import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { shortId } from "@/lib/utils";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

/**
 * Sube la foto de perfil del usuario actual al bucket público `avatars` y
 * guarda la URL en profiles.avatar_url. La subida usa la service role.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "Falta la imagen." }, { status: 400 });
  if (!file.type.startsWith("image/"))
    return NextResponse.json({ error: "Solo se permiten imágenes." }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json(
      { error: "La imagen debe pesar menos de 4 MB." },
      { status: 400 },
    );

  const admin = createAdminClient();

  // Borra el avatar anterior (si estaba en nuestro bucket).
  const { data: prev } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();
  const prevUrl = prev?.avatar_url as string | undefined;
  if (prevUrl && prevUrl.includes("/avatars/")) {
    const oldPath = prevUrl.split("/avatars/")[1]?.split("?")[0];
    if (oldPath) await admin.storage.from("avatars").remove([oldPath]);
  }

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40);
  const path = `${user.id}/${shortId()}-${safe}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from("avatars")
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 });

  const url = admin.storage.from("avatars").getPublicUrl(path).data.publicUrl;

  const { error: updErr } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);
  if (updErr)
    return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, url });
}
