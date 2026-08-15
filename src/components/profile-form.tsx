"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/lib/actions/profile";
import { Field } from "@/components/ui/field";
import { btn, inputCls, cn, errorBox } from "@/lib/ui";

/** Formulario del nombre visible del perfil. */
export function ProfileForm({ fullName }: { fullName: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    undefined,
  );
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        label="Nombre visible"
        htmlFor="full_name"
        hint="Cómo aparecerás en el sitio (por ejemplo, en tus reseñas)."
      >
        <input
          id="full_name"
          name="full_name"
          defaultValue={fullName}
          maxLength={80}
          className={inputCls}
          placeholder="Tu nombre"
        />
      </Field>
      {state?.error && <p className={errorBox}>{state.error}</p>}
      {state?.ok && (
        <p className="text-sm font-medium text-success">Perfil actualizado.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={cn(btn("primary", "md"), "self-start")}
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
