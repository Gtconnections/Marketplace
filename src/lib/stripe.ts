import Stripe from "stripe";

/**
 * Cliente de Stripe (solo servidor).
 * Usa la API version por defecto de tu cuenta; no fijamos una versión
 * literal para evitar desajustes con los tipos del SDK.
 */
// El fallback solo evita que el constructor falle en build sin secretos.
// En runtime SIEMPRE se usa la clave real de process.env.STRIPE_SECRET_KEY.
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_build_only",
  { appInfo: { name: "Marketplace", version: "0.1.0" } },
);
