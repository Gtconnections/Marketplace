-- ═══════════════════════════════════════════════════════════════════════
--  Migración 0002 — Tipos de cobro en los planes
--
--  Soporta los modelos de precio de los productos digitales de referencia:
--   • Suscripción (membresía) mensual o anual, con prueba opcional
--     (ej.: apps, micro-SaaS, Trim Down Club, Reframe)
--   • Precio fijo / pago único
--     (ej.: planners digitales, mentorías high-ticket, paquetes de fotografía)
--
--  Ejecuta este archivo en: Supabase → SQL Editor → New query → Run.
--  (Es aditivo y seguro de re-ejecutar.)
-- ═══════════════════════════════════════════════════════════════════════

-- ── PLANS ──────────────────────────────────────────────────────────────
-- Tipo de cobro del plan.
alter table public.plans
  add column if not exists type text not null default 'subscription';

-- Restringe los valores válidos (drop+add para poder re-ejecutar sin error).
alter table public.plans drop constraint if exists plans_type_check;
alter table public.plans
  add constraint plans_type_check check (type in ('subscription', 'one_time'));

-- Días de prueba gratis (solo aplica a suscripciones). NULL = sin prueba.
alter table public.plans
  add column if not exists trial_days integer;

-- El intervalo deja de ser obligatorio: los pagos únicos no tienen intervalo.
alter table public.plans alter column interval drop not null;

-- ── SUBSCRIPTIONS (entitlements de compra) ─────────────────────────────
-- Para pagos únicos guardamos el PaymentIntent en lugar del Subscription.
alter table public.subscriptions
  add column if not exists stripe_payment_intent_id text;

-- Clave de idempotencia del webhook (una fila por sesión de checkout).
alter table public.subscriptions
  add column if not exists stripe_checkout_session_id text;

create unique index if not exists subs_checkout_session_idx
  on public.subscriptions (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
