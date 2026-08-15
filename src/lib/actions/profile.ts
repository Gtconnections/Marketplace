"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string; ok?: boolean } | undefined;

/** Actualiza el nombre visible del perfil del usuario actual. */
export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/perfil");

  const fullName =
    String(formData.get("full_name") ?? "").trim().slice(0, 80) || null;

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/perfil");
  return { ok: true };
}

/** Cambia la contraseña del usuario con sesión activa (sin correo). */
export async function updatePassword(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8)
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (password !== confirm)
    return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/configuracion");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { ok: true };
}
