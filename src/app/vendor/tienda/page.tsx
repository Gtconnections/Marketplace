import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/config";
import { getStoreSettings } from "@/lib/store-settings";
import { StoreSettingsForm } from "@/components/store-settings-form";
import { ArrowLeft, Settings } from "@/components/icons";
import { container, card, cn } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function StoreSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/vendor/tienda");
  if (!isAdminEmail(user.email)) redirect("/vendor");

  const settings = await getStoreSettings();

  return (
    <div className={cn(container, "animate-in max-w-3xl py-12")}>
      <Link
        href="/vendor"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Panel
      </Link>

      <div className="mt-4 flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Settings className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">
            Configuración de la tienda
          </h1>
          <p className="text-sm text-muted">
            Personaliza la marca, el color y el contacto de tu tienda.
          </p>
        </div>
      </div>

      <div className={card(false, "mt-8 p-6 sm:p-8")}>
        <StoreSettingsForm initial={settings} />
      </div>
    </div>
  );
}
