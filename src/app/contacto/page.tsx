import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { Compass, Lock, Check } from "@/components/icons";
import { container, card, cn } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Contacto — Marketplace",
  description:
    "¿Tienes una duda, una propuesta o necesitas soporte? Escríbenos y te respondemos.",
};

const CONTACT_EMAIL = "contacto@gtconnections.com";

const PUNTOS = [
  {
    Icon: Compass,
    title: "Antes de comprar",
    body: "¿No sabes cuál producto encaja contigo? Cuéntanos tu caso y te orientamos.",
  },
  {
    Icon: Check,
    title: "Soporte de tu compra",
    body: "Problemas de acceso, descargas o facturación: estamos para resolverlo.",
  },
  {
    Icon: Lock,
    title: "Alianzas y prensa",
    body: "¿Quieres colaborar o publicar tu producto con nosotros? Hablemos.",
  },
];

export default function ContactoPage() {
  return (
    <div className={cn(container, "py-14 sm:py-20")}>
      <div className="animate-in mx-auto mb-10 max-w-2xl text-center">
        <p className="eyebrow">Contacto</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          Hablemos.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Sea una duda rápida o una propuesta seria, del otro lado hay un equipo
          real que lee y responde. Normalmente contestamos en menos de 24 horas
          hábiles.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        {/* Izquierda: canales */}
        <div className="animate-in flex flex-col gap-6">
          <div className={card(false, "p-6")}>
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Correo directo
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-2 inline-block text-lg font-semibold text-fg transition-colors hover:text-primary"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-2 text-sm text-muted">
              La vía más rápida. Escríbenos cuando quieras; sin formularios de por
              medio si no los necesitas.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {PUNTOS.map((p) => (
              <div key={p.title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <p.Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-fg">{p.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Derecha: formulario */}
        <div className="animate-in">
          <div className={card(false, "p-6 sm:p-8")}>
            <h2 className="font-display text-xl font-semibold text-fg">
              Escríbenos
            </h2>
            <p className="mb-6 mt-1 text-sm text-muted">
              Completa lo esencial y te respondemos al correo que nos dejes.
            </p>
            <ContactForm to={CONTACT_EMAIL} />
          </div>
        </div>
      </div>
    </div>
  );
}
