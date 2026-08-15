import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Recalcula la portada del servicio: la imagen de menor `position`
 * (o null si no hay imágenes) y la guarda en services.cover_image_url.
 */
export async function recomputeCover(
  supabase: SupabaseClient,
  serviceId: string,
): Promise<void> {
  const { data } = await supabase
    .from("service_images")
    .select("url")
    .eq("service_id", serviceId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  await supabase
    .from("services")
    .update({ cover_image_url: data?.url ?? null })
    .eq("id", serviceId);
}
