import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Autocompletado del catálogo: devuelve hasta 6 servicios publicados que
 * coinciden con el texto. Público (solo servicios publicados).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("q") ?? "").trim();
  if (raw.length < 2) return NextResponse.json({ results: [] });

  const safe = raw.replace(/[,()*%\\:]/g, " ").trim();
  if (!safe) return NextResponse.json({ results: [] });

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("services")
      .select("id, title, slug, category, cover_image_url, rating_avg")
      .eq("status", "published")
      .or(`title.ilike.*${safe}*,description.ilike.*${safe}*`)
      .order("rating_avg", { ascending: false })
      .limit(6);

    return NextResponse.json({ results: data ?? [] });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
