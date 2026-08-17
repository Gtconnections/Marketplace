/** Convierte un texto a slug URL-safe. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

/** Sufijo corto aleatorio para garantizar slugs únicos. */
export function shortId(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Número de pedido legible a partir del id de la suscripción/compra. */
export function orderNumber(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** Descuento en centavos para un importe, según el tipo de cupón. */
export function computeDiscount(
  type: "percent" | "fixed",
  value: number,
  amountCents: number,
): number {
  const d =
    type === "percent" ? Math.round((amountCents * value) / 100) : value;
  return Math.max(0, Math.min(d, amountCents));
}

/** Formatea centavos a moneda legible. */
export function formatMoney(amountCents: number, currency = "usd"): string {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

/** Etiqueta legible para el intervalo de cobro. */
export function intervalLabel(interval: string | null): string {
  return interval === "year" ? "/año" : "/mes";
}

/** Sufijo de precio según el modelo de cobro (recurrente vs pago único). */
export function priceSuffix(
  type: string | null | undefined,
  interval: string | null,
): string {
  if (type === "one_time") return " · pago único";
  return intervalLabel(interval);
}
