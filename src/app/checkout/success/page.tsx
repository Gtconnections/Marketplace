import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isDemoPayments } from "@/lib/config";
import { Check, Download, ArrowRight, Lock } from "@/components/icons";
import { container, card, btn, cn } from "@/lib/ui";
import type { Vendor } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service: slug } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  // Servicio comprado (si viene el slug).
  type PurchasedService = {
    id: string;
    title: string;
    slug: string;
    download_path: string | null;
    vendor: Vendor | null;
  };
  let service: PurchasedService | null = null;

  if (slug) {
    const { data } = await supabase
      .from("services")
      .select("id, title, slug, download_path, vendor:vendors(*)")
      .eq("slug", slug)
      .single();
    service = (data as unknown as PurchasedService) ?? null;
  }

  // ¿Tiene acceso activo? (para mostrar la descarga)
  let hasAccess = false;
  if (service) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("customer_id", user.id)
      .eq("service_id", service.id)
      .in("status", ["active", "trialing"])
      .limit(1)
      .maybeSingle();
    hasAccess = Boolean(sub);
  }

  return (
    <div className={cn(container, "flex justify-center py-16 sm:py-24")}>
      <div className="animate-in w-full max-w-lg text-center">
        {/* Icono de éxito */}
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
          <Check className="h-8 w-8" />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          ¡Compra confirmada!
        </h1>
        <p className="mt-3 text-muted">
          {service ? (
            <>
              Ya tienes acceso a{" "}
              <span className="font-semibold text-fg">{service.title}</span>.
            </>
          ) : (
            <>Tu compra se registró correctamente. Ya tienes acceso.</>
          )}
        </p>

        {isDemoPayments && (
          <p className="mt-2 inline-flex items-center gap-1.5 font-mono text-xs text-muted">
            <Lock className="h-3.5 w-3.5" /> Modo demo · no se realizó ningún
            cobro
          </p>
        )}

        {/* Acceso / descarga */}
        <div className={card(false, "mt-8 flex flex-col gap-3 p-6 text-left")}>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Tu acceso
          </p>
          {service && hasAccess && service.download_path ? (
            <a
              href={`/api/download/${service.id}`}
              className={btn("primary", "md", "w-full")}
            >
              <Download className="h-4 w-4" /> Descargar archivo
            </a>
          ) : (
            <p className="text-sm text-muted">
              Encontrarás este servicio y sus recursos en tu panel, disponibles
              cuando quieras.
            </p>
          )}
          <Link href="/dashboard" className={btn("secondary", "md", "w-full")}>
            Ir a mi panel
          </Link>
        </div>

        <div className="mt-6">
          <Link
            href="/services"
            className="inline-flex items-center gap-1 font-mono text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Seguir explorando el catálogo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
