import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Política de Privacidad — Marketplace",
  description:
    "Cómo recopilamos, usamos y protegemos tus datos cuando usas nuestra tienda.",
};

export default function PrivacidadPage() {
  return (
    <LegalPage
      title="Política de Privacidad"
      updated="15 de agosto de 2026"
      intro="Tu confianza es parte del producto. Aquí te contamos, sin rodeos, qué datos tratamos, para qué y qué control tienes sobre ellos. El responsable del tratamiento es GT Connections."
    >
      <h2>1. Qué datos recopilamos</h2>
      <p>
        Recopilamos solo lo necesario para que la tienda funcione:
      </p>
      <ul>
        <li>
          <strong>Datos de cuenta:</strong> tu correo y, si lo proporcionas, tu
          nombre.
        </li>
        <li>
          <strong>Datos de compra:</strong> qué productos adquieres y el estado de
          tus suscripciones. Los datos de pago (tarjeta) los procesa directamente
          nuestro proveedor de pagos; nosotros no los almacenamos.
        </li>
        <li>
          <strong>Datos de uso:</strong> información técnica básica (páginas
          visitadas, dispositivo) para mantener y mejorar el servicio.
        </li>
      </ul>

      <h2>2. Para qué los usamos</h2>
      <p>
        Usamos tus datos para crear y gestionar tu cuenta, procesar compras y dar
        acceso a lo que adquieres, brindarte soporte, enviarte comunicaciones
        relacionadas con tu cuenta (confirmaciones, avisos de renovación) y velar
        por la seguridad de la plataforma.
      </p>

      <h2>3. Base legal</h2>
      <p>
        Tratamos tus datos para ejecutar el contrato que aceptas al comprar, para
        cumplir obligaciones legales (por ejemplo, facturación), y sobre la base de
        nuestro interés legítimo en operar y mejorar el servicio. Cuando la ley lo
        exige, pedimos tu consentimiento.
      </p>

      <h2>4. Con quién los compartimos</h2>
      <p>
        No vendemos tus datos. Los compartimos únicamente con proveedores que nos
        permiten operar —infraestructura y base de datos, procesamiento de pagos y,
        en su caso, envío de correos— que actúan como encargados del tratamiento
        bajo contrato. También podemos divulgarlos si la ley nos lo exige.
      </p>

      <h2>5. Cookies</h2>
      <p>
        Utilizamos cookies estrictamente necesarias para mantener tu sesión y el
        funcionamiento básico del sitio. Si en el futuro incorporamos analítica o
        marketing, te lo informaremos y solicitaremos tu consentimiento cuando
        corresponda.
      </p>

      <h2>6. Cuánto tiempo los conservamos</h2>
      <p>
        Conservamos tus datos mientras tengas una cuenta activa y durante el tiempo
        necesario para cumplir obligaciones legales y contables. Después, los
        eliminamos o anonimizamos.
      </p>

      <h2>7. Tus derechos</h2>
      <p>
        Puedes acceder, rectificar, eliminar y portar tus datos, así como
        oponerte o limitar ciertos tratamientos. Para ejercerlos, escríbenos a{" "}
        <a href="mailto:contacto@gtconnections.com">contacto@gtconnections.com</a>{" "}
        y te ayudaremos.
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables para proteger tu
        información. Ningún sistema es infalible, pero trabajamos para minimizar
        riesgos y actuar con rapidez ante cualquier incidente.
      </p>

      <h2>9. Menores</h2>
      <p>
        La tienda está dirigida a personas mayores de edad. No recopilamos datos de
        menores de forma consciente; si detectamos un caso así, eliminaremos la
        información.
      </p>

      <h2>10. Cambios</h2>
      <p>
        Podemos actualizar esta política. Publicaremos siempre la versión vigente
        con su fecha; si el cambio es relevante, te lo comunicaremos.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Para cualquier cuestión sobre privacidad, escríbenos a{" "}
        <a href="mailto:contacto@gtconnections.com">contacto@gtconnections.com</a>
        .
      </p>
    </LegalPage>
  );
}
