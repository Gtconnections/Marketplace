"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Heart, LayoutDashboard } from "@/components/icons";
import { cn } from "@/lib/ui";

const ICON = "h-4 w-4";

/** Enlaces de navegación (escritorio): sutiles, con subrayado en el activo. */
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

  const link = (href: string) =>
    cn(
      "group relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
      isActive(href) ? "text-primary" : "text-muted hover:text-fg",
    );

  const underline = (href: string) => (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-3 bottom-1 h-[2px] rounded-full bg-primary transition-all duration-300",
        isActive(href)
          ? "scale-x-100 opacity-100"
          : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-30",
      )}
    />
  );

  return (
    <div className="flex items-center gap-1">
      <Link href="/services" className={link("/services")}>
        <Compass className={ICON} /> Explorar
        {underline("/services")}
      </Link>

      {authed && (
        <Link href="/favorites" className={link("/favorites")}>
          <Heart className={ICON} filled={isActive("/favorites")} /> Favoritos
          {underline("/favorites")}
        </Link>
      )}

      {isAdmin && (
        <Link href="/vendor" className={link("/vendor")}>
          <LayoutDashboard className={ICON} /> Admin
          {underline("/vendor")}
        </Link>
      )}
    </div>
  );
}
