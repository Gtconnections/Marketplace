import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, priceSuffix } from "@/lib/utils";
import { SERVICE_CATEGORIES } from "@/lib/config";
import { SubscribeButton } from "@/components/subscribe-button";
import { DemoCheckoutButton } from "@/components/demo-checkout-button";
import { ReviewForm } from "@/components/review-form";
import { Stars } from "@/components/stars";
import { FavoriteButton } from "@/components/favorite-button";
import { ServiceCard } from "@/components/service-card";
import { getFavoriteIds } from "@/lib/actions/favorites";
import { Gallery } from "@/components/gallery";
import { ArrowLeft, Paperclip, Lock, Check } from "@/components/icons";
import { isDemoPayments } from "@/lib/config";
import { container, card, badge, btn, priceCls, cn } from "@/lib/ui";
import type { Plan, Review, Service, ServiceImage, Vendor } from "@/lib/types";

export const dynamic = "force-dynamic";

type CardService = Service & { vendor: Vendor | null; plans: Plan[] };

function categoryLabel(value: string) {
  return SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

/** Metadatos SEO por servicio (usa meta_title/meta_description si existen). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (!data) return { title: "Servicio — Marketplace" };

  const title = data.meta_title || `${data.title} — Marketplace`;
  const description =
    data.meta_description || (data.description ?? "").slice(0, 160) || undefined;
  const images = data.cover_image_url ? [data.cover_image_url] : [];
  return {
    title,
    description,
    openGraph: { title, description, images },
  };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("*, vendor:vendors(*), plans(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (!service) notFound();

  const vendor = service.vendor as Vendor;
  const plans = ((service.plans as Plan[]) ?? [])
    .filter((p) => p.active)
    .sort((a, b) => a.amount - b.amount);
  const canPay =
    isDemoPayments || Boolean(vendor?.stripe_account_id && vendor?.charges_enabled);

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("*")
    .eq("service_id", service.id)
    .order("created_at", { ascending: false });
  const reviews = (reviewRows ?? []) as Review[];

  const { data: imgRows } = await supabase
    .from("service_images")
    .select("*")
    .eq("service_id", service.id)
    .order("position", { ascending: true });
  const images = (imgRows ?? []) as ServiceImage[];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasAccess = false;
  let isFavorite = false;
  let myReview: Review | null = null;
  if (user) {
    const { data: access } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("customer_id", user.id)
      .eq("service_id", service.id)
      .in("status", ["active", "trialing"])
      .limit(1)
      .maybeSingle();
    hasAccess = Boolean(access);

    const { data: fav } = await supabase
      .from("favorites")
      .select("id")
      .eq("profile_id", user.id)
      .eq("service_id", service.id)
      .maybeSingle();
    isFavorite = Boolean(fav);

    myReview = reviews.find((r) => r.customer_id === user.id) ?? null;
  }

  const isOwner = Boolean(user && vendor?.profile_id === user.id);

  // Recomendaciones: mismo rubro, excluyendo el servicio actual.
  const { data: recData } = await supabase
    .from("services")
    .select("*, vendor:vendors(*), plans(*)")
    .eq("status", "published")
    .eq("category", service.category)
    .neq("id", service.id)
    .order("rating_avg", { ascending: false })
    .limit(4);
  const recs = (recData ?? []) as CardService[];
  const recFavIds = await getFavoriteIds(supabase, user?.id);

  // Categoría: cada parte (separada por " / ") va en su propio chip.
  const catParts = categoryLabel(service.category)
    .split("/")
    .map((c) => c.trim())
    .filter(Boolean);

  // Inicial para el avatar del autor (igual que en las tarjetas del home).
  const vendorInitial = (vendor?.display_name?.[0] ?? "?").toUpperCase();

  // "Qué incluye" — características según el tipo de producto.
  const subs = plans.filter((p) => p.type === "subscription");
  const ones = plans.filter((p) => p.type === "one_time");
  const intervals = [...new Set(subs.map((p) => p.interval))];
  const trial = Math.max(0, ...plans.map((p) => p.trial_days ?? 0));

  const includes: string[] = [];
  if (subs.length)
    includes.push(
      `Membresía · cobro ${intervals
        .map((i) => (i === "year" ? "anual" : "mensual"))
        .join(" o ")}`,
    );
  if (ones.length) includes.push("Disponible en pago único (precio fijo)");
  if (trial > 0) includes.push(`${trial} días de prueba gratis`);
  if (service.download_path) includes.push("Incluye archivo descargable");
  includes.push("Acceso inmediato tras el pago");
  if (subs.length) includes.push("Cancela cuando quieras");

  return (
    <div className={cn(container, "py-12")}>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      {/* Encabezado a todo el ancho: la galería queda nivelada con la tarjeta de planes */}
      <div className="animate-in mt-6 max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex flex-wrap items-center gap-2">
            {catParts.map((c) => (
              <span key={c} className={badge("brand")}>
                {c}
              </span>
            ))}
          </span>
          <Stars value={service.rating_avg} count={service.rating_count} showValue />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {service.title}
        </h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-muted">
          {vendor?.slug ? (
            <Link
              href={`/store/${vendor.slug}`}
              className="inline-flex items-center gap-2 font-medium text-fg transition-colors hover:text-primary"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-secondary-container text-xs font-bold text-on-secondary-container">
                {vendorInitial}
              </span>
              {vendor.display_name}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 font-medium text-fg">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-secondary-container text-xs font-bold text-on-secondary-container">
                {vendorInitial}
              </span>
              {vendor?.display_name ?? "Vendedor"}
            </span>
          )}
        </div>
        {!isOwner && (
          <div className="mt-5">
            <FavoriteButton
              serviceId={service.id}
              active={isFavorite}
              next={`/services/${slug}`}
              variant="plain"
            />
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* Detalle */}
        <div className="animate-in">
          {images.length > 0 && (
            <Gallery images={images} title={service.title} />
          )}

          {service.description ? (
            <p className="mt-8 whitespace-pre-wrap text-[15px] leading-7 text-fg">
              {service.description}
            </p>
          ) : (
            <p className="mt-8 text-muted">Este servicio aún no tiene descripción.</p>
          )}

          {/* Qué incluye */}
          <div className={card(false, "mt-8 p-6")}>
            <h2 className="font-display text-lg font-semibold text-fg">Qué incluye</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {includes.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-fg">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {vendor?.bio && (
            <div className={card(false, "mt-6 p-6")}>
              <h3 className="text-sm font-semibold text-fg">
                Sobre {vendor.display_name}
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                {vendor.bio}
              </p>
            </div>
          )}
        </div>

        {/* Planes */}
        <aside className="animate-in lg:sticky lg:top-24 lg:h-fit" style={{ "--d": "80ms" } as React.CSSProperties}>
          <div className={card(false, "p-6")}>
            <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-muted">
              Planes
            </h2>
            {!isOwner && !isDemoPayments && !canPay && (
              <div className={badge("warning", "mt-4")}>Pagos no configurados aún</div>
            )}
            {plans.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No hay planes disponibles.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {plans.map((plan, i) => (
                  <div
                    key={plan.id}
                    className={cn(
                      "rounded-2xl border p-4 transition-all duration-200",
                      i === 0
                        ? "border-primary/30 bg-primary/5 ring-1 ring-inset ring-primary/10"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-fg">{plan.name}</span>
                      <span className="text-right">
                        <span className={cn(priceCls, "text-xl font-bold tracking-tight text-fg")}>
                          {formatMoney(plan.amount, plan.currency)}
                        </span>
                        <span className="text-sm font-normal text-muted">
                          {priceSuffix(plan.type, plan.interval)}
                        </span>
                      </span>
                    </div>
                    {plan.trial_days ? (
                      <p className="mt-1 text-xs font-medium text-success">
                        {plan.trial_days} días de prueba gratis
                      </p>
                    ) : null}
                    {!isOwner && (
                      <div className="mt-4">
                        {isDemoPayments ? (
                          <DemoCheckoutButton
                            planId={plan.id}
                            label={plan.type === "one_time" ? "Comprar" : "Suscribirme"}
                          />
                        ) : (
                          <SubscribeButton
                            planId={plan.id}
                            label={plan.type === "one_time" ? "Comprar" : "Suscribirme"}
                            disabled={!canPay || !plan.stripe_price_id}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isOwner && (
              <Link
                href={`/vendor/services/${service.id}`}
                className={btn("primary", "md", "mt-5 w-full")}
              >
                Editar servicio
              </Link>
            )}

            {service.download_path && (
              <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-fg">
                <Paperclip className="h-3.5 w-3.5 text-muted" /> Incluye archivo
                descargable
              </p>
            )}
            {!isOwner && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                <Lock className="h-3.5 w-3.5" />
                {isDemoPayments
                  ? "Modo demo · no se realiza ningún cobro"
                  : "Pago seguro procesado por Stripe"}
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* ── Reseñas ── */}
      <section className="animate-in mt-16 border-t border-border pt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">
            Reseñas
          </h2>
          <Stars
            value={service.rating_avg}
            count={service.rating_count}
            size="lg"
            showValue
          />
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[380px_1fr]">
          {/* Formulario / estado */}
          <div className={card(false, "h-fit p-6")}>
            {isOwner ? (
              <p className="text-sm text-muted">
                Este es tu servicio. Aquí verás las reseñas de tus clientes.
              </p>
            ) : !user ? (
              <p className="text-sm text-muted">
                <Link href={`/login?next=/services/${slug}`} className="font-medium text-primary hover:text-primary-hover">
                  Inicia sesión
                </Link>{" "}
                y suscríbete para dejar tu reseña.
              </p>
            ) : hasAccess ? (
              <>
                <h3 className="mb-4 font-semibold text-fg">
                  {myReview ? "Edita tu reseña" : "Deja tu reseña"}
                </h3>
                <ReviewForm
                  serviceId={service.id}
                  slug={slug}
                  initialRating={myReview?.rating ?? 0}
                  initialComment={myReview?.comment ?? ""}
                  editing={Boolean(myReview)}
                />
              </>
            ) : (
              <p className="text-sm text-muted">
                Solo quienes han contratado este servicio pueden reseñarlo.
                Suscríbete arriba para dejar tu opinión.
              </p>
            )}
          </div>

          {/* Lista */}
          <div>
            {reviews.length === 0 ? (
              <div className={card(false, "p-8 text-center text-sm text-muted")}>
                Aún no hay reseñas. Sé el primero en opinar.
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {reviews.map((r) => (
                  <li key={r.id} className={card(false, "p-5")}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-fg">
                          {r.author_name || "Cliente"}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-success"
                          title="Reseña de un comprador verificado"
                        >
                          <Check className="h-3 w-3" /> Compra verificada
                        </span>
                      </div>
                      <span className="font-mono text-xs text-muted">
                        {fmtDate(r.created_at)}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">
                        {r.comment}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ── También te puede interesar ── */}
      {recs.length > 0 && (
        <section className="animate-in mt-16 border-t border-border pt-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">
            También te puede interesar
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recs.map((s, i) => (
              <ServiceCard
                key={s.id}
                service={s}
                index={i}
                isFavorite={recFavIds.has(s.id)}
                next={`/services/${slug}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
