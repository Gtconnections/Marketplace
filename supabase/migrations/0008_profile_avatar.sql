-- ═══════════════════════════════════════════════════════════════════════
--  Migración 0008 — Avatar de perfil
--
--  • Columna avatar_url en profiles (foto del usuario).
--  • Bucket PÚBLICO `avatars` para las fotos (las subidas las hace el
--    servidor con la service role; la lectura es pública).
--
--  Ejecuta este archivo en: Supabase → SQL Editor → New query → Run.
--  (Aditivo y seguro de re-ejecutar.)
-- ═══════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;
