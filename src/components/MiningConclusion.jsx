import React, { useRef } from "react";

// Nota: usamos imports dinámicos para evitar problemas de bundling en algunos entornos
// (Netlify/Vite) y reducir el peso inicial del bundle.
export default function MiningConclusion() {
  const ref = useRef(null);

  const exportPDF = async () => {
    const node = ref.current;
    if (!node) return;

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

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
          {/* Ícono simple para no depender de librerías */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="-mt-px">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
          para un centro de control minero por su plataforma unificada, funcionalidades nativas (GIS, estimador de estado),
          compatibilidad entre versiones, acceso web/remote nativo, agnosticismo de hardware/AV y soporte local en Chile.
        </p>

        <ul className="list-disc pl-5 space-y-2">
          <li>Unificación de SCADA, DMS, GIS, Historian y más (menos integración y costos).</li>
          <li>Funcionalidades clave nativas que en otras soluciones requieren módulos adicionales.</li>
          <li>Compatibilidad entre versiones, con menores costos de migración.</li>
          <li>Acceso remoto/web nativo para operación distribuida.</li>
          <li>Agnóstico de hardware y antivirus.</li>
          <li>Soporte local con integradores certificados.</li>
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
