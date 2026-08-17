import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Escapa un valor para CSV (comillas, comas, saltos de línea). */
function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

type Row = {
  created_at: string;
  status: string;
  customer: { full_name: string | null; email: string | null } | null;
  service: { title: string | null } | null;
  plan: {
    name: string | null;
    amount: number | null;
    currency: string | null;
    type: string | null;
    interval: string | null;
  } | null;
};

/**
 * Exporta las suscripciones/ventas del vendedor autenticado en CSV.
 * Verifica que quien llama es dueño del vendor; lee con la service role para
 * incluir datos del cliente (email/nombre).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return new Response("No autenticado", { status: 401 });

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, display_name")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!vendor) return new Response("Sin panel de vendedor", { status: 403 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select(
      "created_at, status, customer:profiles(full_name, email), service:services(title), plan:plans(name, amount, currency, type, interval)",
    )
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  const header = [
    "Fecha",
    "Cliente",
    "Email",
    "Servicio",
    "Plan",
    "Modelo",
    "Intervalo",
    "Importe",
    "Moneda",
    "Estado",
  ];

  const lines = rows.map((r) => {
    const amount =
      r.plan?.amount != null ? (r.plan.amount / 100).toFixed(2) : "";
    const modelo = r.plan?.type === "one_time" ? "Pago único" : "Suscripción";
    const intervalo =
      r.plan?.type === "one_time"
        ? "—"
        : r.plan?.interval === "year"
          ? "Anual"
          : "Mensual";
    return [
      r.created_at ? r.created_at.slice(0, 10) : "",
      r.customer?.full_name ?? "",
      r.customer?.email ?? "",
      r.service?.title ?? "",
      r.plan?.name ?? "",
      modelo,
      intervalo,
      amount,
      (r.plan?.currency ?? "usd").toUpperCase(),
      r.status,
    ]
      .map(csvCell)
      .join(",");
  });

  // BOM para que Excel respete acentos.
  const csv = "﻿" + [header.join(","), ...lines].join("\r\n");
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ventas-${today}.csv"`,
      "cache-control": "no-store",
    },
  });
}
