-- ═══════════════════════════════════════════════════════════════════════
--  0014 · CONFIGURACIÓN DE LA TIENDA (ajustes globales, fila única)
--  Marca, tagline, color de acento, imagen del hero, contacto y redes.
--  Lectura pública (para renderizar el sitio). Las escrituras las hace el
--  servidor con la service role tras verificar que es administrador.
--
--  Ejecuta en: Supabase → SQL Editor → New query → Run. (Aditivo y seguro.)
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.store_settings (
  id               integer primary key default 1,
  store_name       text not null default 'Marketplace',
  tagline          text,
  contact_email    text,
  hero_image_url   text,
  accent           text,             -- color hex de acento (ej. #0052ff)
  social_x         text,
  social_instagram text,
  social_linkedin  text,
  updated_at       timestamptz not null default now(),
  constraint store_settings_singleton check (id = 1)
);

-- Fila única inicial.
insert into public.store_settings (id) values (1)
on conflict (id) do nothing;

alter table public.store_settings enable row level security;

-- Lectura pública (todo el sitio la usa para renderizar la marca).
drop policy if exists "store_settings_select_public" on public.store_settings;
create policy "store_settings_select_public"
  on public.store_settings for select
  using (true);

-- Sin policies de escritura: las actualizaciones van por el servidor (service role).
