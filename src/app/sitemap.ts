import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Sitemap dinámico: páginas estáticas + cada servicio publicado.
 * Next.js lo sirve en /sitemap.xml (referenciado desde robots.txt).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/services`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/nosotros`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/contacto`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/legal/privacidad`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/legal/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/legal/reembolsos`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("services")
      .select("slug, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(2000);

    const serviceRoutes: MetadataRoute.Sitemap = (data ?? []).map((s) => ({
      url: `${siteUrl}/services/${(s as { slug: string }).slug}`,
      lastModified: (s as { created_at?: string }).created_at,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...serviceRoutes];
  } catch {
    return staticRoutes;
  }
}
