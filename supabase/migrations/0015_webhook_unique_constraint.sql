-- ═══════════════════════════════════════════════════════════════════════
--  Migración 0015 — Fix del ON CONFLICT del webhook de Stripe
--
--  PostgREST no soporta `onConflict` contra un índice PARCIAL, así que el
--  upsert de `/api/webhooks/stripe` fallaba con:
--    "there is no unique or exclusion constraint matching the ON CONFLICT"
--
--  Se reemplaza el índice parcial por una constraint UNIQUE real sobre la
--  columna (Postgres permite múltiples NULL, así que demo/one_time sin
--  sesión siguen siendo válidos).
--
--  Ejecuta este archivo en: Supabase → SQL Editor → New query → Run.
-- ═══════════════════════════════════════════════════════════════════════

drop index if exists public.subs_checkout_session_idx;

alter table public.subscriptions
  drop constraint if exists subscriptions_stripe_checkout_session_id_key;

alter table public.subscriptions
  add constraint subscriptions_stripe_checkout_session_id_key
  unique (stripe_checkout_session_id);