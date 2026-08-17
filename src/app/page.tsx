import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ServiceCard } from "@/components/service-card";
import { HeroSlider } from "@/components/hero-slider";
import { getFavoriteIds } from "@/lib/actions/favorites";
import { publishDueServices } from "@/lib/publish-due";
import { Search, CreditCard, Rocket, ArrowRight } from "@/components/icons";
import { container, btn, cn } from "@/lib/ui";
import type { Plan, Service, Vendor } from "@/lib/types";

export const dynamic = "force-dynamic";

type CardService = Service & { vendor: Vendor | null; plans: Plan[] };

// Estilo glass para el panel del estado vacío del catálogo.
const glassPanel =
  "rounded-3xl border border-white/60 bg-white/45 shadow-[0_28px_80px_-24px_rgba(76,74,180,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]";

const STEPS = [
  {
    n: "01",
    Icon: Search,
    title: "Descubre",
    body: "Explora mentorías, membresías y servicios premium de expertos cuidadosamente seleccionados por categoría.",
  },
  {
    n: "02",
    Icon: CreditCard,
    title: "Suscríbete",
    body: "Elige tu plan ideal —mensual, anual o pago único— y procesa tu pago de forma instantánea y segura.",
  },
  {
    n: "03",
    Icon: Rocket,
    title: "Accede",
    body: "Recibe acceso inmediato al servicio, descargas y comunidades. Desbloquea tu potencial al instante.",
  },
];

export default async function Home() {
  await publishDueServices();
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*, vendor:vendors(*), plans(*)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(8);
  const list = (data ?? []) as CardService[];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const favIds = await getFavoriteIds(supabase, user?.id);

  return (
    <div className="relative">
      {/* ── Hero (slider de 3 diapositivas) ── */}
      <HeroSlider />

      {/* ── Cómo funciona (tarjetas glass) ── */}
      <section id="como-funciona" className={cn(container, "py-14 sm:py-16")}>
        <div className="mb-10 max-w-xl">
          <p className="eyebrow">Cómo funciona</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            De la búsqueda al acceso, en tres pasos.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className={cn(
                glassPanel,
                "group relative overflow-hidden p-8 transition-transform duration-300 hover:-translate-y-1",
              )}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute right-6 top-4 select-none font-display text-6xl font-bold leading-none text-fg/[0.06] transition-all duration-500 group-hover:text-primary/10"
              >
                {s.n}
              </span>
              <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/60 bg-white/50 text-primary backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]">
                <s.Icon className="h-6 w-6" />
              </div>
              <h3 className="relative z-10 mt-6 font-display text-xl font-semibold text-fg">
                {s.title}
              </h3>
              <p className="relative z-10 mt-3 text-sm leading-relaxed text-muted">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Servicios destacados ── */}
      <section id="servicios" className={cn(container, "py-8 pb-24")}>
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">El catálogo</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              Servicios destacados
            </h2>
          </div>
          <Link
            href="/services"
            className="group inline-flex items-center gap-1 font-mono text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Ver todos
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {list.length === 0 ? (
          <div className={cn(glassPanel, "p-14 text-center")}>
            <p className="mx-auto max-w-sm text-muted">
              Pronto habrá servicios disponibles. Vuelve en breve.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((s, i) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  index={i}
                  isFavorite={favIds.has(s.id)}
                  next="/"
                />
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <Link href="/services" className={btn("secondary", "lg")}>
                Ver todos los servicios
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
