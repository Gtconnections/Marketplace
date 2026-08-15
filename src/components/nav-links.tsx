"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, LayoutDashboard } from "@/components/icons";
import { btn, cn } from "@/lib/ui";

const ICON = "h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5";

/** Enlaces de navegación (escritorio) con iconos, estado activo y micro-interacciones. */
export function NavLinks({
  authed,
  isAdmin,
}: {
  authed: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/services" ? pathname.startsWith("/services") : pathname === href;

  const pill = (href: string) =>
    cn(
      "group relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
      isActive(href)
        ? "bg-primary/10 text-primary"
        : "text-muted hover:bg-surface-2 hover:text-fg",
    );

  return (
    <div className="flex items-center gap-1">
      <Link href="/services" className={pill("/services")}>
        <Compass className={ICON} /> Explorar
      </Link>

      {authed && (
        <Link href="/favorites" className={pill("/favorites")}>
          <Heart className={ICON} filled={isActive("/favorites")} /> Favoritos
        </Link>
      )}

      {isAdmin && (
        <Link href="/vendor" className={cn(btn("secondary", "sm"), "group gap-2")}>
          <LayoutDashboard className={ICON} /> Admin
        </Link>
      )}
    </div>
  );
}
