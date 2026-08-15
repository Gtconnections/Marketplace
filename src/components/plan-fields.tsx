"use client";

import { useState } from "react";
import { BILLING_INTERVALS, PRICING_TYPES, type PricingType } from "@/lib/config";
import { Field } from "@/components/ui/field";
import { card, inputCls, cn } from "@/lib/ui";

function defaultName(type: PricingType) {
  return type === "one_time" ? "Acceso completo" : "Plan mensual";
}

/**
 * Campos de cobro reutilizables (modelo membresía/precio fijo + intervalo,
 * precio y prueba). Se usa al crear un servicio y al añadir tiers.
 */
export function PlanFields({ title = "Cómo se cobra" }: { title?: string }) {
  const [pricingType, setPricingType] = useState<PricingType>("subscription");
  const [planName, setPlanName] = useState(defaultName("subscription"));
  const [interval, setInterval] = useState("month");
  const isSubscription = pricingType === "subscription";

  function choose(type: PricingType) {
    setPricingType(type);
    setPlanName(defaultName(type));
  }

  const priceHint = isSubscription
    ? `Se cobra cada ${interval === "year" ? "año" : "mes"}.`
    : "Se cobra una sola vez.";

  return (
    <div className={card(false, "flex flex-col gap-5 p-6")}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {title}
      </h2>

      <input type="hidden" name="pricing_type" value={pricingType} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PRICING_TYPES.map((pt) => {
          const selected = pricingType === pt.value;
          return (
            <button
              key={pt.value}
              type="button"
              onClick={() => choose(pt.value)}
              aria-pressed={selected}
              className={cn(
                "min-h-11 cursor-pointer rounded-xl border p-4 text-left transition-all duration-200",
                selected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-surface hover:border-primary/40",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid h-4 w-4 place-items-center rounded-full border-2 transition-colors",
                    selected ? "border-primary" : "border-border",
                  )}
                  aria-hidden
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <span className="font-semibold text-fg">{pt.label}</span>
              </div>
              <p className="mt-1 pl-6 text-xs text-muted">{pt.description}</p>
            </button>
          );
        })}
      </div>

      <div className={cn("grid gap-4", isSubscription && "sm:grid-cols-2")}>
        <Field label="Nombre del plan" htmlFor="plan_name">
          <input
            id="plan_name"
            name="plan_name"
            className={inputCls}
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            required
          />
        </Field>
        {isSubscription && (
          <Field label="Frecuencia de cobro" htmlFor="interval">
            <select
              id="interval"
              name="interval"
              className={inputCls}
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
            >
              {BILLING_INTERVALS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <Field label="Precio (USD)" htmlFor="price" hint={priceHint}>
        <input
          id="price"
          name="price"
          type="number"
          min="1"
          step="0.01"
          className={inputCls}
          placeholder={isSubscription ? "29.00" : "199.00"}
          required
        />
      </Field>

      {isSubscription && (
        <Field
          label="Días de prueba gratis"
          htmlFor="trial_days"
          hint="Opcional. Déjalo vacío o en 0 para no ofrecer prueba."
        >
          <input
            id="trial_days"
            name="trial_days"
            type="number"
            min="0"
            step="1"
            className={inputCls}
            placeholder="0"
          />
        </Field>
      )}
    </div>
  );
}
