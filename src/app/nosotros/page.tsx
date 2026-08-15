import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Rocket, Star, Lock, ArrowRight } from "@/components/icons";
import { container, btn, cn } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Nosotros — Marketplace",
  description:
    "Somos una tienda digital de herramientas y servicios premium, seleccionados con criterio para acelerar tu trabajo.",
};

const VALORES = [
  {
    Icon: Compass,
    title: "Curaduría con criterio",
    body: "No listamos todo lo que existe. Elegimos y probamos cada herramienta para que tú no pierdas tiempo separando lo bueno del ruido.",
  },
  {
    Icon: Rocket,
    title: "Acceso inmediato",
    body: "Compras y empiezas a usar en segundos. Sin esperas, sin fricción: descargas, accesos y comunidades disponibles al instante.",
  },
  {
    Icon: Star,
    title: "Calidad que se nota",
    body: "Estándares altos en todo lo que ofrecemos, desde el producto hasta el detalle de la experiencia. Si no lo usaríamos nosotros, no está aquí.",
  },
];

export default function NosotrosPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_75%_-20%,color-mix(in_srgb,var(--primary)_13%,transparent),transparent_70%),radial-gradient(50%_100%_at_0%_0%,color-mix(in_srgb,var(--secondary-container)_45%,transparent),transparent_60%)]"
        />
        <div className={cn(container, "relative py-16 sm:py-24")}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">Nosotros</p>
            <h1 className="animate-in mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-fg sm:text-5xl">
              Herramientas digitales que{" "}
              <span className="text-primary">aceleran tu trabajo.</span>
            </h1>
            <p className="animate-in mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              Nacimos de una idea simple: reunir en un solo lugar los recursos
              digitales que de verdad mueven la aguja —mentorías, membresías,
              plantillas y software— y entregarlos con una experiencia a la
              altura de lo que cuestan.
            </p>
          </div>
        </div>
      </section>

      {/* Historia */}
      <section className={cn(container, "py-16 sm:py-20")}>
        <div className="mx-auto max-w-2xl">
          <div className="prose">
            <h2>Por qué existimos</h2>
            <p>
              El mercado de productos digitales está lleno de promesas y vacío de
              criterio. Hay miles de herramientas, cursos y plantillas compitiendo
              por tu atención, y separar lo valioso del relleno se ha vuelto un
              trabajo en sí mismo.
            </p>
            <p>
              Construimos esta tienda para resolver exactamente eso: ser el filtro
              en el que puedes confiar. Cada producto que publicamos pasa por un
              estándar claro —utilidad real, calidad y soporte— antes de llegar a
              ti. Si está aquí, es porque creemos que vale tu tiempo y tu dinero.
            </p>
            <p>
              Detrás está <strong>GT Connections</strong>, un equipo obsesionado
              con la tecnología, la velocidad y el detalle. Tratamos cada compra
              como lo que es: una decisión de negocio tuya que merece una
              experiencia impecable.
            </p>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className={cn(container, "pb-8")}>
        <div className="grid gap-6 md:grid-cols-3">
          {VALORES.map((v) => (
            <div key={v.title} className="glass-card rounded-2xl p-8">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <v.Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-fg">
                {v.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className={cn(container, "py-16 sm:py-20")}>
        <div className="bg-grad relative overflow-hidden rounded-3xl p-10 text-center text-on-primary sm:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl"
          />
          <div className="relative">
            <p className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-white/80">
              <Lock className="h-4 w-4" /> Pago seguro · Sin permanencia
            </p>
            <h2 className="mx-auto mt-4 max-w-xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Lo que necesitas para tu próximo salto, en un solo lugar.
            </h2>
            <div className="mt-8 flex justify-center">
              <Link
                href="/services"
                className={cn(
                  btn("secondary", "lg"),
                  "group border-transparent bg-white text-primary hover:bg-white/90",
                )}
              >
                Explorar el catálogo
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
