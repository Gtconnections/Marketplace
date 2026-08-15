# Marketplace — Recomendaciones de funcionalidades

> Documento redactado desde la perspectiva de un **desarrollador senior**, tomando
> como base el estado actual del proyecto (Next.js 16 · Supabase · Stripe Connect
> en modo demo · tienda de un solo vendedor con esquema multi‑vendedor listo).
> El objetivo es **enriquecer el producto y hacerlo más robusto**, priorizando lo
> que aporta valor real y es realmente funcional.

---

## Cómo leer este documento

Cada funcionalidad lleva una etiqueta de prioridad:

- **🔴 Crítico** — sin esto no puedes operar de verdad (cobrar, entregar, dar soporte).
- **🟡 Necesario** — esperado en cualquier marketplace serio; impacta conversión, confianza o mantenimiento.
- **🟢 Plus** — diferenciadores y crecimiento; valiosos, pero después de tener la base sólida.

Y una estimación relativa de **esfuerzo** (S / M / L) e **impacto** (bajo / medio / alto).

---

## 0. Lo primero: cerrar la base (transversal)

Antes de añadir features nuevas, conviene solidificar el núcleo. Hoy los pagos
están simulados y varias piezas de "producción" faltan. Esto es lo que yo haría
primero, en orden.

| # | Funcionalidad | Prioridad | Esfuerzo | Impacto |
|---|---|---|---|---|
| 0.1 | **Activar Stripe real y el ciclo de vida completo de suscripciones** | 🔴 Crítico | L | Alto |
| 0.2 | **Portal de cliente de Stripe** (auto‑gestión) | 🔴 Crítico | S | Alto |
| 0.3 | **Emails transaccionales** (compra, recibo, renovación, fallo de cobro) | 🔴 Crítico | M | Alto |
| 0.4 | **Validación y seguridad de servidor** (Zod + auditoría RLS + rate limiting) | 🟡 Necesario | M | Alto |
| 0.5 | **Observabilidad** (Sentry + logs estructurados) | 🟡 Necesario | S | Medio |
| 0.6 | **Tests + CI** (unitarios de acciones + e2e del flujo de compra) | 🟡 Necesario | M | Medio |

**Detalle de las críticas:**

- **0.1 Stripe real.** El webhook ya está esqueletado; falta manejar de forma
  idempotente los eventos clave: `checkout.session.completed`,
  `invoice.paid`, `invoice.payment_failed`,
  `customer.subscription.updated/deleted`. Con eso la tabla `subscriptions`
  refleja el estado real (activa, en prueba, morosa, cancelada) y el acceso del
  cliente se activa/desactiva solo. Mantén el flag `isDemoPayments` para poder
  seguir demostrando sin cobrar.
- **0.2 Portal de cliente.** `stripe.billingPortal.sessions.create` te da, con
  ~20 líneas, que el cliente cambie su método de pago, vea facturas y cancele —
  sin que tú programes esas pantallas. Es el mayor retorno por esfuerzo.
- **0.3 Emails.** Usa Resend o Supabase Auth + un proveedor SMTP. Mínimo:
  confirmación de compra con enlace de descarga/acceso, recibo, aviso de
  renovación y aviso de cobro fallido (dunning). Sin esto, el cliente "compra y
  desaparece".
- **0.4 Validación.** Hoy las Server Actions parsean `FormData` a mano. Migrar a
  **Zod** por acción evita datos corruptos y te da mensajes de error
  consistentes. Añade **rate limiting** (Upstash) a `/api/checkout`,
  `/api/download` y a las subidas. Haz una **auditoría de RLS** (cada tabla, cada
  política) antes de abrir a producción.

---

## 1. Lado del cliente (comprador)

### 1.1 Necesarias

- **🔴 Confirmación de compra / "gracias"** — Página post‑pago con resumen, acceso
  inmediato y enlace de descarga. Cierra el bucle emocional de la compra. · S · Alto
- **🟡 Mi cuenta enriquecida** — Hoy hay panel de suscripciones; ampliar a:
  historial de compras, facturas descargables, estado de cada suscripción y
  botón "Gestionar" (→ portal de Stripe). · M · Alto
