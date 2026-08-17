"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { isAdminEmail, isDemoPayments } from "@/lib/config";
import { slugify, shortId } from "@/lib/utils";
import type { Plan } from "@/lib/types";

export type ActionState = { error?: string; ok?: boolean } | undefined;

// ── Helpers ────────────────────────────────────────────────────────────

type ParsedPlan = {
  planName: string;
  pricingType: "subscription" | "one_time";
  isSubscription: boolean;
  interval: "month" | "year" | null;
  trialDays: number | null;
  amount: number;
};

/** Lee y valida los campos de un plan desde el formulario. */
function parsePlanFields(formData: FormData): ParsedPlan | { error: string } {
  const planName = String(formData.get("plan_name") ?? "Plan").trim() || "Plan";
  const pricingType =
    String(formData.get("pricing_type") ?? "subscription") === "one_time"
      ? "one_time"
      : "subscription";
  const isSubscription = pricingType === "subscription";
  const interval =
    String(formData.get("interval") ?? "month") === "year" ? "year" : "month";
  const trialDaysRaw = Number(formData.get("trial_days") ?? "0");
  const priceUsd = Number(formData.get("price") ?? "0");

  if (!priceUsd || priceUsd <= 0) return { error: "Pon un precio válido." };
  if (priceUsd > 100000) return { error: "El precio máximo es 100 000 USD." };
  if (!planName || planName.length > 60)
    return { error: "El nombre del plan debe tener entre 1 y 60 caracteres." };

  const trialDays =
    isSubscription && trialDaysRaw > 0
      ? Math.min(365, Math.floor(trialDaysRaw))
      : null;

  return {
    planName,
    pricingType,
    isSubscription,
    interval: isSubscription ? interval : null,
    trialDays,
    amount: Math.round(priceUsd * 100),
  };
}

/**
 * Crea el Product + Price en tu cuenta de Stripe (cuenta única) e inserta el
 * plan en la base de datos. En modo demo no toca Stripe (sin precio).
 * Reutilizado al crear el servicio y al añadir planes adicionales (tiers).
 */
async function createStripePriceAndPlan(
  supabase: Awaited<ReturnType<typeof createClient>>,
  serviceId: string,
  serviceTitle: string,
  p: ParsedPlan,
): Promise<{ error?: string }> {
  let stripeProductId: string | null = null;
  let stripePriceId: string | null = null;

  if (!isDemoPayments) {
    try {
      const product = await stripe.products.create({
        name: `${serviceTitle} — ${p.planName}`,
        metadata: { service_id: serviceId },
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: p.amount,
        currency: "usd",
        ...(p.isSubscription
          ? { recurring: { interval: p.interval as "month" | "year" } }
          : {}),
      });
      stripeProductId = product.id;
      stripePriceId = price.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error en Stripe";
      return { error: `Falló el precio en Stripe: ${msg}` };
    }
  }

  const { error } = await supabase.from("plans").insert({
    service_id: serviceId,
    name: p.planName,
    type: p.pricingType,
    interval: p.interval,
    trial_days: p.trialDays,
    amount: p.amount,
    currency: "usd",
    stripe_product_id: stripeProductId,
    stripe_price_id: stripePriceId,
  });
  if (error) return { error: error.message };
  return {};
}

// ── Vendedor ───────────────────────────────────────────────────────────

/** Convierte al usuario actual en vendedor (crea su tienda). */
export async function becomeVendor(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) return { error: "Pon un nombre de tienda." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vendor");
  if (!isAdminEmail(user.email)) return { error: "No autorizado." };

  const { error } = await supabase.from("vendors").insert({
    profile_id: user.id,
    display_name: displayName,
    slug: `${slugify(displayName)}-${shortId()}`,
    bio: String(formData.get("bio") ?? "").trim() || null,
  });
  if (error) return { error: error.message };

  await supabase.from("profiles").update({ role: "vendor" }).eq("id", user.id);

  revalidatePath("/vendor");
  redirect("/vendor");
}

