import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/config";

/**
 * Crea una sesión de Checkout de Stripe para suscribirse a un plan.
 *
 * Modelo: CUENTA ÚNICA. El cobro va directo a tu cuenta de Stripe (sin
 * cuentas conectadas ni comisión de plataforma). El 100% del pago es tuyo.
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

  const service = plan.service as { id: string; vendor: { id: string } };
  const vendor = service.vendor;

  // Metadata que el webhook usará para crear la fila de subscription.
  const metadata = {
    customer_id: user.id,
    plan_id: plan.id,
    service_id: service.id,
    vendor_id: vendor.id,
  };

  // Pago único (precio fijo) vs suscripción (membresía).
  const isOneTime = plan.type === "one_time";

  // ¿Es una EXTENSIÓN de una suscripción ya activa del mismo servicio?
  // En ese caso NO aplica trial: se cobra el mes completo desde la fecha actual.
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("customer_id", user.id)
    .eq("service_id", service.id)
    .in("status", ["active", "trialing"])
    .limit(1)
    .maybeSingle();
  const isExtension = !isOneTime && !!existingSub;

  const session = await stripe.checkout.sessions.create({
    mode: isOneTime ? "payment" : "subscription",
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata,
    ...(isOneTime
      ? { payment_intent_data: { metadata } }
      : {
          subscription_data: {
            ...(plan.trial_days && !isExtension
              ? { trial_period_days: plan.trial_days }
              : {}),
            metadata,
          },
        }),
    success_url: `${siteUrl}/dashboard?success=1`,
    cancel_url: `${siteUrl}/services/${plan.service_id}?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}
