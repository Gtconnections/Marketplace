"use client";

import { useState, useTransition } from "react";
import { validateCoupon } from "@/lib/actions/coupons";
import { SubscribeButton } from "@/components/subscribe-button";
import { DemoCheckoutButton } from "@/components/demo-checkout-button";
import { Tag, Check, X } from "@/components/icons";
import { formatMoney, priceSuffix, computeDiscount } from "@/lib/utils";
import { btn, inputCls, priceCls, cn } from "@/lib/ui";
import type { CouponType } from "@/lib/types";

type PlanLite = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  type: string | null;
  interval: string | null;
  trial_days: number | null;
  stripe_price_id: string | null;
};

type Applied = { code: string; type: CouponType; value: number };

export function PricingPanel({
  serviceId,
  plans,
  isDemo,
  canPay,
  isOwner,
  ownedPlanIds = [],
}: {
  serviceId: string;
  plans: PlanLite[];
  isDemo: boolean;
  canPay: boolean;
  isOwner: boolean;
  ownedPlanIds?: string[];
}) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<Applied | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const apply = () => {
    if (!code.trim()) return;
    setMsg(null);
    startTransition(async () => {
      const res = await validateCoupon(code, serviceId);
      if (res.ok) {
        setApplied({ code: res.code, type: res.type, value: res.value });
        setMsg({ ok: true, text: res.message });
      } else {
        setApplied(null);
        setMsg({ ok: false, text: res.message });
      }
    });
  };

  const clear = () => {
    setApplied(null);
    setCode("");
    setMsg(null);
  };

  return (
    <div className="mt-4 flex flex-col gap-3">
      {/* Campo de cupón (solo demo) */}
      {isDemo && !isOwner && (
        <div className="rounded-2xl border border-border p-3">
          {applied ? (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                <Check className="h-4 w-4" />
                <span className="font-mono">{applied.code}</span> aplicado
              </span>
              <button
                type="button"
                onClick={clear}
                aria-label="Quitar cupón"
                className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
                <Tag className="h-4 w-4" />
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Código promocional"
                className={cn(inputCls, "h-9 flex-1 py-1 font-mono text-sm uppercase")}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), apply())}
              />
              <button
                type="button"
                onClick={apply}
                disabled={isPending || !code.trim()}
                className={btn("secondary", "sm")}
              >
                {isPending ? "…" : "Aplicar"}
              </button>
            </div>
          )}
          {msg && (
            <p
              className={cn(
                "mt-2 text-xs",
                msg.ok ? "text-success" : "text-danger",
              )}
            >
              {msg.text}
            </p>
          )}
        </div>
      )}

      {plans.map((plan, i) => {
        const discount = applied
          ? computeDiscount(applied.type, applied.value, plan.amount)
          : 0;
        const finalAmount = plan.amount - discount;
        return (
          <div
            key={plan.id}
            className={cn(
              "rounded-2xl border p-4 transition-all duration-200",
              i === 0
                ? "border-primary/30 bg-primary/5 ring-1 ring-inset ring-primary/10"
                : "border-border",
            )}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-fg">{plan.name}</span>
              <span className="text-right">
                {discount > 0 && (
                  <span className="mr-1.5 text-sm text-muted line-through">
                    {formatMoney(plan.amount, plan.currency)}
                  </span>
                )}
                <span
                  className={cn(
                    priceCls,
                    "text-xl font-bold tracking-tight",
                    discount > 0 ? "text-success" : "text-fg",
                  )}
                >
                  {formatMoney(finalAmount, plan.currency)}
                </span>
                <span className="text-sm font-normal text-muted">
                  {priceSuffix(plan.type, plan.interval)}
                </span>
              </span>
            </div>
            {discount > 0 && (
              <p className="mt-1 text-xs font-medium text-success">
                Ahorras {formatMoney(discount, plan.currency)} con{" "}
                <span className="font-mono">{applied?.code}</span>
              </p>
            )}
            {plan.trial_days ? (
              <p className="mt-1 text-xs font-medium text-success">
                {plan.trial_days} días de prueba gratis
              </p>
            ) : null}
            {!isOwner && (
              <div className="mt-4">
                {(() => {
                  const ownedOneTime =
                    plan.type === "one_time" && ownedPlanIds.includes(plan.id);
                  const label =
                    plan.type === "one_time"
                      ? "Comprar"
                      : ownedPlanIds.includes(plan.id)
                        ? "Extender Plan"
                        : "Suscribirme";
                  return ownedOneTime ? (
                    <span
                      className={cn(
                        btn("secondary", "md"),
                        "pointer-events-none w-full cursor-default justify-center opacity-80",
                      )}
                    >
                      <Check className="h-4 w-4" /> Ya lo tienes
                    </span>
                  ) : isDemo ? (
                    <DemoCheckoutButton
                      planId={plan.id}
                      label={label}
                      couponCode={applied?.code}
                    />
                  ) : (
                    <SubscribeButton
                      planId={plan.id}
                      label={label}
                      disabled={!canPay || !plan.stripe_price_id}
                    />
                  );
                })()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
