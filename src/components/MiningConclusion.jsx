import React from "react";

/**
 * MiningConclusion.jsx
 * Componente 100% autónomo (sin dependencias externas) para mostrar
 * la "Conclusión para Cliente en la Industria Minera".
 *
 * Ubicación: src/components/MiningConclusion.jsx
 * Uso: import MiningConclusion from "../components/MiningConclusion";
 *      ...
 *      <MiningConclusion />
 *
 * Si quieres agregar exportación a PDF, puedes instalar:
 *   npm i jspdf html2canvas
 * y luego cambiar el botón por una función que use esas librerías.
 */

export default function MiningConclusion() {
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Conclusión para Cliente en la Industria Minera
        </h2>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 md:p-8 leading-relaxed prose prose-slate max-w-none">
        <p>
          <strong>zenon Energy Edition</strong> como <em>Network Control System</em> es la opción más adecuada
          para un centro de control minero debido a:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Plataforma unificada que integra SCADA, DMS, GIS, Historian y más, reduciendo la complejidad y los costos
            de integración.
          </li>
          <li>
            Funcionalidades clave nativas, como GIS y estimador de estado, que en otras soluciones requieren módulos
            adicionales o integraciones externas.
          </li>
          <li>
            Compatibilidad garantizada entre versiones, asegurando la continuidad operativa y reduciendo los costos de
            migración.
          </li>
          <li>
            Acceso remoto y web nativo, facilitando la supervisión y el control desde diferentes ubicaciones.
          </li>
          <li>
            Agnosticismo de hardware y antivirus, ofreciendo flexibilidad en la elección de infraestructura y
            soluciones de seguridad.
          </li>
          <li>
            Soporte local en Chile a través de integradores certificados, asegurando una implementación y
            mantenimiento eficientes.
          </li>
        </ul>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
          <div className="font-medium mb-1">Nota de versiones ABB ZEE600 / SEE00</div>
          <p>
            ZEE600 (SEE00) de ABB suele operar una versión por detrás de zenon; por ejemplo, si zenon está en v15,
            ABB suele estar en v14. Recomendación: validar el roadmap de versiones con el proveedor.
          </p>
        </div>
      </div>
    </section>
  );
}
