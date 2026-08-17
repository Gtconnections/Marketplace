import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/utils";
import { ArrowLeft, Users, Download } from "@/components/icons";
import { container, card, badge, btn, cn } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Row = {
  customer_id: string;
  status: string;
  created_at: string;
  discount_cents: number | null;
  customer: { full_name: string | null; email: string | null } | null;
  plan: { amount: number | null } | null;
};

type Client = {
  id: string;
  name: string;
  email: string;
  orders: number;
  active: number;
  spent: number;
  last: string;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vendor/clientes");

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!vendor) redirect("/vendor");

  // Lee las ventas con datos del cliente vía service role (verificado el dueño).
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select(
      "customer_id, status, created_at, discount_cents, customer:profiles(full_name, email), plan:plans(amount)",
    )
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  // Agrega por cliente.
  const byClient = new Map<string, Client>();
  for (const r of rows) {
    const net = Math.max(0, (r.plan?.amount ?? 0) - (r.discount_cents ?? 0));
    const isActive = r.status === "active" || r.status === "trialing";
    const existing = byClient.get(r.customer_id);
    if (existing) {
      existing.orders += 1;
      existing.active += isActive ? 1 : 0;
      existing.spent += net;
      if (r.created_at > existing.last) existing.last = r.created_at;
    } else {
      byClient.set(r.customer_id, {
        id: r.customer_id,
        name: r.customer?.full_name || "Cliente",
        email: r.customer?.email || "—",
        orders: 1,
        active: isActive ? 1 : 0,
        spent: net,
        last: r.created_at,
      });
    }
  }
  const clients = [...byClient.values()].sort((a, b) => b.spent - a.spent);
  const totalIngresos = clients.reduce((s, c) => s + c.spent, 0);

  return (
    <div className={cn(container, "animate-in py-12")}>
      <Link
        href="/vendor"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Panel
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-fg">Clientes</h1>
            <p className="text-sm text-muted">
              Quién ha comprado tus servicios y cuánto.
            </p>
          </div>
        </div>
        {clients.length > 0 && (
          <a
            href="/api/vendor/export"
            className={cn(btn("ghost", "md"), "gap-2")}
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </a>
        )}
      </div>

      {clients.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className={card(false, "p-5")}>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Clientes
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-fg">
              {clients.length}
            </p>
          </div>
          <div className={card(false, "p-5")}>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Ingresos totales
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-fg">
              {formatMoney(totalIngresos)}
            </p>
          </div>
          <div className={card(false, "p-5")}>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Ticket medio / cliente
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-fg">
              {formatMoney(
                clients.length ? Math.round(totalIngresos / clients.length) : 0,
              )}
            </p>
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <div className={card(false, "mt-8 p-12 text-center text-sm text-muted")}>
          Aún no tienes clientes. Cuando alguien contrate un servicio, aparecerá
          aquí.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-border bg-surface-2/50 font-mono text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Cliente</th>
                <th className="px-5 py-3 text-left font-medium">Pedidos</th>
                <th className="px-5 py-3 text-left font-medium">Activos</th>
                <th className="px-5 py-3 text-left font-medium">Última compra</th>
                <th className="px-5 py-3 text-right font-medium">Total gastado</th>
                <th className="px-5 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-surface-2/30"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-fg">{c.name}</p>
                    <p className="text-xs text-muted">{c.email}</p>
                  </td>
                  <td className="px-5 py-4 text-muted">{c.orders}</td>
                  <td className="px-5 py-4">
                    {c.active > 0 ? (
                      <span className={badge("success")}>{c.active} activo{c.active > 1 ? "s" : ""}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-muted">{fmtDate(c.last)}</td>
                  <td className="px-5 py-4 text-right font-semibold text-fg">
                    {formatMoney(c.spent)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/vendor/clientes/${c.id}`}
                      className={btn("secondary", "sm")}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
