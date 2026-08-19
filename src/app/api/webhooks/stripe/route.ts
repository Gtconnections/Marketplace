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
          // Idempotencia: si esta sesión ya se procesó, es un reintento de
          // Stripe. No volver a crear/EXTENDER (evita sumar meses de más).
          const { data: alreadyPaid } = await supabase
            .from("payments")
            .select("id")
            .eq("stripe_checkout_session_id", session.id)
            .maybeSingle();
          if (alreadyPaid) break;

          const { data: plan } = await supabase
            .from("plans")
            .select("id, type, interval, amount, currency")
            .eq("id", m.plan_id)
            .single();
          const isOneTime = plan?.type === "one_time";

          const subId = (session.subscription as string) ?? null;
          let currentPeriodEnd: string | null = null;
          if (subId) {
            const sub = (await stripe.subscriptions.retrieve(subId)) as Stripe.Subscription & {
              current_period_end?: number;
            };
            const firstItem = sub.items?.data?.[0] as
              | {
                  current_period_end?: number;
                  price?: { recurring?: { interval?: string } };
                }
              | undefined;
            const periodEnd = sub.current_period_end ?? firstItem?.current_period_end;
            if (periodEnd) {
              currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
            }
          }

          // ¿El cliente ya tiene una suscripción activa de este servicio?
          // → la EXTENDEMOS en lugar de duplicar.
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("id, current_period_end")
            .eq("customer_id", m.customer_id)
            .eq("service_id", m.service_id)
            .in("status", ["active", "trialing"])
            .limit(1)
            .maybeSingle();

          let subscriptionId: string;

          if (existing) {
            subscriptionId = existing.id;
            if (!isOneTime) {
              const base = existing.current_period_end
                ? new Date(existing.current_period_end).getTime() > Date.now()
                  ? new Date(existing.current_period_end)
                  : new Date()
                : new Date();
              if (plan?.interval === "year") base.setFullYear(base.getFullYear() + 1);
              else base.setMonth(base.getMonth() + 1);
              currentPeriodEnd = base.toISOString();
            }
            // Aplicación ATÓMICA: la extensión solo corre si esta sesión aún no
            // se aplicó a esta suscripción. Si Stripe reentrega el evento (retry,
            // doble entrega local+prod), la segunda vez no suma otro mes.
            const { error: updateError } = await supabase
              .from("subscriptions")
              .update({
                status: "active",
                current_period_end: currentPeriodEnd,
                stripe_subscription_id: subId,
                stripe_payment_intent_id: (session.payment_intent as string) ?? null,
                stripe_customer_id: (session.customer as string) ?? null,
                stripe_checkout_session_id: session.id,
              })
              .eq("id", existing.id)
              .or(
                `stripe_checkout_session_id.is.null,stripe_checkout_session_id.neq.${session.id}`,
              );
            if (updateError) throw updateError;
            // Si la fila no se actualizó, esta sesión ya estaba aplicada
            // (reintento): igual nos aseguramos de que el pago quede registrado.
          } else {
            const { data: inserted, error: upsertError } = await supabase
              .from("subscriptions")
              .upsert(
                {
                  customer_id: m.customer_id,
                  plan_id: m.plan_id,
                  service_id: m.service_id,
                  vendor_id: m.vendor_id,
                  stripe_checkout_session_id: session.id,
                  stripe_subscription_id: subId,
                  stripe_payment_intent_id: (session.payment_intent as string) ?? null,
                  stripe_customer_id: (session.customer as string) ?? null,
                  status: "active",
                  current_period_end: currentPeriodEnd,
                },
                { onConflict: "stripe_checkout_session_id" },
              )
              .select("id")
              .single();
            if (upsertError) throw upsertError;
            subscriptionId = inserted.id;
          }

          // Historial de pagos.
          const { error: paymentError } = await supabase
            .from("payments")
            .upsert(
              {
                subscription_id: subscriptionId,
                customer_id: m.customer_id,
                plan_id: m.plan_id,
                service_id: m.service_id,
                vendor_id: m.vendor_id,
                amount_cents: plan?.amount ?? 0,
                currency: plan?.currency ?? "usd",
                status: "succeeded",
                stripe_checkout_session_id: session.id,
                stripe_payment_intent_id: (session.payment_intent as string) ?? null,
                stripe_subscription_id: subId,
              },
              { onConflict: "stripe_checkout_session_id" },
            );
          if (paymentError) throw paymentError;
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

        // Solo actualizamos la fecha si Stripe nos da una fecha real.
        // En suscripciones con TRIAL, current_period_end llega null y no
        // debe pisar la fecha que ya calculamos al comprar/extender.
        const updatePayload: { status: string; current_period_end?: string | null } = {
          status: sub.status,
        };
        if (periodEnd) {
          updatePayload.current_period_end = new Date(periodEnd * 1000).toISOString();
        }
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update(updatePayload)
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
