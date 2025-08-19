import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * MiningConclusion.jsx
 * Sección fija con "Conclusión para Cliente en la Industria Minera"
 * + botón "Exportar PDF" (cliente-side con jsPDF + html2canvas).
 *
 * Dependencias (agregar a tu proyecto):
 *   npm i jspdf html2canvas
 */
export default function MiningConclusion() {
  const ref = useRef(null);

  const exportPDF = async () => {
    const node = ref.current;
    if (!node) return;
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Paginado vertical si el bloque supera el alto de una hoja
    let y = 0;
    let remaining = imgHeight;
    while (remaining > 0) {
      pdf.addImage(imgData, "PNG", 0, 0 - y, imgWidth, imgHeight);
      remaining -= pageHeight;
      if (remaining > 0) pdf.addPage();
      y += pageHeight;
    }

    pdf.save("conclusion-mineria.pdf");
  };

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Conclusión para Cliente en la Industria Minera
        </h2>
        <button
          onClick={exportPDF}
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-gray-900 text-white shadow hover:bg-gray-800 focus:outline-none"
          title="Exportar la sección como PDF"
        >
          {/* Ícono simple inline (evita dependencias externas) */}
          <svg xmlns="http://.w3.org/2000/svg" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" strokeWidth="2"
               className="w-4 h-4">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
            <path d="M12 18v-6"/>
            <path d="M9 15l3 3 3-3"/>
          </svg>
          Exportar PDF
        </button>
      </div>

      <div
        ref={ref}
        className="bg-white rounded-2xl shadow p-6 md:p-8 leading-relaxed prose prose-slate max-w-none"
      >
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
