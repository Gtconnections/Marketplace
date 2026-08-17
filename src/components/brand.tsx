import Link from "next/link";
import { getStoreSettings } from "@/lib/store-settings";

/** Marca de la tienda: mark azul eléctrico + wordmark (configurable). */
export async function Brand() {
  const { store_name } = await getStoreSettings();
  const initial = (store_name.trim()[0] ?? "M").toUpperCase();
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5">
      <span
        className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-display text-base font-bold text-on-primary transition-colors duration-200 group-hover:bg-primary-hover"
        aria-hidden
      >
        {initial}
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-fg">
        {store_name}
      </span>
    </Link>
  );
}
