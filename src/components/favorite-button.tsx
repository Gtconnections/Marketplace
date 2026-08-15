import { toggleFavorite } from "@/lib/actions/favorites";
import { Heart } from "@/components/icons";
import { cn } from "@/lib/ui";

/**
 * Botón de favorito (guardar/quitar). Envía una Server Action.
 * - variant "overlay": píldora glass para superponer sobre la imagen de una tarjeta.
 * - variant "plain": botón con borde para usar en el detalle.
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
  variant?: "overlay" | "plain";
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
            : "h-11 gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-fg shadow-soft hover:bg-surface-2",
          active ? "text-danger" : variant === "overlay" ? "text-fg/70" : "text-fg",
        )}
      >
        <Heart className="h-5 w-5" filled={active} />
        {variant === "plain" && (
          <span>{active ? "Guardado" : "Guardar"}</span>
        )}
      </button>
    </form>
  );
}
