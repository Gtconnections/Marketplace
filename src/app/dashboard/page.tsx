import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, priceSuffix } from "@/lib/utils";
import { Download } from "@/components/icons";
import { container, card, badge, btn, cn } from "@/lib/ui";
import type { Plan, Service, Vendor } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "Activa",
  trialing: "Prueba",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  incomplete: "Incompleta",
  unpaid: "Impaga",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*, service:services(*, vendor:vendors(*)), plan:plans(*)")
    .eq("customer_id", user!.id)
    .order("created_at", { ascending: false });

  const list = subs ?? [];

  return (
    <div className={cn(container, "animate-in py-12")}>
      <h1 className="text-3xl font-bold tracking-tight text-fg">
        Mis suscripciones
      </h1>
      <p className="mt-1 text-muted">Los servicios que has contratado.</p>

      {list.length === 0 ? (
        <div className={card(false, "mt-8 flex flex-col items-center gap-3 p-12 text-center")}>
          <p className="text-muted">Aún no tienes suscripciones.</p>
          <Link href="/" className={btn("primary", "md")}>
            Explorar servicios
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {list.map((sub) => {
            const service = sub.service as Service & { vendor: Vendor };
            const plan = sub.plan as Plan;
            const active = sub.status === "active" || sub.status === "trialing";
            return (
              <div
                key={sub.id}
                className={card(false, "flex flex-wrap items-center justify-between gap-4 p-6")}
              >
                <div>
                  <h3 className="font-semibold tracking-tight text-fg">
                    {service?.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted">
                    {service?.vendor?.display_name} · {plan?.name}
                  </p>
                  {sub.current_period_end && (
                    <p className="mt-1 text-xs text-muted">
                      Renueva el{" "}
                      {new Date(sub.current_period_end).toLocaleDateString("es")}
                    </p>
                  )}
                  {active && service?.download_path && (
                    <a
                      href={`/api/download/${service.id}`}
                      className={btn("secondary", "sm", "mt-3")}
                    >
                      <Download className="h-4 w-4" /> Descargar archivo
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <span className={badge(active ? "success" : "neutral")}>
                    {STATUS_LABEL[sub.status] ?? sub.status}
                  </span>
                  {plan && (
                    <p className="mt-2 font-semibold text-fg">
                      {formatMoney(plan.amount, plan.currency)}
                      <span className="text-sm font-normal text-muted">
                        {priceSuffix(plan.type, plan.interval)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
