import { Star } from "@/components/icons";
import { cn } from "@/lib/ui";

/** Muestra una valoración (0–5) con relleno fraccionado y, opcional, el conteo. */
export function Stars({
  value,
  count,
  size = "sm",
  showValue = false,
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "lg";
  showValue?: boolean;
  className?: string;
}) {
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  const sz = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  const row = (cls: string) =>
    Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn(sz, cls)} />);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative inline-flex" aria-hidden>
        <span className="inline-flex text-muted/25">{row("")}</span>
        <span
          className="absolute inset-0 inline-flex overflow-hidden text-warning"
          style={{ width: `${pct}%` }}
        >
          {row("")}
        </span>
      </span>
      {showValue && value > 0 && (
        <span className="font-mono text-xs font-medium text-fg">
          {value.toFixed(1)}
        </span>
      )}
      {typeof count === "number" && (
        <span className="font-mono text-xs text-muted">
          {count > 0 ? `(${count})` : "Sin reseñas"}
        </span>
      )}
    </span>
  );
}
