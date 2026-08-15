import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvatarUploader } from "@/components/avatar-uploader";
import { ProfileForm } from "@/components/profile-form";
import { container, card, cn } from "@/lib/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Perfil — Marketplace" };

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/perfil");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const fullName = (profile?.full_name as string) ?? "";
  const avatarUrl = (profile?.avatar_url as string) ?? null;
  const initial = (fullName?.[0] ?? user.email?.[0] ?? "?").toUpperCase();

  return (
    <div className={cn(container, "animate-in max-w-2xl py-12")}>
      <p className="eyebrow">Tu cuenta</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
        Perfil
      </h1>
      <p className="mt-1 text-muted">
        Personaliza cómo te ven en el sitio.
      </p>

      <section className={card(false, "mt-8 p-6")}>
        <h2 className="font-semibold text-fg">Foto de perfil</h2>
        <p className="mt-0.5 mb-5 text-sm text-muted">
          Una buena foto le da confianza a tu cuenta.
        </p>
        <AvatarUploader avatarUrl={avatarUrl} initial={initial} />
      </section>

      <section className={card(false, "mt-6 p-6")}>
        <h2 className="mb-5 font-semibold text-fg">Datos</h2>
        <ProfileForm fullName={fullName} />
        <p className="mt-4 text-xs text-muted">
          Correo de la cuenta:{" "}
          <span className="font-mono text-fg">{user.email}</span> (se gestiona en
          Configuración).
        </p>
      </section>
    </div>
  );
}
