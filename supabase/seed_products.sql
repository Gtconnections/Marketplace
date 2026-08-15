-- ═══════════════════════════════════════════════════════════════════════
--  Seed: 20 productos digitales de relleno (basados en tu documento).
--
--  Inserta 20 servicios PUBLICADOS en tu tienda, cada uno con:
--    • su(s) plan(es) de precio (membresía o pago único, según el documento),
--    • portada + galería de imágenes reales (Unsplash),
--    • categoría y descripción.
--
--  REQUISITO PREVIO: haber corrido `seed_admin.sql` (necesitas tu tienda
--  creada). Si no existe la tienda, este script se detiene con un aviso.
--
--  Cómo ejecutarlo:
--    Supabase → SQL Editor → New query → pega esto → Run.
--
--  Es IDEMPOTENTE: borra estos 20 productos (por slug) antes de reinsertarlos,
--  así que puedes correrlo las veces que quieras sin duplicar nada.
--  (El borrado en cascada elimina también sus planes e imágenes.)
--
--  Ajusta el correo si tu admin es otro.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 0) Verifica que exista la tienda del admin ─────────────────────────
do $$
begin
  if not exists (
    select 1
    from public.vendors v
    join auth.users u on u.id = v.profile_id
    where lower(u.email) = lower('martin@gtconnections.com')
  ) then
    raise exception
      'No existe una tienda para martin@gtconnections.com. Corre primero seed_admin.sql.';
  end if;
end $$;

-- ── 1) Limpia los 20 productos previos (idempotencia) ──────────────────
delete from public.services
where slug in (
  'complete-wedding-planning-system','teds-woodworking','pencil-drawing-made-easy',
  'yang-mun','the-trim-down-club','reframe','menufit','resumax','talknotes',
  'gettranscribe','metricool','submagic','klap','sandcastles','arvow',
  'freedom-builders-elite','the-inner-circle','squadron-twosix',
  'awakening-with-alison','ray-hennessy-bird-photography'
);

-- ── 2) Inserta servicios + planes + imágenes ───────────────────────────
with target as (
  select v.id as vendor_id
  from public.vendors v
  join auth.users u on u.id = v.profile_id
  where lower(u.email) = lower('martin@gtconnections.com')
  limit 1
),

