-- ═══════════════════════════════════════════════════════════════════════
--  0011 · BORRADORES + PROGRAMAR PUBLICACIÓN
--  • Nuevo estado 'scheduled' (programado): no es público hasta su fecha.
--  • Columna publish_at: cuándo debe publicarse automáticamente.
--
--  La publicación automática se dispara de forma perezosa desde la app
--  (al visitar el home / catálogo / panel se publican los que ya vencieron).
--  Así funciona sin cron en modo demo.
--
--  Ejecuta en: Supabase → SQL Editor → New query → Run. (Aditivo y seguro.)
-- ═══════════════════════════════════════════════════════════════════════

alter table public.services
  add column if not exists publish_at timestamptz;

-- Amplía el check de status para admitir 'scheduled'.
alter table public.services drop constraint if exists services_status_check;
alter table public.services
  add constraint services_status_check
  check (status in ('draft', 'published', 'scheduled'));

create index if not exists services_publish_at_idx
  on public.services (publish_at)
  where status = 'scheduled';
