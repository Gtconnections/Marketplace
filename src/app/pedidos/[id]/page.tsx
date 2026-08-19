import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, priceSuffix, orderNumber } from "@/lib/utils";
import { isDemoPayments } from "@/lib/config";
import { PrintButton } from "@/components/print-button";
import { ArrowLeft } from "@/components/icons";
import { container, badge, cn } from "@/lib/ui";
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

function fmtDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/pedidos/${id}`);

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*, service:services(*, vendor:vendors(*)), plan:plans(*)")
    .eq("id", id)
    .eq("customer_id", user.id)
    .maybeSingle();
  if (!sub) notFound();

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("subscription_id", sub.id)
    .order("created_at", { ascending: false });

  const service = sub.service as (Service & { vendor: Vendor }) | null;
  const plan = sub.plan as Plan | null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const active = sub.status === "active" || sub.status === "trialing";
  const currency = plan?.currency ?? "usd";
  const subtotalCents = plan?.amount ?? 0;
  const discountCents = sub.discount_cents ?? 0;
  const totalCents = Math.max(0, subtotalCents - discountCents);
  const amount = plan ? formatMoney(subtotalCents, currency) : "—";
  const totalAmount = plan ? formatMoney(totalCents, currency) : "—";
  const modelo = plan?.type === "one_time" ? "Pago único" : "Suscripción";
  const txId =
    sub.stripe_checkout_session_id || sub.stripe_payment_intent_id || sub.id;

  return (
    <div className={cn(container, "animate-in py-12")}>
      {/* Barra de acciones (no se imprime) */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" /> Mis pedidos
        </Link>
        <PrintButton />
      </div>

      {/* Recibo */}
      <div className="print-surface mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8 shadow-soft sm:p-10">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-display text-base font-bold text-on-primary"
            >
              M
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-fg">
              Marketplace
            </span>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Recibo
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-fg">
              #{orderNumber(sub.id)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Facturado a
            </p>
            <p className="mt-2 font-medium text-fg">
              {profile?.full_name || "Cliente"}
            </p>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
          <div className="sm:text-right">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Vendedor
            </p>
            <p className="mt-2 font-medium text-fg">
              {service?.vendor?.display_name ?? "—"}
            </p>
            <p className="text-sm text-muted">Fecha: {fmtDateLong(sub.created_at)}</p>
          </div>
        </div>

        {/* Detalle */}
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-2/50 font-mono text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Concepto</th>
                <th className="px-4 py-2.5 text-left font-medium">Modelo</th>
                <th className="px-4 py-2.5 text-right font-medium">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4">
                  <p className="font-medium text-fg">{service?.title ?? "—"}</p>
                  {plan && (
                    <p className="text-xs text-muted">{plan.name}</p>
                  )}
                </td>
                <td className="px-4 py-4 text-muted">
                  {modelo}
                  {plan?.type !== "one_time" && (
                    <span className="text-muted">
                      {" "}
                      {priceSuffix(plan?.type, plan?.interval ?? null)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-right font-medium text-fg">
                  {amount}
                </td>
              </tr>
            </tbody>
            <tfoot className="border-t border-border">
              {discountCents > 0 && (
                <>
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-right text-muted">
                      Subtotal
                    </td>
                    <td className="px-4 py-2 text-right text-muted">{amount}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="px-4 py-2 text-right text-success">
                      Descuento
                      {sub.coupon_code ? ` (${sub.coupon_code})` : ""}
                    </td>
                    <td className="px-4 py-2 text-right text-success">
                      −{formatMoney(discountCents, currency)}
                    </td>
                  </tr>
                </>
              )}
              <tr>
                <td colSpan={2} className="px-4 py-3 text-right font-semibold text-fg">
                  Total
                </td>
                <td className="px-4 py-3 text-right font-bold text-fg">
                  {totalAmount}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Meta */}
        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Estado
            </p>
            <span className={cn(badge(active ? "success" : "neutral"), "mt-2")}>
              {STATUS_LABEL[sub.status] ?? sub.status}
            </span>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Método de pago
            </p>
            <p className="mt-2 text-fg">
              {isDemoPayments ? "Modo demo (simulado)" : "Tarjeta (Stripe)"}
            </p>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Próximo cobro
            </p>
            <p className="mt-2 text-fg">
              {plan?.type === "one_time"
                ? "Pago único"
                : sub.current_period_end
                  ? fmtDateLong(sub.current_period_end)
                  : "—"}
            </p>
          </div>
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Transacción
            </p>
            <p className="mt-2 truncate font-mono text-xs text-muted" title={txId}>
              {txId}
            </p>
          </div>
        </div>

        {payments && payments.length > 0 && (
          <div className="mt-8">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
              Historial de pagos
            </h2>
            <div className="mt-2 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface-2/50 font-mono text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
                    <th className="px-4 py-2.5 text-left font-medium">Importe</th>
                    <th className="px-4 py-2.5 text-right font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">{fmtDateLong(p.created_at)}</td>
                      <td className="px-4 py-3">
                        {formatMoney(p.amount_cents, p.currency)}
                        {p.discount_cents > 0 && (
                          <span className="ml-1 text-xs text-success">
                            (desc. {formatMoney(p.discount_cents, p.currency)}
                            {p.coupon_code ? ` ${p.coupon_code}` : ""})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            badge(p.status === "succeeded" ? "success" : "neutral"),
                          )}
                        >
                          {p.status === "succeeded" ? "Pagado" : p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-8 border-t border-border pt-5 text-center text-xs text-muted">
          Gracias por tu compra. Este documento es un comprobante generado por
          Marketplace.
          {isDemoPayments &&
            " Pago simulado en modo demo — no representa un cobro real."}
        </p>
      </div>
    </div>
  );
}
