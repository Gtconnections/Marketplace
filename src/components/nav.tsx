import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileMenu } from "@/components/mobile-menu";
import { ScrollHeader } from "@/components/scroll-header";
import { NavLinks } from "@/components/nav-links";
import { UserMenu } from "@/components/user-menu";
import { NotificationsMenu } from "@/components/notifications-menu";
import { getNotifications } from "@/lib/actions/notifications";
import { LogIn, UserPlus } from "@/components/icons";
import { btn, container, cn } from "@/lib/ui";
import type { Notification } from "@/lib/types";

type ProfileLite = { full_name: string | null; avatar_url: string | null };

export async function Nav() {
  let user = null;
  let profile: ProfileLite | null = null;
  let notifs: { items: Notification[]; unread: number } = { items: [], unread: 0 };
  try {
    const supabase = await createClient();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
    if (u) {
      const [{ data }, n] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", u.id)
          .single(),
        getNotifications(supabase, u.id),
      ]);
      profile = (data as unknown as ProfileLite) ?? null;
      notifs = n;
    }
  } catch {
    // Supabase no configurado/alcanzable: mostramos la nav como invitado.
  }

  const admin = isAdminEmail(user?.email);
  const linkCls =
    "text-sm font-medium text-muted transition-colors duration-200 hover:text-fg";

  return (
    <ScrollHeader>
      <nav className={cn(container, "flex h-16 items-center justify-between")}>
        <Brand />

        {/* Escritorio */}
        <div className="hidden items-center gap-2 md:flex">
          <NavLinks authed={Boolean(user)} isAdmin={admin} />
          <span className="mx-1.5 h-5 w-px bg-border/50" aria-hidden />
          <ThemeToggle className="h-9 w-9" />
          {user ? (
            <>
              <NotificationsMenu items={notifs.items} unread={notifs.unread} />
              <UserMenu
                name={profile?.full_name ?? ""}
                email={user.email ?? ""}
                avatarUrl={profile?.avatar_url ?? null}
                isAdmin={admin}
              />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={cn(linkCls, "inline-flex items-center gap-1.5 px-2")}
              >
                <LogIn className="h-4 w-4" /> Entrar
              </Link>
              <Link
                href="/signup"
                className={cn(btn("primary", "sm"), "group gap-2")}
              >
                <UserPlus className="h-4 w-4" /> Crear cuenta
              </Link>
            </div>
          )}
        </div>

        {/* Móvil */}
        <div className="flex items-center gap-1 md:hidden">
          {user && (
            <NotificationsMenu items={notifs.items} unread={notifs.unread} />
          )}
          <ThemeToggle />
          <MobileMenu authed={Boolean(user)} isAdmin={admin} />
        </div>
      </nav>
    </ScrollHeader>
  );
}
