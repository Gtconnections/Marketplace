"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useActionState, useEffect, useState } from "react";
import { updatePlan, deletePlan, type ActionState } from "@/lib/actions/vendor";
import { PlanFields } from "@/components/plan-fields";
import { formatMoney, priceSuffix } from "@/lib/utils";
import { btn, badge, errorBox } from "@/lib/ui";
import type { Plan } from "@/lib/types";

/** Fila de un plan: vista de solo lectura + edición inline. */
export function PlanRow({
  plan,
  serviceId,
  canDelete,
  isDemo,
}: {
  plan: Plan;
  serviceId: string;
  canDelete: boolean;
  isDemo: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updatePlan,
    undefined,
  );

  // Cierra el editor cuando la acción termina con éxito.
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (editing) {
    return (
      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-xl border border-primary/30 p-4"
      >
        <input type="hidden" name="plan_id" value={plan.id} />
        <input type="hidden" name="service_id" value={serviceId} />
        <PlanFields
          title="Editar plan"
          initial={{
            pricingType: plan.type === "one_time" ? "one_time" : "subscription",
            planName: plan.name,
            interval: plan.interval ?? "month",
            price: (plan.amount / 100).toString(),
            trialDays: plan.trial_days ? String(plan.trial_days) : "",
          }}
        />
        {!isDemo && (
          <p className="text-xs text-muted">
            Al cambiar el precio o la frecuencia se crea un precio nuevo en Stripe
            y se archiva el anterior (los precios de Stripe no se pueden modificar).
          </p>
        )}
        {state?.error && <p className={errorBox}>{state.error}</p>}
        <div className="flex items-center gap-2">
          <button type="submit" disabled={pending} className={btn("primary", "sm")}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className={btn("ghost", "sm")}
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-fg">{plan.name}</span>
          <span className={badge(plan.type === "one_time" ? "neutral" : "brand")}>
            {plan.type === "one_time" ? "Pago único" : "Membresía"}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {formatMoney(plan.amount, plan.currency)}
          {priceSuffix(plan.type, plan.interval)}
          {plan.trial_days ? ` · ${plan.trial_days} días de prueba` : ""}
          {!isDemo && !plan.stripe_price_id && (
            <span className="text-warning"> · sin precio en Stripe</span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={btn("secondary", "sm")}
        >
          Editar
        </button>
        {canDelete && (
          <form action={deletePlan}>
            <input type="hidden" name="plan_id" value={plan.id} />
            <input type="hidden" name="service_id" value={serviceId} />
            <button type="submit" className={btn("ghost", "sm")}>
              Eliminar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
