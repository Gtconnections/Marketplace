"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "@/components/icons";
import { btn, cn } from "@/lib/ui";

/** Muestra el avatar del usuario y permite cambiar la foto (sube a /api/profile/avatar). */
export function AvatarUploader({
  avatarUrl,
  initial,
}: {
  avatarUrl: string | null;
  initial: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo subir la imagen.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Tu foto de perfil"
            className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <span className="grid h-20 w-20 place-items-center rounded-full bg-secondary-container text-2xl font-bold text-on-secondary-container">
            {initial}
          </span>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Cambiar foto"
          disabled={busy}
          className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-on-primary shadow-float transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={cn(btn("secondary", "sm"))}
        >
          {busy ? "Subiendo…" : "Cambiar foto"}
        </button>
        <p className="mt-2 text-xs text-muted">JPG o PNG, hasta 4 MB.</p>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
