-- ═══════════════════════════════════════════════════════════════════════
--  Migración 0016 — Historial de pagos por suscripción
--
--  Cada pago (compra inicial o renovación/re-pago) queda registrado en
--  `payments`, ligado a la suscripción a la que pertenece.
--
--  El webhook de Stripe:
--    • si el cliente ya tiene una suscripción ACTIVA del servicio,
--      extiende su fecha de vencimiento (no duplica la fila);
--    • siempre inserta un pago en `payments`.
--
--  Escrituras solo con la SERVICE ROLE (salta RLS).
--  Ejecuta este archivo en: Supabase → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.payments (
  id                        uuid primary key default gen_random_uuid(),
  subscription_id           uuid not null references public.subscriptions (id) on delete cascade,
  customer_id               uuid not null references public.profiles (id) on delete cascade,
  plan_id                   uuid not null references public.plans (id),
  service_id                uuid not null references public.services (id),
  vendor_id                 uuid not null references public.vendors (id),
  amount_cents              integer not null,
  currency                  text not null default 'usd',
  coupon_code               text,
  discount_cents            integer not null default 0,
  status                    text not null default 'succeeded',
  stripe_checkout_session_id text,
  stripe_payment_intent_id  text,
  stripe_subscription_id    text,
  created_at                timestamptz not null default now()
);

create index if not exists payments_subscription_idx on public.payments (subscription_id);
create index if not exists payments_customer_idx on public.payments (customer_id);
create index if not exists payments_vendor_idx on public.payments (vendor_id);

alter table public.payments
  add constraint payments_stripe_checkout_session_id_key
  unique (stripe_checkout_session_id);

alter table public.payments enable row level security;

-- El cliente ve los pagos de sus suscripciones.
create policy "payments_select_own_customer"
  on public.payments for select
  using (auth.uid() = customer_id);

-- El vendedor ve los pagos de sus servicios.
create policy "payments_select_own_vendor"
  on public.payments for select
  using (public.is_vendor_owner(vendor_id));