-- ═══════════════════════════════════════════════════════════════════════
--  Migración 0003 — Archivos descargables + varios planes por servicio
--
--  • Bucket PRIVADO de Storage para los archivos entregables.
--  • Columnas en `services` para guardar el archivo adjunto (opcional).
--  • (Los "varios planes por servicio" ya los soporta la tabla `plans`,
--     que puede tener N filas por service_id; no requiere cambios de esquema.)
--
--  El acceso a los archivos NO usa RLS de Storage: se gestiona en el servidor
--  con la service role (subida) y URLs firmadas temporales (descarga), previa
--  verificación de que el cliente tiene una compra/suscripción activa.
--
--  Ejecuta este archivo en: Supabase → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════════════

-- Bucket privado para entregables.
insert into storage.buckets (id, name, public)
values ('deliverables', 'deliverables', false)
on conflict (id) do nothing;

-- Archivo adjunto del servicio (opcional).
alter table public.services
  add column if not exists download_path text,   -- ruta dentro del bucket
  add column if not exists download_name text;   -- nombre visible del archivo
