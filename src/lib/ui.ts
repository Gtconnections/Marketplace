/**
 * Sistema de diseño — helpers de clases de Tailwind sobre tokens semánticos.
 *
 * Marca Nexus Digital: titulares Geist (font-display), texto Inter (font-sans),
 * etiquetas/datos JetBrains Mono (font-mono). Acento azul eléctrico (primary),
 * profundidad por capas con sombra azulada (shadow-soft/float/pop) y tarjetas
 * glass (glass-card) con elevación al hover.
 */

/** Une clases condicionalmente (mini-clsx). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Contenedor centrado con padding responsivo consistente. */
export const container = "mx-auto w-full max-w-6xl px-5 sm:px-6";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold cursor-pointer " +
  "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg " +
  "disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary shadow-float hover:bg-primary-hover hover:shadow-pop hover:-translate-y-0.5",
  secondary:
    "border border-border bg-surface text-fg shadow-soft hover:bg-surface-2 hover:border-outline",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  danger: "bg-danger text-white shadow-soft hover:opacity-90",
};

// Alturas ≥ 44px en md/lg para buen target táctil; sm=36px (filas densas).
const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-7 text-base",
};

/** Clases para un botón (o un <Link> con apariencia de botón). */
export function btn(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string,
): string {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], extra);
}

/** Card de superficie de vidrio. `hover` añade elevación (glass-card). */
export function card(hover = false, extra?: string): string {
  return cn(
    "rounded-2xl",
    hover ? "glass-card" : "glass-surface",
    extra,
  );
}

/** Campo de formulario (input / select / textarea). */
export const inputCls =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm " +
  "text-fg placeholder:text-muted shadow-soft transition-all duration-200 " +
  "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none";

/** Etiqueta de campo. */
export const labelCls = "block text-sm font-medium text-fg mb-1.5";

/** Caja de mensaje de error de formulario. */
export const errorBox =
  "rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger ring-1 ring-inset ring-danger/20";

/** Precio: cifras en mono con numeración tabular. */
export const priceCls = "font-mono tabular-nums";

type BadgeVariant = "brand" | "neutral" | "success" | "warning";

// Chips en JetBrains Mono con tinte suave, píldora sin borde (DESIGN.md · Chips).
const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  brand: "bg-primary/10 text-primary",
  neutral: "bg-surface-2 text-muted",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

/** Etiqueta/píldora de estado (mono, totalmente redondeada, sin borde). */
export function badge(variant: BadgeVariant = "neutral", extra?: string): string {
  return cn(
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs font-medium",
    BADGE_VARIANTS[variant],
    extra,
  );
}
