import React, { useRef, useCallback } from "react";

/**
 * Conclusión para cliente en minería + Exportar (sin dependencias externas).
 * El botón "Exportar" abre una ventana con el bloque y dispara window.print().
 */
export default function MiningConclusion() {
  const ref = useRef(null);

  const handleExport = useCallback(() => {
    const node = ref.current;
    if (!node) return;

    // Clonamos el HTML del bloque
    const content = node.innerHTML;

    // Abre una ventana con estilos mínimos y dispara print()
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;

    win.document.open();
    win.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Conclusión minería</title>
          <style>
            /* Estilos mínimos para impresión */
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, "Helvetica Neue", Arial; margin: 24px; color: #0f172a; }
            h1, h2, h3 { margin: 0 0 12px; }
            .wrap { max-width: 900px; }
            .title { font-size: 22px; font-weight: 700; margin-bottom: 12px; }
            .note { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 12px; padding: 12px 14px; margin-top: 12px; }
            ul { padding-left: 18px; }
            li { margin: 6px 0; }
            .muted { color: #334155; }
            hr { border: 0; border-top: 1px solid #e2e8f0; margin: 12px 0; }
          </style>
        </head>
        <body>
          <div class="wrap">
            ${content}
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 300);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  }, []);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Conclusión para Cliente en la Industria Minera
        </h2>

        {/* Botón sin lucide-react (SVG inline) */}
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-gray-900 text-white shadow hover:bg-gray-800 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          Exportar
        </button>
      </div>

      {/* Contenido exportable */}
      <div
        ref={ref}
        className="bg-white rounded-2xl shadow p-6 md:p-8 leading-relaxed prose prose-slate max-w-none"
      >
        <p>
          <strong>zenon Energy Edition</strong> como <em>Network Control System</em> es la opción más adecuada
          para un centro de control minero debido a:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Plataforma unificada (SCADA, DMS, GIS, Historian, etc.) que reduce complejidad e integración.</li>
          <li>Funcionalidades clave nativas (GIS, estimador de estado) sin dependencias externas costosas.</li>
          <li>Compatibilidad garantizada entre versiones, bajando riesgos y costos de migración.</li>
          <li>Acceso remoto / web nativo para operación distribuida.</li>
          <li>Agnóstico de hardware/antivirus, con flexibilidad de infraestructura.</li>
          <li>Soporte local en Chile con integradores certificados.</li>
        </ul>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
          <div className="font-medium mb-1">Nota de versiones ABB ZEE600 / SEE00</div>
          <p className="muted">
            ZEE600 (SEE00) suele ir una versión por detrás de zenon; p. ej., si zenon está en v15, ABB suele estar en v14.
            Recomendación: validar roadmap de versiones con proveedor.
          </p>
        </div>
      </div>
    </section>
  );
}
