import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Política de Reembolsos — Marketplace",
  description:
    "Cómo funcionan las cancelaciones y los reembolsos de productos y servicios digitales.",
};

export default function ReembolsosPage() {
  return (
    <LegalPage
      title="Política de Reembolsos"
      updated="15 de agosto de 2026"
      intro="Queremos que compres con tranquilidad. Aquí explicamos, con transparencia, cómo tratamos las cancelaciones y los reembolsos de nuestros productos digitales."
    >
      <h2>1. Principio general</h2>
      <p>
        Nuestros productos son digitales y, en muchos casos, de acceso o descarga
        inmediata. Por su naturaleza, el reembolso no siempre es posible una vez
        entregado el contenido. Aun así, valoramos cada caso: si algo no fue como
        esperabas, cuéntanoslo.
      </p>

      <h2>2. Suscripciones (membresías)</h2>
      <p>
        Puedes cancelar tu suscripción cuando quieras desde tu panel. La
        cancelación detiene las renovaciones futuras; conservarás el acceso hasta
        el final del período que ya pagaste. No realizamos reembolsos por períodos
        parciales ya iniciados, salvo que la ley aplicable disponga lo contrario.
      </p>

      <h2>3. Pagos únicos y descargables</h2>
      <p>
        Para productos de pago único que aún <strong>no hayas descargado ni
        accedido</strong>, puedes solicitar reembolso dentro de los{" "}
        <strong>14 días</strong> posteriores a la compra. Si ya descargaste o
        consumiste el material, el derecho de desistimiento puede no aplicar, tal
        como permite la normativa para contenidos digitales.
      </p>

      <h2>4. Cuándo sí devolvemos siempre</h2>
      <p>
        Emitimos reembolso completo si el producto tiene un defecto que impide
        usarlo, si te cobramos por error o por duplicado, o si el contenido difiere
        de forma sustancial de lo descrito. Estos casos no dependen de plazos.
      </p>

      <h2>5. Cómo solicitarlo</h2>
      <p>
        Escríbenos a{" "}
        <a href="mailto:contacto@gtconnections.com">contacto@gtconnections.com</a>{" "}
        con el correo de tu cuenta y el nombre del producto. Revisamos cada
        solicitud y respondemos, normalmente, en menos de 48 horas hábiles. Los
        reembolsos aprobados se procesan al mismo método de pago original.
      </p>

      <h2>6. Excepciones</h2>
      <p>
        No aplican reembolsos por cambio de opinión sobre contenido ya consumido,
        por falta de resultados derivada del uso que le des al producto, ni sobre
        elementos personalizados una vez entregados.
      </p>

      <h2>7. Contacto</h2>
      <p>
        Ante cualquier duda sobre esta política, estamos a un correo de distancia:{" "}
        <a href="mailto:contacto@gtconnections.com">contacto@gtconnections.com</a>
        .
      </p>
    </LegalPage>
  );
}
