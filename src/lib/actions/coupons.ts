"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CouponType } from "@/lib/types";

export type CouponFormState = { error?: string; ok?: boolean } | undefined;

/** Normaliza un código: mayúsculas, sin espacios, solo alfanumérico y guiones. */
function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 24);
}

/** Vendor del usuario actual (o null). */
async function currentVendorId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("vendors")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

/** Crea un cupón para el vendedor actual. */
export async function createCoupon(
  _prev: CouponFormState,
  formData: FormData,
): Promise<CouponFormState> {
  const vendorId = await currentVendorId();
  if (!vendorId) return { error: "No tienes panel de vendedor." };

  const code = normalizeCode(String(formData.get("code") ?? ""));
  const type = String(formData.get("type") ?? "percent") as CouponType;
  const rawValue = Number(formData.get("value") ?? "0");
  const maxRaw = String(formData.get("max_redemptions") ?? "").trim();
  const expiresRaw = String(formData.get("expires_at") ?? "").trim();

  if (code.length < 3) return { error: "El código debe tener al menos 3 caracteres." };
  if (type !== "percent" && type !== "fixed")
    return { error: "Tipo de cupón no válido." };

  let value = Math.round(rawValue);
  if (type === "percent") {
    if (value < 1 || value > 100)
      return { error: "El porcentaje debe estar entre 1 y 100." };
  } else {
    // fixed: el usuario ingresa la moneda; guardamos en centavos.
    value = Math.round(rawValue * 100);
    if (value < 1) return { error: "El monto debe ser mayor a 0." };
  }

  const max_redemptions = maxRaw ? Math.max(1, Math.round(Number(maxRaw))) : null;
  const expires_at = expiresRaw ? new Date(expiresRaw).toISOString() : null;

  const supabase = await createClient();
  const { error } = await supabase.from("coupons").insert({
    vendor_id: vendorId,
    code,
    type,
    value,
    max_redemptions,
    expires_at,
  });
  if (error) {
    if (error.code === "23505")
      return { error: "Ya tienes un cupón con ese código." };
    return { error: error.message };
  }

  revalidatePath("/vendor/coupons");
  return { ok: true };
}

/** Activa/desactiva un cupón del vendedor actual. */
export async function toggleCoupon(formData: FormData): Promise<void> {
  const id = String(formData.get("coupon_id") ?? "");
  const next = String(formData.get("active") ?? "") === "1";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("coupons").update({ active: next }).eq("id", id);
  revalidatePath("/vendor/coupons");
}

/** Elimina un cupón del vendedor actual. */
export async function deleteCoupon(formData: FormData): Promise<void> {
  const id = String(formData.get("coupon_id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("coupons").delete().eq("id", id);
  revalidatePath("/vendor/coupons");
}

export type CouponValidation =
  | {
      ok: true;
      code: string;
      type: CouponType;
      value: number;
      message: string;
    }
  | { ok: false; message: string };

/**
 * Valida un código para un servicio (lado servidor, con service role).
 * NO aplica nada: solo dice si es válido y su valor. La aplicación real del
 * descuento se recalcula en el checkout.
 */
export async function validateCoupon(
  code: string,
  serviceId: string,
): Promise<CouponValidation> {
  const clean = normalizeCode(code);
  if (!clean) return { ok: false, message: "Ingresa un código." };
  if (!serviceId) return { ok: false, message: "Servicio no válido." };

  const admin = createAdminClient();
  const { data: service } = await admin
    .from("services")
    .select("vendor_id")
    .eq("id", serviceId)
    .maybeSingle();
  const vendorId = (service as { vendor_id?: string } | null)?.vendor_id;
  if (!vendorId) return { ok: false, message: "Servicio no válido." };

  const { data: coupon } = await admin
    .from("coupons")
    .select("*")
    .eq("vendor_id", vendorId)
    .eq("code", clean)
    .maybeSingle();

  if (!coupon) return { ok: false, message: "Cupón no encontrado." };
  if (!coupon.active) return { ok: false, message: "Este cupón está inactivo." };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now())
    return { ok: false, message: "Este cupón ha expirado." };
  if (
    coupon.max_redemptions != null &&
    coupon.times_redeemed >= coupon.max_redemptions
  )
    return { ok: false, message: "Este cupón alcanzó su límite de usos." };

  const label =
    coupon.type === "percent"
      ? `${coupon.value}% de descuento`
      : `descuento aplicado`;
  return {
    ok: true,
    code: clean,
    type: coupon.type as CouponType,
    value: coupon.value,
    message: `Cupón aplicado: ${label}.`,
  };
}
