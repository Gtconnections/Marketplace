"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SERVICE_CATEGORIES } from "@/lib/config";
import { inputCls, cn } from "@/lib/ui";

/** Barra de filtros del catálogo: búsqueda + categoría + orden (via URL). */
export function CatalogFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const category = sp.get("category") ?? "";
  const sort = sp.get("sort") ?? "recientes";

  function update(patch: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    router.push(`/${qs ? `?${qs}` : ""}#servicios`, { scroll: false });
  }

  // Búsqueda con debounce (no navega en cada tecla).
  useEffect(() => {
    const id = setTimeout(() => {
      if ((sp.get("q") ?? "") !== q) update({ q });
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar servicios…"
        aria-label="Buscar servicios"
        className={cn(inputCls, "sm:max-w-xs")}
      />
      <select
        value={category}
        onChange={(e) => update({ category: e.target.value })}
        aria-label="Filtrar por categoría"
        className={cn(inputCls, "sm:w-auto")}
      >
        <option value="">Todas las categorías</option>
        {SERVICE_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(e) => update({ sort: e.target.value })}
        aria-label="Ordenar"
        className={cn(inputCls, "sm:w-auto")}
      >
        <option value="recientes">Más recientes</option>
        <option value="rating">Mejor valorados</option>
      </select>
    </div>
  );
}
