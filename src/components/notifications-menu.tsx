"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  CreditCard,
  Star,
  Rocket,
  Sparkles,
} from "@/components/icons";
import { markAllRead, markRead } from "@/lib/actions/notifications";
import type { Notification, NotificationType } from "@/lib/types";
import { cn } from "@/lib/ui";

const ICONS: Record<NotificationType, (p: { className?: string }) => React.ReactNode> = {
  purchase: CreditCard,
  sale: Rocket,
  review: Star,
  renewal: CreditCard,
  system: Sparkles,
};

const TINT: Record<NotificationType, string> = {
  purchase: "bg-primary/10 text-primary",
  sale: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  review: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  renewal: "bg-primary/10 text-primary",
  system: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

/** "hace 5 min", "hace 2 h", "ayer", "12 ago". */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  if (d < 7) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

export function NotificationsMenu({
  items,
  unread,
}: {
  items: Notification[];
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

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

  const onItem = (n: Notification) => {
    setOpen(false);
    if (!n.read_at) startTransition(() => markRead(n.id));
    if (n.href) router.push(n.href);
  };

  const onMarkAll = () => {
    startTransition(() => markAllRead());
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"
        }
        className="relative grid h-9 w-9 place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-fg/[0.05] hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] font-semibold leading-none text-on-primary ring-2 ring-bg">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="animate-in absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-pop"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-fg">Notificaciones</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <CheckCheck className="h-4 w-4" /> Marcar leídas
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-muted">
                <Bell className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-medium text-fg">Sin novedades</p>
              <p className="mt-1 text-xs text-muted">
                Aquí verás tus compras, reseñas y avisos.
              </p>
            </div>
          ) : (
            <ul className="max-h-[24rem] overflow-y-auto p-1.5">
              {items.map((n) => {
                const Icon = ICONS[n.type] ?? Sparkles;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => onItem(n)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-surface-2",
                        !n.read_at && "bg-primary/[0.04]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full",
                          TINT[n.type] ?? TINT.system,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-fg">
                            {n.title}
                          </span>
                          {!n.read_at && (
                            <span
                              aria-hidden
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                            />
                          )}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-1 block font-mono text-[11px] text-muted/80">
                          {timeAgo(n.created_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
