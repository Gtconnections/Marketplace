-- ═══════════════════════════════════════════════════════════════════════
--  Seed: convierte tu cuenta en ADMINISTRADOR y crea tu TIENDA (vendor).
--
--  REQUISITO PREVIO: primero regístrate en la app con este correo
--  (ve a /signup). Al registrarte, el trigger `on_auth_user_created` crea
--  tu fila en `profiles` automáticamente. Este script solo la promueve a
--  admin y le añade la tienda.
--
--  Cómo ejecutarlo:
--    Supabase → SQL Editor → New query → pega esto → Run.
--
--  Es idempotente: puedes correrlo varias veces sin duplicar nada.
--  Ajusta las tres variables de abajo a tu gusto antes de correr.
-- ═══════════════════════════════════════════════════════════════════════

do $$
declare
  -- ── Ajusta estos valores ──────────────────────────────────────────────
  v_email        text := 'martin@gtconnections.com';   -- tu correo (debe existir en auth.users)
  v_store_name   text := 'GT Connections';             -- nombre público de la tienda
  v_store_slug   text := 'gt-connections';             -- URL de la tienda: /store/<slug>
  v_store_bio    text := 'Tienda oficial de GT Connections.';
  -- ──────────────────────────────────────────────────────────────────────
  v_uid uuid;
begin
  -- 1) Localiza el usuario por correo.
  select id into v_uid
  from auth.users
  where lower(email) = lower(v_email);

  if v_uid is null then
    raise exception
      'No existe ningún usuario con el correo %. Regístrate primero en la app (/signup) y vuelve a correr este script.',
      v_email;
  end if;

  -- 2) Asegura la fila de perfil y márcala como admin.
  insert into public.profiles (id, email, role)
  values (v_uid, v_email, 'admin')
  on conflict (id) do update
    set role  = 'admin',
        email = excluded.email;

  -- 3) Crea la tienda (vendor) si aún no existe para este perfil.
  insert into public.vendors (profile_id, display_name, slug, bio)
  values (v_uid, v_store_name, v_store_slug, v_store_bio)
  on conflict (profile_id) do update
    set display_name = excluded.display_name,
        bio          = excluded.bio;

  raise notice 'Listo: % es admin y su tienda "%" (slug: %) está creada.',
    v_email, v_store_name, v_store_slug;
end $$;

-- Verificación rápida (opcional): descomenta para ver el resultado.
-- select p.email, p.role, v.display_name, v.slug
-- from public.profiles p
-- left join public.vendors v on v.profile_id = p.id
-- where lower(p.email) = lower('martin@gtconnections.com');
