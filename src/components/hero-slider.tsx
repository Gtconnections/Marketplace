"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Star,
  Check,
} from "@/components/icons";
import { container, cn } from "@/lib/ui";

const glassPanel =
  "rounded-3xl border border-white/60 bg-white/45 shadow-[0_28px_80px_-24px_rgba(76,74,180,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]";
const glassInner =
  "rounded-2xl border border-white/60 bg-white/55 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]";

const AVATARS = [
  "from-violet-400 to-fuchsia-400",
  "from-sky-400 to-blue-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
];

type Slide = {
  title: string;
  accent: string;
  subtitle: string;
  chart: string;
  chartEndY: number;
  top: { label: string; value: string; trend: string; sub: string; tag: string };
  avatarDelta: string;
  avatarCaption: string;
  bottom: {
    label: string;
    value: string;
    pct: number;
    Icon: (p: { className?: string }) => React.ReactNode;
  };
};

const SLIDES: Slide[] = [
  {
    title: "Diseñado para",
    accent: "el futuro.",
    subtitle:
      "Una experiencia digital que combina claridad, profundidad y elegancia. Mentorías, membresías y recursos premium en un solo lugar.",
    chart: "M0,92 C46,86 66,66 104,66 C146,66 168,40 210,44 C252,48 278,20 320,12",
    chartEndY: 12,
    top: {
      label: "Usuarios activos",
      value: "24.8K",
      trend: "12.5%",
      sub: "en los últimos 30 días",
      tag: "Tiempo real",
    },
    avatarDelta: "+2.4K",
    avatarCaption: "nuevos esta semana",
    bottom: { label: "Rendimiento", value: "98.6%", pct: 98.6, Icon: Rocket },
  },
  {
    title: "Expertos que",
    accent: "mueven la aguja.",
    subtitle:
      "Accede a mentorías y comunidades de líderes de la industria. Contenido probado que se traduce en resultados reales para tu carrera.",
    chart: "M0,80 C40,84 70,58 108,56 C150,54 176,72 214,48 C252,28 286,34 320,20",
    chartEndY: 20,
    top: {
      label: "Miembros activos",
      value: "12.4K",
      trend: "8.2%",
      sub: "con acceso a comunidades",
      tag: "Comunidad",
    },
    avatarDelta: "+1.1K",
    avatarCaption: "miembros nuevos",
    bottom: { label: "Satisfacción", value: "96%", pct: 96, Icon: Star },
  },
  {
    title: "Todo listo,",
    accent: "al instante.",
    subtitle:
      "Compra, descarga y accede en segundos. Sin fricción y sin permanencia: cancela cuando quieras, con pago 100% seguro.",
    chart: "M0,96 C44,92 68,72 104,70 C150,68 172,50 210,48 C250,46 280,22 320,10",
    chartEndY: 10,
    top: {
      label: "Descargas",
      value: "48.2K",
      trend: "21%",
      sub: "entregadas al instante",
      tag: "Hoy",
    },
    avatarDelta: "+5.0K",
    avatarCaption: "en las últimas 24 h",
    bottom: { label: "Entrega inmediata", value: "99.2%", pct: 99.2, Icon: Check },
  },
];

