-- ═══════════════════════════════════════════════════════════════════════
--  0013 · CUPONES Y DESCUENTOS
--  • coupons: códigos por vendedor (% o monto fijo, vigencia y límite de usos).
--  • subscriptions.coupon_code / discount_cents: descuento aplicado a la compra.
--  La validación en el checkout se hace en el servidor (service role); por eso
--  el comprador no necesita leer la tabla de cupones directamente.
--
--  Ejecuta en: Supabase → SQL Editor → New query → Run. (Aditivo y seguro.)
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.coupons (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendors (id) on delete cascade,
  code            text not null,
  type            text not null check (type in ('percent', 'fixed')),
  value           integer not null check (value > 0),  -- percent 1–100 · fixed en centavos
  active          boolean not null default true,
  max_redemptions integer,                              -- null = ilimitado
  times_redeemed  integer not null default 0,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  unique (vendor_id, code)
);

create index if not exists coupons_vendor_idx on public.coupons (vendor_id);

alter table public.coupons enable row level security;

-- El vendedor gestiona (lee/crea/edita/borra) solo sus cupones.
drop policy if exists "coupons_select_own" on public.coupons;
create policy "coupons_select_own"
  on public.coupons for select
  using (public.is_vendor_owner(vendor_id));

drop policy if exists "coupons_insert_own" on public.coupons;
create policy "coupons_insert_own"
  on public.coupons for insert
  with check (public.is_vendor_owner(vendor_id));

drop policy if exists "coupons_update_own" on public.coupons;
create policy "coupons_update_own"
  on public.coupons for update
  using (public.is_vendor_owner(vendor_id));

drop policy if exists "coupons_delete_own" on public.coupons;
create policy "coupons_delete_own"
  on public.coupons for delete
  using (public.is_vendor_owner(vendor_id));

-- Descuento aplicado en la compra.
alter table public.subscriptions
  add column if not exists coupon_code    text,
  add column if not exists discount_cents integer not null default 0;
