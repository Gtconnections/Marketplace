"use client";

/* eslint-disable @next/next/no-img-element */
import { useActionState, useRef, useState } from "react";
import { submitReview, type ReviewState } from "@/lib/actions/reviews";
import { Star, Camera, X } from "@/components/icons";
import { btn, inputCls, errorBox, cn } from "@/lib/ui";

export function ReviewForm({
  serviceId,
  slug,
  initialRating = 0,
  initialComment = "",
  initialPhotoUrl = null,
  editing = false,
}: {
  serviceId: string;
  slug: string;
  initialRating?: number;
  initialComment?: string;
  initialPhotoUrl?: string | null;
  editing?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(
    submitReview,
    undefined,
  );
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  // Foto: preview del archivo nuevo, o la existente; permite quitarla.
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialPhotoUrl);
  const [removed, setRemoved] = useState(false);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPreview(URL.createObjectURL(f));
      setRemoved(false);
    }
  };
  const clearPhoto = () => {
    if (fileRef.current) fileRef.current.value = "";
    setPreview(null);
    setRemoved(true);
  };

  if (state?.ok) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
        ¡Gracias! Tu reseña se ha publicado.
      </div>
    );
  }

  const shown = hover || rating;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="service_id" value={serviceId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />
      <input type="hidden" name="remove_photo" value={removed ? "1" : ""} />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-fg">
          Tu valoración
        </span>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
              aria-pressed={rating === n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="grid h-9 w-9 place-items-center rounded-md transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  n <= shown ? "text-warning" : "text-muted/30",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="mb-1.5 block text-sm font-medium text-fg">
          Comentario <span className="font-normal text-muted">(opcional)</span>
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          maxLength={1000}
          defaultValue={initialComment}
          placeholder="¿Qué tal fue tu experiencia?"
          className={inputCls}
        />
      </div>

      {/* Foto opcional */}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-fg">
          Foto <span className="font-normal text-muted">(opcional)</span>
        </span>
        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Vista previa"
              className="h-24 w-24 rounded-xl border border-border object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              aria-label="Quitar foto"
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-border bg-surface text-muted shadow-sm transition-colors hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted transition-colors hover:border-primary/50 hover:text-fg"
          >
            <Camera className="h-4 w-4" /> Añadir foto
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          name="photo"
          accept="image/*"
          onChange={onPick}
          className="hidden"
        />
      </div>

      {state?.error && <p className={errorBox}>{state.error}</p>}

      <button
        type="submit"
        disabled={pending || rating < 1}
        className={btn("primary", "md", "self-start")}
      >
        {pending ? "Publicando…" : editing ? "Actualizar reseña" : "Publicar reseña"}
      </button>
    </form>
  );
}
