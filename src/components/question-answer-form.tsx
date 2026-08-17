"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { answerQuestion } from "@/lib/actions/questions";
import { CornerDownRight } from "@/components/icons";
import { btn, inputCls, cn } from "@/lib/ui";

/** Caja de respuesta del vendedor a una pregunta (crear o editar). */
export function QuestionAnswerForm({
  questionId,
  slug,
  initialAnswer = null,
}: {
  questionId: string;
  slug: string;
  initialAnswer?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initialAnswer ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await answerQuestion(questionId, value, slug);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs font-medium text-primary transition-colors hover:text-primary-hover"
      >
        <CornerDownRight className="h-3.5 w-3.5" />
        {initialAnswer ? "Editar respuesta" : "Responder"}
      </button>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <textarea
        rows={2}
        maxLength={1000}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Responde a esta pregunta…"
        className={cn(inputCls, "text-sm")}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className={btn("primary", "sm")}
        >
          {isPending ? "Guardando…" : "Publicar respuesta"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={btn("ghost", "sm")}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
