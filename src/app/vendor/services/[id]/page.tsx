import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toggleServiceStatus, duplicateService } from "@/lib/actions/vendor";
import { SERVICE_CATEGORIES, isDemoPayments } from "@/lib/config";
import { AddPlanForm } from "@/components/add-plan-form";
import { PlanRow } from "@/components/plan-row";
import { SeoForm } from "@/components/seo-form";
import { DownloadUploader } from "@/components/download-uploader";
import { ImageUploader } from "@/components/image-uploader";
import { container, card, badge, btn, cn } from "@/lib/ui";
import type { Plan, ServiceImage } from "@/lib/types";

export const dynamic = "force-dynamic";

function categoryLabel(value: string) {
  return SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export default async function ManageServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: service } = await supabase
    .from("services")
    .select("*, plans(*), vendor:vendors(profile_id)")
    .eq("id", id)
    .single();

  // Solo el dueño puede gestionar.
  const vendor = service?.vendor as { profile_id: string } | undefined;
  if (!service || !vendor || vendor.profile_id !== user!.id) notFound();

  const plans = ((service.plans as Plan[]) ?? []).sort((a, b) => a.amount - b.amount);
  const isPublished = service.status === "published";
  const canPublish = isDemoPayments || plans.some((p) => p.stripe_price_id);

  const { data: imgRows } = await supabase
    .from("service_images")
    .select("*")
    .eq("service_id", id)
    .order("position", { ascending: true });
  const images = (imgRows ?? []) as ServiceImage[];

  return (
    <div className={cn(container, "animate-in max-w-3xl py-12")}>
      <Link
        href="/vendor"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <span aria-hidden>←</span> Volver al panel
      </Link>

      {/* Cabecera */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-fg">
              {service.title}
            </h1>
            <span className={badge(isPublished ? "success" : "neutral")}>
              {isPublished ? "Publicado" : "Borrador"}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            {categoryLabel(service.category)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPublished && (
            <Link href={`/services/${service.slug}`} className={btn("secondary", "sm")}>
              Ver público
            </Link>
          )}
          <form action={duplicateService}>
            <input type="hidden" name="service_id" value={service.id} />
            <button type="submit" className={btn("secondary", "sm")}>
              Duplicar
            </button>
          </form>
          <form action={toggleServiceStatus}>
            <input type="hidden" name="service_id" value={service.id} />
            <input
              type="hidden"
              name="next_status"
              value={isPublished ? "draft" : "published"}
            />
            <button
              type="submit"
              className={btn(isPublished ? "ghost" : "primary", "sm")}
              disabled={!isPublished && !canPublish}
            >
              {isPublished ? "Despublicar" : "Publicar"}
            </button>
          </form>
        </div>
      </div>

      {!canPublish && (
        <div className={cn(badge("warning"), "mt-4")}>
          Necesitas al menos un plan con precio en Stripe para publicar.
        </div>
      )}

      {/* Planes / tiers */}
      <section className={card(false, "mt-8 p-6")}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-fg">Planes</h2>
            <p className="mt-0.5 text-sm text-muted">
              Puedes ofrecer varios tiers. Es opcional: con uno basta.
            </p>
          </div>
          <span className="text-sm text-muted">
            {plans.length} {plans.length === 1 ? "plan" : "planes"}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {plans.map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              serviceId={service.id}
              canDelete={plans.length > 1}
              isDemo={isDemoPayments}
            />
          ))}
        </div>

        <div className="mt-5">
          <AddPlanForm serviceId={service.id} />
        </div>
      </section>

      {/* Imágenes / galería */}
      <section className={card(false, "mt-6 p-6")}>
        <h2 className="font-semibold text-fg">Imágenes</h2>
        <p className="mt-0.5 mb-4 text-sm text-muted">
          Sube fotos del producto. La primera es la portada (aparece en el
          catálogo); pasa el ratón sobre una imagen para cambiar portada o
          borrarla.
        </p>
        <ImageUploader serviceId={service.id} images={images} />
      </section>

      {/* Archivo descargable */}
      <section className={card(false, "mt-6 p-6")}>
        <h2 className="font-semibold text-fg">Archivo descargable</h2>
        <p className="mt-0.5 mb-4 text-sm text-muted">
          Opcional. Para productos digitales: el archivo se entrega solo a quien
          compra o se suscribe, con enlace temporal seguro.
        </p>
        <DownloadUploader
          serviceId={service.id}
          currentName={service.download_name}
        />
      </section>

      {/* SEO */}
      <section className={card(false, "mt-6 p-6")}>
        <h2 className="font-semibold text-fg">SEO</h2>
        <p className="mt-0.5 mb-4 text-sm text-muted">
          Controla el título y la descripción que ven los buscadores y las redes
          al compartir el enlace. Si los dejas vacíos, se usan los del servicio.
        </p>
        <SeoForm
          serviceId={service.id}
          metaTitle={service.meta_title ?? null}
          metaDescription={service.meta_description ?? null}
        />
      </section>
    </div>
  );
}
