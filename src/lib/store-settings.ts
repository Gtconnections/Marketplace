import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type StoreSettings = {
  store_name: string;
  tagline: string;
  contact_email: string;
  hero_image_url: string;
  accent: string;
  social_x: string;
  social_instagram: string;
  social_linkedin: string;
};

/** Valores por defecto (si no hay fila o Supabase no responde). */
export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: "Marketplace",
  tagline:
    "Herramientas y servicios digitales premium, seleccionados con criterio para acelerar tu trabajo.",
  contact_email: "",
  hero_image_url:
    "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1920&q=80",
  accent: "",
  social_x: "#",
  social_instagram: "#",
  social_linkedin: "#",
};

/**
 * Lee los ajustes de la tienda (fila única). Cacheado por request para que
 * layout, nav, footer y catálogo compartan una sola consulta. Nunca lanza.
 */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (!data) return DEFAULT_SETTINGS;
    return {
      store_name: data.store_name || DEFAULT_SETTINGS.store_name,
      tagline: data.tagline || DEFAULT_SETTINGS.tagline,
      contact_email: data.contact_email || DEFAULT_SETTINGS.contact_email,
      hero_image_url: data.hero_image_url || DEFAULT_SETTINGS.hero_image_url,
      accent: data.accent || DEFAULT_SETTINGS.accent,
      social_x: data.social_x || DEFAULT_SETTINGS.social_x,
      social_instagram:
        data.social_instagram || DEFAULT_SETTINGS.social_instagram,
      social_linkedin: data.social_linkedin || DEFAULT_SETTINGS.social_linkedin,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
});

/** ¿Es un color hex válido (#rgb o #rrggbb)? */
export function isHexColor(v: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());
}
