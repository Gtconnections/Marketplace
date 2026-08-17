-- ═══════════════════════════════════════════════════════════════════════
--  0012 · PREGUNTAS Y RESPUESTAS (Q&A) por servicio
--  • Cualquier usuario autenticado puede preguntar (no requiere compra).
--  • El vendedor (dueño del servicio) responde; la respuesta la escribe el
--    servidor tras verificar la propiedad.
--  • Las preguntas y respuestas son públicas (contenido para SEO y confianza).
--
--  Ejecuta en: Supabase → SQL Editor → New query → Run. (Aditivo y seguro.)
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references public.services (id) on delete cascade,
  vendor_id   uuid not null references public.vendors (id) on delete cascade,
  asker_id    uuid not null references public.profiles (id) on delete cascade,
  asker_name  text,
  body        text not null,
  answer      text,
  answered_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists questions_service_idx
  on public.questions (service_id, created_at desc);

alter table public.questions enable row level security;

-- Públicas: cualquiera las lee (detalle del servicio).
drop policy if exists "questions_select_public" on public.questions;
create policy "questions_select_public"
  on public.questions for select
  using (true);

-- Cualquier usuario autenticado puede preguntar (como sí mismo).
drop policy if exists "questions_insert_own" on public.questions;
create policy "questions_insert_own"
  on public.questions for insert
  with check (asker_id = auth.uid());

-- El autor puede editar/borrar su propia pregunta.
drop policy if exists "questions_update_own" on public.questions;
create policy "questions_update_own"
  on public.questions for update
  using (asker_id = auth.uid());

drop policy if exists "questions_delete_own" on public.questions;
create policy "questions_delete_own"
  on public.questions for delete
  using (asker_id = auth.uid());

-- Nota: la RESPUESTA del vendedor se escribe desde el servidor con la service
-- role (tras verificar que es el dueño del servicio), por eso no hace falta una
-- policy de update para el vendedor.