/** Crea un servicio con su primer plan. */
export async function createServiceWithPlan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vendor/services/new");
  if (!isAdminEmail(user.email)) return { error: "No autorizado." };

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("profile_id", user.id)
    .single();
  if (!vendor) return { error: "Primero crea tu tienda de vendedor." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "otro");
  if (!title) return { error: "El título es obligatorio." };
  if (title.length > 120)
    return { error: "El título es demasiado largo (máx. 120 caracteres)." };
  if (description.length > 4000)
    return { error: "La descripción es demasiado larga (máx. 4000 caracteres)." };

  const parsed = parsePlanFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  // 1) Crear el servicio (borrador).
  const { data: service, error: sErr } = await supabase
    .from("services")
    .insert({
      vendor_id: vendor.id,
      title,
      slug: `${slugify(title)}-${shortId()}`,
      description: description || null,
      category,
      status: "draft",
    })
    .select()
    .single();
  if (sErr || !service) return { error: sErr?.message ?? "No se pudo crear el servicio." };

  // 2) Crear el plan (Stripe + BD).
  const res = await createStripePriceAndPlan(
    supabase,
    service.id,
    title,
    parsed,
  );
  if (res.error) return { error: `Servicio creado, pero ${res.error}` };

  revalidatePath("/vendor");
  redirect(`/vendor/services/${service.id}`);
}

/** Añade un plan (tier) adicional a un servicio existente. Opcional. */
export async function addPlan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const serviceId = String(formData.get("service_id") ?? "");
  if (!serviceId) return { error: "Servicio no válido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vendor");
  if (!isAdminEmail(user.email)) return { error: "No autorizado." };

  // RLS garantiza que solo el dueño ve/gestiona su servicio.
  const { data: service } = await supabase
    .from("services")
    .select("*, vendor:vendors(*)")
    .eq("id", serviceId)
    .single();
  if (!service) return { error: "Servicio no encontrado." };

  const parsed = parsePlanFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  const res = await createStripePriceAndPlan(
    supabase,
    serviceId,
    service.title,
    parsed,
  );
  if (res.error) return { error: res.error };

  revalidatePath(`/vendor/services/${serviceId}`);
  redirect(`/vendor/services/${serviceId}`);
}

/** Elimina un plan (tier) de un servicio. */
export async function deletePlan(formData: FormData): Promise<void> {
  const planId = String(formData.get("plan_id") ?? "");
  const serviceId = String(formData.get("service_id") ?? "");
  if (!planId) return;

  const supabase = await createClient();

  // Archiva el precio en Stripe (si existe) para no dejarlo activo.
  const { data: plan } = await supabase
    .from("plans")
    .select("stripe_price_id")
    .eq("id", planId)
    .single();

  if (plan?.stripe_price_id && !isDemoPayments) {
    try {
      await stripe.prices.update(plan.stripe_price_id, { active: false });
    } catch {
      // Si falla el archivado en Stripe, seguimos borrando en BD.
    }
  }

  // RLS: solo el dueño puede borrar.
  await supabase.from("plans").delete().eq("id", planId);
  revalidatePath(`/vendor/services/${serviceId}`);
}

/** Publica o despublica un servicio. */
export async function toggleServiceStatus(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("service_id") ?? "");
  const next = String(formData.get("next_status") ?? "published");

  const supabase = await createClient();
  // Publicar o despublicar limpia cualquier programación pendiente.
  await supabase
    .from("services")
    .update({
      status: next === "published" ? "published" : "draft",
      publish_at: null,
    })
    .eq("id", serviceId);

  revalidatePath("/vendor");
  revalidatePath(`/vendor/services/${serviceId}`);
  revalidatePath("/");
}

