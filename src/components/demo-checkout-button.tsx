"use client";

import { useFormStatus } from "react-dom";
import { demoCheckout } from "@/lib/actions/demo";
import { btn } from "@/lib/ui";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={btn("primary", "md", "w-full")}
    >
      {pending ? "Procesando…" : label}
    </button>
  );
}

/** Botón de pago FICTICIO (modo demo). Simula la compra/suscripción. */
export function DemoCheckoutButton({
  planId,
  label,
  couponCode,
}: {
  planId: string;
  label: string;
  couponCode?: string;
}) {
  return (
    <form action={demoCheckout}>
      <input type="hidden" name="plan_id" value={planId} />
      <input type="hidden" name="coupon_code" value={couponCode ?? ""} />
      <Submit label={label} />
      <p className="mt-2 text-center text-xs text-muted">
        Pago de ejemplo · no se cobra nada
      </p>
    </form>
  );
}
