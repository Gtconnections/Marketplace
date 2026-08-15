"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Provee el tema claro/oscuro (con opción "system") a toda la app. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
