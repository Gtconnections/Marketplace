# Guía: activar Stripe en modo test (cuenta única)

Tu tienda usa un modelo de **cuenta única**: eres el único vendedor y **todos los
pagos entran completos a tu cuenta de Stripe**, sin comisiones ni cuentas
conectadas. Por eso esta configuración es sencilla: es como cualquier tienda
online. Sigue los pasos en orden.

---

## 0. Cómo funciona (contexto de 30 segundos)

- El cliente paga en el **Checkout de Stripe** → el dinero llega **directo a tu
  cuenta**.
- Los **precios** de cada plan se crean en tu cuenta de Stripe **cuando creas el
  plan** (estando en modo `stripe`).
- Un **webhook** normal le avisa a tu app cuando alguien paga, para crear la
  suscripción/pedido y sincronizar renovaciones y cancelaciones.

No hay onboarding, ni comisión, ni cuentas conectadas. Ya está todo programado;
solo falta configurar llaves y webhook.

---

## 1. Entra a Stripe y quédate en modo **Test**

1. Crea o entra a tu cuenta en <https://dashboard.stripe.com>.
2. Arriba a la derecha, enciende **“Test mode” / “Modo de prueba”**. Todo se hace
   con ese interruptor **encendido**.

> En test no necesitas activar tu cuenta ni verificar identidad real: puedes
> cobrar con tarjetas de prueba de inmediato.

---

## 2. Copia tus claves de API de **test**