/** Programa la publicación de un servicio para una fecha futura. */
export async function scheduleService(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("service_id") ?? "");
  const when = String(formData.get("publish_at") ?? "");
  if (!serviceId || !when) return;

  const ts = new Date(when);
  if (Number.isNaN(ts.getTime())) return;
  // Si la fecha ya pasó, publica de inmediato.
  const isFuture = ts.getTime() > Date.now();

  const supabase = await createClient();
  await supabase
    .from("services")
    .update({
      status: isFuture ? "scheduled" : "published",
      publish_at: isFuture ? ts.toISOString() : null,
    })
    .eq("id", serviceId);

  revalidatePath("/vendor");
  revalidatePath(`/vendor/services/${serviceId}`);
  revalidatePath("/");
}

/** Cancela una publicación programada (vuelve a borrador). */
export async function cancelSchedule(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("service_id") ?? "");
  if (!serviceId) return;

  const supabase = await createClient();
  await supabase
    .from("services")
    .update({ status: "draft", publish_at: null })
    .eq("id", serviceId);

  revalidatePath("/vendor");
  revalidatePath(`/vendor/services/${serviceId}`);
}

/** Quita el archivo descargable de un servicio. */
export async function removeDownload(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("service_id") ?? "");
  if (!serviceId) return;

  const supabase = await createClient();

  // Verifica propiedad y obtiene la ruta actual (RLS).
  const { data: service } = await supabase
    .from("services")
    .select("id, download_path")
    .eq("id", serviceId)
    .single();
  if (!service) return;

  // Borra el archivo del bucket con la service role.
  if (service.download_path) {
    const admin = createAdminClient();
    await admin.storage.from("deliverables").remove([service.download_path]);
  }

  await supabase
    .from("services")
    .update({ download_path: null, download_name: null })
    .eq("id", serviceId);

  revalidatePath(`/vendor/services/${serviceId}`);
}

/** Guarda los metadatos SEO (meta título / descripción) de un servicio. */
export async function updateServiceSeo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const serviceId = String(formData.get("service_id") ?? "");
  if (!serviceId) return { error: "Servicio no válido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vendor");
  if (!isAdminEmail(user.email)) return { error: "No autorizado." };

  const metaTitle =
    String(formData.get("meta_title") ?? "").trim().slice(0, 120) || null;
  const metaDescription =
    String(formData.get("meta_description") ?? "").trim().slice(0, 300) || null;

  // RLS garantiza que solo el dueño actualiza su servicio.
  const { error } = await supabase
    .from("services")
    .update({ meta_title: metaTitle, meta_description: metaDescription })
    .eq("id", serviceId);
  if (error) return { error: error.message };

  revalidatePath(`/vendor/services/${serviceId}`);
  return { ok: true };
}

/** Duplica un servicio (con sus planes) como borrador nuevo. */
export async function duplicateService(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("service_id") ?? "");
  if (!serviceId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vendor");
  if (!isAdminEmail(user.email)) return;

  // Original + planes (RLS: solo el dueño lo lee/gestiona).
  const { data: orig } = await supabase
    .from("services")
    .select("*, plans(*)")
    .eq("id", serviceId)
    .single();
  if (!orig) return;

  const { data: copy, error } = await supabase
    .from("services")
    .insert({
      vendor_id: orig.vendor_id,
      title: `${orig.title} (copia)`,
      slug: `${slugify(orig.title)}-${shortId()}`,
      description: orig.description,
      category: orig.category,
      status: "draft",
    })
    .select()
    .single();
  if (error || !copy) return;

  // Copia los planes (sin IDs de Stripe; en demo no aplica).
  const plans = (orig.plans as Plan[]) ?? [];
  if (plans.length) {
    await supabase.from("plans").insert(
      plans.map((p) => ({
        service_id: copy.id,
        name: p.name,
        type: p.type,
        interval: p.interval,
        trial_days: p.trial_days,
        amount: p.amount,
        currency: p.currency,
        active: true,
      })),
    );
  }

  revalidatePath("/vendor");
  redirect(`/vendor/services/${copy.id}`);
}
