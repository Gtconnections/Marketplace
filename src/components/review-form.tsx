"use client";

import { useActionState, useState } from "react";
import { submitReview, type ReviewState } from "@/lib/actions/reviews";
import { Star } from "@/components/icons";
import { btn, inputCls, errorBox, cn } from "@/lib/ui";

export function ReviewForm({
  serviceId,
  slug,
  initialRating = 0,
  initialComment = "",
  editing = false,
}: {
  serviceId: string;
  slug: string;
  initialRating?: number;
  initialComment?: string;
  editing?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(
    submitReview,
    undefined,
  );
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

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

      <div>
        <span className="mb-1.5 block text-sm font-medium text-fg">
          Tu valoración
        </span>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHover(0)}
        >
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