1. Ve a **Developers → API keys** (<https://dashboard.stripe.com/test/apikeys>).
2. Copia:
   - **Publishable key** → `pk_test_…`
   - **Secret key** → `sk_test_…` (pulsa “Reveal”)

---

## 3. Configura las variables de entorno

Tu app usa estas variables:

| Variable | Valor en test | Para qué sirve |
|---|---|---|
| `NEXT_PUBLIC_PAYMENTS_MODE` | `stripe` | **Cambia de `demo` a `stripe`** para activar cobros reales |
| `STRIPE_SECRET_KEY` | `sk_test_…` | Llave secreta (solo servidor) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` | Llave pública |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | Se obtiene en el **paso 4** |
| `NEXT_PUBLIC_SITE_URL` | tu URL | En local `http://localhost:3000`; en prod tu dominio |

### En local

Crea o edita **`.env.local`** en la raíz del proyecto:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PAYMENTS_MODE=stripe

STRIPE_SECRET_KEY=sk_test_TU_CLAVE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE
STRIPE_WEBHOOK_SECRET=whsec_LO_LLENAS_EN_EL_PASO_4

# (mantén también tus variables de Supabase existentes)
```

Reinicia `npm run dev` después de cambiar el `.env.local`.

### En Vercel (producción)

Proyecto → **Settings → Environment Variables** → agrega las mismas
(`NEXT_PUBLIC_PAYMENTS_MODE=stripe`, las dos llaves y el `STRIPE_WEBHOOK_SECRET`
de producción) y **redeploya**.

> ⚠️ Las `NEXT_PUBLIC_*` se incrustan en el build: si las cambias en Vercel,
> necesitas un nuevo deploy.

---

## 4. Configura el webhook

Es lo que “cierra el círculo”: cuando alguien paga, Stripe le avisa a tu app para
crear la suscripción. Tu endpoint es **`/api/webhooks/stripe`**.

### Opción A — En local, con Stripe CLI (para probar)

1. Instala la CLI: <https://stripe.com/docs/stripe-cli>
   (o `brew install stripe/stripe-cli/stripe`).
2. `stripe login`.
3. Reenvía los eventos a tu endpoint local:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. La CLI imprime un **`whsec_…`**. Cópialo en `STRIPE_WEBHOOK_SECRET` de tu
   `.env.local` y reinicia `npm run dev`.
5. Deja esa terminal abierta mientras pruebas.

### Opción B — En producción, desde el Dashboard

1. **Developers → Webhooks → Add endpoint**.
2. URL: `https://TU-DOMINIO/api/webhooks/stripe`.
3. Selecciona estos eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Guarda y copia el **Signing secret** (`whsec_…`) → ponlo en
   `STRIPE_WEBHOOK_SECRET` en Vercel y redeploya.

> Nota: al ser cuenta única, es un webhook **normal**. No necesitas activar
> “Connect” ni marcar “eventos de cuentas conectadas”.

---

## 5. Crea o re-crea tus servicios (con precio en Stripe)

Los servicios/planes que creaste en **modo demo no tienen precio en Stripe**, así
que en modo `stripe` mostrarán *“sin precio en Stripe”* y no se podrán publicar.

1. Con el modo ya en `stripe`, ve a **`/vendor/services/new`** y crea un servicio
   con su plan. Al guardarlo, tu app crea el **Product + Price** en tu cuenta de
   Stripe automáticamente.
2. Públicalo (ya sin el aviso de Stripe).

> Los planes viejos de demo puedes volver a crearlos ahora que estás en modo
> `stripe`; el precio se genera al **crear el plan**.

---

## 6. Haz una compra de prueba

1. Entra con una cuenta de **cliente** (distinta a la de admin).
2. Abre el servicio publicado y pulsa **“Suscribirme” / “Comprar”**.
3. En el Checkout usa una **tarjeta de prueba**:
   - Número: **`4242 4242 4242 4242`**
   - Vencimiento: cualquier fecha futura · CVC: cualquiera · CP: cualquiera
4. Completa el pago → Stripe redirige a `/dashboard?success=1`.

En la terminal del `stripe listen` verás `checkout.session.completed`, y en tu app
aparecerá el **pedido** con su **recibo** y sus **notificaciones**.

Otras tarjetas de test útiles:
- Requiere autenticación 3DS: `4000 0025 0000 3155`
- Rechazada: `4000 0000 0000 9995`

---

## 7. Verifica

- **Stripe → Payments (test)**: aparece el cobro completo (sin comisiones).
- **Developers → Webhooks / la CLI**: eventos entregados con estado `200`.
- **Tu app**: el pedido en `/dashboard` y `/pedidos`, el recibo, y en el panel la
  venta reflejada en métricas, clientes y suscripciones.

---

## Solución de problemas

- **Pagué pero no aparece la suscripción** → casi siempre es el webhook: el
  `stripe listen` no está corriendo, o el `STRIPE_WEBHOOK_SECRET` no coincide, o
  en producción faltó crear el endpoint.
- **“Plan no disponible” (404)** → ese plan no tiene `stripe_price_id`: se creó en
  demo. Vuelve a crear el plan en modo `stripe`.
- **Cambié variables `NEXT_PUBLIC_*` y no pasa nada** → reinicia `npm run dev`
  (local) o **redeploy** (Vercel).
- **Quiero volver a demo** → pon `NEXT_PUBLIC_PAYMENTS_MODE=demo` y reinicia.
  Vuelve el botón de pago simulado.

---

## Checklist rápido

- [ ] Modo **Test** activado en Stripe
- [ ] Claves `sk_test_…` y `pk_test_…` en `.env.local` (y en Vercel)
- [ ] `NEXT_PUBLIC_PAYMENTS_MODE=stripe`
- [ ] Webhook corriendo (`stripe listen …`) y `whsec_…` puesto
- [ ] Servicio nuevo creado y **publicado** (con precio en Stripe)
- [ ] Compra de prueba con `4242 4242 4242 4242` ✔️

---

### Cuando pases a producción

- Repite con las claves **live** (`sk_live_…`, `pk_live_…`) y un webhook de
  producción.
- **Activa tu cuenta** de Stripe (datos reales de negocio y banco) para cobrar de
  verdad.
- Recién ahí conviene montar los extras que dependen de Stripe real: **portal de
  cliente** (gestionar/cancelar suscripción), **emails transaccionales** y
  **reembolsos**.
