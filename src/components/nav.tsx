import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileMenu } from "@/components/mobile-menu";
import { ScrollHeader } from "@/components/scroll-header";
import { NavLinks } from "@/components/nav-links";
import { container, cn } from "@/lib/ui";

export async function Nav() {
  let user = null;
  try {
    const supabase = await createClient();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    user = u;
  } catch {
    // Supabase no configurado/alcanzable: mostramos la nav como invitado.
  }

  const admin = isAdminEmail(user?.email);

  return (
    <ScrollHeader>
      <nav className={cn(container, "flex h-16 items-center justify-between")}>
        <Brand />

        {/* Escritorio */}
        <div className="hidden items-center gap-2 md:flex">
          <NavLinks authed={Boolean(user)} isAdmin={admin} />
          <span className="mx-1 h-6 w-px bg-border" aria-hidden />
          <ThemeToggle className="h-9 w-9" />
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
