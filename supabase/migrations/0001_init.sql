-- ═══════════════════════════════════════════════════════════════════════
--  Marketplace de servicios y suscripciones — esquema inicial
--  Diseñado MULTI-VENDEDOR desde el día 1 (aunque lances con un solo vendedor).
--
--  Ejecuta este archivo en: Supabase → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════════════

-- ── Extensiones ────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ═══════════════════════════════════════════════════════════════════════
--  1. PROFILES  (1:1 con auth.users)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'customer'
             check (role in ('customer', 'vendor', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada usuario lee y actualiza su propio perfil.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Al crearse un usuario en auth, se crea su fila en profiles automáticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════
--  2. VENDORS  (un perfil que vende)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.vendors (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles (id) on delete cascade,
  display_name      text not null,
  slug              text not null unique,
  bio               text,
  stripe_account_id text,               -- cuenta de Stripe Connect (acct_...)
  charges_enabled   boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (profile_id)
);

alter table public.vendors enable row level security;

-- Storefronts públicos: cualquiera puede leer la info del vendedor.
create policy "vendors_select_public"
  on public.vendors for select
  using (true);

-- El dueño gestiona su propio registro de vendedor.
create policy "vendors_insert_own"
  on public.vendors for insert
  with check (auth.uid() = profile_id);

create policy "vendors_update_own"
  on public.vendors for update
  using (auth.uid() = profile_id);

-- Helper: ¿el usuario actual es dueño de este vendor?
create or replace function public.is_vendor_owner(v_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.vendors
    where id = v_id and profile_id = auth.uid()
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════
--  3. SERVICES  (la oferta: mentoría, membresía, coaching, ...)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.services (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendors (id) on delete cascade,
  title           text not null,
  slug            text not null unique,
  description     text,
  category        text not null default 'otro',
  cover_image_url text,
  status          text not null default 'draft'
                  check (status in ('draft', 'published')),
  created_at      timestamptz not null default now()
);

create index if not exists services_vendor_idx on public.services (vendor_id);
create index if not exists services_status_idx on public.services (status);

alter table public.services enable row level security;

-- El público ve los servicios publicados.
create policy "services_select_published"
  on public.services for select
  using (status = 'published');

-- El vendedor ve y gestiona TODOS sus servicios (borradores incluidos).
create policy "services_select_own"
  on public.services for select
  using (public.is_vendor_owner(vendor_id));

create policy "services_insert_own"
  on public.services for insert
  with check (public.is_vendor_owner(vendor_id));

create policy "services_update_own"
  on public.services for update
  using (public.is_vendor_owner(vendor_id));

create policy "services_delete_own"
  on public.services for delete
  using (public.is_vendor_owner(vendor_id));

-- ═══════════════════════════════════════════════════════════════════════
--  4. PLANS  (precio/plan de suscripción de un servicio = Stripe Price)
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.plans (
  id                uuid primary key default gen_random_uuid(),
  service_id        uuid not null references public.services (id) on delete cascade,
  name              text not null,
  interval          text not null default 'month'
                    check (interval in ('month', 'year')),
  amount            integer not null,          -- centavos
  currency          text not null default 'usd',
  stripe_product_id text,
  stripe_price_id   text,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

create index if not exists plans_service_idx on public.plans (service_id);

alter table public.plans enable row level security;

-- Helper: ¿el usuario es dueño del servicio al que pertenece el plan?
create or replace function public.owns_service(s_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1
    from public.services s
    join public.vendors v on v.id = s.vendor_id
    where s.id = s_id and v.profile_id = auth.uid()
  );
$$;

-- Público: ve planes activos de servicios publicados.
create policy "plans_select_public"
  on public.plans for select
  using (
    active and exists (
      select 1 from public.services s
      where s.id = plans.service_id and s.status = 'published'
    )
  );

-- Vendedor: ve y gestiona los planes de sus servicios.
create policy "plans_select_own"
  on public.plans for select
  using (public.owns_service(service_id));

create policy "plans_insert_own"
  on public.plans for insert
  with check (public.owns_service(service_id));

create policy "plans_update_own"
  on public.plans for update
  using (public.owns_service(service_id));

create policy "plans_delete_own"
  on public.plans for delete
  using (public.owns_service(service_id));

-- ═══════════════════════════════════════════════════════════════════════
--  5. SUBSCRIPTIONS  (la suscripción de un cliente a un servicio)
--     Las escrituras las hace el webhook con la service role key (salta RLS).
-- ═══════════════════════════════════════════════════════════════════════
create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  customer_id            uuid not null references public.profiles (id) on delete cascade,
  plan_id                uuid not null references public.plans (id),
  service_id             uuid not null references public.services (id),
  vendor_id              uuid not null references public.vendors (id),
  stripe_subscription_id text unique,
  stripe_customer_id     text,
  status                 text not null default 'incomplete',
  current_period_end     timestamptz,
  created_at             timestamptz not null default now()
);

create index if not exists subs_customer_idx on public.subscriptions (customer_id);
create index if not exists subs_vendor_idx on public.subscriptions (vendor_id);

alter table public.subscriptions enable row level security;

-- El cliente ve sus propias suscripciones.
create policy "subs_select_own_customer"
  on public.subscriptions for select
  using (auth.uid() = customer_id);

-- El vendedor ve las suscripciones a sus servicios.
create policy "subs_select_own_vendor"
  on public.subscriptions for select
  using (public.is_vendor_owner(vendor_id));

-- Nota: no hay policies de INSERT/UPDATE para usuarios normales.
-- Solo el webhook (service role) escribe aquí, y la service role salta RLS.
