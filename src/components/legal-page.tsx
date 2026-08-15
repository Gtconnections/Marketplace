import Link from "next/link";
import { ArrowLeft } from "@/components/icons";
import { container, cn } from "@/lib/ui";

/** Contenedor consistente para páginas legales (título + fecha + prosa). */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(container, "py-14 sm:py-20")}>
      <div className="animate-in mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>
        <p className="eyebrow mt-8">Legal</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 font-mono text-xs text-muted">
          Última actualización: {updated}
        </p>
        {intro && (
          <p className="mt-6 text-lg leading-relaxed text-muted">{intro}</p>
        )}
        <div className="prose mt-8">{children}</div>
      </div>
    </div>
  );
}