- **🟡 Acceso y descargas seguras** — Consolidar `/api/download` con **URLs
  firmadas de corta duración**, límite de descargas y verificación de acceso
  activo (`has_active_access`). Evita compartir enlaces. · S · Alto
- **🟡 Recuperación de contraseña y verificación de email** — Flujos estándar de
  Supabase Auth; imprescindibles para confianza y soporte. · S · Alto
- **🟡 Búsqueda de verdad** — Pasar de `ilike` sobre el título a **full‑text
  search** de Postgres (título + descripción + categoría) con ranking y, opcional,
  sugerencias. · M · Medio
- **🟡 Estados vacíos, de carga y de error pulidos** — Skeletons en el catálogo,
  mensajes claros de error, páginas 404/500 con marca. Percepción de calidad. · S · Medio
- **🟡 Reseñas con "compra verificada"** — Ya tienes `has_active_access`;
  mostrar la insignia de comprador verificado y permitir editar/eliminar la
  propia reseña. Sube la confianza del catálogo. · S · Medio

### 1.2 Plus

- **🟢 Favoritos / lista de deseos** — Guardar servicios para después (requiere
  sesión). Aumenta retorno. · S · Medio
- **🟢 Carrito para pagos únicos** — Comprar varios productos digitales de una
  vez (los de suscripción siguen individuales). · M · Medio
- **🟢 Q&A / preguntas en el producto** — El comprador pregunta, tú respondes en
  público; contenido que ayuda a convertir. · M · Medio
- **🟢 Compra como regalo** — Generar un código canjeable para otra persona. · M · Medio
- **🟢 Recomendaciones "también te puede interesar"** — Por categoría o por
  co‑compra; sube el ticket medio. · M · Medio
- **🟢 Contenido por goteo (drip) / módulos** — Para mentorías y cursos: liberar
  material por semanas. Encaja con tu catálogo de mentorías. · L · Alto (para ese nicho)

---

## 2. Lado del admin / vendedor

### 2.1 Necesarias

- **🟡 Dashboard con métricas** — Ingresos, **MRR**, suscripciones activas, nuevas
  vs. canceladas (churn), top productos y conversión. Es tu tablero de mando. · M · Alto
- **🟡 Gestión de pedidos y suscripciones** — Listado de clientes con estado,
  fecha de renovación y acciones (ver en Stripe, **reembolsar**, cancelar). · M · Alto
- **🟡 Cupones y códigos de descuento** — Porcentaje o monto fijo, con caducidad y
  límite de usos (Stripe Coupons/Promotion Codes). Palanca de marketing directa. · M · Alto
- **🟡 Campos SEO por servicio** — Meta título/descripción, slug editable, imagen
  Open Graph. Hoy dependes del catálogo; el SEO trae tráfico orgánico. · S · Alto
- **🟡 Vista previa de borrador** — Ver el servicio como lo verá el cliente antes
  de publicar (token de previsualización). · S · Medio
- **🟡 Gestión de categorías** — Hoy están hardcodeadas en `config.ts`; moverlas a
  una tabla para crear/editar sin desplegar. · M · Medio
- **🟡 Auditoría / registro de actividad** — Quién publicó/editó/despublicó y
  cuándo. Trazabilidad, sobre todo si mañana entran más admins. · S · Medio

### 2.2 Plus

- **🟢 Editor enriquecido de descripción** — Markdown o rich text con bloques
  (listas, imágenes, vídeo incrustado). Mejora fichas de producto. · M · Medio
- **🟢 Duplicar servicio** — Clonar una ficha para crear variantes rápido. · S · Bajo
- **🟢 Programar publicación / despublicación** — Fecha y hora automáticas. · S · Bajo
- **🟢 Exportar datos** — CSV de ventas/clientes para contabilidad. · S · Medio
- **🟢 Notificaciones al admin** — Aviso (email/Slack) por nueva venta, nueva
  reseña o cobro fallido. · S · Medio
