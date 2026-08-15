import { createClient } from "@supabase/supabase-js";

/**
 * Cliente admin con la SERVICE ROLE KEY. Salta RLS.
 * USAR SOLO en el servidor (webhooks, tareas de sistema). Nunca en el cliente.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
