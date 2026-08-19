import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhook de Stripe (cuenta única, endpoint normal — sin Connect).
 *
 * Eventos manejados:
 *  - checkout.session.completed   → crea la fila de suscripción
 *  - customer.subscription.*      → sincroniza estado y fin de período
 *
 * Escribe con la SERVICE ROLE (salta RLS).
 */
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secrets = (process.env.STRIPE_WEBHOOK_SECRET ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!signature || secrets.length === 0) {
    return NextResponse.json({ error: "Config de webhook faltante" }, { status: 400 });
  }

  let event: Stripe.Event | null = null;
  let lastError: unknown = null;
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret);
      break;
    } catch (err) {
      lastError = err;
    }
  }

  if (!event) {
    const msg = lastError instanceof Error ? lastError.message : "firma inválida";
    return NextResponse.json({ error: `Webhook inválido: ${msg}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      // Un cliente completó el checkout: suscripción (membresía) o pago único.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const m = session.metadata ?? {};
        if (m.customer_id && m.plan_id) {
          const { error: upsertError } = await supabase
            .from("subscriptions")
            .upsert(
              {
                customer_id: m.customer_id,
                plan_id: m.plan_id,
                service_id: m.service_id,
                vendor_id: m.vendor_id,
                stripe_checkout_session_id: session.id,
                stripe_subscription_id: (session.subscription as string) ?? null,
                stripe_payment_intent_id: (session.payment_intent as string) ?? null,
                stripe_customer_id: (session.customer as string) ?? null,
                status: "active",
              },
              { onConflict: "stripe_checkout_session_id" },
            );
          if (upsertError) throw upsertError;
        }
        break;
      }

      // Cambios de estado de la suscripción (renovación, cancelación, impago...).
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription & {
          current_period_end?: number;
        };
        const firstItem = sub.items?.data?.[0] as
          | { current_period_end?: number }
          | undefined;
        const periodEnd =
          sub.current_period_end ?? firstItem?.current_period_end ?? null;

        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: sub.status,
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
          })
          .eq("stripe_subscription_id", sub.id);
        if (updateError) throw updateError;
        break;
      }

      default:
        // Otros eventos: ignorados por ahora.
        break;
    }
  } catch (err) {
    console.error("Error procesando webhook:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
