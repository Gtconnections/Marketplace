"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleHelpful } from "@/lib/actions/reviews";
import { ThumbsUp } from "@/components/icons";
import { cn } from "@/lib/ui";

/** Botón "me fue útil" con conteo. Optimista; si no hay sesión, es de solo lectura. */
export function ReviewHelpfulButton({
  reviewId,
  slug,
  count,
  voted,
  canVote,
}: {
  reviewId: string;
  slug: string;
  count: number;
  voted: boolean;
  canVote: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optVoted, setOptVoted] = useState(voted);
  const [optCount, setOptCount] = useState(count);

  const onClick = () => {
    if (!canVote || isPending) return;
    const next = !optVoted;
    setOptVoted(next);
    setOptCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      await toggleHelpful(reviewId, slug);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!canVote}
      aria-pressed={optVoted}
      title={canVote ? "Marcar como útil" : "Inicia sesión para votar"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors",
        optVoted
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted hover:border-primary/40 hover:text-fg",
        !canVote && "cursor-default opacity-70 hover:border-border hover:text-muted",
      )}
    >
      <ThumbsUp className={cn("h-3.5 w-3.5", optVoted && "fill-current")} />
      Útil{optCount > 0 ? ` · ${optCount}` : ""}
    </button>
  );
}
