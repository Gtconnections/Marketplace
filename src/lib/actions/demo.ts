"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // Plan + servicio (para vendor_id, intervalo y slug de confirmación).
  const { data: plan } = await supabase
    .from("plans")
    .select("id, type, interval, service_id, service:services(vendor_id, slug)")
    .eq("id", planId)
    .single();
  if (!plan) return;

  const svc = plan.service as { vendor_id?: string; slug?: string } | null;
  const vendorId = svc?.vendor_id;
  if (!vendorId) return;

  // Si ya tiene acceso activo a este servicio, no duplicar.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("customer_id", user.id)
    .eq("service_id", plan.service_id)
    .in("status", ["active", "trialing"])
    .limit(1)
    .maybeSingle();

  if (!existing) {
    const days = plan.type === "one_time" ? 0 : plan.interval === "year" ? 365 : 30;
    const periodEnd =
      plan.type === "one_time"
        ? null
        : new Date(Date.now() + days * 86400000).toISOString();

    // Inserta con la service role (las escrituras en subscriptions van por servidor).
    const admin = createAdminClient();
    await admin.from("subscriptions").insert({
      customer_id: user.id,
      plan_id: plan.id,
      service_id: plan.service_id,
      vendor_id: vendorId,
      status: "active",
      current_period_end: periodEnd,
      stripe_checkout_session_id: `demo-${crypto.randomUUID()}`,
    });
  }

  revalidatePath("/dashboard");
  redirect(
    svc?.slug ? `/checkout/success?service=${svc.slug}` : "/checkout/success",
  );
}
