"use client";

import { useActionState } from "react";
import { submitQuestion, type QuestionState } from "@/lib/actions/questions";
import { btn, inputCls, errorBox, cn } from "@/lib/ui";

/** Formulario para publicar una pregunta sobre un servicio. */
export function QuestionForm({
  serviceId,
  slug,
}: {
  serviceId: string;
  slug: string;
}) {
  const [state, formAction, pending] = useActionState<QuestionState, FormData>(
    submitQuestion,
    undefined,
  );

  if (state?.ok) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
        ¡Pregunta enviada! El vendedor te responderá pronto.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="service_id" value={serviceId} />
      <input type="hidden" name="slug" value={slug} />
      <textarea
        name="body"
        rows={3}
        maxLength={500}
        required
        placeholder="¿Tienes una duda sobre este servicio? Pregunta aquí…"
        className={cn(inputCls, "text-sm")}
      />
      {state?.error && <p className={errorBox}>{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className={btn("primary", "md", "self-start")}
      >
        {pending ? "Enviando…" : "Publicar pregunta"}
      </button>
    </form>
  );
}
