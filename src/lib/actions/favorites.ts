"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Alterna un servicio en los favoritos del usuario actual.
 * Si no hay sesión, redirige al login conservando el destino.
 */
export async function toggleFavorite(formData: FormData): Promise<void> {
  const serviceId = String(formData.get("service_id") ?? "");
  const next = String(formData.get("next") ?? "/services");
  if (!serviceId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("profile_id", user.id)
    .eq("service_id", serviceId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("favorites")
      .insert({ profile_id: user.id, service_id: serviceId });
  }

  revalidatePath(next);
  revalidatePath("/favorites");
}

/** Devuelve el conjunto de service_id que el usuario tiene en favoritos. */
export async function getFavoriteIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | undefined,
): Promise<Set<string>> {
  if (!userId) return new Set();
  const { data } = await supabase
    .from("favorites")
    .select("service_id")
    .eq("profile_id", userId);
  return new Set((data ?? []).map((r) => r.service_id as string));
}
