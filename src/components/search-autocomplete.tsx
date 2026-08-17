"use client";

/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SERVICE_CATEGORIES } from "@/lib/config";
import { Search, X, Star } from "@/components/icons";

type Result = {
  id: string;
  title: string;
  slug: string;
  category: string;
  cover_image_url: string | null;
  rating_avg: number;
};

const RECENT_KEY = "mk_recent_searches";

function categoryLabel(v: string) {
  return SERVICE_CATEGORIES.find((c) => c.value === v)?.label ?? v;
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function SearchAutocomplete({
  initialQuery = "",
  placeholder = "Buscar servicios…",
}: {
  initialQuery?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState<Result[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  // Cierra al hacer clic fuera.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Autocompletado con debounce.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  const saveRecent = (term: string) => {
    const t = term.trim();
    if (!t) return;
    try {
      const next = [t, ...loadRecent().filter((r) => r !== t)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecent(next);
    } catch {
      /* almacenamiento no disponible */
    }
  };

  const goToSearch = (term: string) => {
    const t = term.trim();
    if (!t) return;
    saveRecent(t);
    setOpen(false);
    router.push(`/services?q=${encodeURIComponent(t)}`);
  };

  const goToService = (r: Result) => {
    saveRecent(q);
    setOpen(false);
    router.push(`/services/${r.slug}`);
  };

  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* noop */
    }
    setRecent([]);
  };

  const term = q.trim();
  const showResults = term.length >= 2;

  return (
    <div ref={ref} className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToSearch(q);
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label="Buscar servicios"
          className="h-14 w-full rounded-2xl border border-white/20 bg-white/95 pl-12 pr-28 text-base text-slate-900 shadow-lg outline-none ring-primary/30 backdrop-blur transition-shadow placeholder:text-slate-400 focus:ring-4 dark:bg-white/95"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setResults([]);
            }}
            aria-label="Limpiar"
            className="absolute right-24 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          Buscar
        </button>
      </form>

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-pop">
          {showResults ? (
            <>
              {loading && results.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted">Buscando…</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted">
                  Sin coincidencias para “{term}”.
                </p>
              ) : (
                <ul className="max-h-[22rem] overflow-y-auto p-1.5">
                  {results.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => goToService(r)}
                        className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-surface-2"
                      >
                        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2">
                          {r.cover_image_url ? (
                            <img
                              src={r.cover_image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Search className="h-4 w-4 text-muted" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-fg">
                            {r.title}
                          </span>
                          <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                            <span className="font-mono">{categoryLabel(r.category)}</span>
                            {r.rating_avg > 0 && (
                              <span className="inline-flex items-center gap-0.5">
                                <Star className="h-3 w-3 text-warning" />
                                {r.rating_avg.toFixed(1)}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => goToSearch(q)}
                className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm font-medium text-primary transition-colors hover:bg-surface-2"
              >
                <Search className="h-4 w-4" /> Ver todos los resultados de “{term}”
              </button>
            </>
          ) : recent.length > 0 ? (
            <div className="p-1.5">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="font-mono text-xs uppercase tracking-widest text-muted">
                  Búsquedas recientes
                </span>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-xs text-muted transition-colors hover:text-fg"
                >
                  Limpiar
                </button>
              </div>
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setQ(r);
                    goToSearch(r);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-2"
                >
                  <Search className="h-4 w-4 text-muted" /> {r}
                </button>
              ))}
            </div>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted">
              Escribe para buscar servicios.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
