"use client";

import { useActionState, useState } from "react";
import { updateStoreSettings, type StoreFormState } from "@/lib/actions/store";
import type { StoreSettings } from "@/lib/store-settings";
import { btn, inputCls, errorBox, cn } from "@/lib/ui";

const field = "mb-1.5 block text-sm font-medium text-fg";

export function StoreSettingsForm({ initial }: { initial: StoreSettings }) {
  const [state, formAction, pending] = useActionState<StoreFormState, FormData>(
    updateStoreSettings,
    undefined,
  );
  const [accent, setAccent] = useState(initial.accent || "#0052ff");

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {/* Marca */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
          Marca
        </h2>
        <div>
          <label htmlFor="store_name" className={field}>Nombre de la tienda</label>
          <input
            id="store_name"
            name="store_name"
            defaultValue={initial.store_name}
            maxLength={60}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="tagline" className={field}>Tagline</label>
          <textarea
            id="tagline"
            name="tagline"
            rows={2}
            maxLength={300}
            defaultValue={initial.tagline}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="accent" className={field}>Color de acento</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              aria-label="Selector de color"
              className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent"
            />
            <input
              name="accent"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              placeholder="#0052ff"
              className={cn(inputCls, "font-mono")}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Se aplica a botones y acentos de toda la tienda.
          </p>
        </div>
      </section>

      {/* Portada */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
          Portada del catálogo
        </h2>
        <div>
          <label htmlFor="hero_image_url" className={field}>
            Imagen del hero (URL)
          </label>
          <input
            id="hero_image_url"
            name="hero_image_url"
            type="url"
            defaultValue={initial.hero_image_url}
            placeholder="https://…"
            className={inputCls}
          />
        </div>
      </section>

      {/* Contacto y redes */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-muted">
          Contacto y redes
        </h2>
        <div>
          <label htmlFor="contact_email" className={field}>Email de contacto</label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={initial.contact_email}
            placeholder="hola@tutienda.com"
            className={inputCls}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="social_x" className={field}>X</label>
            <input id="social_x" name="social_x" defaultValue={initial.social_x} placeholder="https://x.com/…" className={inputCls} />
          </div>
          <div>
            <label htmlFor="social_instagram" className={field}>Instagram</label>
            <input id="social_instagram" name="social_instagram" defaultValue={initial.social_instagram} placeholder="https://instagram.com/…" className={inputCls} />
          </div>
          <div>
            <label htmlFor="social_linkedin" className={field}>LinkedIn</label>
            <input id="social_linkedin" name="social_linkedin" defaultValue={initial.social_linkedin} placeholder="https://linkedin.com/…" className={inputCls} />
          </div>
        </div>
      </section>

      {state?.error && <p className={errorBox}>{state.error}</p>}
      {state?.ok && (
        <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Ajustes guardados. Los cambios ya se ven en toda la tienda.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={btn("primary", "md", "self-start")}
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
