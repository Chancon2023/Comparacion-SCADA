import React from "react";
import ScadaAssistant from "../components/ScadaAssistant";

export default function AssistantPage() {
  return (
    <div className="px-4 md:px-6 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Asistente de Selección SCADA</h1>
      <ScadaAssistant />
    </div>
  );
}
