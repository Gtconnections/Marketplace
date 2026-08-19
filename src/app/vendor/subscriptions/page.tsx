import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Pagination } from "@/components/pagination";
import { formatMoney, priceSuffix } from "@/lib/utils";
import { ArrowLeft } from "@/components/icons";
import { container, card, badge, cn } from "@/lib/ui";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  trialing: "Prueba",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  incomplete: "Incompleta",
  unpaid: "Impaga",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type Row = {
  id: string;
  status: string;
  created_at: string;
  current_period_end: string | null;
  customer_id: string;
  service: { title: string; slug: string } | null;
  plan: {
    name: string;
    amount: number;
    currency: string;
    type: string;
    interval: string | null;
  } | null;
};

export default async function VendorSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("profile_id", user!.id)
    .single();
  if (!vendor) redirect("/vendor");

  const { page: pageParam } = await searchParams;
  const pageNum = Math.max(1, Number(pageParam) || 1);
  const fromRow = (pageNum - 1) * PAGE_SIZE;

  const { data, count } = await supabase
    .from("subscriptions")
    .select(
      "id, status, created_at, current_period_end, customer_id, service:services(title, slug), plan:plans(name, amount, currency, type, interval)",
      { count: "exact" },
    )
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .range(fromRow, fromRow + PAGE_SIZE - 1);

  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Emails de clientes: RLS bloquea leer perfiles ajenos → usamos la service role.
  const ids = [...new Set(rows.map((r) => r.customer_id))];
  const emailById = new Map<string, string>();
  if (ids.length > 0) {
    const admin = createAdminClient();
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .in("id", ids);
    for (const p of profiles ?? []) {
      emailById.set(
        p.id as string,
        (p.full_name as string) || (p.email as string) || "Cliente",
      );
    }
  }

  // Total acumulado de pagos por suscripción (neto, con descuentos aplicados).
  const totalBySub = new Map<
    string,
    { cents: number; count: number; currency: string }
  >();
  if (rows.length > 0) {
    const subIds = rows.map((r) => r.id);
    const { data: payRows } = await supabase
      .from("payments")
      .select("subscription_id, amount_cents, discount_cents, currency")
      .in("subscription_id", subIds);
    for (const p of payRows ?? []) {
      const key = p.subscription_id as string;
      const cur = totalBySub.get(key) ?? {
        cents: 0,
        count: 0,
        currency: (p.currency as string) ?? "usd",
      };
      cur.cents +=
        ((p.amount_cents as number) ?? 0) - ((p.discount_cents as number) ?? 0);
      cur.count += 1;
      totalBySub.set(key, cur);
    }
  }

  return (
    <div className={cn(container, "animate-in py-12")}>
      <Link
        href="/vendor"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>

      <div className="mt-6 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          Suscripciones y clientes
        </h1>
        <p className="mt-1 font-mono text-xs text-muted">
          {total} {total === 1 ? "registro" : "registros"}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className={card(false, "p-12 text-center text-muted")}>
          Aún no hay suscripciones.
        </div>
      ) : (
        <>
          {/* Tabla en escritorio */}
          <div className={card(false, "hidden overflow-hidden md:block")}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-2/50 font-mono text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Servicio</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Estado</th>
                  <th className="px-5 py-3 font-medium">Alta</th>
                  <th className="px-5 py-3 font-medium">Renueva</th>
                  <th className="px-5 py-3 text-right font-medium">Total pagado</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const active =
                    r.status === "active" || r.status === "trialing";
                  const totals = totalBySub.get(r.id);
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium text-fg">
                        {emailById.get(r.customer_id) ?? "Cliente"}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {r.service?.slug ? (
                          <Link
                            href={`/services/${r.service.slug}`}
                            className="hover:text-primary"
                          >
                            {r.service.title}
                          </Link>
                        ) : (
                          r.service?.title ?? "—"
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {r.plan
                          ? `${r.plan.name} · ${formatMoney(r.plan.amount, r.plan.currency)}${priceSuffix(r.plan.type, r.plan.interval)}`
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={badge(active ? "success" : "neutral")}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted">
                        {fmtDate(r.created_at)}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted">
                        {r.plan?.type === "one_time"
                          ? "Pago único"
                          : fmtDate(r.current_period_end)}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-fg">
                        {totals && totals.count > 0
                          ? `${formatMoney(totals.cents, totals.currency)}${totals.count > 1 ? ` · ${totals.count} pagos` : ""}`
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/vendor/subscriptions/${r.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-fg transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tarjetas en móvil */}
          <div className="flex flex-col gap-3 md:hidden">
            {rows.map((r) => {
              const active = r.status === "active" || r.status === "trialing";
              const totals = totalBySub.get(r.id);
              return (
                <div key={r.id} className={card(false, "p-4")}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-fg">
                      {emailById.get(r.customer_id) ?? "Cliente"}
                    </span>
                    <span className={badge(active ? "success" : "neutral")}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{r.service?.title}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {r.plan
                      ? `${r.plan.name} · ${formatMoney(r.plan.amount, r.plan.currency)}${priceSuffix(r.plan.type, r.plan.interval)}`
                      : "—"}{" "}
                    · alta {fmtDate(r.created_at)}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {r.plan?.type === "one_time"
                      ? "Pago único"
                      : `próx. cobro ${fmtDate(r.current_period_end)}`}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                    <span className="font-mono text-xs text-muted">
                      {totals && totals.count > 0 ? (
                        <>
                          Total:{" "}
                          <span className="font-semibold text-fg">
                            {formatMoney(totals.cents, totals.currency)}
                          </span>{" "}
                          · {totals.count} {totals.count === 1 ? "pago" : "pagos"}
                        </>
                      ) : (
                        "Sin pagos"
                      )}
                    </span>
                    <Link
                      href={`/vendor/subscriptions/${r.id}`}
                      className="rounded-full border border-border px-3 py-1 text-xs font-medium text-fg transition-colors hover:border-primary/40 hover:text-primary"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            page={pageNum}
            totalPages={totalPages}
            params={{}}
            basePath="/vendor/subscriptions"
          />
        </>
      )}
    </div>
  );
}
