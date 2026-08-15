"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  User,
  Settings,
  CreditCard,
  LogOut,
  ChevronDown,
} from "@/components/icons";
import { cn } from "@/lib/ui";

/** Botón de avatar + menú desplegable de cuenta. */
export function UserMenu({
  name,
  email,
  avatarUrl,
  isAdmin,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (name?.[0] ?? email?.[0] ?? "?").toUpperCase();
  const close = () => setOpen(false);

  // Cierra al clic fuera o Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const avatar = (size: string, text: string) =>
    avatarUrl ? (
      <img
        src={avatarUrl}
        alt=""
        className={cn(size, "rounded-full object-cover")}
      />
    ) : (
      <span
        className={cn(
          size,
          "grid place-items-center rounded-full bg-secondary-container font-bold text-on-secondary-container",
          text,
        )}
      >
        {initial}
      </span>
    );

  const linkCls =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface-2";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de cuenta"
        className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-1 pr-2 transition-all duration-200 hover:border-outline hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {avatar("h-7 w-7", "text-xs")}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-in absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-surface shadow-pop"
        >
          <div className="flex items-center gap-3 border-b border-border p-4">
            {avatar("h-10 w-10", "text-sm")}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-fg">
                {name || "Tu cuenta"}
              </p>
              <p className="truncate text-xs text-muted">{email}</p>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 p-2">
            <Link href="/perfil" onClick={close} className={linkCls} role="menuitem">
              <User className="h-4 w-4 text-muted" /> Perfil
            </Link>
            <Link href="/configuracion" onClick={close} className={linkCls} role="menuitem">
              <Settings className="h-4 w-4 text-muted" /> Configuración
            </Link>
            {!isAdmin && (
              <Link href="/dashboard" onClick={close} className={linkCls} role="menuitem">
                <CreditCard className="h-4 w-4 text-muted" /> Mis suscripciones
              </Link>
            )}
          </div>

          <div className="border-t border-border p-2">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className={cn(linkCls, "w-full text-left text-muted hover:text-fg")}
                role="menuitem"
              >
                <LogOut className="h-4 w-4" /> Salir
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
