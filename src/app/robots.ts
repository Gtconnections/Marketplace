import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";

/**
 * robots.txt: permite el rastreo del contenido público y bloquea áreas
 * privadas o transaccionales. Apunta al sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/vendor",
          "/dashboard",
          "/perfil",
          "/configuracion",
          "/favorites",
          "/checkout",
          "/login",
          "/signup",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