export function HeroSlider() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const n = SLIDES.length;

  const goTo = (idx: number) => {
    setDir(idx === i ? 1 : (idx - i + n) % n <= n / 2 ? 1 : -1);
    setI(((idx % n) + n) % n);
  };
  const next = () => {
    setDir(1);
    setI((v) => (v + 1) % n);
  };
  const prev = () => {
    setDir(-1);
    setI((v) => (v - 1 + n) % n);
  };

  useEffect(() => {
    if (paused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const id = setInterval(() => {
      setDir(1);
      setI((v) => (v + 1) % n);
    }, 4000);
    return () => clearInterval(id);
  }, [paused, n]);

  const s = SLIDES[i];
  const slideCls = dir > 0 ? "hero-slide-r" : "hero-slide-l";

  const arrowBtn =
    "grid h-9 w-9 place-items-center rounded-full border border-white/60 bg-white/50 text-fg backdrop-blur-md transition-colors duration-200 hover:bg-white/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.12]";

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Presentación principal"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        container,
        "grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:py-24",
      )}
    >
      {/* Izquierda */}
      <div className="flex flex-col items-start gap-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/50 px-3.5 py-1.5 font-mono text-xs font-medium text-primary shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Marketplace de
          expertos
        </span>

        {/* Texto que cambia por diapositiva (con entrada direccional) */}
        <div className="min-h-[220px] sm:min-h-[210px]">
          <h1 key={`t-${i}`} className={cn(slideCls, "text-4xl font-extrabold leading-[1.05] tracking-tight text-fg sm:text-5xl lg:text-6xl")}>
            {s.title}{" "}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-violet-400">
              {s.accent}
            </span>
          </h1>
          <p
            key={`p-${i}`}
            className={cn(slideCls, "mt-5 max-w-md text-lg leading-relaxed text-muted")}
            style={{ "--d": "90ms" } as React.CSSProperties}
          >
            {s.subtitle}
          </p>
        </div>

        {/* CTAs (constantes) */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/services"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-slate-900 shadow-[0_10px_30px_-8px_rgba(80,80,180,0.45)] ring-1 ring-white/70 transition-all duration-200 hover:-translate-y-0.5"
          >
            Probar ahora
            <ArrowRight className="h-5 w-5 -rotate-45 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex h-12 items-center gap-2 rounded-full border border-white/60 bg-white/40 px-6 text-base font-semibold text-fg backdrop-blur-md transition-colors hover:bg-white/60 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
          >
            ¿Cómo funciona?
          </a>
        </div>

        {/* Controles: flechas + puntos + confianza */}
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Anterior" onClick={prev} className={arrowBtn}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label="Diapositivas">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={idx === i}
                  aria-label={`Ir a la diapositiva ${idx + 1}`}
                  onClick={() => goTo(idx)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    idx === i ? "w-6 bg-primary" : "w-2 bg-muted/40 hover:bg-muted/70",
                  )}
                />
              ))}
            </div>
            <button type="button" aria-label="Siguiente" onClick={next} className={arrowBtn}>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <span className="hidden h-4 w-px bg-border/60 sm:block" aria-hidden />
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted">
            <Lock className="h-4 w-4" /> Pago seguro · Sin permanencia
          </span>
        </div>
      </div>

      {/* Derecha: dashboard de vidrio (cambia por diapositiva) */}
      <div className="w-full">
        <div className={cn(glassPanel, "relative p-5 sm:p-6")}>
          <div key={`c-${i}`} className="hero-card-in">
            {/* Widget superior */}
            <div className={cn(glassInner, "p-5")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">{s.top.label}</p>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold tracking-tight text-fg">
                      {s.top.value}
                    </span>
                    <span className="inline-flex items-center gap-0.5 font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <ArrowRight className="h-3 w-3 -rotate-90" /> {s.top.trend}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{s.top.sub}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wide text-primary">
                  {s.top.tag}
                </span>
              </div>
              <svg viewBox="0 0 320 110" className="mt-4 h-24 w-full" fill="none" aria-hidden>
                <defs>
                  <linearGradient id="lineg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="areag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#6366f1" stopOpacity="0.28" />
                    <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${s.chart} L320,110 L0,110 Z`} fill="url(#areag)" />
                <path
                  d={s.chart}
                  stroke="url(#lineg)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="hero-draw"
                />
                <circle cx="320" cy={s.chartEndY} r="4.5" fill="#8b5cf6" />
                <circle cx="320" cy={s.chartEndY} r="8" fill="#8b5cf6" fillOpacity="0.2" />
              </svg>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {AVATARS.map((g, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "h-8 w-8 rounded-full bg-gradient-to-br ring-2 ring-white dark:ring-slate-800",
                        g,
                      )}
                    />
                  ))}
                </div>
                <div className="text-xs leading-tight">
                  <p className="font-semibold text-fg">{s.avatarDelta}</p>
                  <p className="text-muted">{s.avatarCaption}</p>
                </div>
              </div>
            </div>

            {/* Widget inferior */}
            <div className={cn(glassInner, "mt-4 p-5")}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">{s.bottom.label}</p>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-sm">
                  <s.bottom.Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-1 font-display text-3xl font-bold tracking-tight text-fg">
                {s.bottom.value}
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/50 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700"
                  style={{ width: `${s.bottom.pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
