import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BecomeVendorForm } from "@/components/become-vendor-form";
import { Pagination } from "@/components/pagination";
import { toggleServiceStatus } from "@/lib/actions/vendor";
import { formatMoney, priceSuffix } from "@/lib/utils";
import { platformFeePercent, isDemoPayments } from "@/lib/config";
import { container, card, badge, btn, cn } from "@/lib/ui";
import type { Plan, Service } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function VendorPage({
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
    .select("*")
    .eq("profile_id", user!.id)
    .single();

  if (!vendor) {
    return (
      <div className={cn(container, "animate-in py-12")}>
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-fg">
          Panel de vendedor
        </h1>
        <BecomeVendorForm />
      </div>
    );
  }

  const { page: pageParam } = await searchParams;
  const pageNum = Math.max(1, Number(pageParam) || 1);
  const fromRow = (pageNum - 1) * PAGE_SIZE;

  const { data: services, count } = await supabase
    .from("services")
    .select("*, plans(*)", { count: "exact" })
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .range(fromRow, fromRow + PAGE_SIZE - 1);

  const list = (services ?? []) as (Service & { plans: Plan[] })[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ── Métricas (calculadas desde subscriptions; en demo son simuladas) ──
  type SubMetric = {
    status: string;
    customer_id: string;
    service: { title: string } | null;
    plan: { amount: number; type: string; interval: string | null } | null;
  };
  const { data: subRows } = await supabase
    .from("subscriptions")
    .select("status, customer_id, service:services(title), plan:plans(amount, type, interval)")
    .eq("vendor_id", vendor.id);
  const subs = (subRows ?? []) as unknown as SubMetric[];

  const isActiveSub = (s: SubMetric) =>
    s.status === "active" || s.status === "trialing";
  const ventas = subs.length;
  const clientes = new Set(subs.map((s) => s.customer_id)).size;
  const activas = subs.filter(isActiveSub).length;
  const ingresos = subs.reduce((sum, s) => sum + (s.plan?.amount ?? 0), 0);
  const mrr = subs.filter(isActiveSub).reduce((sum, s) => {
    const p = s.plan;
    if (!p || p.type === "one_time") return sum;
    return sum + (p.interval === "year" ? Math.round(p.amount / 12) : p.amount);
  }, 0);

  const topCounts = new Map<string, number>();
  for (const s of subs) {
    const t = s.service?.title ?? "—";
    topCounts.set(t, (topCounts.get(t) ?? 0) + 1);
  }
  const topServicios = [...topCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const stats = [
    { label: "Ingresos (demo)", value: formatMoney(ingresos) },
    { label: "MRR (demo)", value: formatMoney(mrr) },
    { label: "Suscripciones activas", value: String(activas) },
    { label: "Clientes", value: String(clientes) },
  ];

  return (
    <div className={cn(container, "animate-in py-12")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">
            {vendor.display_name}
          </h1>
          <p className="mt-1 text-sm text-muted">Panel de vendedor</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/vendor/subscriptions" className={btn("secondary", "md")}>
            Suscripciones
          </Link>
          <Link href="/vendor/services/new" className={btn("primary", "md")}>
            + Nuevo servicio
          </Link>
        </div>
      </div>

      {/* Métricas */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={card(false, "p-5")}>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {s.label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-fg">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {topServicios.length > 0 && (
        <div className={card(false, "mt-4 p-6")}>
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
              Top servicios
            </h2>
            <span className="font-mono text-xs text-muted">
              {ventas} {ventas === 1 ? "venta" : "ventas"} en total
            </span>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {topServicios.map(([title, n], i) => {
              const pct = ventas > 0 ? Math.round((n / ventas) * 100) : 0;
              return (
                <li key={title} className="flex items-center gap-3">
                  <span className="w-4 shrink-0 font-mono text-xs text-muted">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm text-fg">{title}</span>
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right font-mono text-xs text-muted">
                    {n}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Estado de pagos */}
      {isDemoPayments ? (
        <div className={card(false, "mt-8 flex flex-wrap items-center justify-between gap-4 p-6")}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-fg">Pagos</h2>
              <span className={badge("brand")}>Modo demo</span>
            </div>
            <p className="mt-1.5 max-w-xl text-sm text-muted">
              Los pagos están simulados: puedes publicar servicios y probar todo
              el flujo sin Stripe. Cuando quieras cobrar de verdad, activa Stripe
              (variable <span className="font-mono text-xs">NEXT_PUBLIC_PAYMENTS_MODE=stripe</span>).
            </p>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            card(false, "mt-8 flex flex-wrap items-center justify-between gap-4 p-6"),
            !vendor.charges_enabled && "border-warning/40 bg-warning/10",
          )}
        >
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-fg">Pagos (Stripe Connect)</h2>
              <span className={badge(vendor.charges_enabled ? "success" : "warning")}>
                {vendor.charges_enabled ? "Habilitado" : "Pendiente"}
              </span>
            </div>
            <p className="mt-1.5 max-w-xl text-sm text-muted">
              {vendor.charges_enabled
                ? "Tu cuenta está lista para recibir pagos."
                : "Completa tu configuración para poder cobrar suscripciones."}{" "}
              Comisión de la plataforma:{" "}
              <span className="font-medium text-fg">{platformFeePercent}%</span>.
            </p>
          </div>
          {!vendor.charges_enabled && (
            <a href="/vendor/onboard" className={btn("primary", "md")}>
              Configurar pagos
            </a>
          )}
        </div>
      )}

      {/* Servicios */}
      <h2 className="mb-4 mt-10 text-lg font-semibold tracking-tight text-fg">
        Tus servicios{" "}
        <span className="font-mono text-sm font-normal text-muted">({total})</span>
      </h2>
      {list.length === 0 ? (
        <div className={card(false, "flex flex-col items-center gap-3 p-12 text-center")}>
          <p className="text-muted">Aún no tienes servicios.</p>
          <Link href="/vendor/services/new" className={btn("primary", "md")}>
            Crear el primero
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
          {list.map((s) => {
            const plan = s.plans?.[0];
            const planCount = s.plans?.length ?? 0;
            const isPublished = s.status === "published";
            const canPublish =
              isDemoPayments || (s.plans ?? []).some((p) => p.stripe_price_id);
            return (
              <div
                key={s.id}
                className={card(false, "flex flex-wrap items-center justify-between gap-4 p-6")}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold tracking-tight text-fg">
                      {s.title}
                    </h3>
                    <span className={badge(isPublished ? "success" : "neutral")}>
                      {isPublished ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                  {plan && (
                    <p className="mt-1 text-sm text-muted">
                      {plan.name} · {formatMoney(plan.amount, plan.currency)}
                      {priceSuffix(plan.type, plan.interval)}
                      {planCount > 1 && (
                        <span className="text-muted">
                          {" "}
                          · +{planCount - 1} plan{planCount - 1 > 1 ? "es" : ""}
                        </span>
                      )}
                      {!isDemoPayments && !plan.stripe_price_id && (
                        <span className="text-warning">
                          {" "}
                          · sin precio en Stripe
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/vendor/services/${s.id}`}
                    className={btn("secondary", "sm")}
                  >
                    Gestionar
                  </Link>
                  <form action={toggleServiceStatus}>
                    <input type="hidden" name="service_id" value={s.id} />
                    <input
                      type="hidden"
                      name="next_status"
                      value={isPublished ? "draft" : "published"}
                    />
                    <button
                      type="submit"
                      className={btn(isPublished ? "ghost" : "primary", "sm")}
                      disabled={!isPublished && !canPublish}
                    >
                      {isPublished ? "Despublicar" : "Publicar"}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
          </div>
          <Pagination
            page={pageNum}
            totalPages={totalPages}
            params={{}}
            basePath="/vendor"
          />
        </>
      )}
    </div>
  );
}
