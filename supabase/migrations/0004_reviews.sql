-- ═══════════════════════════════════════════════════════════════════════
--  Migración 0004 — Valoraciones y reseñas
--
--  • reviews: una reseña (1–5 estrellas + comentario) por cliente y servicio.
--    Solo puede reseñar quien tiene una compra/suscripción activa.
--  • services.rating_avg / rating_count: agregados, recalculados por trigger.
--
--  Ejecuta este archivo en: Supabase → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════════════

-- ¿El usuario actual tiene acceso activo a este servicio?
create or replace function public.has_active_access(s_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.subscriptions
    where service_id = s_id
      and customer_id = auth.uid()
      and status in ('active', 'trialing')
  );
$$;

-- ── Agregados de rating en services ────────────────────────────────────
alter table public.services
  add column if not exists rating_avg numeric(2, 1) not null default 0,
  add column if not exists rating_count integer not null default 0;

-- ── REVIEWS ────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references public.services (id) on delete cascade,
  vendor_id   uuid not null references public.vendors (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  author_name text,                    -- nombre mostrado (snapshot al crear)
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (service_id, customer_id)     -- una reseña por cliente y servicio
);

create index if not exists reviews_service_idx on public.reviews (service_id);

alter table public.reviews enable row level security;

-- Las reseñas son públicas (para mostrarlas en el catálogo y el detalle).
create policy "reviews_select_public"
  on public.reviews for select
  using (true);

-- Solo puede insertar el propio cliente Y con acceso activo al servicio.
create policy "reviews_insert_own"
  on public.reviews for insert
  with check (customer_id = auth.uid() and public.has_active_access(service_id));

create policy "reviews_update_own"
  on public.reviews for update
  using (customer_id = auth.uid());

create policy "reviews_delete_own"
  on public.reviews for delete
  using (customer_id = auth.uid());

-- ── Recálculo de agregados ─────────────────────────────────────────────
create or replace function public.recompute_service_rating()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  sid uuid := coalesce(new.service_id, old.service_id);
begin
  update public.services s
  set rating_avg = coalesce(
        (select round(avg(rating)::numeric, 1) from public.reviews where service_id = sid),
        0),
      rating_count = (select count(*) from public.reviews where service_id = sid)
  where s.id = sid;
  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_recompute on public.reviews;
create trigger reviews_recompute
  after insert or update or delete on public.reviews
  for each row execute function public.recompute_service_rating();
