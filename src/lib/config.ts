/**
 * Configuración central de la plataforma.
 * Valores derivados de variables de entorno con defaults seguros.
 */

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

/** Comisión de la plataforma sobre cada suscripción, en porcentaje (0-100). */
export const platformFeePercent = Number(process.env.PLATFORM_FEE_PERCENT ?? "10");

/**
 * Modo de pagos:
 *  - "demo"   → botón de pago ficticio, sin Stripe (por defecto, para desarrollo).
 *  - "stripe" → cobros reales con Stripe Connect.
 * Cámbialo con NEXT_PUBLIC_PAYMENTS_MODE=stripe cuando quieras activar Stripe.
 */
export const paymentsMode: "demo" | "stripe" =
  process.env.NEXT_PUBLIC_PAYMENTS_MODE === "stripe" ? "stripe" : "demo";

export const isDemoPayments = paymentsMode === "demo";

/**
 * Administradores (los únicos que pueden vender/publicar). Tienda de un solo
 * vendedor por ahora; en el futuro se abrirá a más. Configúralo con
 * ADMIN_EMAILS (separado por comas). Por defecto, el dueño de la tienda.
 */
export const adminEmails = (process.env.ADMIN_EMAILS ?? "martin@gtconnections.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** ¿Este email es administrador (puede publicar)? */
export function isAdminEmail(email?: string | null): boolean {
  return Boolean(email && adminEmails.includes(email.toLowerCase()));
}

/** Categorías de servicios que admite el marketplace (servicios y suscripciones). */
export const SERVICE_CATEGORIES = [
  { value: "mentoria", label: "Mentoría" },
  { value: "membresia", label: "Membresía / Comunidad" },
  { value: "coaching", label: "Coaching" },
  { value: "consultoria", label: "Consultoría" },
  { value: "curso", label: "Curso / Programa" },
  { value: "otro", label: "Otro" },
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]["value"];

/** Intervalos de cobro soportados. */
export const BILLING_INTERVALS = [
  { value: "month", label: "Mensual" },
  { value: "year", label: "Anual" },
] as const;

export type BillingInterval = (typeof BILLING_INTERVALS)[number]["value"];

/**
 * Modelos de cobro de un servicio.
 * - subscription: membresía con pago recurrente (mensual/anual), prueba opcional.
 * - one_time: precio fijo, un solo pago (planners, mentorías high-ticket, paquetes).
 */
export const PRICING_TYPES = [
  {
    value: "subscription",
    label: "Membresía",
    description: "Pago recurrente (mensual o anual)",
  },
  {
    value: "one_time",
    label: "Precio fijo",
    description: "Un solo pago",
  },
] as const;

export type PricingType = (typeof PRICING_TYPES)[number]["value"];
