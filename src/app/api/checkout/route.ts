import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { siteUrl, platformFeePercent } from "@/lib/config";

/**
 * Crea una sesión de Checkout de Stripe para suscribirse a un plan.
 *
 * Modelo: DIRECT CHARGES sobre la cuenta conectada del vendedor, con una
 * comisión de la plataforma (`application_fee_percent`). El dinero entra a la
 * cuenta del vendedor y Stripe transfiere tu comisión automáticamente.
 *
 * Body JSON: { planId: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { planId } = await request.json().catch(() => ({ planId: null }));
  if (!planId) {
    return NextResponse.json({ error: "Falta planId" }, { status: 400 });
  }

  // Trae el plan + servicio + vendedor.
  const { data: plan } = await supabase
    .from("plans")
    .select("*, service:services(*, vendor:vendors(*))")
    .eq("id", planId)
    .single();

  if (!plan || !plan.stripe_price_id) {
    return NextResponse.json(
      { error: "Plan no disponible" },
      { status: 404 },
    );
  }

  const service = plan.service as {
    id: string;
    vendor: { id: string; stripe_account_id: string | null; charges_enabled: boolean };
  };
  const vendor = service.vendor;

  if (!vendor?.stripe_account_id || !vendor.charges_enabled) {
    return NextResponse.json(
      { error: "Este vendedor aún no puede recibir pagos" },
      { status: 409 },
    );
  }

  // Metadata que el webhook usará para crear la fila de subscription.
  const metadata = {
    customer_id: user.id,
    plan_id: plan.id,
    service_id: service.id,
    vendor_id: vendor.id,
  };

  // Pago único (precio fijo) vs suscripción (membresía).
  const isOneTime = plan.type === "one_time";
  const applicationFeeAmount = Math.round((plan.amount * platformFeePercent) / 100);

  const session = await stripe.checkout.sessions.create(
    {
      mode: isOneTime ? "payment" : "subscription",
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata,
      ...(isOneTime
        ? {
            // Pago único: la comisión de la plataforma es un monto fijo.
            payment_intent_data: {
              application_fee_amount: applicationFeeAmount,
              metadata,
            },
          }
        : {
            // Suscripción: comisión como porcentaje + prueba opcional.
            subscription_data: {
              application_fee_percent: platformFeePercent,
              ...(plan.trial_days
                ? { trial_period_days: plan.trial_days }
                : {}),
              metadata,
            },
          }),
      success_url: `${siteUrl}/dashboard?success=1`,
      cancel_url: `${siteUrl}/services/${plan.service_id}?canceled=1`,
    },
    // DIRECT CHARGE: la sesión se crea en la cuenta conectada del vendedor.
    { stripeAccount: vendor.stripe_account_id },
  );

  return NextResponse.json({ url: session.url });
}
