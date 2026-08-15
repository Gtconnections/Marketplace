import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileMenu } from "@/components/mobile-menu";
import { ScrollHeader } from "@/components/scroll-header";
import { NavLinks } from "@/components/nav-links";
import { UserMenu } from "@/components/user-menu";
import { LogIn, UserPlus } from "@/components/icons";
import { btn, container, cn } from "@/lib/ui";

type ProfileLite = { full_name: string | null; avatar_url: string | null };

export async function Nav() {
  let user = null;
  let profile: ProfileLite | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
    if (u) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", u.id)
        .single();
      profile = (data as unknown as ProfileLite) ?? null;
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
          <span className="mx-1 h-6 w-px bg-border" aria-hidden />
          <ThemeToggle className="h-9 w-9" />
          {user ? (
            <UserMenu
              name={profile?.full_name ?? ""}
              email={user.email ?? ""}
              avatarUrl={profile?.avatar_url ?? null}
              isAdmin={admin}
            />
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
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <MobileMenu authed={Boolean(user)} isAdmin={admin} />
        </div>
      </nav>
    </ScrollHeader>
  );
}
