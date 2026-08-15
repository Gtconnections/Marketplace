# Marketplace — Servicios y suscripciones

Plataforma de marketplace para **servicios y suscripciones** (mentorías, membresías,
coaching, consultoría, cursos). Construida con **Next.js 16 (App Router)**,
**Supabase** (Postgres + Auth + Storage) y **Stripe Connect** con cobros recurrentes.

Diseñada **multi-vendedor desde el día 1**: puedes lanzar siendo el único vendedor
y abrir a más vendedores después sin reescribir el modelo de datos.

---

## Arquitectura en una imagen

```
Cliente ──► Next.js (App Router)
                │
                ├── Supabase Auth          (sesión por cookies, RLS)
                ├── Supabase Postgres      (profiles, vendors, services, plans, subscriptions)
                └── Stripe Connect          (Express accounts por vendedor)
                       │
                       ├── Direct charges + application_fee_percent  ← tu comisión
                       └── Webhook  ──► sincroniza suscripciones en Postgres
```

**Modelo de cobro:** *direct charges* sobre la cuenta conectada del vendedor. El dinero
entra a la cuenta del vendedor y Stripe te transfiere automáticamente tu comisión
(`PLATFORM_FEE_PERCENT`). Así funciona un marketplace real.

---

## Requisitos

- Node.js 18.18+ (recomendado 20 o 22)
- Una cuenta de [Supabase](https://supabase.com) (plan gratis sirve)
- Una cuenta de [Stripe](https://stripe.com) con **Connect** activado (modo test)

---

## Puesta en marcha (paso a paso)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Crea un proyecto en Supabase.
2. Ve a **SQL Editor → New query**, pega el contenido de
   `supabase/migrations/0001_init.sql` y ejecútalo. Esto crea todas las tablas,
   políticas RLS y el trigger que crea el perfil al registrarse.
3. (Opcional, para desarrollo) En **Authentication → Providers → Email**, desactiva
   "Confirm email" para poder entrar sin confirmar el correo.
4. Copia tus claves desde **Project Settings → API**.

### 3. Configurar Stripe

1. Activa **Connect** en tu dashboard de Stripe (Settings → Connect).
2. Copia tu **Secret key** y **Publishable key** (usa las de **test**).
3. Para el webhook en local, usa la CLI de Stripe (ver paso 5).

### 4. Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PLATFORM_FEE_PERCENT=10
```

### 5. Webhook de Stripe en local

En una terminal aparte, con la [CLI de Stripe](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copia el `whsec_...` que imprime y ponlo en `STRIPE_WEBHOOK_SECRET`.

> **Importante:** como usamos *direct charges* sobre cuentas conectadas, cuando crees
> el endpoint de webhook en producción (Developers → Webhooks) márcalo para escuchar
> también eventos de **cuentas conectadas** ("Listen to events on Connected accounts").

### 6. Arrancar

```bash
npm run dev
```

Abre <http://localhost:3000>.

---

## Cómo probar el flujo completo

1. **Crea una cuenta** en `/signup`.
2. Ve a **Vender** (`/vendor`) y crea tu tienda de vendedor.
3. Pulsa **Configurar pagos** → completa el onboarding de Stripe Connect
   (en test, Stripe te deja rellenar datos de prueba).
4. Cuando el webhook `account.updated` marque tu cuenta como habilitada, crea un
   **Nuevo servicio** con su plan y precio. Esto crea el Product + Price en tu cuenta
   conectada de Stripe.
5. **Publica** el servicio desde el panel.
6. Con otra cuenta (o la misma), entra al servicio desde el inicio y pulsa
   **Suscribirme**. Usa la tarjeta de prueba `4242 4242 4242 4242`.
7. El webhook `checkout.session.completed` crea la suscripción, visible en
   **Mis suscripciones** (`/dashboard`).

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                     # Marketplace (servicios publicados)
│   ├── services/[slug]/             # Detalle de servicio + suscripción
│   ├── login/ · signup/             # Autenticación
│   ├── dashboard/                   # Panel del cliente (sus suscripciones)
│   ├── vendor/                      # Panel del vendedor
│   │   ├── services/new/            # Crear servicio + plan
│   │   └── onboard/                 # Inicia Stripe Connect onboarding
│   ├── auth/                        # callback + signout
│   └── api/
│       ├── checkout/                # Crea la sesión de Checkout (suscripción)
│       └── webhooks/stripe/         # Sincroniza cuentas y suscripciones
├── components/                      # Nav, botón de suscripción, formularios
├── lib/
│   ├── supabase/                    # Clientes server/client/admin/middleware
│   ├── actions/                     # Server Actions (auth, vendor)
│   ├── stripe.ts · config.ts · types.ts · utils.ts
└── middleware.ts                    # Refresca sesión + protege rutas privadas
supabase/migrations/0001_init.sql    # Esquema + RLS
```

---

## Modelo de datos

| Tabla | Qué guarda |
|---|---|
| `profiles` | Usuario (1:1 con `auth.users`), rol: customer / vendor / admin |
| `vendors` | Tienda de un vendedor + su cuenta de Stripe Connect |
| `services` | La oferta (mentoría, membresía…), con estado draft/published |
| `plans` | Precio/plan de suscripción de un servicio (= Stripe Price) |
| `subscriptions` | Suscripción de un cliente (sincronizada desde Stripe) |

La seguridad está en **RLS de Postgres**: cada quien ve y edita solo lo suyo; el
público solo ve servicios publicados; las suscripciones las escribe el webhook con la
service role key.

---

## Roadmap sugerido (siguientes fases)

- **Fase 2 — Multi-vendedor completo:** página pública por tienda (`/[vendor-slug]`),
  onboarding de vendedores externos, panel de ingresos y payouts.
- Portal de cliente de Stripe (cancelar/actualizar suscripción).
- Editar servicios y gestionar varios planes por servicio.
- Reseñas y valoraciones.
- Búsqueda y filtros por categoría.
- Subida de imágenes de portada (Supabase Storage).

---

## Notas técnicas

- **`middleware.ts`**: Next 16 muestra un aviso de que la convención se renombrará a
  `proxy`. Sigue funcionando; puedes migrar cuando quieras con
  `npx @next/codemod@canary middleware-to-proxy .`.
- La tipografía usa el *stack* del sistema (sin descargar fuentes en build). Si quieres
  Geist u otra, añádela con `next/font`.
- El fallback de la clave de Stripe en `src/lib/stripe.ts` solo evita que el build
  falle sin secretos; en runtime siempre se usa tu clave real.
