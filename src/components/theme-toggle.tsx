"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "@/components/icons";
import { cn } from "@/lib/ui";

/** Botón para alternar entre tema claro y oscuro (target táctil 44×44). */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Hasta que el componente se monte en el cliente no sabemos el tema real
  // (el servidor no lo conoce). Usamos un valor estable para evitar el
  // desajuste de hidratación en el aria-label y el onClick.
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={
        !mounted
          ? "Cambiar tema"
          : isDark
            ? "Activar modo claro"
            : "Activar modo oscuro"
      }
      suppressHydrationWarning
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface text-fg transition-colors duration-200 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        className,
      )}
    >
      {mounted ? (
        isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />
      ) : (
        <span className="h-5 w-5" />
      )}
    </button>
  );
}