- **🟢 Bundles / paquetes** — Vender varios servicios juntos a precio especial. · M · Alto

---

## 3. Preparación multi‑vendedor (tu visión a futuro)

El esquema ya nació multi‑vendedor. Cuando decidas abrirlo, esto es lo que hace
falta —lo dejo aquí para que el diseño de hoy no te cierre puertas:

- **🟢 Onboarding de vendedores con Stripe Connect Express** — alta de cuenta,
  verificación (KYC) y estado `charges_enabled`. · L · Alto
- **🟢 Comisiones y payouts** — `application_fee_percent` por transacción y panel
  de liquidaciones por vendedor. · M · Alto
- **🟢 Panel por vendedor + moderación** — cada vendedor gestiona lo suyo; tú
  apruebas/moderas publicaciones y reseñas. · L · Alto
- **🟢 Resolver el "huevo y la gallina"** — estrategia de arranque (invitar
  vendedores semilla, destacar catálogo propio primero). *Producto, no código.*

---

## 4. Robustez, calidad y cumplimiento (no negociable a mediano plazo)

- **🟡 Accesibilidad (a11y)** — foco visible, contraste, navegación por teclado,
  `aria` en modales/galería. Ya hay buena base; conviene auditar con axe. · S · Medio
- **🟡 Rendimiento** — imágenes con `next/image` + tamaños responsivos, caché de
  consultas del catálogo, paginación por cursor si el volumen crece. · M · Medio
- **🟡 Legales** — páginas reales de Privacidad, Términos y Reembolsos; banner de
  cookies si usas analítica. Hoy son enlaces placeholder. · S · Alto
- **🟡 Analítica respetuosa** — Plausible/PostHog para medir embudo de conversión
  sin comprometer privacidad. · S · Medio
- **🟢 i18n** — si apuntas a varios países, estructura para traducir e importes en
  varias monedas (Stripe lo soporta). · L · Medio
- **🟢 Copias de seguridad y plan de recuperación** — backups automáticos de
  Supabase y prueba de restauración. · S · Alto

---

## 5. Roadmap sugerido (por fases)

**Fase 1 — "Vender de verdad" (2–3 semanas)**
Stripe real + webhooks · Portal de cliente · Emails transaccionales ·
Confirmación de compra · Descargas seguras · Páginas legales.

**Fase 2 — "Operar y crecer" (3–4 semanas)**
Dashboard de métricas · Gestión de pedidos/suscripciones y reembolsos · Cupones ·
SEO por servicio · Full‑text search · Validación Zod + rate limiting.

**Fase 3 — "Confianza y conversión" (2–3 semanas)**
Reseñas verificadas · Favoritos · Recomendaciones · Estados pulidos · Analítica ·
Observabilidad (Sentry) · Tests del flujo crítico.

**Fase 4 — "Diferenciación / futuro"**
Bundles · Contenido por goteo · Carrito · Multi‑vendedor · i18n/multi‑moneda.

---

## 6. Notas de implementación (aprovechando tu stack)

- **Stripe** ya está integrado a medias: prioriza webhooks idempotentes (tienes
  índice único por `stripe_checkout_session_id`) y el Billing Portal.
- **Supabase** te da gratis: full‑text search (`tsvector`), Storage con URLs
  firmadas (descargas), Auth (reset/verify) y Row Level Security — úsalos antes
  de construir a mano.
- **Emails/Jobs**: Resend para transaccionales; para dunning y recordatorios,
  Supabase Cron o un webhook programado.
- **Feature flags**: mantén el patrón `isDemoPayments` para lanzar cada bloque sin
  romper la demo.

---

### Mi recomendación de arranque (si tuviera que elegir 3)

1. **Stripe real + Portal de cliente** — sin cobrar y sin auto‑gestión, no hay negocio.
2. **Emails transaccionales + confirmación/descarga segura** — cierra la experiencia de compra.
3. **Dashboard de métricas + cupones** — para operar y empujar ventas desde el día uno.

Todo lo demás es acumulativo sobre esa base.
