import React from "react";
import AssistantChat from "../components/AssistantChat";

export default function Assistant() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Asistente</h1>
      <p className="text-sm text-slate-600 mb-4">
        Pregunta sobre NTSyCS, SITR, IEC 62443 y selección de SCADA para minería.
      </p>
      <AssistantChat />
    </div>
  );
}
