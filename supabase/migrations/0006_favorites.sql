-- ═══════════════════════════════════════════════════════════════════════
--  Migración 0006 — Favoritos (lista de deseos del cliente)
--
--  Cada usuario puede guardar servicios como favoritos. RLS: solo gestiona
--  los suyos. La lectura pública NO aplica (es privado por usuario).
--
--  Ejecuta este archivo en: Supabase → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, service_id)
);

create index if not exists favorites_profile_idx on public.favorites (profile_id);

alter table public.favorites enable row level security;

-- El usuario ve y gestiona únicamente sus favoritos.
create policy "favorites_select_own"
  on public.favorites for select
  using (auth.uid() = profile_id);

create policy "favorites_insert_own"
  on public.favorites for insert
  with check (auth.uid() = profile_id);

create policy "favorites_delete_own"
  on public.favorites for delete
  using (auth.uid() = profile_id);
