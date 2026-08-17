"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Compass,
  Heart,
  CreditCard,
  Receipt,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
} from "@/components/icons";
import { btn, container, cn } from "@/lib/ui";

type Item = { href: string; label: string; Icon: (p: { className?: string }) => React.ReactNode };

/** Menú de navegación para móvil (hamburguesa + panel animado con iconos). */
export function MobileMenu({
  authed,
  isAdmin = false,
}: {
  authed: boolean;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  const items: Item[] = [{ href: "/services", label: "Explorar", Icon: Compass }];
  if (authed) {
    items.push({ href: "/favorites", label: "Favoritos", Icon: Heart });
    if (!isAdmin) {
      items.push({ href: "/dashboard", label: "Mis suscripciones", Icon: CreditCard });
      items.push({ href: "/pedidos", label: "Mis pedidos", Icon: Receipt });
    }
    if (isAdmin)
      items.push({ href: "/vendor", label: "Admin", Icon: LayoutDashboard });
    items.push(
      { href: "/perfil", label: "Perfil", Icon: User },
      { href: "/configuracion", label: "Configuración", Icon: Settings },
    );
  }

  const item = (href: string) =>
    cn(
      "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
      pathname === href || (href === "/services" && pathname.startsWith("/services"))
        ? "bg-primary/10 text-primary"
        : "text-fg hover:bg-surface-2",
    );

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-grid h-11 w-11 place-items-center rounded-lg border border-border bg-surface text-fg transition-all duration-200 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <span
          className={cn(
            "transition-transform duration-300",
            open ? "rotate-90" : "rotate-0",
          )}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={close}
            className="animate-in fixed inset-0 top-16 z-30 cursor-default bg-black/30 backdrop-blur-sm"
          />
          <div className="glass fixed inset-x-0 top-16 z-40 border-b border-border shadow-float">
            <div className={cn(container, "flex flex-col gap-1 py-4")}>
              {items.map((it, i) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={close}
                  className={cn(item(it.href), "animate-in")}
                  style={{ "--d": `${i * 45}ms` } as React.CSSProperties}
                >
                  <it.Icon className="h-5 w-5 opacity-80" />
                  {it.label}
                </Link>
              ))}

              <span className="my-2 h-px bg-border" aria-hidden />

              {authed ? (
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg",
                      "animate-in",
                    )}
                    style={{ "--d": `${items.length * 45}ms` } as React.CSSProperties}
                  >
                    <LogOut className="h-5 w-5 opacity-80" /> Salir
                  </button>
                </form>
              ) : (
                <div
                  className="animate-in flex flex-col gap-2"
                  style={{ "--d": `${items.length * 45}ms` } as React.CSSProperties}
                >
                  <Link href="/login" onClick={close} className={item("/login")}>
                    <LogIn className="h-5 w-5 opacity-80" /> Entrar
                  </Link>
                  <Link
                    href="/signup"
                    onClick={close}
                    className={cn(btn("primary", "md", "w-full gap-2"))}
                  >
                    <UserPlus className="h-4 w-4" /> Crear cuenta
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
