"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notify } from "@/lib/actions/notifications";

export type QuestionState = { error?: string; ok?: boolean } | undefined;

/** Un usuario autenticado publica una pregunta sobre un servicio. */
export async function submitQuestion(
  _prev: QuestionState,
  formData: FormData,
): Promise<QuestionState> {
  const serviceId = String(formData.get("service_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!serviceId) return { error: "Servicio no válido." };
  if (body.length < 5)
    return { error: "Escribe una pregunta un poco más larga." };
  if (body.length > 500)
    return { error: "La pregunta es demasiado larga (máx. 500 caracteres)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/services/${slug}`);

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
  const askerName = profile?.full_name || "Usuario";

  const { error } = await supabase.from("questions").insert({
    service_id: serviceId,
    vendor_id: service.vendor_id,
    asker_id: user.id,
    asker_name: askerName,
    body,
  });
  if (error) return { error: error.message };

  // Avisa al vendedor de la nueva pregunta.
  const admin = createAdminClient();
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
      title: "Nueva pregunta",
      body: `${askerName} preguntó sobre “${service.title}”.`,
      href: `/services/${service.slug}#preguntas`,
    });
  }

  if (slug) revalidatePath(`/services/${slug}`);
  return { ok: true };
}

/** El dueño del servicio responde (o edita la respuesta de) una pregunta. */
export async function answerQuestion(
  questionId: string,
  answer: string,
  slug?: string,
): Promise<{ error?: string } | void> {
  const text = answer.trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };
  if (text.length > 1000)
    return { error: "La respuesta es demasiado larga (máx. 1000)." };

  const admin = createAdminClient();
  const { data: question } = await admin
    .from("questions")
    .select("id, vendor_id, asker_id, service_id")
    .eq("id", questionId)
    .maybeSingle();
  if (!question) return { error: "Pregunta no encontrada." };

  const { data: vendorRow } = await admin
    .from("vendors")
    .select("profile_id")
    .eq("id", question.vendor_id)
    .maybeSingle();
  if ((vendorRow as { profile_id?: string } | null)?.profile_id !== user.id)
    return { error: "No autorizado." };

  const { error } = await admin
    .from("questions")
    .update({
      answer: text || null,
      answered_at: text ? new Date().toISOString() : null,
    })
    .eq("id", questionId);
  if (error) return { error: error.message };

  // Avisa a quien preguntó.
  if (text && question.asker_id && question.asker_id !== user.id) {
    const { data: svc } = await admin
      .from("services")
      .select("title, slug")
      .eq("id", question.service_id)
      .maybeSingle();
    await notify({
      userId: question.asker_id,
      type: "review",
      title: "Respondieron tu pregunta",
      body: svc?.title ? `Sobre “${svc.title}”.` : undefined,
      href: svc?.slug ? `/services/${svc.slug}#preguntas` : "/",
    });
  }

  if (slug) revalidatePath(`/services/${slug}`);
}

/** El autor elimina su propia pregunta. */
export async function deleteQuestion(
  questionId: string,
  slug?: string,
): Promise<void> {
  if (!questionId) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("questions")
    .delete()
    .eq("id", questionId)
    .eq("asker_id", user.id);
  if (slug) revalidatePath(`/services/${slug}`);
}
