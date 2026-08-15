import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/config";
import { shortId } from "@/lib/utils";

/**
 * Sube el archivo descargable de un servicio al bucket privado `deliverables`.
 * Solo el dueño del servicio puede subirlo (verificado por RLS al leer el
 * servicio). La subida usa la service role para saltar RLS de Storage.
 *
 * Body: multipart/form-data con `file` y `service_id`.
 *
 * Nota: para archivos muy grandes conviene migrar a subida directa con URL
 * firmada (createSignedUploadUrl); este handler es suficiente para archivos
 * de tamaño moderado (PDFs, ZIPs, plantillas).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const serviceId = String(form.get("service_id") ?? "");

  if (!(file instanceof File) || !serviceId) {
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  }

  // Verifica propiedad del servicio (RLS: services_select_own).
  const { data: service } = await supabase
    .from("services")
    .select("id, download_path")
    .eq("id", serviceId)
    .single();
  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado." }, { status: 404 });
  }

  const admin = createAdminClient();

  // Borra el archivo anterior si lo había.
  if (service.download_path) {
    await admin.storage.from("deliverables").remove([service.download_path]);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const path = `${serviceId}/${shortId()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from("deliverables")
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { error: updErr } = await supabase
    .from("services")
    .update({ download_path: path, download_name: file.name })
    .eq("id", serviceId);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, name: file.name });
}
