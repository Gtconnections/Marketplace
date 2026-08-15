import { labelCls } from "@/lib/ui";

/**
 * Campo de formulario modular: etiqueta + control + ayuda opcional.
 * Mantiene el espaciado y la jerarquía tipográfica consistentes.
 */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
