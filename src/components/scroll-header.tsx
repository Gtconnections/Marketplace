"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/ui";

/**
 * Cabecera sticky con efecto glass y una sombra/borde que aparece al hacer
 * scroll — le da profundidad y "movimiento" a la barra de navegación.
 */
export function ScrollHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "glass sticky top-0 z-40 border-b transition-[box-shadow,border-color] duration-300",
        scrolled ? "border-border/70 shadow-float" : "border-transparent",
      )}
    >
      {children}
    </header>
  );
}
