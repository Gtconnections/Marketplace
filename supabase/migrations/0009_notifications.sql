-- ═══════════════════════════════════════════════════════════════════════
--  0009 · NOTIFICACIONES in-app
--  Avisos por usuario: compra confirmada, nueva venta, nueva reseña, sistema.
--  Los inserts los hace el servidor (service role, salta RLS). El usuario solo
--  lee y marca como leídas las suyas.
--
--  Ejecuta en: Supabase → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null default 'system'
             check (type in ('purchase', 'sale', 'review', 'renewal', 'system')),
  title      text not null,
  body       text,
  href       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications (user_id)
  where read_at is null;

alter table public.notifications enable row level security;

-- Cada usuario lee solo sus notificaciones.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Cada usuario marca como leídas solo las suyas.
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Nota: no hay policy de INSERT para clientes a propósito.
-- Las notificaciones se crean desde el servidor con la service role.
