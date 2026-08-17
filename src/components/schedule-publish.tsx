"use client";

import { useState } from "react";
import { scheduleService, cancelSchedule } from "@/lib/actions/vendor";
import { CalendarClock, X } from "@/components/icons";
import { btn, inputCls, cn } from "@/lib/ui";

/**
 * Control para programar (o reprogramar / cancelar) la publicación de un
 * servicio en una fecha futura. Usa server actions.
 */
/** Fecha → valor para <input type="datetime-local"> (hora local). */
function toLocalInput(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function SchedulePublish({
  serviceId,
  publishAt = null,
}: {
  serviceId: string;
  publishAt?: string | null;
}) {
  // Las fechas se calculan al abrir (en un handler), no durante el render.
  const [times, setTimes] = useState<{ def: string; min: string } | null>(null);

  const openPanel = () => {
    const now = new Date();
    const def = publishAt
      ? toLocalInput(new Date(publishAt))
      : toLocalInput(new Date(now.getTime() + 86400000));
    setTimes({ def, min: toLocalInput(now) });
  };

  if (!times) {
    return (
      <button
        type="button"
        onClick={openPanel}
        className={cn(btn("ghost", "sm"), "gap-1.5")}
      >
        <CalendarClock className="h-4 w-4" />
        {publishAt ? "Reprogramar" : "Programar"}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={scheduleService} className="flex items-center gap-2">
        <input type="hidden" name="service_id" value={serviceId} />
        <input
          type="datetime-local"
          name="publish_at"
          defaultValue={times.def}
          min={times.min}
          required
          className={cn(inputCls, "h-9 w-auto py-1 text-sm")}
        />
        <button type="submit" className={btn("primary", "sm")}>
          Guardar
        </button>
      </form>
      {publishAt && (
        <form action={cancelSchedule}>
          <input type="hidden" name="service_id" value={serviceId} />
          <button
            type="submit"
            className={cn(btn("ghost", "sm"), "gap-1.5 text-danger")}
          >
            Cancelar
          </button>
        </form>
      )}
      <button
        type="button"
        onClick={() => setTimes(null)}
        aria-label="Cerrar"
        className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
