import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServiceCard } from "@/components/service-card";
import { container, card, btn, cn } from "@/lib/ui";
import type { Plan, Service, Vendor } from "@/lib/types";

export const dynamic = "force-dynamic";

type CardService = Service & { vendor: Vendor | null; plans: Plan[] };

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/favorites");

  const { data: favRows } = await supabase
    .from("favorites")
    .select("service:services(*, vendor:vendors(*), plans(*))")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  const list = (favRows ?? [])
    .map((r) => r.service as unknown as CardService)
    .filter((s) => s && s.status === "published");

  return (
    <div className={cn(container, "py-12")}>
      <div className="animate-in mb-8">
        <p className="eyebrow">Tu selección</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          Favoritos
        </h1>
        <p className="mt-1 text-muted">
          {list.length}{" "}
          {list.length === 1 ? "servicio guardado" : "servicios guardados"}.
        </p>
      </div>

      {list.length === 0 ? (
        <div className={card(false, "flex flex-col items-center gap-4 p-14 text-center")}>
          <p className="mx-auto max-w-sm text-muted">
            Aún no has guardado nada. Toca el corazón en cualquier servicio para
            guardarlo aquí.
          </p>
          <Link href="/services" className={btn("primary", "md")}>
            Explorar servicios
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((s, i) => (
            <ServiceCard
              key={s.id}
              service={s}
              index={i}
              isFavorite
              next="/favorites"
            />
          ))}
        </div>
      )}
    </div>
  );
}
