import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Publica los servicios programados cuya fecha ya venció.
 * Se llama de forma perezosa desde páginas públicas (home / catálogo) y desde
 * el panel: así, sin cron, los servicios "scheduled" pasan a "published" en
 * cuanto alguien visita el sitio después de su fecha. No lanza nunca.
 */
export async function publishDueServices(): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin
      .from("services")
      .update({ status: "published", publish_at: null })
      .eq("status", "scheduled")
      .lte("publish_at", new Date().toISOString());
  } catch {
    // La publicación programada es best-effort; si falla, se reintenta luego.
  }
}