-- Datos de los 20 servicios: (título, slug, descripción, categoría)
svc(title, slug, description, category) as (
  values
    ('Complete Wedding Planning System','complete-wedding-planning-system',
     'Sistema completo de planificación de bodas: hojas de cálculo, listas de verificación, presupuestos y plantillas de diseño listas para usar. Todo lo que una pareja necesita para organizar el gran día sin estrés.',
     'curso'),
    ('Ted''s Woodworking','teds-woodworking',
     '16.000 planos de carpintería con diagramas paso a paso, medidas exactas y listas de materiales. Para principiantes y expertos que quieren construir muebles y proyectos de madera.',
     'curso'),
    ('Pencil Drawing Made Easy','pencil-drawing-made-easy',
     'Curso en video de más de 40 horas para aprender a dibujar a lápiz desde cero. Técnicas de sombreado, retrato y perspectiva explicadas de forma sencilla.',
     'curso'),
    ('Yang Mun','yang-mun',
     'Colección de ebooks e ilustraciones generadas con IA para creadores de contenido. Recursos listos para publicar y personalizar, con tres niveles de acceso.',
     'curso'),
    ('The Trim Down Club','the-trim-down-club',
     'Comunidad de nutrición con planes de alimentación personalizados, recetas y seguimiento semanal. Baja de peso con acompañamiento real, no dietas de moda.',
     'membresia'),
    ('Reframe','reframe',
     'App y comunidad para cambiar tu relación con el alcohol. Contenido diario, sesiones en vivo y una comunidad privada que te acompaña en el proceso.',
     'membresia'),
    ('MenuFit','menufit',
     'Planificador de comidas inteligente con base de datos de millones de restaurantes y recetas. Come mejor sin complicarte, adaptado a tus objetivos.',
     'membresia'),
    ('ResuMax','resumax',
     'Crea currículums profesionales en minutos con plantillas optimizadas para sistemas ATS. Entra tu información y descarga un CV que destaca.',
     'membresia'),
    ('TalkNotes','talknotes',
     'Convierte tus notas de voz en texto organizado automáticamente. Ideal para creadores, estudiantes y profesionales que piensan en voz alta.',
     'membresia'),
    ('GetTranscribe','gettranscribe',
     'Transcribe y reutiliza tu contenido de TikTok, Instagram y YouTube en segundos. Convierte un video en artículos, hilos y subtítulos.',
     'membresia'),
    ('Metricool','metricool',
     'Gestiona y analiza todas tus redes sociales desde un solo panel. Programa publicaciones, mide resultados y ahorra horas cada semana.',
     'membresia'),
    ('SubMagic','submagic',
     'Añade subtítulos animados y efectos virales a tus videos con IA. Edita como un profesional sin saber edición.',
     'membresia'),
    ('Klap','klap',
     'Convierte videos largos en clips cortos listos para redes con cuatro sistemas de IA trabajando juntos. De un podcast a diez clips virales.',
     'membresia'),
    ('SandCastles','sandcastles',
     'Analítica multiplataforma para creadores y marcas. Reúne datos de todas tus fuentes en reportes claros y accionables.',
     'membresia'),
    ('Arvow','arvow',
     'Genera artículos optimizados para SEO en piloto automático. Conecta tu blog y publica contenido que posiciona.',
     'membresia'),
    ('Freedom Builders Elite','freedom-builders-elite',
     'Mentoría de negocios de alto nivel para emprendedores que quieren escalar. Acompañamiento directo, comunidad selecta y estrategias probadas.',
     'mentoria'),
    ('The Inner Circle','the-inner-circle',
     'Círculo privado de emprendedores con acceso a un experto, networking y sesiones exclusivas. Rodéate de gente que juega en tu nivel.',
     'mentoria'),
    ('Squadron TwoSix','squadron-twosix',
     'Programa de trading con un socio experto que muestra resultados reales. Aprende a operar los mercados con método y disciplina.',
     'mentoria'),
    ('Awakening with Alison','awakening-with-alison',
     'Programa de coaching de tres meses con doce sesiones personalizadas. Un proceso de transformación guiado paso a paso.',
     'coaching'),
    ('Ray Hennessy Bird Photography','ray-hennessy-bird-photography',
     'Mentoría de fotografía de aves y naturaleza con un fotógrafo profesional. Domina la técnica, el equipo y la paciencia detrás de la toma perfecta.',
     'mentoria')
),

ins_services as (
  insert into public.services
    (vendor_id, title, slug, description, category, status)
  select t.vendor_id, s.title, s.slug, s.description, s.category, 'published'
  from svc s cross join target t
  returning id, slug
),

