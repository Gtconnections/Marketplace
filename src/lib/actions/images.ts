"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recomputeCover } from "@/lib/images";

/** Elimina una imagen de la galería (storage + fila) y recalcula la portada. */
export async function deleteImage(formData: FormData): Promise<void> {
  const imageId = String(formData.get("image_id") ?? "");
  const serviceId = String(formData.get("service_id") ?? "");
  if (!imageId || !serviceId) return;

  const supabase = await createClient();

  // RLS garantiza que solo el dueño lee/borra sus imágenes.
  const { data: img } = await supabase
    .from("service_images")
    .select("path")
    .eq("id", imageId)
    .single();

  if (img?.path) {
    const admin = createAdminClient();
    await admin.storage.from("service-images").remove([img.path]);
  }

  await supabase.from("service_images").delete().eq("id", imageId);
  await recomputeCover(supabase, serviceId);
  revalidatePath(`/vendor/services/${serviceId}`);
}

/** Marca una imagen como portada (position 0) y reordena el resto. */
export async function setCover(formData: FormData): Promise<void> {
  const imageId = String(formData.get("image_id") ?? "");
  const serviceId = String(formData.get("service_id") ?? "");
  if (!imageId || !serviceId) return;

  const supabase = await createClient();

  const { data: images } = await supabase
    .from("service_images")
    .select("id")
    .eq("service_id", serviceId)
    .order("position", { ascending: true });

  if (!images) return;

  // La elegida va primero (0); las demás mantienen su orden a partir de 1.
  let pos = 1;
  for (const im of images) {
    const newPos = im.id === imageId ? 0 : pos++;
    await supabase
      .from("service_images")
      .update({ position: newPos })
      .eq("id", im.id);
  }

  await recomputeCover(supabase, serviceId);
  revalidatePath(`/vendor/services/${serviceId}`);
}
