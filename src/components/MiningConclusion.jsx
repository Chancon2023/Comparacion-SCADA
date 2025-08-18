// src/components/MiningConclusion.jsx
import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
          title="Exportar PDF"
        >
          <span aria-hidden>⬇️</span> Exportar PDF
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
          <li>Plataforma unificada (SCADA, DMS, GIS, Historian, etc.).</li>
          <li>Funciones nativas clave (GIS, estimador de estado) sin módulos extra.</li>
          <li>Compatibilidad entre versiones: menor costo y riesgo de migración.</li>
          <li>Acceso remoto/web nativo para operación distribuida.</li>
          <li>Agnóstico en hardware y antivirus: flexibilidad de infraestructura.</li>
          <li>Soporte local en Chile vía integradores certificados.</li>
        </ul>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
          <div className="font-medium mb-1">Nota de versiones ABB ZEE600 / SEE00</div>
          <p>
            ZEE600 (SEE00) de ABB suele operar una versión por detrás de zenon; p.ej. si zenon está en v15,
            ABB suele estar en v14. Sugerencia: validar roadmap de versiones con el proveedor.
          </p>
        </div>
      </div>
    </section>
  );
}
