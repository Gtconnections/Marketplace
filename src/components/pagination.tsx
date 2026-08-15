import Link from "next/link";
import { cn } from "@/lib/ui";

/** Paginación reutilizable. Construye enlaces a `basePath` conservando filtros. */
export function Pagination({
  page,
  totalPages,
  params,
  basePath = "/services",
}: {
  page: number;
  totalPages: number;
  params: Record<string, string | undefined>;
  basePath?: string;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const cell =
    "grid h-10 min-w-10 place-items-center rounded-lg border px-3 text-sm font-medium transition-colors";
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Paginación"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 && (
        <Link href={href(page - 1)} className={cn(cell, "border-border text-muted hover:text-fg")}>
          ← Anterior
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            cell,
            "font-mono",
            p === page
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted hover:text-fg",
          )}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link href={href(page + 1)} className={cn(cell, "border-border text-muted hover:text-fg")}>
          Siguiente →
        </Link>
      )}
    </nav>
  );
}
