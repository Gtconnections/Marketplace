-- ═══════════════════════════════════════════════════════════════════════
--  0010 · RESEÑAS ENRIQUECIDAS
--  • Foto opcional en la reseña (bucket público `review-photos`).
--  • Votos "me fue útil" (tabla review_helpful + contador en reviews).
--  • Respuesta del vendedor (vendor_reply) — la escribe el servidor tras
--    verificar que quien responde es el dueño del servicio.
--
--  Ejecuta en: Supabase → SQL Editor → New query → Run. (Aditivo y seguro.)
-- ═══════════════════════════════════════════════════════════════════════

-- ── Columnas nuevas en reviews ─────────────────────────────────────────
alter table public.reviews
  add column if not exists photo_url        text,
  add column if not exists photo_path       text,
  add column if not exists helpful_count    integer not null default 0,
  add column if not exists vendor_reply     text,
  add column if not exists vendor_reply_at  timestamptz;

-- ── Votos "útil" (uno por usuario y reseña) ────────────────────────────
create table if not exists public.review_helpful (
  review_id  uuid not null references public.reviews (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, profile_id)
);

alter table public.review_helpful enable row level security;

-- Lectura pública (para pintar el conteo y saber si yo voté).
drop policy if exists "review_helpful_select" on public.review_helpful;
create policy "review_helpful_select"
  on public.review_helpful for select
  using (true);

-- Cada usuario añade/quita solo su propio voto.
drop policy if exists "review_helpful_insert_own" on public.review_helpful;
create policy "review_helpful_insert_own"
  on public.review_helpful for insert
  with check (profile_id = auth.uid());

drop policy if exists "review_helpful_delete_own" on public.review_helpful;
create policy "review_helpful_delete_own"
  on public.review_helpful for delete
  using (profile_id = auth.uid());

-- Mantiene reviews.helpful_count sincronizado.
create or replace function public.recompute_review_helpful()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  rid uuid := coalesce(new.review_id, old.review_id);
begin
  update public.reviews r
  set helpful_count = (
    select count(*) from public.review_helpful where review_id = rid
  )
  where r.id = rid;
  return coalesce(new, old);
end;
$$;

drop trigger if exists review_helpful_recount on public.review_helpful;
create trigger review_helpful_recount
  after insert or delete on public.review_helpful
  for each row execute function public.recompute_review_helpful();

-- ── Bucket para las fotos de reseña ────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;
