import type { Metadata, Viewport } from "next";
// Fuentes locales (fontsource) — marca Nexus Digital:
// titulares Geist, texto Inter, etiquetas/datos JetBrains Mono.
import "@fontsource-variable/geist";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { container } from "@/lib/ui";

// La app es dinámica (sesión + datos en cada request); sin prerender estático.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketplace — Servicios y suscripciones",
  description:
    "Plataforma para ofrecer y contratar mentorías, membresías y servicios por suscripción.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1116" },
  ],
};

const footerLinks = [
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
  { label: "Privacidad", href: "/legal/privacidad" },
  { label: "Términos", href: "/legal/terminos" },
  { label: "Reembolsos", href: "/legal/reembolsos" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-bg text-fg">
        <ThemeProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <footer className="mt-24 border-t border-border bg-surface">
            <div
              className={`${container} flex flex-col items-center gap-6 py-12 text-sm text-muted sm:flex-row sm:justify-between`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="grid h-7 w-7 place-items-center rounded-lg bg-primary font-display text-xs font-bold text-on-primary"
                >
                  M
                </span>
                <p>
                  © {new Date().getFullYear()} Marketplace. Todos los derechos
                  reservados.
                </p>
              </div>
              <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {footerLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="transition-colors duration-200 hover:text-primary"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
