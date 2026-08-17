import type { Metadata, Viewport } from "next";
// Fuentes locales (fontsource) — marca Nexus Digital:
// titulares Geist, texto Inter, etiquetas/datos JetBrains Mono.
import "@fontsource-variable/geist";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { siteUrl } from "@/lib/config";
import { getStoreSettings, isHexColor } from "@/lib/store-settings";

// La app es dinámica (sesión + datos en cada request); sin prerender estático.
export const dynamic = "force-dynamic";

const SITE_NAME = "Marketplace";
const DEFAULT_TITLE = "Marketplace — Servicios y suscripciones";
const DEFAULT_DESC =
  "Plataforma para ofrecer y contratar mentorías, membresías y servicios por suscripción.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: DEFAULT_TITLE,
    template: "%s — Marketplace",
  },
  description: DEFAULT_DESC,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    url: siteUrl,
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1116" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { accent } = await getStoreSettings();
  // Override opcional del color de acento (marca de la tienda).
  const accentCss =
    accent && isHexColor(accent)
      ? `:root{--primary:${accent};--primary-hover:color-mix(in srgb, ${accent} 82%, black);}` +
        `.dark{--primary:${accent};--primary-hover:color-mix(in srgb, ${accent} 78%, white);}`
      : "";

  return (
    <html lang="es" suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-bg text-fg">
        {accentCss && (
          <style dangerouslySetInnerHTML={{ __html: accentCss }} />
        )}
        <ThemeProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
