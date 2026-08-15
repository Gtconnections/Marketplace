"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = { error?: string; ok?: boolean } | undefined;

/**
 * Crea o actualiza la reseña del usuario actual sobre un servicio.
 * Validaciones: rating 1–5, comentario ≤ 1000, y el usuario debe tener una
 * compra/suscripción activa (verificado aquí y por RLS).
 */
export async function submitReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const serviceId = String(formData.get("service_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const rating = Number(formData.get("rating") ?? "0");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!serviceId) return { error: "Servicio no válido." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { error: "Elige una valoración de 1 a 5 estrellas." };
  if (comment.length > 1000)
    return { error: "El comentario es demasiado largo (máx. 1000 caracteres)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/services/${slug}`);

  // Verifica acceso activo (mensaje claro; RLS también lo exige).
  const { data: access } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("customer_id", user.id)
    .eq("service_id", serviceId)
    .in("status", ["active", "trialing"])
    .limit(1)
    .maybeSingle();
  if (!access)
    return {
      error: "Solo puedes reseñar servicios que has contratado.",
    };

  // Datos necesarios para la fila.
  const { data: service } = await supabase
    .from("services")
    .select("vendor_id")
    .eq("id", serviceId)
    .single();
  if (!service) return { error: "Servicio no encontrado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("reviews").upsert(
    {
      service_id: serviceId,
      vendor_id: service.vendor_id,
      customer_id: user.id,
      author_name: profile?.full_name || "Cliente",
      rating,
      comment: comment || null,
    },
    { onConflict: "service_id,customer_id" },
  );
  if (error) return { error: error.message };

  if (slug) revalidatePath(`/services/${slug}`);
  revalidatePath("/");
  return { ok: true };
}
