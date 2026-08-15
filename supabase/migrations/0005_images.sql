-- ═══════════════════════════════════════════════════════════════════════
--  Migración 0005 — Imágenes y galería de servicios
--
--  • Bucket PÚBLICO service-images (las imágenes de producto son públicas).
--  • Tabla service_images: galería por servicio; position 0 = portada.
--  • services.cover_image_url (ya existe) guarda la URL de portada
--    denormalizada para las tarjetas del catálogo.
--
--  Ejecuta este archivo en: Supabase → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('service-images', 'service-images', true)
on conflict (id) do nothing;

create table if not exists public.service_images (
  id         uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  vendor_id  uuid not null references public.vendors (id) on delete cascade,
  url        text not null,           -- URL pública de la imagen
  path       text not null,           -- ruta en el bucket (para borrar)
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists service_images_service_idx
  on public.service_images (service_id, position);

alter table public.service_images enable row level security;

-- Galería pública (se muestra en catálogo y detalle).
create policy "service_images_select_public"
  on public.service_images for select
  using (true);

-- Solo el dueño del servicio gestiona sus imágenes.
create policy "service_images_insert_own"
  on public.service_images for insert
  with check (public.owns_service(service_id));

create policy "service_images_update_own"
  on public.service_images for update
  using (public.owns_service(service_id));

create policy "service_images_delete_own"
  on public.service_images for delete
  using (public.owns_service(service_id));
