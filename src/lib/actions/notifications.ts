"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Notification, NotificationType } from "@/lib/types";

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
};

/**
 * Crea una notificación para un usuario. Uso EXCLUSIVO en el servidor:
 * inserta con la service role (no hay policy de INSERT para clientes).
 * Nunca lanza: si algo falla, se registra y se sigue (el aviso es secundario).
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
    });
  } catch (err) {
    console.error("[notify] no se pudo crear la notificación:", err);
  }
}

/** Varias notificaciones de una (p. ej. avisar al comprador y al vendedor). */
export async function notifyMany(inputs: NotifyInput[]): Promise<void> {
  if (inputs.length === 0) return;
  try {
    const admin = createAdminClient();
    await admin.from("notifications").insert(
      inputs.map((n) => ({
        user_id: n.userId,
        type: n.type,
        title: n.title,
        body: n.body ?? null,
        href: n.href ?? null,
      })),
    );
  } catch (err) {
    console.error("[notifyMany] no se pudieron crear las notificaciones:", err);
  }
}

/**
 * Lee las notificaciones recientes del usuario + el conteo de no leídas.
 * Se llama desde la Nav (server component) con el cliente ya autenticado.
 */
export async function getNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 12,
): Promise<{ items: Notification[]; unread: number }> {
  try {
    const [{ data }, { count }] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null),
    ]);
    return {
      items: (data as unknown as Notification[]) ?? [],
      unread: count ?? 0,
    };
  } catch {
    return { items: [], unread: 0 };
  }
}

/** Marca TODAS las notificaciones del usuario actual como leídas. */
export async function markAllRead(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  revalidatePath("/", "layout");
}

/** Marca una notificación concreta como leída (al abrirla). */
export async function markRead(id: string): Promise<void> {
  if (!id) return;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("read_at", null);
  revalidatePath("/", "layout");
}
