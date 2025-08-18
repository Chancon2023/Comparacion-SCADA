import React, { useRef } from "react";

export default function MiningConclusion() {
  const printRef = useRef(null);

  const printSection = () => {
    const el = printRef.current;
    if (!el) return;
    // Abre una ventana con solo la sección y ejecuta print()
    const w = window.open("", "PRINT", "width=850,height=1100");
    if (!w) return;

    w.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Conclusión minería</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, "Apple Color Emoji","Segoe UI Emoji"; margin: 24px; }
    h2 { margin-top: 0; }
    .card { background:#fff; border-radius:16px; padding:24px; border:1px solid #e5e7eb; }
    .note { background:#fffbeb; border:1px solid #fde68a; color:#92400e; border-radius:12px; padding:12px 14px; margin-top:16px; }
    ul { padding-left: 20px; }
    @page { size: A4; margin: 14mm; }
  </style>
</head>
<body>${el.innerHTML}</body>
</html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Conclusión para Cliente en la Industria Minera
        </h2>
        <button
          onClick={printSection}
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-gray-900 text-white shadow hover:bg-gray-800 focus:outline-none"
        >
          {/* simple inline icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Imprimir / PDF
        </button>
      </div>

      <div ref={printRef} className="bg-white rounded-2xl shadow p-6 md:p-8 leading-relaxed max-w-none">
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

        <div className="mt-6 p-4 note">
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
