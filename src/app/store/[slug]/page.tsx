import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServiceCard } from "@/components/service-card";
import { container, card, cn } from "@/lib/ui";
import type { Plan, Service, Vendor } from "@/lib/types";

export const dynamic = "force-dynamic";

type CardService = Service & { vendor: Vendor | null; plans: Plan[] };

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("slug", slug)
    .single();
  if (!vendor) notFound();

  const { data } = await supabase
    .from("services")
    .select("*, vendor:vendors(*), plans(*)")
    .eq("vendor_id", vendor.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  const services = (data ?? []) as CardService[];

  const initial = (vendor.display_name?.[0] ?? "?").toUpperCase();

  return (
    <div className={cn(container, "py-12")}>
      {/* Cabecera del vendedor */}
      <div className="animate-in flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <span className="bg-grad grid h-16 w-16 shrink-0 place-items-center rounded-2xl font-display text-2xl font-semibold text-white shadow-float">
          {initial}
        </span>
        <div>
          <p className="eyebrow">Vendedor</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            {vendor.display_name}
          </h1>
          {vendor.bio && (
            <p className="mt-2 max-w-2xl text-muted">{vendor.bio}</p>
          )}
        </div>
      </div>

      {/* Servicios del vendedor */}
      <div className="mt-12">
        <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight text-fg">
          {services.length > 0
            ? `Servicios (${services.length})`
            : "Sin servicios publicados"}
        </h2>
        {services.length === 0 ? (
          <div className={card(false, "p-10 text-center text-muted")}>
            Este vendedor todavía no tiene servicios publicados.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <ServiceCard key={s.id} service={s} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
