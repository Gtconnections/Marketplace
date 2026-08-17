import Link from "next/link";
import { XLogo, Instagram, LinkedIn, Mail } from "@/components/icons";
import { getStoreSettings } from "@/lib/store-settings";
import { container, cn } from "@/lib/ui";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Producto",
    links: [
      { label: "Explorar servicios", href: "/services" },
      { label: "Cómo funciona", href: "/#como-funciona" },
      { label: "Favoritos", href: "/favorites" },
      { label: "Mi cuenta", href: "/dashboard" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Nosotros", href: "/nosotros" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidad", href: "/legal/privacidad" },
      { label: "Términos", href: "/legal/terminos" },
      { label: "Reembolsos", href: "/legal/reembolsos" },
    ],
  },
];

const linkCls =
  "text-sm text-muted transition-colors duration-200 hover:text-primary";

export async function Footer() {
  const year = new Date().getFullYear();
  const s = await getStoreSettings();
  const initial = (s.store_name.trim()[0] ?? "M").toUpperCase();
  const socials = [
    { label: "X", href: s.social_x, Icon: XLogo },
    { label: "Instagram", href: s.social_instagram, Icon: Instagram },
    { label: "LinkedIn", href: s.social_linkedin, Icon: LinkedIn },
  ];

  return (
    <footer className="glass mt-24 border-t border-border/60">
      <div className={cn(container, "py-14")}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Marca */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-display text-base font-bold text-on-primary"
              >
                {initial}
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-fg">
                {s.store_name}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              {s.tagline}
            </p>
            {s.contact_email && (
              <a
                href={`mailto:${s.contact_email}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4" /> {s.contact_email}
              </a>
            )}
            <div className="mt-5 flex items-center gap-2">
              {socials.map((soc) => (
                <a
                  key={soc.label}
                  href={soc.href || "#"}
                  aria-label={soc.label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-surface/40 text-muted backdrop-blur-md transition-colors duration-200 hover:border-primary/40 hover:text-primary"
                >
                  <soc.Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Columnas de enlaces */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted">
                {col.title}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={linkCls}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Barra inferior */}
        <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            © {year} {s.store_name}. Todos los derechos reservados.
          </p>
          <p className="font-mono text-xs text-muted">
            Construido con Next.js, Supabase y Stripe.
          </p>
        </div>
      </div>
    </footer>
  );
}
