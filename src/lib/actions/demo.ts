"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyMany } from "@/lib/actions/notifications";
import { computeDiscount, formatMoney } from "@/lib/utils";

/**
 * Pago SIMULADO (modo demo, sin Stripe). Crea la suscripción/compra
 * directamente para el usuario actual y lo lleva a su panel.
 * Solo para desarrollo: no cobra nada.
 */
export async function demoCheckout(formData: FormData): Promise<void> {
  const planId = String(formData.get("plan_id") ?? "");
  if (!planId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Plan + servicio (para vendor_id, intervalo, slug, título e importe).
  const { data: plan } = await supabase
    .from("plans")
    .select(
      "id, type, interval, amount, currency, service_id, service:services(vendor_id, slug, title)",
    )
    .eq("id", planId)
    .single();
  if (!plan) return;

  const svc = plan.service as
    | { vendor_id?: string; slug?: string; title?: string }
    | null;
  const vendorId = svc?.vendor_id;
  if (!vendorId) return;

  const rawCoupon = String(formData.get("coupon_code") ?? "")
    .toUpperCase()
    .replace(/\s+/g, "");

  // Si ya tiene acceso activo a este servicio, extender el vencimiento.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, current_period_end, discount_cents")
    .eq("customer_id", user.id)
    .eq("service_id", plan.service_id)
    .in("status", ["active", "trialing"])
    .limit(1)
    .maybeSingle();

  const admin = createAdminClient();

  // Cupón: valida contra la BD (nunca confiar en el cliente) y calcula el descuento.
  let couponCode: string | null = null;
  let discountCents = 0;
  if (rawCoupon) {
    const { data: coupon } = await admin
      .from("coupons")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("code", rawCoupon)
      .maybeSingle();
    const valid =
      coupon &&
      coupon.active &&
      (!coupon.expires_at ||
        new Date(coupon.expires_at).getTime() >= Date.now()) &&
      (coupon.max_redemptions == null ||
        coupon.times_redeemed < coupon.max_redemptions);
    if (valid) {
      couponCode = coupon.code;
      discountCents = computeDiscount(coupon.type, coupon.value, plan.amount);
      // Registra el uso.
      await admin
        .from("coupons")
        .update({ times_redeemed: coupon.times_redeemed + 1 })
        .eq("id", coupon.id);
    }
  }

  const days = plan.type === "one_time" ? 0 : plan.interval === "year" ? 365 : 30;
  let subscriptionId: string;

  if (existing && plan.type !== "one_time") {
    const base =
      existing.current_period_end &&
      new Date(existing.current_period_end).getTime() > Date.now()
        ? new Date(existing.current_period_end)
        : new Date();
    base.setDate(base.getDate() + days);
    const { error } = await admin
      .from("subscriptions")
      .update({
        status: "active",
        current_period_end: base.toISOString(),
        coupon_code: couponCode,
        discount_cents: existing.discount_cents + discountCents,
      })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    subscriptionId = existing.id;
  } else if (existing) {
    // Pago único ya activo: acceso permanente, no se toca la fecha.
    subscriptionId = existing.id;
  } else {
    const periodEnd =
      plan.type === "one_time"
        ? null
        : new Date(Date.now() + days * 86400000).toISOString();
    const { data: inserted, error } = await admin
      .from("subscriptions")
      .insert({
        customer_id: user.id,
        plan_id: plan.id,
        service_id: plan.service_id,
        vendor_id: vendorId,
        status: "active",
        current_period_end: periodEnd,
        coupon_code: couponCode,
        discount_cents: discountCents,
        stripe_checkout_session_id: `demo-${crypto.randomUUID()}`,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    subscriptionId = inserted.id;
  }

  // Historial de pagos.
  const { error: paymentError } = await admin.from("payments").insert({
    subscription_id: subscriptionId,
    customer_id: user.id,
    plan_id: plan.id,
    service_id: plan.service_id,
    vendor_id: vendorId,
    amount_cents: plan.amount,
    currency: plan.currency,
    coupon_code: couponCode,
    discount_cents: discountCents,
    status: "succeeded",
    stripe_checkout_session_id: `demo-${crypto.randomUUID()}`,
  });
  if (paymentError) throw new Error(paymentError.message);

  // Avisos: al comprador (confirmación) y al vendedor (nueva venta).
  const title = svc?.title || "tu nuevo servicio";
  const savedNote =
    discountCents > 0
      ? ` Ahorraste ${formatMoney(discountCents, plan.currency)} con ${couponCode}.`
      : "";
  const { data: vendorRow } = await admin
    .from("vendors")
    .select("profile_id")
    .eq("id", vendorId)
    .maybeSingle();
  const vendorOwnerId = (vendorRow as { profile_id?: string } | null)
    ?.profile_id;

    await notifyMany([
    {
      userId: user.id,
      type: "purchase",
      title: "¡Compra confirmada!",
      body: `Ya tienes acceso a “${title}”.${savedNote}`,
      href: "/dashboard",
    },
    ...(vendorOwnerId && vendorOwnerId !== user.id
      ? [
          {
            userId: vendorOwnerId,
            type: "sale" as const,
            title: "Nueva venta",
            body: `Alguien contrató “${title}”.`,
            href: "/vendor/subscriptions",
          },
        ]
      : []),
  ]);

  revalidatePath("/dashboard");
  redirect(
    svc?.slug ? `/checkout/success?service=${svc.slug}` : "/checkout/success",
  );
}
