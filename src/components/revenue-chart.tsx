import { formatMoney } from "@/lib/utils";

export type MonthPoint = { label: string; ingresos: number; ventas: number };

/**
 * Gráfica de barras de ingresos por mes (presentacional, sin estado).
 * Altura proporcional al mes con más ingresos. Muestra el detalle al pasar
 * el cursor (title nativo) para no depender de JS.
 */
export function RevenueChart({
  data,
  currency = "usd",
}: {
  data: MonthPoint[];
  currency?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.ingresos));
  const totalVentas = data.reduce((s, d) => s + d.ventas, 0);

  return (
    <div>
      <div className="flex items-end justify-between gap-2 sm:gap-3">
        {data.map((d) => {
          const h = Math.round((d.ingresos / max) * 100);
          return (
            <div
              key={d.label}
              className="group flex flex-1 flex-col items-center gap-2"
              title={`${d.label}: ${formatMoney(d.ingresos, currency)} · ${d.ventas} ${
                d.ventas === 1 ? "venta" : "ventas"
              }`}
            >
              <span className="font-mono text-[10px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
                {formatMoney(d.ingresos, currency)}
              </span>
              <div className="flex h-32 w-full items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary/60 to-primary transition-all duration-500 group-hover:from-primary group-hover:to-primary-hover"
                  style={{ height: `${Math.max(2, h)}%` }}
                />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 border-t border-border pt-3 font-mono text-xs text-muted">
        {totalVentas} {totalVentas === 1 ? "venta" : "ventas"} en los últimos{" "}
        {data.length} meses
      </p>
    </div>
  );
}
