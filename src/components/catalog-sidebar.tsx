"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SERVICE_CATEGORIES } from "@/lib/config";
import { Star } from "@/components/icons";
import { inputCls, card, cn } from "@/lib/ui";

const RATINGS = [
  { value: "", label: "Cualquiera" },
  { value: "4", label: "4+" },
  { value: "4.5", label: "4.5+" },
];

/** Sidebar de filtros del catálogo (/services). Actualiza la URL. */
export function CatalogSidebar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const category = sp.get("category") ?? "";
  const rating = sp.get("rating") ?? "";
  const downloadable = sp.get("downloadable") === "1";
  const sort = sp.get("sort") ?? "recientes";

  function update(patch: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page"); // los filtros reinician la paginación
    const qs = params.toString();
    router.push(`/services${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if ((sp.get("q") ?? "") !== q) update({ q });
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const anyFilter = Boolean(q || category || rating || downloadable);

  const sectionTitle =
    "mb-2 font-mono text-xs font-medium uppercase tracking-widest text-muted";
  const chip = (active: boolean) =>
    cn(
      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
      active ? "bg-primary/10 font-medium text-primary" : "text-muted hover:bg-surface-2 hover:text-fg",
    );

  return (
    <div className={card(false, "flex flex-col gap-6 p-5")}>
      {/* Búsqueda */}
      <div>
        <label htmlFor="sb-q" className={sectionTitle}>
          Búsqueda
        </label>
        <input
          id="sb-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className={inputCls}
        />
      </div>

      {/* Categoría */}
      <div>
        <p className={sectionTitle}>Categoría</p>
        <div className="flex flex-col gap-0.5">
          <button type="button" onClick={() => update({ category: "" })} className={chip(!category)}>
            Todas
          </button>
          {SERVICE_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => update({ category: c.value })}
              className={chip(category === c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Valoración */}
      <div>
        <p className={sectionTitle}>Valoración mínima</p>
        <div className="flex gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => update({ rating: r.value })}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm transition-colors",
                rating === r.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted hover:text-fg",
              )}
            >
              {r.value && <Star className="h-3 w-3 text-warning" />}
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Descargable */}
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-fg">
        <input
          type="checkbox"
          checked={downloadable}
          onChange={(e) => update({ downloadable: e.target.checked ? "1" : "" })}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        Con archivo descargable
      </label>

      {/* Orden */}
      <div>
        <label htmlFor="sb-sort" className={sectionTitle}>
          Ordenar
        </label>
        <select
          id="sb-sort"
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
          className={inputCls}
        >
          <option value="recientes">Más recientes</option>
          <option value="rating">Mejor valorados</option>
        </select>
      </div>

      {anyFilter && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.push("/services", { scroll: false });
          }}
          className="text-sm font-medium text-primary hover:text-primary-hover"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
