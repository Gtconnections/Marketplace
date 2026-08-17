import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CouponForm } from "@/components/coupon-form";
import { toggleCoupon, deleteCoupon } from "@/lib/actions/coupons";
import { formatMoney } from "@/lib/utils";
import { ArrowLeft, Tag, Trash } from "@/components/icons";
import { container, card, badge, btn, cn } from "@/lib/ui";
import type { Coupon } from "@/lib/types";

export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CouponsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vendor/coupons");

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, display_name")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!vendor) redirect("/vendor");

  const { data: couponRows } = await supabase
    .from("coupons")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });
  const coupons = (couponRows ?? []) as Coupon[];

  const now = new Date().getTime();
  const statusOf = (c: Coupon) => {
    if (!c.active) return { variant: "neutral" as const, label: "Inactivo" };
    if (c.expires_at && new Date(c.expires_at).getTime() < now)
      return { variant: "warning" as const, label: "Expirado" };
    if (c.max_redemptions != null && c.times_redeemed >= c.max_redemptions)
      return { variant: "warning" as const, label: "Agotado" };
    return { variant: "success" as const, label: "Activo" };
  };

  return (
    <div className={cn(container, "animate-in py-12")}>
      <Link
        href="/vendor"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Panel
      </Link>

      <div className="mt-4 flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Tag className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Cupones</h1>
          <p className="text-sm text-muted">Códigos de descuento para tus servicios.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* Crear */}
        <div className={card(false, "h-fit p-6")}>
          <h2 className="mb-4 font-semibold text-fg">Nuevo cupón</h2>
          <CouponForm />
        </div>

        {/* Lista */}
        <div>
          {coupons.length === 0 ? (
            <div className={card(false, "p-10 text-center text-sm text-muted")}>
              Aún no tienes cupones. Crea el primero para lanzar una promoción.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="border-b border-border bg-surface-2/50 font-mono text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Código</th>
                    <th className="px-5 py-3 text-left font-medium">Descuento</th>
                    <th className="hidden px-5 py-3 text-left font-medium sm:table-cell">
                      Usos
                    </th>
                    <th className="hidden px-5 py-3 text-left font-medium sm:table-cell">
                      Vigencia
                    </th>
                    <th className="px-5 py-3 text-left font-medium">Estado</th>
                    <th className="px-5 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => {
                    const st = statusOf(c);
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-5 py-4 font-mono font-semibold text-fg">
                          {c.code}
                        </td>
                        <td className="px-5 py-4 text-fg">
                          {c.type === "percent"
                            ? `${c.value}%`
                            : formatMoney(c.value)}
                        </td>
                        <td className="hidden px-5 py-4 text-muted sm:table-cell">
                          {c.times_redeemed}
                          {c.max_redemptions != null ? ` / ${c.max_redemptions}` : ""}
                        </td>
                        <td className="hidden px-5 py-4 text-muted sm:table-cell">
                          {c.expires_at ? `Hasta ${fmtDate(c.expires_at)}` : "Sin límite"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={badge(st.variant)}>{st.label}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <form action={toggleCoupon}>
                              <input type="hidden" name="coupon_id" value={c.id} />
                              <input
                                type="hidden"
                                name="active"
                                value={c.active ? "" : "1"}
                              />
                              <button type="submit" className={btn("ghost", "sm")}>
                                {c.active ? "Desactivar" : "Activar"}
                              </button>
                            </form>
                            <form action={deleteCoupon}>
                              <input type="hidden" name="coupon_id" value={c.id} />
                              <button
                                type="submit"
                                aria-label="Eliminar cupón"
                                className={cn(btn("ghost", "sm"), "text-danger")}
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
