"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/config";
import { isHexColor } from "@/lib/store-settings";

export type StoreFormState = { error?: string; ok?: boolean } | undefined;

function clean(v: FormDataEntryValue | null, max = 300): string {
  return String(v ?? "").trim().slice(0, max);
}

/** Guarda los ajustes de la tienda. Solo administradores. */
export async function updateStoreSettings(
  _prev: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email))
    return { error: "No autorizado." };

  const store_name = clean(formData.get("store_name"), 60) || "Marketplace";
  const tagline = clean(formData.get("tagline"), 300);
  const contact_email = clean(formData.get("contact_email"), 120);
  const hero_image_url = clean(formData.get("hero_image_url"), 500);
  const accentRaw = clean(formData.get("accent"), 9);
  const social_x = clean(formData.get("social_x"), 200);
  const social_instagram = clean(formData.get("social_instagram"), 200);
  const social_linkedin = clean(formData.get("social_linkedin"), 200);

  if (accentRaw && !isHexColor(accentRaw))
    return { error: "El color de acento debe ser un hex válido (ej. #0052ff)." };
  if (
    contact_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)
  )
    return { error: "El email de contacto no es válido." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("store_settings")
    .update({
      store_name,
      tagline: tagline || null,
      contact_email: contact_email || null,
      hero_image_url: hero_image_url || null,
      accent: accentRaw || null,
      social_x: social_x || null,
      social_instagram: social_instagram || null,
      social_linkedin: social_linkedin || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { error: error.message };

  // Afecta a toda la app (marca, footer, hero).
  revalidatePath("/", "layout");
  return { ok: true };
}