-- Planes: (slug, nombre, tipo, intervalo, días_prueba, monto_en_centavos)
plan_data(slug, name, type, interval, trial_days, amount) as (
  values
    ('complete-wedding-planning-system','Acceso completo','one_time',null::text,null::int,3000),
    ('teds-woodworking','Acceso completo','one_time',null,null,6700),
    ('pencil-drawing-made-easy','Acceso completo','one_time',null,null,4700),
    ('yang-mun','Básico (ebook)','one_time',null,null,1499),
    ('yang-mun','Colección completa','one_time',null,null,4999),
    ('yang-mun','Membresía mensual','subscription','month',null,1999),
    ('the-trim-down-club','Mensual','subscription','month',7,990),
    ('the-trim-down-club','Premium','subscription','month',7,3895),
    ('reframe','Anual','subscription','year',30,9999),
    ('menufit','Mensual','subscription','month',null,999),
    ('resumax','Pro','subscription','month',null,500),
    ('resumax','Premium','subscription','month',null,1000),
    ('talknotes','Mensual','subscription','month',null,1997),
    ('talknotes','Anual','subscription','year',null,19700),
    ('gettranscribe','Mensual','subscription','month',null,999),
    ('metricool','Starter','subscription','month',null,2000),
    ('metricool','Advanced','subscription','month',null,5300),
    ('submagic','Pro','subscription','month',null,1900),
    ('submagic','Premium','subscription','month',null,3900),
    ('klap','Mensual','subscription','month',null,2900),
    ('sandcastles','Mensual','subscription','month',null,3900),
    ('arvow','Growth','subscription','month',null,3900),
    ('arvow','Scale','subscription','month',null,6900),
    ('freedom-builders-elite','Membresía anual','subscription','year',null,500000),
    ('the-inner-circle','Acceso','one_time',null,null,350000),
    ('squadron-twosix','Acceso','one_time',null,null,429500),
    ('awakening-with-alison','Programa 3 meses','one_time',null,null,330000),
    ('ray-hennessy-bird-photography','4 meses','one_time',null,null,60000),
    ('ray-hennessy-bird-photography','12 meses','one_time',null,null,150000)
),

ins_plans as (
  insert into public.plans
    (service_id, name, type, interval, trial_days, amount, currency, active)
  select i.id, p.name, p.type, p.interval, p.trial_days, p.amount, 'usd', true
  from plan_data p
  join ins_services i on i.slug = p.slug
  returning id
),

-- Imágenes: (slug, url, posición). Posición 0 = portada.
img_data(slug, url, position) as (
  values
    ('complete-wedding-planning-system','https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',0),
    ('complete-wedding-planning-system','https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',1),
    ('complete-wedding-planning-system','https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1200&q=80',2),
    ('teds-woodworking','https://images.unsplash.com/photo-1506968430777-bf7784a87f23?auto=format&fit=crop&w=1200&q=80',0),
    ('teds-woodworking','https://images.unsplash.com/photo-1645651964715-d200ce0939cc?auto=format&fit=crop&w=1200&q=80',1),
    ('teds-woodworking','https://images.unsplash.com/photo-1631396326646-c06a935ff3a6?auto=format&fit=crop&w=1200&q=80',2),
    ('pencil-drawing-made-easy','https://images.unsplash.com/photo-1602738328654-51ab2ae6c4ff?auto=format&fit=crop&w=1200&q=80',0),
    ('pencil-drawing-made-easy','https://images.unsplash.com/photo-1582201957428-5ff47ff7605c?auto=format&fit=crop&w=1200&q=80',1),
    ('pencil-drawing-made-easy','https://images.unsplash.com/photo-1720248090619-95d555f01bfb?auto=format&fit=crop&w=1200&q=80',2),
    ('yang-mun','https://images.unsplash.com/photo-1630343710506-89f8b9f21d31?auto=format&fit=crop&w=1200&q=80',0),
    ('yang-mun','https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=1200&q=80',1),
    ('yang-mun','https://images.unsplash.com/photo-1611328857214-a5aae689f21a?auto=format&fit=crop&w=1200&q=80',2),
    ('the-trim-down-club','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',0),
    ('the-trim-down-club','https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',1),
    ('the-trim-down-club','https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80',2),
    ('reframe','https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',0),
    ('reframe','https://images.unsplash.com/photo-1522075782449-e45a34f1ddfb?auto=format&fit=crop&w=1200&q=80',1),
    ('reframe','https://images.unsplash.com/photo-1600618528240-fb9fc964b853?auto=format&fit=crop&w=1200&q=80',2),
    ('menufit','https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',0),
    ('menufit','https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',1),
    ('resumax','https://images.unsplash.com/photo-1698047681432-006d2449c631?auto=format&fit=crop&w=1200&q=80',0),
    ('resumax','https://images.unsplash.com/photo-1635253548172-d82ffe76449d?auto=format&fit=crop&w=1200&q=80',1),
    ('talknotes','https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=1200&q=80',0),
    ('talknotes','https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',1),
    ('gettranscribe','https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&q=80',0),
    ('gettranscribe','https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=1200&q=80',1),
    ('metricool','https://images.unsplash.com/photo-1683721003111-070bcc053d8b?auto=format&fit=crop&w=1200&q=80',0),
    ('metricool','https://images.unsplash.com/photo-1724862936518-ae7fcfc052c1?auto=format&fit=crop&w=1200&q=80',1),
    ('submagic','https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80',0),
    ('submagic','https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',1),
    ('klap','https://images.unsplash.com/photo-1528109966604-5a6a4a964e8d?auto=format&fit=crop&w=1200&q=80',0),
    ('klap','https://images.unsplash.com/photo-1490810194309-344b3661ba39?auto=format&fit=crop&w=1200&q=80',1),
    ('sandcastles','https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=1200&q=80',0),
    ('sandcastles','https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80',1),
    ('arvow','https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80',0),
    ('arvow','https://images.unsplash.com/photo-1603145733146-ae562a55031e?auto=format&fit=crop&w=1200&q=80',1),
    ('freedom-builders-elite','https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?auto=format&fit=crop&w=1200&q=80',0),
    ('freedom-builders-elite','https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=1200&q=80',1),
    ('the-inner-circle','https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?auto=format&fit=crop&w=1200&q=80',0),
    ('the-inner-circle','https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=1200&q=80',1),
    ('squadron-twosix','https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',0),
    ('squadron-twosix','https://images.unsplash.com/photo-1651341050677-24dba59ce0fd?auto=format&fit=crop&w=1200&q=80',1),
    ('awakening-with-alison','https://images.unsplash.com/photo-1554244933-d876deb6b2ff?auto=format&fit=crop&w=1200&q=80',0),
    ('awakening-with-alison','https://images.unsplash.com/photo-1559595500-e15296bdbb48?auto=format&fit=crop&w=1200&q=80',1),
    ('ray-hennessy-bird-photography','https://images.unsplash.com/photo-1555169062-013468b47731?auto=format&fit=crop&w=1200&q=80',0),
    ('ray-hennessy-bird-photography','https://images.unsplash.com/photo-1620588280212-bf1d2b23b112?auto=format&fit=crop&w=1200&q=80',1)
),

