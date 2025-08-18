import React from "react";
import AssistantChat from "../components/AssistantChat";

/**
 * Página /assistant.
 * Si la ves en blanco, confirma que:
 *  - La ruta está registrada en App.jsx (<Route path="/assistant" element={<AssistantPage />} />)
 *  - No hay errores en la consola del navegador.
 */
export default function AssistantPage() {
  return (
    <main className="px-4 md:px-8 lg:px-12 py-6">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Asistente SCADA</h2>
        <p className="text-slate-600 mt-2">
          Chat de recomendaciones y guía técnica. Usa tu dataset local si está disponible.
        </p>
      </div>
      <AssistantChat />
    </main>
  );
}
