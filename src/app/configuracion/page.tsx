import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PasswordForm } from "@/components/password-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { container, card, btn, cn } from "@/lib/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Configuración — Marketplace" };

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/configuracion");

  return (
    <div className={cn(container, "animate-in max-w-2xl py-12")}>
      <p className="eyebrow">Tu cuenta</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
        Configuración
      </h1>
      <p className="mt-1 text-muted">Gestiona tu acceso y tus preferencias.</p>

      {/* Cuenta */}
      <section className={card(false, "mt-8 p-6")}>
        <h2 className="font-semibold text-fg">Cuenta</h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-muted">
              Correo
            </p>
            <p className="mt-1 font-medium text-fg">{user.email}</p>
          </div>
          <Link href="/perfil" className={btn("secondary", "sm")}>
            Editar perfil
          </Link>
        </div>
      </section>

      {/* Seguridad */}
      <section className={card(false, "mt-6 p-6")}>
        <h2 className="mb-1 font-semibold text-fg">Seguridad</h2>
        <p className="mb-5 text-sm text-muted">
          Cambia tu contraseña cuando quieras.
        </p>
        <PasswordForm />
      </section>

      {/* Apariencia */}
      <section className={card(false, "mt-6 p-6")}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-fg">Apariencia</h2>
            <p className="mt-0.5 text-sm text-muted">
              Alterna entre tema claro y oscuro.
            </p>
          </div>
          <ThemeToggle className="h-11 w-11" />
        </div>
      </section>

      {/* Sesión */}
      <section className={card(false, "mt-6 flex items-center justify-between gap-4 p-6")}>
        <div>
          <h2 className="font-semibold text-fg">Sesión</h2>
          <p className="mt-0.5 text-sm text-muted">
            Cierra tu sesión en este dispositivo.
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className={btn("secondary", "md")}>
            Salir
          </button>
        </form>
      </section>
    </div>
  );
}
