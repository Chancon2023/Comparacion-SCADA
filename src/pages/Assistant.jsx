// src/pages/Assistant.jsx
import React from "react";
import ScadaAssistant from "../components/ScadaAssistant";

export default function AssistantPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">
        Asistente SCADA (Beta)
      </h1>
      <p className="text-slate-600 mb-6">
        Describe tus requisitos (p. ej. "minería, IEC 61850, redundancia PRP/HSR,
        NTSyCS, acceso web/móvil") y el asistente calculará la mejor opción con
        una explicación basada en tu dataset y en red flags conocidas.
      </p>
      <ScadaAssistant />
    </div>
  );
}