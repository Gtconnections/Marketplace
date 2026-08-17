import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, priceSuffix, orderNumber } from "@/lib/utils";
import { Receipt } from "@/components/icons";
import { container, card, badge, btn, cn } from "@/lib/ui";
import type { Plan, Service, Vendor } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  trialing: "Prueba",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  incomplete: "Incompleta",
  unpaid: "Impaga",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/pedidos");

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*, service:services(*, vendor:vendors(*)), plan:plans(*)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const list = subs ?? [];
  const totalGastado = list.reduce(
    (sum, s) => sum + ((s.plan as Plan | null)?.amount ?? 0),
    0,
  );

  return (
    <div className={cn(container, "animate-in py-12")}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Mis pedidos</h1>
          <p className="mt-1 text-muted">
            Historial de tus compras y sus recibos.
          </p>
        </div>
        {list.length > 0 && (
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Total ({list.length} {list.length === 1 ? "pedido" : "pedidos"})
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-fg">
              {formatMoney(totalGastado)}
            </p>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className={card(false, "mt-8 flex flex-col items-center gap-3 p-12 text-center")}>
          <p className="text-muted">Aún no tienes pedidos.</p>
          <Link href="/services" className={btn("primary", "md")}>
            Explorar servicios
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-2/50 font-mono text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Pedido</th>
                <th className="px-5 py-3 text-left font-medium">Servicio</th>
                <th className="hidden px-5 py-3 text-left font-medium sm:table-cell">
                  Fecha
                </th>
                <th className="hidden px-5 py-3 text-left font-medium sm:table-cell">
                  Estado
                </th>
                <th className="px-5 py-3 text-right font-medium">Importe</th>
                <th className="px-5 py-3 text-right font-medium">Recibo</th>
              </tr>
            </thead>
            <tbody>
              {list.map((sub) => {
                const service = sub.service as (Service & { vendor: Vendor }) | null;
                const plan = sub.plan as Plan | null;
                const active =
                  sub.status === "active" || sub.status === "trialing";
                return (
                  <tr
                    key={sub.id}
                    className="border-b border-border last:border-0 hover:bg-surface-2/30"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-muted">
                      #{orderNumber(sub.id)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-fg">{service?.title ?? "—"}</p>
                      <p className="text-xs text-muted">
                        {service?.vendor?.display_name}
                        {plan ? ` · ${plan.name}` : ""}
                      </p>
                    </td>
                    <td className="hidden px-5 py-4 text-muted sm:table-cell">
                      {fmtDate(sub.created_at)}
                    </td>
                    <td className="hidden px-5 py-4 sm:table-cell">
                      <span className={badge(active ? "success" : "neutral")}>
                        {STATUS_LABEL[sub.status] ?? sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-fg">
                      {plan ? (
                        <>
                          {formatMoney(plan.amount, plan.currency)}
                          <span className="font-normal text-muted">
                            {priceSuffix(plan.type, plan.interval)}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/pedidos/${sub.id}`}
                        className={cn(btn("secondary", "sm"), "gap-1.5")}
                      >
                        <Receipt className="h-4 w-4" /> Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
