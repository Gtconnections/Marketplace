"use client";

import { useState } from "react";
import { Field } from "@/components/ui/field";
import { btn, inputCls, cn } from "@/lib/ui";

/**
 * Formulario de contacto. Sin backend de correo, compone un mensaje y abre la
 * app de correo del usuario (mailto). Simple, honesto y funcional.
 */
export function ContactForm({ to }: { to: string }) {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const email = String(f.get("email") ?? "").trim();
    const subject =
      String(f.get("subject") ?? "").trim() || "Consulta desde el sitio";
    const message = String(f.get("message") ?? "").trim();
    const body = `Nombre: ${name}\nEmail: ${email}\n\n${message}`;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="name">
          <input id="name" name="name" required className={inputCls} />
        </Field>
        <Field label="Correo" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputCls}
          />
        </Field>
      </div>
      <Field label="Asunto" htmlFor="subject">
        <input id="subject" name="subject" className={inputCls} />
      </Field>
      <Field label="Mensaje" htmlFor="message">
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className={inputCls}
        />
      </Field>

      <button type="submit" className={cn(btn("primary", "md"), "self-start")}>
        Enviar mensaje
      </button>

      <p className="text-xs text-muted">
        {sent
          ? "Se abrió tu aplicación de correo con el mensaje listo para enviar."
          : "Al enviar se abrirá tu aplicación de correo con el mensaje ya redactado."}
      </p>
    </form>
  );
}
