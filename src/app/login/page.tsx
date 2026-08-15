"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "@/lib/actions/auth";
import { Field } from "@/components/ui/field";
import { btn, card, inputCls, cn, errorBox } from "@/lib/ui";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signIn,
    undefined,
  );

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-16">
      <div className={card(false, "animate-in p-8")}>
        <h1 className="text-2xl font-bold tracking-tight text-fg">
          Bienvenido de vuelta
        </h1>
        <p className="mt-1 text-sm text-muted">
          Entra para gestionar tus suscripciones.
        </p>

        <form action={formAction} className="mt-8 flex flex-col gap-5">
          <input type="hidden" name="next" value={next} />
          <Field label="Email" htmlFor="email">
            <input id="email" name="email" type="email" required className={inputCls} />
          </Field>
          <Field label="Contraseña" htmlFor="password">
            <input
              id="password"
              name="password"
              type="password"
              required
              className={inputCls}
            />
          </Field>

          {state?.error && <p className={errorBox}>{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className={cn(btn("primary", "md"), "w-full")}
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="font-medium text-primary hover:text-primary-hover">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
