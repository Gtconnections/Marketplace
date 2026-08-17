"use client";

import { Printer } from "@/components/icons";
import { btn, cn } from "@/lib/ui";

/** Botón para imprimir / guardar como PDF el recibo (usa el diálogo del navegador). */
export function PrintButton({ label = "Imprimir / Guardar PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(btn("primary", "md"), "no-print gap-2")}
    >
      <Printer className="h-4 w-4" /> {label}
    </button>
  );
}
