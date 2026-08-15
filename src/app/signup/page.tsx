"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthState } from "@/lib/actions/auth";
import { Field } from "@/components/ui/field";
import { btn, card, inputCls, cn } from "@/lib/ui";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    undefined,
  );

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-16">
      <div className={card(false, "animate-in p-8")}>
        <h1 className="text-2xl font-bold tracking-tight text-fg">
          Crea tu cuenta
        </h1>
        <p className="mt-1 text-sm text-muted">
          Contrata o vende servicios por suscripción.
        </p>

        <form action={formAction} className="mt-8 flex flex-col gap-5">
          <Field label="Nombre" htmlFor="full_name">
            <input id="full_name" name="full_name" type="text" className={inputCls} />
          </Field>
          <Field label="Email" htmlFor="email">
            <input id="email" name="email" type="email" required className={inputCls} />
          </Field>
          <Field label="Contraseña" htmlFor="password" hint="Mínimo 6 caracteres.">
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className={inputCls}
            />
          </Field>

          {state?.error && (
            <p className="rounded-lg bg-primary/10 px-3.5 py-2.5 text-sm text-fg ring-1 ring-inset ring-primary/20">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className={cn(btn("primary", "md"), "w-full")}
          >
            {pending ? "Creando…" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
