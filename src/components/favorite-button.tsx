import { toggleFavorite } from "@/lib/actions/favorites";
import { Heart } from "@/components/icons";
import { cn } from "@/lib/ui";

/**
 * Botón de favorito (guardar/quitar). Envía una Server Action.
 * - variant "overlay": píldora glass circular para superponer sobre la imagen de una tarjeta.
 * - variant "float": píldora con texto "Guardar" para superponer sobre la imagen del detalle.
 * - variant "plain": botón con borde para usar en el detalle (sin imagen).
 */
export function FavoriteButton({
  serviceId,
  active,
  next,
  variant = "overlay",
}: {
  serviceId: string;
  active: boolean;
  next: string;
  variant?: "overlay" | "plain" | "float";
}) {
  return (
    <form action={toggleFavorite} className="relative z-10">
      <input type="hidden" name="service_id" value={serviceId} />
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        aria-label={active ? "Quitar de favoritos" : "Guardar en favoritos"}
        aria-pressed={active}
        className={cn(
          "inline-flex items-center justify-center transition-colors",
          variant === "overlay"
            ? "h-9 w-9 rounded-full bg-white/85 shadow-sm ring-1 ring-black/5 backdrop-blur-md hover:bg-white"
            : variant === "float"
              ? "h-10 gap-2 rounded-full bg-white/90 px-4 text-sm font-semibold shadow-sm ring-1 ring-black/10 backdrop-blur-md hover:bg-white"
              : "h-11 gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-fg shadow-soft hover:bg-surface-2",
          // Sobre píldora blanca (overlay/float) usamos un gris oscuro fijo para
          // que el corazón se vea también en modo oscuro.
          active
            ? "text-danger"
            : variant === "overlay" || variant === "float"
              ? "text-slate-700/80"
              : "text-fg",
        )}
      >
        <Heart className="h-5 w-5" filled={active} />
        {variant !== "overlay" && (
          <span>{active ? "Guardado" : "Guardar"}</span>
        )}
      </button>
    </form>
  );
}