ins_images as (
  insert into public.service_images
    (service_id, vendor_id, url, path, position)
  select i.id, (select vendor_id from target),
         m.url, 'seed/' || i.slug || '-' || m.position, m.position
  from img_data m
  join ins_services i on i.slug = m.slug
  returning id
)

select
  (select count(*) from ins_services) as servicios_creados,
  (select count(*) from ins_plans)    as planes_creados,
  (select count(*) from ins_images)   as imagenes_creadas;

-- ── 3) Fija la portada (cover) desde la imagen en posición 0 ───────────
update public.services s
set cover_image_url = si.url
from public.service_images si
where si.service_id = s.id
  and si.position = 0
  and s.slug in (
    'complete-wedding-planning-system','teds-woodworking','pencil-drawing-made-easy',
    'yang-mun','the-trim-down-club','reframe','menufit','resumax','talknotes',
    'gettranscribe','metricool','submagic','klap','sandcastles','arvow',
    'freedom-builders-elite','the-inner-circle','squadron-twosix',
    'awakening-with-alison','ray-hennessy-bird-photography'
  );

-- Verificación rápida (opcional): descomenta para revisar el resultado.
-- select s.title, s.category, s.status,
--        count(distinct p.id) as planes,
--        count(distinct si.id) as imagenes,
--        min(p.amount) as desde_centavos
-- from public.services s
-- left join public.plans p on p.service_id = s.id
-- left join public.service_images si on si.service_id = s.id
-- where s.slug in ('complete-wedding-planning-system','yang-mun','reframe')
-- group by s.id, s.title, s.category, s.status;
