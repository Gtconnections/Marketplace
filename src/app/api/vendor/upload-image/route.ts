import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/config";
import { recomputeCover } from "@/lib/images";
import { shortId } from "@/lib/utils";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB por imagen
const MAX_IMAGES = 8;

/**
 * Sube una o varias imágenes a la galería de un servicio (bucket público
 * service-images). Solo el dueño del servicio (verificado por RLS al leerlo).
 * Body: multipart con `files` (una o varias) y `service_id`.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!isAdminEmail(user.email))
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const form = await request.formData();
  const serviceId = String(form.get("service_id") ?? "");
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (!serviceId || files.length === 0)
    return NextResponse.json({ error: "Falta la imagen." }, { status: 400 });

  // Verifica propiedad + cuenta actual de imágenes.
  const { data: service } = await supabase
    .from("services")
    .select("id, vendor_id")
    .eq("id", serviceId)
    .single();
  if (!service)
    return NextResponse.json({ error: "Servicio no encontrado." }, { status: 404 });

  const { count } = await supabase
    .from("service_images")
    .select("id", { count: "exact", head: true })
    .eq("service_id", serviceId);
  const existing = count ?? 0;
  if (existing + files.length > MAX_IMAGES)
    return NextResponse.json(
      { error: `Máximo ${MAX_IMAGES} imágenes por servicio.` },
      { status: 400 },
    );

  const admin = createAdminClient();

  for (const [i, file] of files.entries()) {
    if (!file.type.startsWith("image/"))
      return NextResponse.json(
        { error: "Solo se permiten imágenes." },
        { status: 400 },
      );
    if (file.size > MAX_BYTES)
      return NextResponse.json(
        { error: "Cada imagen debe pesar menos de 6 MB." },
        { status: 400 },
      );

    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
    const path = `${serviceId}/${shortId()}-${safe}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await admin.storage
      .from("service-images")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });
    if (upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 });

    const url = admin.storage.from("service-images").getPublicUrl(path).data
      .publicUrl;

    const { error: insErr } = await supabase.from("service_images").insert({
      service_id: serviceId,
      vendor_id: service.vendor_id,
      url,
      path,
      position: existing + i,
    });
    if (insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  await recomputeCover(supabase, serviceId);
  return NextResponse.json({ ok: true });
}
