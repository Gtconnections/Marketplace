"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeDownload } from "@/lib/actions/vendor";
import { Paperclip } from "@/components/icons";
import { btn, inputCls, cn } from "@/lib/ui";

/**
 * Sube / reemplaza / quita el archivo descargable de un servicio (opcional).
 * La subida va al route handler /api/vendor/upload (permite archivos grandes
 * sin el límite de las server actions).
 */
export function DownloadUploader({
  serviceId,
  currentName,
}: {
  serviceId: string;
  currentName: string | null;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("service_id", serviceId);
    try {
      const res = await fetch("/api/vendor/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo subir el archivo.");
        return;
      }
      setFile(null);
      router.refresh();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {currentName ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 p-3">
          <span className="flex min-w-0 items-center gap-2 text-sm text-fg">
            <Paperclip className="h-4 w-4 shrink-0 text-muted" />
            <span className="truncate font-medium">{currentName}</span>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <a href={`/api/download/${serviceId}`} className={btn("secondary", "sm")}>
              Descargar
            </a>
            <form action={removeDownload}>
              <input type="hidden" name="service_id" value={serviceId} />
              <button type="submit" className={btn("ghost", "sm")}>
                Quitar
              </button>
            </form>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">
          Sin archivo. Sube uno (PDF, ZIP, plantilla…) y se entregará
          automáticamente a quien compre o se suscriba.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className={cn(
            inputCls,
            "cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-surface-2 file:px-3 file:py-1 file:text-sm file:font-medium file:text-fg",
          )}
        />
        <button
          type="button"
          onClick={upload}
          disabled={!file || busy}
          className={btn("primary", "sm")}
        >
          {busy ? "Subiendo…" : currentName ? "Reemplazar" : "Subir"}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
