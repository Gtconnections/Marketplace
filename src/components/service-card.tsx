/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { formatMoney, priceSuffix } from "@/lib/utils";
import { SERVICE_CATEGORIES } from "@/lib/config";
import { ArrowRight } from "@/components/icons";
import { Stars } from "@/components/stars";
import { FavoriteButton } from "@/components/favorite-button";
import { card, badge, priceCls, cn } from "@/lib/ui";
import type { Plan, Service, Vendor } from "@/lib/types";

type CardService = Service & { vendor: Vendor | null; plans: Plan[] };

// Chip flotante sobre la imagen: pequeño, sutil, tipo glass.
const CHIP =
  "rounded-full bg-white/85 px-2.5 py-0.5 font-mono text-[11px] font-medium text-primary shadow-sm ring-1 ring-black/5 backdrop-blur-md";

function categoryChips(value: string) {
  const label = SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
  return label
    .split("/")
    .map((c) => c.trim())
    .filter(Boolean);
}

function fromPrice(plans: Plan[]) {
  const active = (plans ?? []).filter((p) => p.active);
  if (active.length === 0) return null;
  return active.reduce((min, p) => (p.amount < min.amount ? p : min), active[0]);
}

/**
 * Tarjeta de servicio para el catálogo y los perfiles.
 * El título es un "stretched link" que cubre toda la tarjeta; el vendedor es un
 * enlace independiente (z-10) a su perfil → sin anclas anidadas.
 */
export function ServiceCard({
  service,
  index = 0,
  isFavorite = false,
  next = "/services",
}: {
  service: CardService;
  index?: number;
  isFavorite?: boolean;
  next?: string;
}) {
  const plan = fromPrice(service.plans);
  const vendor = service.vendor;
  const initial = (vendor?.display_name?.[0] ?? "?").toUpperCase();

  return (
    <article
      className={card(true, "group animate-in relative flex flex-col overflow-hidden")}
      style={{ "--d": `${index * 60}ms` } as React.CSSProperties}
    >
      {service.cover_image_url && (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2">
          <img
            src={service.cover_image_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Chips flotantes (arriba-izquierda) */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {categoryChips(service.category).map((c) => (
              <span key={c} className={CHIP}>
                {c}
              </span>
            ))}
          </div>
          {/* Favorito (arriba-derecha) */}
          <div className="absolute right-3 top-3">
            <FavoriteButton
              serviceId={service.id}
              active={isFavorite}
              next={next}
            />
          </div>
          {service.rating_count > 0 && (
            <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-white/85 px-2 py-0.5 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
              <Stars value={service.rating_avg} showValue />
            </span>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        {/* Sin imagen de portada: los chips (y el favorito) van en el cuerpo */}
        {!service.cover_image_url && (
          <div className="mb-3 flex items-start justify-between gap-2">
            <span className="flex flex-wrap items-center gap-1.5">
              {categoryChips(service.category).map((c) => (
                <span key={c} className={badge("brand")}>
                  {c}
                </span>
              ))}
            </span>
            <div className="flex items-center gap-2">
              {service.rating_count > 0 && (
                <Stars value={service.rating_avg} showValue />
              )}
              <FavoriteButton
                serviceId={service.id}
                active={isFavorite}
                next={next}
              />
            </div>
          </div>
        )}

        <h3 className="font-display text-lg font-semibold tracking-tight text-fg transition-colors group-hover:text-primary">
          <Link
            href={`/services/${service.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {service.title}
          </Link>
        </h3>

        {vendor && (
          <Link
            href={`/store/${vendor.slug}`}
            className="relative z-10 mt-2 inline-flex w-fit items-center gap-2 font-mono text-xs text-muted transition-colors hover:text-primary"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-secondary-container text-[10px] font-bold text-on-secondary-container">
              {initial}
            </span>
            {vendor.display_name}
          </Link>
        )}

        {service.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
            {service.description}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
          <span className={cn(priceCls, "text-xs text-muted")}>
            {plan ? (
              <>
                {plan.type !== "one_time" && <span>desde </span>}
                <span className="font-bold text-fg">
                  {formatMoney(plan.amount, plan.currency)}
                </span>
                <span>{priceSuffix(plan.type, plan.interval)}</span>
              </>
            ) : (
              <span>Próximamente</span>
            )}
          </span>
          <ArrowRight className="h-4 w-4 text-primary transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </article>
  );
}
