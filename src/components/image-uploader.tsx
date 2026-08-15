"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteImage, setCover } from "@/lib/actions/images";
import type { ServiceImage } from "@/lib/types";
import { btn, cn } from "@/lib/ui";

/** Gestiona la galería de imágenes de un servicio (subir / portada / borrar). */
export function ImageUploader({
  serviceId,
  images,
}: {
  serviceId: string;
  images: ServiceImage[];
}) {
  const router = useRouter();
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("service_id", serviceId);
    Array.from(files).forEach((f) => fd.append("files", f));
    try {
      const res = await fetch("/api/vendor/upload-image", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudieron subir las imágenes.");
        return;
      }
      setFiles(null);
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((im, i) => (
            <div
              key={im.id}
              className="group relative overflow-hidden rounded-xl border border-border"
            >
              <img
                src={im.url}
                alt=""
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-on-primary">
                  Portada
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/45 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <form action={setCover}>
                    <input type="hidden" name="image_id" value={im.id} />
                    <input type="hidden" name="service_id" value={serviceId} />
                    <button
                      type="submit"
                      className="rounded-md px-2 py-1 text-xs font-medium text-white hover:bg-white/20"
                    >
                      Portada
                    </button>
                  </form>
                )}
                <form action={deleteImage} className="ml-auto">
                  <input type="hidden" name="image_id" value={im.id} />
                  <input type="hidden" name="service_id" value={serviceId} />
                  <button
                    type="submit"
                    className="rounded-md px-2 py-1 text-xs font-medium text-white hover:bg-white/20"
                  >
                    Borrar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">
          Sin imágenes todavía. La primera que subas será la portada.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          className={cn(
            "w-full cursor-pointer rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-fg shadow-soft",
            "file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-sm file:font-medium file:text-fg",
          )}
        />
        <button
          type="button"
          onClick={upload}
          disabled={!files || files.length === 0 || busy}
          className={btn("primary", "sm")}
        >
          {busy ? "Subiendo…" : "Subir"}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
