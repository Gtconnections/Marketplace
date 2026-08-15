"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createServiceWithPlan, type ActionState } from "@/lib/actions/vendor";
import { SERVICE_CATEGORIES } from "@/lib/config";
import { Field } from "@/components/ui/field";
import { PlanFields } from "@/components/plan-fields";
import { btn, card, inputCls } from "@/lib/ui";

export default function NewServicePage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createServiceWithPlan,
    undefined,
  );

  return (
    <div className="animate-in mx-auto w-full max-w-2xl px-5 py-12 sm:px-6">
      <Link
        href="/vendor"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <span aria-hidden>←</span> Volver al panel
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg">
        Nuevo servicio
      </h1>
      <p className="mt-1 text-muted">
        Define tu oferta y cómo quieres cobrarla. Podrás añadir más planes y un
        archivo descargable después.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-6">
        {/* Detalles */}
        <div className={card(false, "flex flex-col gap-5 p-6")}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Detalles
          </h2>
          <Field label="Título del servicio" htmlFor="title">
            <input
              id="title"
              name="title"
              className={inputCls}
              placeholder="Ej: Mentoría 1:1 de desarrollo web"
              required
            />
          </Field>
          <Field label="Categoría" htmlFor="category">
            <select id="category" name="category" className={inputCls} defaultValue="mentoria">
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Descripción" htmlFor="description">
            <textarea
              id="description"
              name="description"
              className={inputCls}
              rows={5}
              placeholder="Qué incluye, para quién es, cómo funciona…"
            />
          </Field>
        </div>

        {/* Cobro (componente compartido) */}
        <PlanFields />

        {state?.error && (
          <p className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger ring-1 ring-inset ring-danger/20">
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className={btn("primary", "md")}>
            {pending ? "Creando…" : "Crear servicio"}
          </button>
          <Link href="/vendor" className={btn("ghost", "md")}>
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
