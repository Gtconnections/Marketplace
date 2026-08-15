"use client";

import { useActionState } from "react";
import { updateServiceSeo, type ActionState } from "@/lib/actions/vendor";
import { Field } from "@/components/ui/field";
import { btn, inputCls, cn, errorBox } from "@/lib/ui";

/** Formulario de metadatos SEO de un servicio (meta título / descripción). */
export function SeoForm({
  serviceId,
  metaTitle,
  metaDescription,
}: {
  serviceId: string;
  metaTitle: string | null;
  metaDescription: string | null;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateServiceSeo,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="service_id" value={serviceId} />
      <Field
        label="Meta título"
        htmlFor="meta_title"
        hint="Opcional. Si lo dejas vacío se usa el título del servicio. Máx. 120."
      >
        <input
          id="meta_title"
          name="meta_title"
          defaultValue={metaTitle ?? ""}
          maxLength={120}
          className={inputCls}
          placeholder="Título para buscadores"
        />
      </Field>
      <Field
        label="Meta descripción"
        htmlFor="meta_description"
        hint="Opcional. Resumen para buscadores y al compartir. Máx. 300."
      >
        <textarea
          id="meta_description"
          name="meta_description"
          defaultValue={metaDescription ?? ""}
          maxLength={300}
          rows={3}
          className={inputCls}
          placeholder="Descripción breve y atractiva…"
        />
      </Field>

      {state?.error && <p className={errorBox}>{state.error}</p>}
      {state?.ok && (
        <p className="text-sm font-medium text-success">Cambios guardados.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(btn("primary", "md"), "self-start")}
      >
        {pending ? "Guardando…" : "Guardar SEO"}
      </button>
    </form>
  );
}
