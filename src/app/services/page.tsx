import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ServiceCard } from "@/components/service-card";
import { getFavoriteIds } from "@/lib/actions/favorites";
import { publishDueServices } from "@/lib/publish-due";
import { getStoreSettings } from "@/lib/store-settings";
import { CatalogSidebar } from "@/components/catalog-sidebar";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { SERVICE_CATEGORIES } from "@/lib/config";
import { Pagination } from "@/components/pagination";
import { container, card, btn, cn } from "@/lib/ui";
import type { Plan, Service, Vendor } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;
type CardService = Service & { vendor: Vendor | null; plans: Plan[] };

// Imagen de fondo del hero (tecnología / servicios digitales). Cámbiala aquí.
// Alternativas: photo-1550751827-4bd374c3f58b · photo-1462556791646-c201b8241a94
const HERO_IMG =
  "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1920&q=80";

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    rating?: string;
    downloadable?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const { q = "", category = "", rating = "", downloadable = "", sort = "recientes" } = params;
  const pageNum = Math.max(1, Number(params.page) || 1);
  const hasFilters = Boolean(q || category || rating || downloadable);

  await publishDueServices();
  const { hero_image_url } = await getStoreSettings();
  const supabase = await createClient();
  let query = supabase
    .from("services")
    .select("*, vendor:vendors(*), plans(*)", { count: "exact" })
    .eq("status", "published");

  if (q) {
    // Busca en título + descripción. Saneamos caracteres que rompen el filtro or().
    const safe = q.replace(/[,()*%\\:]/g, " ").trim();
    if (safe) query = query.or(`title.ilike.*${safe}*,description.ilike.*${safe}*`);
  }
  if (category) query = query.eq("category", category);
  if (rating) query = query.gte("rating_avg", Number(rating));
  if (downloadable === "1") query = query.not("download_path", "is", null);
  query =
    sort === "rating"
      ? query.order("rating_avg", { ascending: false }).order("created_at", { ascending: false })
      : query.order("created_at", { ascending: false });

  const from = (pageNum - 1) * PAGE_SIZE;
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
  const list = (data ?? []) as CardService[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const favIds = await getFavoriteIds(supabase, user?.id);

  const paginationParams = { q, category, rating, downloadable, sort };

  return (
    <div>
      {/* ── Hero con imagen de fondo ── */}
      <section className="relative isolate overflow-hidden border-b border-border">
        {/* Imagen de fondo */}
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${hero_image_url || HERO_IMG})` }}
        />
        {/* Overlay navy para contraste del texto */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-[#081228]/92 via-[#0a1734]/82 to-[#0b2050]/70"
        />
        <div className={cn(container, "relative py-12 sm:py-16")}>
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow animate-in !text-[#9db4ff]">El catálogo</p>
            <h1 className="animate-in mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Explora nuestra selección de{" "}
              <span className="text-[#9db4ff]">servicios digitales</span>
            </h1>
            <p
              className="animate-in mt-5 max-w-2xl text-lg leading-relaxed text-white/80"
              style={{ "--d": "80ms" } as React.CSSProperties}
            >
              Descubre herramientas y recursos premium diseñados para acelerar
              tu flujo de trabajo. Calidad corporativa, velocidad tecnológica y
              diseño impecable en cada entrega.
            </p>
            <div
              className="animate-in mt-7 max-w-xl"
              style={{ "--d": "160ms" } as React.CSSProperties}
            >
              <SearchAutocomplete initialQuery={q} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Catálogo ── */}
      <div className={cn(container, "py-12")}>
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="animate-in lg:sticky lg:top-24 lg:h-fit">
            <CatalogSidebar />
          </aside>

          <div>
            <p className="mb-5 font-mono text-xs text-muted">
              {total} {total === 1 ? "resultado" : "resultados"}
              {hasFilters ? " con estos filtros" : ""}
            </p>
            {list.length === 0 ? (
              <div className={card(false, "flex flex-col items-center gap-4 p-14 text-center")}>
                <p className="font-medium text-fg">
                  {hasFilters
                    ? q
                      ? `Sin resultados para “${q}”.`
                      : "No encontramos servicios con esos filtros."
                    : "Aún no hay servicios publicados."}
                </p>
                {hasFilters && (
                  <>
                    <p className="max-w-sm text-sm text-muted">
                      Prueba con otros términos o explora por categoría:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {SERVICE_CATEGORIES.map((c) => (
                        <Link
                          key={c.value}
                          href={`/services?category=${c.value}`}
                          className="rounded-full border border-border px-3.5 py-1.5 text-sm text-muted transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                    <Link href="/services" className={cn(btn("secondary", "md"), "mt-1")}>
                      Limpiar filtros
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((s, i) => (
                    <ServiceCard
                      key={s.id}
                      service={s}
                      index={i}
                      isFavorite={favIds.has(s.id)}
                      next="/services"
                    />
                  ))}
                </div>
                <Pagination
                  page={pageNum}
                  totalPages={totalPages}
                  params={paginationParams}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
