import React from "react";
import AssistantChat from "../components/AssistantChat";

/**
 * Pestaña exclusiva del Asistente.
 * Si esta página aparecía en blanco, con este componente debería verse SIEMPRE algo.
 * Asegúrate de registrar la ruta en App.jsx:
 *   <Route path="/assistant" element={<AssistantPage />} />
 */
export default function AssistantPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Asistente SCADA</h1>
      <p className="text-slate-600 mb-4">Chat ligero sin backend. Recomienda según tus requisitos.</p>
      <AssistantChat />
    </div>
  );
}