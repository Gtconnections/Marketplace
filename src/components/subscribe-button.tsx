"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { btn } from "@/lib/ui";

export function SubscribeButton({
  planId,
  label,
  disabled,
}: {
  planId: string;
  label: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar el pago.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className={btn("primary", "md", "w-full")}
      >
        {loading ? "Redirigiendo…" : label}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
