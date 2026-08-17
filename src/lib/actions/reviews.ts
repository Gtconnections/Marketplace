"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/actions/notifications";
import { shortId } from "@/lib/utils";

export type ReviewState = { error?: string; ok?: boolean } | undefined;

const PHOTO_BUCKET = "review-photos";
const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4 MB

/**
 * Crea o actualiza la reseña del usuario actual sobre un servicio.
 * Admite: valoración 1–5, comentario ≤ 1000, foto opcional (≤ 4 MB).
 * Requiere compra/suscripción activa (verificado aquí y por RLS).
 */
export async function submitReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const serviceId = String(formData.get("service_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const rating = Number(formData.get("rating") ?? "0");
  const comment = String(formData.get("comment") ?? "").trim();
  const removePhoto = String(formData.get("remove_photo") ?? "") === "1";
  const photo = formData.get("photo");
  const hasNewPhoto = photo instanceof File && photo.size > 0;

  if (!serviceId) return { error: "Servicio no válido." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { error: "Elige una valoración de 1 a 5 estrellas." };
  if (comment.length > 1000)
    return { error: "El comentario es demasiado largo (máx. 1000 caracteres)." };
  if (hasNewPhoto) {
    if (!photo.type.startsWith("image/"))
      return { error: "El adjunto debe ser una imagen." };
    if (photo.size > MAX_PHOTO_BYTES)
      return { error: "La imagen debe pesar menos de 4 MB." };
  }

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
    return { error: "Solo puedes reseñar servicios que has contratado." };

  // Datos del servicio.
  const { data: service } = await supabase
    .from("services")
    .select("vendor_id, title, slug")
    .eq("id", serviceId)
    .single();
  if (!service) return { error: "Servicio no encontrado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // ¿Ya había reseña de este usuario? (avisar solo en nuevas y reusar foto).
  const { data: prior } = await supabase
    .from("reviews")
    .select("id, photo_path")
    .eq("service_id", serviceId)
    .eq("customer_id", user.id)
    .maybeSingle();
  const isNew = !prior;
  const priorPhotoPath = (prior as { photo_path?: string | null } | null)
    ?.photo_path;

  const admin = createAdminClient();

  // ── Gestión de la foto ──
  // photoFields queda undefined = no tocar la foto actual.
  let photoFields: { photo_url: string | null; photo_path: string | null } | undefined;

  if (hasNewPhoto) {
    const safe = photo.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40);
    const path = `${user.id}/${shortId()}-${safe}`;
    const buffer = Buffer.from(await photo.arrayBuffer());
    const { error: upErr } = await admin.storage
      .from(PHOTO_BUCKET)
      .upload(path, buffer, { contentType: photo.type, upsert: false });
    if (upErr) return { error: `No se pudo subir la imagen: ${upErr.message}` };
    const url = admin.storage.from(PHOTO_BUCKET).getPublicUrl(path).data
      .publicUrl;
    photoFields = { photo_url: url, photo_path: path };
    if (priorPhotoPath) await admin.storage.from(PHOTO_BUCKET).remove([priorPhotoPath]);
  } else if (removePhoto && priorPhotoPath) {
    await admin.storage.from(PHOTO_BUCKET).remove([priorPhotoPath]);
    photoFields = { photo_url: null, photo_path: null };
  }

  const authorName = profile?.full_name || "Cliente";
  const { error } = await supabase.from("reviews").upsert(
    {
      service_id: serviceId,
      vendor_id: service.vendor_id,
      customer_id: user.id,
      author_name: authorName,
      rating,
      comment: comment || null,
      ...(photoFields ?? {}),
    },
    { onConflict: "service_id,customer_id" },
  );
  if (error) return { error: error.message };

  // Avisa al vendedor de una reseña nueva.
  if (isNew) {
    const { data: vendorRow } = await admin
      .from("vendors")
      .select("profile_id")
      .eq("id", service.vendor_id)
      .maybeSingle();
    const vendorOwnerId = (vendorRow as { profile_id?: string } | null)
      ?.profile_id;
    if (vendorOwnerId && vendorOwnerId !== user.id) {
      await notify({
        userId: vendorOwnerId,
        type: "review",
        title: `Nueva reseña · ${rating}★`,
        body: `${authorName} reseñó “${service.title}”.`,
        href: `/services/${service.slug}#resenas`,
      });
    }
  }

  if (slug) revalidatePath(`/services/${slug}`);
  revalidatePath("/");
  return { ok: true };
}

/** Alterna el voto "me fue útil" del usuario actual sobre una reseña. */
export async function toggleHelpful(reviewId: string, slug?: string): Promise<void> {
  if (!reviewId) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("review_helpful")
    .select("review_id")
    .eq("review_id", reviewId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("review_helpful")
      .delete()
      .eq("review_id", reviewId)
      .eq("profile_id", user.id);
  } else {
    await supabase
      .from("review_helpful")
      .insert({ review_id: reviewId, profile_id: user.id });
  }

  if (slug) revalidatePath(`/services/${slug}`);
}

/** El dueño del servicio responde (o edita su respuesta a) una reseña. */
export async function replyToReview(
  reviewId: string,
  reply: string,
  slug?: string,
): Promise<{ error?: string } | void> {
  const text = reply.trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };
  if (text.length > 1000)
    return { error: "La respuesta es demasiado larga (máx. 1000)." };

  // Verifica que el usuario es el dueño del servicio de esta reseña.
  const admin = createAdminClient();
  const { data: review } = await admin
    .from("reviews")
    .select("id, vendor_id, customer_id, service_id")
    .eq("id", reviewId)
    .maybeSingle();
  if (!review) return { error: "Reseña no encontrada." };

  const { data: vendorRow } = await admin
    .from("vendors")
    .select("profile_id")
    .eq("id", review.vendor_id)
    .maybeSingle();
  if ((vendorRow as { profile_id?: string } | null)?.profile_id !== user.id)
    return { error: "No autorizado." };

  const { error } = await admin
    .from("reviews")
    .update({
      vendor_reply: text || null,
      vendor_reply_at: text ? new Date().toISOString() : null,
    })
    .eq("id", reviewId);
  if (error) return { error: error.message };

  // Avisa al autor de la reseña que el vendedor respondió.
  if (text && review.customer_id && review.customer_id !== user.id) {
    const { data: svc } = await admin
      .from("services")
      .select("title, slug")
      .eq("id", review.service_id)
      .maybeSingle();
    await notify({
      userId: review.customer_id,
      type: "review",
      title: "El vendedor respondió tu reseña",
      body: svc?.title ? `Sobre “${svc.title}”.` : undefined,
      href: svc?.slug ? `/services/${svc.slug}#resenas` : "/",
    });
  }

  if (slug) revalidatePath(`/services/${slug}`);
}
