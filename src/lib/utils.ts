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
