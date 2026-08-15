"use client";

import { useActionState, useState } from "react";
import { addPlan, type ActionState } from "@/lib/actions/vendor";
import { PlanFields } from "@/components/plan-fields";
import { btn, errorBox } from "@/lib/ui";

/** Añadir un plan/tier adicional. Opcional: por defecto está plegado. */
export function AddPlanForm({ serviceId }: { serviceId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addPlan,
    undefined,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={btn("secondary", "sm")}
      >
        + Añadir plan
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="service_id" value={serviceId} />
      <PlanFields title="Nuevo plan" />

      {state?.error && <p className={errorBox}>{state.error}</p>}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className={btn("primary", "sm")}>
          {pending ? "Añadiendo…" : "Guardar plan"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={btn("ghost", "sm")}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
