import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney, priceSuffix } from "@/lib/utils";
import { ArrowLeft, Mail } from "@/components/icons";
import { container, card, badge, cn } from "@/lib/ui";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  trialing: "Prueba",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  incomplete: "Incompleta",
  unpaid: "Impaga",
};

function fmtDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type SubRow = {
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

export default async function VendorSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/vendor/subscriptions/${id}`);

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!vendor) redirect("/vendor");

  const { data: sub } = await supabase
    .from("subscriptions")
    .select(
      "id, status, created_at, current_period_end, customer_id, service:services(title, slug), plan:plans(name, amount, currency, type, interval)",
    )
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .maybeSingle();
  if (!sub) notFound();
  const row = sub as unknown as SubRow;

  const { data: payments } = await supabase
    .from("payments")
    .select("*, plan:plans(name)")
    .eq("subscription_id", row.id)
    .order("created_at", { ascending: false });
  const pays = payments ?? [];

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", row.customer_id)
    .maybeSingle();

  const active = row.status === "active" || row.status === "trialing";
  const currency = row.plan?.currency ?? "usd";
  const totalCents = pays.reduce(
    (s, p) =>
      s +
      ((p.amount_cents as number) ?? 0) - ((p.discount_cents as number) ?? 0),
    0,
  );
  const name = profile?.full_name || "Cliente";
  const email = profile?.email || "—";

  return (
    <div className={cn(container, "animate-in py-12")}>
      <Link
        href="/vendor/subscriptions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Suscripciones
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg">
        Detalle de suscripción
      </h1>

      {/* Info de la suscripción */}
      <div className={card(false, "mt-6 p-6")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-fg">
              {row.service?.slug ? (
                <Link
                  href={`/services/${row.service.slug}`}
                  className="transition-colors hover:text-primary"
                >
                  {row.service?.title ?? "—"}
                </Link>
              ) : (
                row.service?.title ?? "—"
              )}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {row.plan ? `${row.plan.name} · ${formatMoney(row.plan.amount, row.plan.currency)}${priceSuffix(row.plan.type, row.plan.interval)}` : "—"}
            </p>
          </div>
          <span className={badge(active ? "success" : "neutral")}>
            {STATUS_LABEL[row.status] ?? row.status}
          </span>
        </div>

        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Cliente
            </p>
            <p className="mt-2 font-medium text-fg">{name}</p>
            <a
              href={`mailto:${email}`}
              className="mt-0.5 inline-flex items-center gap-1 text-muted transition-colors hover:text-primary"
            >
              <Mail className="h-3.5 w-3.5" /> {email}
            </a>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Alta
            </p>
            <p className="mt-2 text-fg">{fmtDateLong(row.created_at)}</p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Próximo cobro
            </p>
            <p className="mt-2 text-fg">
              {row.plan?.type === "one_time"
                ? "Pago único"
                : fmtDateLong(row.current_period_end ?? "")}
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Total pagado
            </p>
            <p className="mt-2 text-xl font-bold tracking-tight text-fg">
              {formatMoney(totalCents, currency)}
              <span className="ml-1.5 text-xs font-normal text-muted">
                · {pays.length} {pays.length === 1 ? "pago" : "pagos"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Historial de pagos */}
      <h2 className="mb-4 mt-10 text-lg font-semibold tracking-tight text-fg">
        Historial de pagos
      </h2>
      {pays.length === 0 ? (
        <div className={card(false, "p-12 text-center text-muted")}>
          Aún no hay pagos registrados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-border bg-surface-2/50 font-mono text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Fecha</th>
                <th className="px-5 py-3 text-left font-medium">Plan</th>
                <th className="px-5 py-3 text-right font-medium">Importe</th>
                <th className="px-5 py-3 text-right font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pays.map((p) => {
                const net =
                  ((p.amount_cents as number) ?? 0) -
                  ((p.discount_cents as number) ?? 0);
                const paid = p.status === "succeeded";
                return (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-4 text-muted">
                      {fmtDateLong(p.created_at as string)}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {(p.plan as { name?: string } | null)?.name ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-fg">
                      {formatMoney(net, (p.currency as string) ?? currency)}
                      {(p.discount_cents as number) > 0 && (
                        <span className="ml-1 text-xs font-normal text-success">
                          (desc.)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={badge(paid ? "success" : "neutral")}>
                        {paid ? "Pagado" : p.status}
                      </span>
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
