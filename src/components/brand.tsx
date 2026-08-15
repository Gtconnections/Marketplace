import Link from "next/link";

/** Marca del marketplace: mark azul eléctrico + wordmark en Geist. */
export function Brand() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5">
      <span
        className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-display text-base font-bold text-on-primary transition-colors duration-200 group-hover:bg-primary-hover"
        aria-hidden
      >
        M
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-fg">
        Marketplace
      </span>
    </Link>
  );
}
