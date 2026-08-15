import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ServiceCard } from "@/components/service-card";
import { getFavoriteIds } from "@/lib/actions/favorites";
import { Search, CreditCard, Rocket, Lock, ArrowRight } from "@/components/icons";
import { container, btn, card, cn } from "@/lib/ui";
import type { Plan, Service, Vendor } from "@/lib/types";

export const dynamic = "force-dynamic";

type CardService = Service & { vendor: Vendor | null; plans: Plan[] };

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
    body: "Elige tu plan ideal —mensual, anual o pago único— y procesa tu pago de forma instantánea y segura con Stripe.",
  },
  {
    n: "03",
    Icon: Rocket,
    title: "Accede",
    body: "Recibe acceso inmediato al servicio, descargas y comunidades. Desbloquea tu potencial al instante.",
  },
];

export default async function Home() {
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
    <div className="relative overflow-hidden">
      {/* ── Glows ambientales de fondo ── */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/4 right-0 h-[600px] w-[600px] translate-x-1/3 rounded-full bg-secondary-container/40 blur-3xl dark:bg-primary/10" />
      </div>

      {/* ── Hero ── */}
      <section className={cn(container, "grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:py-28")}>
        <div className="flex flex-col items-start gap-5">
          <p className="eyebrow animate-in" style={{ "--d": "0ms" } as React.CSSProperties}>
            Marketplace de Expertos
          </p>
          <h1
            className="animate-in text-4xl font-extrabold leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-6xl"
            style={{ "--d": "80ms" } as React.CSSProperties}
          >
            Potencia tu mundo digital con{" "}
            <span className="italic font-medium text-primary">expertos de élite.</span>
          </h1>
          <p
            className="animate-in max-w-xl text-lg leading-relaxed text-muted"
            style={{ "--d": "160ms" } as React.CSSProperties}
          >
            Una membresía para acceder a mentorías, comunidades y servicios
            recurrentes de líderes de la industria tecnológica. Impulsa tu
            carrera y proyectos hoy mismo.
          </p>
          <div
            className="animate-in mt-2 flex flex-wrap items-center gap-4"
            style={{ "--d": "240ms" } as React.CSSProperties}
          >
            <Link href="/services" className={btn("primary", "lg")}>
              Explorar servicios
            </Link>
            <a href="#como-funciona" className={btn("secondary", "lg")}>
              ¿Cómo funciona?
            </a>
          </div>
          <div
            className="animate-in mt-4 flex items-center gap-4 font-mono text-xs text-muted"
            style={{ "--d": "320ms" } as React.CSSProperties}
          >
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-4 w-4" /> Pago seguro
            </span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>Sin permanencia</span>
          </div>
        </div>

        {/* Membership pass */}
        <div
          className="animate-in w-full"
          style={{ "--d": "200ms" } as React.CSSProperties}
        >
          <div className="bg-grad group relative mx-auto flex aspect-[4/3] w-full max-w-md flex-col justify-between overflow-hidden rounded-3xl p-8 text-on-primary shadow-pop transition-transform duration-500 hover:scale-[1.02] lg:ml-auto lg:mr-0">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/20 blur-2xl"
            />
            <div className="relative flex items-start justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/80">
                Membership Pass
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 font-display text-lg font-bold text-white backdrop-blur-sm">
                M
              </span>
            </div>
            <div className="relative mt-auto">
              <div className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-white/80">
                <span>Plan Pro</span>
                <span className="h-1 w-1 rounded-full bg-white" />
                <span>Acceso Total</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-white">
                Estudio del experto
              </h3>
              <div className="mt-5 flex items-end justify-between border-t border-white/20 pt-4">
                <span className="font-display text-3xl font-bold tabular-nums text-white">
                  $29
                  <span className="text-base font-normal text-white/80">/mes</span>
                </span>
                <span className="rounded-full bg-white/20 px-3 py-1 font-mono text-xs uppercase tracking-wider text-white backdrop-blur-md">
                  Activa
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section id="como-funciona" className={cn(container, "border-t border-border/60 py-20 sm:py-24")}>
        <div className="mb-10">
          <p className="eyebrow">Cómo funciona</p>
          <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            De la búsqueda al acceso, en tres pasos sencillos.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="glass-card group relative overflow-hidden rounded-2xl p-8"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute right-6 top-4 select-none font-display text-6xl font-bold leading-none text-surface-3 transition-all duration-500 group-hover:-translate-y-1 group-hover:text-primary/10"
              >
                {s.n}
              </span>
              <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <s.Icon className="h-6 w-6" />
              </div>
              <h3 className="relative z-10 font-display text-xl font-semibold text-fg">
                {s.title}
              </h3>
              <p className="relative z-10 mt-3 text-sm leading-relaxed text-muted">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Servicios destacados (preview de 8) ── */}
      <section id="servicios" className={cn(container, "border-t border-border/60 py-20 sm:py-24")}>
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">El Catálogo</p>
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
            <div className={card(false, "p-14 text-center")}>
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
