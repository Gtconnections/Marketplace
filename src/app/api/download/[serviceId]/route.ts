import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/config";

/**
 * Descarga protegida del archivo de un servicio.
 * Permite el acceso solo si el usuario:
 *   • tiene una compra/suscripción activa a ese servicio, o
 *   • es el vendedor dueño del servicio.
 * Genera una URL firmada temporal (60s) y redirige a ella.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const { serviceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${siteUrl}/login?next=/dashboard`);
  }

  const admin = createAdminClient();

  // Datos del servicio (ruta del archivo + dueño), con la service role.
  const { data: service } = await admin
    .from("services")
    .select("id, download_path, download_name, vendor:vendors(profile_id)")
    .eq("id", serviceId)
    .single();

  if (!service?.download_path) {
    return NextResponse.json(
      { error: "Este servicio no tiene archivo." },
      { status: 404 },
    );
  }

  const ownerId = (service.vendor as { profile_id?: string } | null)?.profile_id;
  const isOwner = ownerId === user.id;

  // ¿Tiene acceso el cliente?
  let hasAccess = isOwner;
  if (!hasAccess) {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("id, status")
      .eq("customer_id", user.id)
      .eq("service_id", serviceId)
      .in("status", ["active", "trialing"])
      .limit(1)
      .maybeSingle();
    hasAccess = Boolean(sub);
  }

  if (!hasAccess) {
    return NextResponse.json(
      { error: "No tienes acceso a este archivo." },
      { status: 403 },
    );
  }

  const { data: signed, error } = await admin.storage
    .from("deliverables")
    .createSignedUrl(service.download_path, 60, {
      download: service.download_name ?? true,
    });

  if (error || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "No se pudo generar la descarga." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(signed.signedUrl);
}
