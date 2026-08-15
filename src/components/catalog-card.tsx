/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { formatMoney, priceSuffix } from "@/lib/utils";
import { SERVICE_CATEGORIES } from "@/lib/config";
import { ArrowRight } from "@/components/icons";
import { card, priceCls, cn } from "@/lib/ui";
import type { Plan, Service, Vendor } from "@/lib/types";

type CardService = Service & { vendor: Vendor | null; plans: Plan[] };

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
 * Tarjeta del catálogo (/services): imagen con chips de categoría flotantes,
 * título, descripción y un footer con "Entrega inmediata" + precio + flecha.
 * Toda la tarjeta es un enlace estirado al detalle.
 */
export function CatalogCard({
  service,
  index = 0,
}: {
  service: CardService;
  index?: number;
}) {
  const plan = fromPrice(service.plans);
  const chips = categoryChips(service.category);

  return (
    <article
      className={card(true, "group animate-in relative flex flex-col overflow-hidden")}
      style={{ "--d": `${index * 60}ms` } as React.CSSProperties}
    >
      {/* Imagen + chips flotantes */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2">
        {service.cover_image_url && (
          <img
            src={service.cover_image_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-full bg-white/85 px-2.5 py-0.5 font-mono text-[11px] font-medium text-primary shadow-sm ring-1 ring-black/5 backdrop-blur-md"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-lg font-semibold tracking-tight text-fg transition-colors group-hover:text-primary">
          <Link
            href={`/services/${service.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {service.title}
          </Link>
        </h3>

        {service.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
            {service.description}
          </p>
        )}

        <div className="mt-6 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-muted">Entrega inmediata</p>
            <p className="mt-1 leading-none">
              {plan ? (
                <>
                  <span className={cn(priceCls, "text-2xl font-bold tracking-tight text-fg")}>
                    {formatMoney(plan.amount, plan.currency)}
                  </span>
                  {plan.type !== "one_time" && (
                    <span className="text-sm text-muted">
                      {priceSuffix(plan.type, plan.interval)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted">Próximamente</span>
              )}
            </p>
          </div>
          <span
            aria-hidden
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-on-primary shadow-float transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-primary-hover"
          >
            <ArrowRight className="h-5 w-5" />
          </span>
        </div>
      </div>
    </article>
  );
}
