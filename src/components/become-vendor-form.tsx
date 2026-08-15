"use client";

import { useActionState } from "react";
import { becomeVendor, type ActionState } from "@/lib/actions/vendor";
import { Field } from "@/components/ui/field";
import { btn, card, inputCls, cn, errorBox } from "@/lib/ui";

export function BecomeVendorForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    becomeVendor,
    undefined,
  );

  return (
    <div className={card(false, "max-w-lg p-8")}>
      <h2 className="text-xl font-bold tracking-tight text-fg">
        Abre tu tienda
      </h2>
      <p className="mt-1 text-sm text-muted">
        Crea tu perfil de vendedor para empezar a ofrecer servicios.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-5">
        <Field label="Nombre de la tienda" htmlFor="display_name">
          <input id="display_name" name="display_name" className={inputCls} required />
        </Field>
        <Field label="Descripción" htmlFor="bio" hint="Opcional. Cuenta quién eres.">
          <textarea id="bio" name="bio" className={inputCls} rows={3} />
        </Field>

        {state?.error && <p className={errorBox}>{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className={cn(btn("primary", "md"), "self-start")}
        >
          {pending ? "Creando…" : "Crear tienda"}
        </button>
      </form>
    </div>
  );
}
