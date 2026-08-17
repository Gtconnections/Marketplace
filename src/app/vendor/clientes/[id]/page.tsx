import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney, priceSuffix, orderNumber } from "@/lib/utils";
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

type Order = {
  id: string;
  status: string;
  created_at: string;
  discount_cents: number | null;
  coupon_code: string | null;
  service: { title: string | null } | null;
  plan: {
    name: string | null;
    amount: number | null;
    currency: string | null;
    type: string | null;
    interval: string | null;
  } | null;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/vendor/clientes/${id}`);

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!vendor) redirect("/vendor");

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email, created_at")
    .eq("id", id)
    .maybeSingle();

  const { data: orderRows } = await admin
    .from("subscriptions")
    .select(
      "id, status, created_at, discount_cents, coupon_code, service:services(title), plan:plans(name, amount, currency, type, interval)",
    )
    .eq("vendor_id", vendor.id)
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  const orders = (orderRows ?? []) as unknown as Order[];
  if (!profile && orders.length === 0) notFound();

  const spent = orders.reduce(
    (s, o) => s + Math.max(0, (o.plan?.amount ?? 0) - (o.discount_cents ?? 0)),
    0,
  );
  const active = orders.filter(
    (o) => o.status === "active" || o.status === "trialing",
  ).length;

  const name = profile?.full_name || "Cliente";
  const email = profile?.email || "—";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={cn(container, "animate-in py-12")}>
      <Link
        href="/vendor/clientes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Clientes
      </Link>

      {/* Cabecera del cliente */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary-container text-xl font-bold text-on-secondary-container">
          {initial}
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{name}</h1>
          <a
            href={`mailto:${email}`}
            className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
          >
            <Mail className="h-4 w-4" /> {email}
          </a>
        </div>
      </div>

      {/* Métricas del cliente */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className={card(false, "p-5")}>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Pedidos
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-fg">
            {orders.length}
          </p>
        </div>
        <div className={card(false, "p-5")}>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Suscripciones activas
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-fg">{active}</p>
        </div>
        <div className={card(false, "p-5")}>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Total gastado
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-fg">
            {formatMoney(spent)}
          </p>
        </div>
      </div>

      {/* Pedidos del cliente */}
      <h2 className="mb-4 mt-10 text-lg font-semibold tracking-tight text-fg">
        Pedidos
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-surface-2/50 font-mono text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Pedido</th>
              <th className="px-5 py-3 text-left font-medium">Servicio</th>
              <th className="px-5 py-3 text-left font-medium">Fecha</th>
              <th className="px-5 py-3 text-left font-medium">Estado</th>
              <th className="px-5 py-3 text-right font-medium">Importe</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const isActive =
                o.status === "active" || o.status === "trialing";
              const net = Math.max(
                0,
                (o.plan?.amount ?? 0) - (o.discount_cents ?? 0),
              );
              return (
                <tr key={o.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 font-mono text-xs text-muted">
                    #{orderNumber(o.id)}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-fg">{o.service?.title ?? "—"}</p>
                    <p className="text-xs text-muted">
                      {o.plan?.name}
                      {o.coupon_code ? ` · cupón ${o.coupon_code}` : ""}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-muted">{fmtDate(o.created_at)}</td>
                  <td className="px-5 py-4">
                    <span className={badge(isActive ? "success" : "neutral")}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-fg">
                    {formatMoney(net, o.plan?.currency ?? "usd")}
                    <span className="font-normal text-muted">
                      {priceSuffix(o.plan?.type, o.plan?.interval ?? null)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
