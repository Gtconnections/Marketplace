"use client";

import { useActionState, useState } from "react";
import { createCoupon, type CouponFormState } from "@/lib/actions/coupons";
import { btn, inputCls, errorBox, cn } from "@/lib/ui";

/** Formulario para crear un cupón (porcentaje o monto fijo). */
export function CouponForm() {
  const [state, formAction, pending] = useActionState<CouponFormState, FormData>(
    createCoupon,
    undefined,
  );
  const [type, setType] = useState<"percent" | "fixed">("percent");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-fg">
          Código
        </label>
        <input
          id="code"
          name="code"
          required
          placeholder="VERANO20"
          className={cn(inputCls, "font-mono uppercase")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="type" className="mb-1.5 block text-sm font-medium text-fg">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "fixed")}
            className={inputCls}
          >
            <option value="percent">Porcentaje (%)</option>
            <option value="fixed">Monto fijo</option>
          </select>
        </div>
        <div>
          <label htmlFor="value" className="mb-1.5 block text-sm font-medium text-fg">
            {type === "percent" ? "Descuento (%)" : "Descuento ($)"}
          </label>
          <input
            id="value"
            name="value"
            type="number"
            min={type === "percent" ? 1 : 0.01}
            max={type === "percent" ? 100 : undefined}
            step={type === "percent" ? 1 : 0.01}
            required
            placeholder={type === "percent" ? "20" : "10.00"}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="max_redemptions"
            className="mb-1.5 block text-sm font-medium text-fg"
          >
            Límite de usos{" "}
            <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            id="max_redemptions"
            name="max_redemptions"
            type="number"
            min={1}
            step={1}
            placeholder="Ilimitado"
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="expires_at"
            className="mb-1.5 block text-sm font-medium text-fg"
          >
            Expira <span className="font-normal text-muted">(opcional)</span>
          </label>
          <input
            id="expires_at"
            name="expires_at"
            type="date"
            className={inputCls}
          />
        </div>
      </div>

      {state?.error && <p className={errorBox}>{state.error}</p>}
      {state?.ok && (
        <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          ¡Cupón creado!
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={btn("primary", "md", "self-start")}
      >
        {pending ? "Creando…" : "Crear cupón"}
      </button>
    </form>
  );
}
