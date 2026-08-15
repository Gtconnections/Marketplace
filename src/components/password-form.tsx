"use client";

import { useActionState } from "react";
import { updatePassword, type ProfileState } from "@/lib/actions/profile";
import { Field } from "@/components/ui/field";
import { btn, inputCls, cn, errorBox } from "@/lib/ui";

/** Cambio de contraseña (usuario con sesión activa). */
export function PasswordForm() {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    updatePassword,
    undefined,
  );
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nueva contraseña" htmlFor="password">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className={inputCls}
          />
        </Field>
        <Field label="Confirmar contraseña" htmlFor="confirm">
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className={inputCls}
          />
        </Field>
      </div>
      {state?.error && <p className={errorBox}>{state.error}</p>}
      {state?.ok && (
        <p className="text-sm font-medium text-success">
          Contraseña actualizada.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={cn(btn("primary", "md"), "self-start")}
      >
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
