-- ═══════════════════════════════════════════════════════════════════════
--  Migración 0007 — Campos SEO por servicio
--
--  Meta título y meta descripción opcionales para controlar cómo aparece
--  cada servicio en buscadores y al compartir el enlace (Open Graph).
--  Si están vacíos, la app usa el título y la descripción del servicio.
--
--  Ejecuta este archivo en: Supabase → SQL Editor → New query → Run.
--  (Es aditivo y seguro de re-ejecutar.)
-- ═══════════════════════════════════════════════════════════════════════

alter table public.services
  add column if not exists meta_title text;

alter table public.services
  add column if not exists meta_description text;
