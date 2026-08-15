/**
 * Tipos del dominio, alineados con el esquema de la base de datos
 * (supabase/migrations/0001_init.sql).
 */

export type UserRole = "customer" | "vendor" | "admin";
export type ServiceStatus = "draft" | "published";
export type PlanInterval = "month" | "year";
/** Modelo de cobro del plan. */
export type PlanType = "subscription" | "one_time";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export interface Vendor {
  id: string;
  profile_id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  stripe_account_id: string | null;
  charges_enabled: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  vendor_id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  cover_image_url: string | null;
  download_path: string | null; // ruta del archivo adjunto en Storage
  download_name: string | null; // nombre visible del archivo
  rating_avg: number; // media de valoraciones (0–5)
  rating_count: number; // nº de reseñas
  status: ServiceStatus;
  created_at: string;
}

export interface ServiceImage {
  id: string;
  service_id: string;
  vendor_id: string;
  url: string;
  path: string;
  position: number;
  created_at: string;
}

export interface Review {
  id: string;
  service_id: string;
  vendor_id: string;
  customer_id: string;
  author_name: string | null;
  rating: number; // 1–5
  comment: string | null;
  created_at: string;
}

export interface Plan {
  id: string;
  service_id: string;
  name: string;
  type: PlanType; // 'subscription' | 'one_time'
  interval: PlanInterval | null; // null para pago único
  trial_days: number | null; // días de prueba (solo suscripción)
  amount: number; // en centavos
  currency: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  service_id: string;
  vendor_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  created_at: string;
}

// Tipos compuestos usados en la UI
export interface ServiceWithVendorAndPlans extends Service {
  vendor: Vendor;
  plans: Plan[];
}
