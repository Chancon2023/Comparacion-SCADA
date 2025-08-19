import React from "react";
import UploadPanel from "../components/UploadPanel";
import AssistantChat from "../components/AssistantChat";

export default function AssistantPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">Asistente</h1>
      <p className="text-slate-600 mb-6">
        Pregunta sobre NTSyCS, SITR, IEC 62443 y selección de SCADA para
        minería. Carga tu documentación para obtener respuestas basadas en ella.
      </p>

      {/* Aquí aparece el botón para cargar documentos */}
      <UploadPanel />

      {/* Chat */}
      <AssistantChat />
    </main>
  );
}
