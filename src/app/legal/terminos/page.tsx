import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Marketplace",
  description:
    "Las reglas que rigen el uso de nuestra tienda y la compra de productos y servicios digitales.",
};

export default function TerminosPage() {
  return (
    <LegalPage
      title="Términos y Condiciones"
      updated="15 de agosto de 2026"
      intro="Estos términos regulan tu acceso y uso de esta tienda, operada por GT Connections. Al crear una cuenta o realizar una compra, aceptas lo que sigue. Léelos con calma: están escritos para ser claros."
    >
      <h2>1. Qué ofrecemos</h2>
      <p>
        Operamos una tienda de productos y servicios digitales —mentorías,
        membresías, plantillas, software y descargables— seleccionados por
        nosotros. Actuamos como vendedor de los productos publicados salvo que se
        indique expresamente lo contrario en la ficha del producto.
      </p>

      <h2>2. Tu cuenta</h2>
      <p>
        Para comprar necesitas una cuenta con datos veraces. Eres responsable de
        mantener la confidencialidad de tus credenciales y de toda actividad que
        ocurra bajo tu cuenta. Avísanos de inmediato si detectas un uso no
        autorizado.
      </p>

      <h2>3. Compras, suscripciones y renovaciones</h2>
      <p>
        Ofrecemos dos modelos de cobro: <strong>pago único</strong> (acceso
        permanente al producto adquirido) y <strong>membresía</strong> (acceso
        recurrente mientras la suscripción esté activa). Las suscripciones se
        renuevan automáticamente al final de cada período —mensual o anual— al
        precio vigente, hasta que las canceles. Puedes cancelar cuando quieras
        desde tu panel; conservarás el acceso hasta el final del período ya
        pagado.
      </p>

      <h2>4. Precios y pagos</h2>
      <p>
        Los precios se muestran en la moneda indicada e incluyen o excluyen
        impuestos según tu jurisdicción, tal como se detalle en el proceso de
        pago. Los cobros se procesan a través de proveedores de pago externos;
        nosotros no almacenamos los datos completos de tu tarjeta. Nos reservamos
        el derecho de actualizar precios; los cambios no afectan a compras ya
        realizadas.
      </p>

      <h2>5. Entrega y acceso</h2>
      <p>
        Por tratarse de bienes digitales, la entrega es inmediata: al confirmarse
        el pago obtienes acceso al producto, sus descargas y, cuando aplique, a la
        comunidad o los materiales asociados. Es tu responsabilidad descargar y
        guardar los archivos que adquieras.
      </p>

      <h2>6. Licencia de uso y propiedad intelectual</h2>
      <p>
        Al comprar, recibes una licencia personal, no exclusiva e intransferible
        para usar el producto según su naturaleza. Salvo autorización expresa, no
        puedes revender, redistribuir, sublicenciar ni compartir públicamente los
        materiales. Todo el contenido de la tienda —marca, textos y diseño— es
        propiedad de GT Connections o de sus licenciantes.
      </p>

      <h2>7. Uso aceptable</h2>
      <p>
        Te comprometes a no usar la plataforma para fines ilícitos, a no intentar
        vulnerar su seguridad, a no automatizar accesos sin permiso y a no
        publicar reseñas falsas o difamatorias. Podemos suspender cuentas que
        incumplan estas reglas.
      </p>

      <h2>8. Reseñas y contenido de usuarios</h2>
      <p>
        Solo pueden reseñar quienes han adquirido el producto. Al publicar una
        reseña nos concedes permiso para mostrarla. Nos reservamos el derecho de
        retirar contenido que infrinja estos términos o la ley.
      </p>

      <h2>9. Cancelaciones y reembolsos</h2>
      <p>
        Las condiciones de reembolso se detallan en nuestra{" "}
        <a href="/legal/reembolsos">Política de Reembolsos</a>, que forma parte de
        estos términos.
      </p>

      <h2>10. Disponibilidad y cambios</h2>
      <p>
        Trabajamos para mantener el servicio disponible, pero no garantizamos una
        operación ininterrumpida. Podemos modificar, suspender o descontinuar
        funciones, y actualizar estos términos. Si el cambio es relevante, te lo
        comunicaremos; el uso continuado implica su aceptación.
      </p>

      <h2>11. Limitación de responsabilidad</h2>
      <p>
        En la medida que permita la ley, nuestra responsabilidad se limita al
        importe que pagaste por el producto en cuestión. No respondemos por daños
        indirectos ni por el resultado que obtengas al aplicar el contenido: las
        herramientas son un medio, no una garantía de resultados.
      </p>

      <h2>12. Ley aplicable</h2>
      <p>
        Estos términos se rigen por la legislación aplicable en la jurisdicción de
        operación de GT Connections. Cualquier controversia se resolverá ante los
        tribunales competentes de dicha jurisdicción.
      </p>

      <h2>13. Contacto</h2>
      <p>
        ¿Dudas sobre estas condiciones? Escríbenos a{" "}
        <a href="mailto:contacto@gtconnections.com">contacto@gtconnections.com</a>
        .
      </p>
    </LegalPage>
  );
}
