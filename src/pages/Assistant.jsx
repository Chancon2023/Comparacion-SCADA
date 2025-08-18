import React from "react";
import ScadaAssistant from "../components/ScadaAssistant";

export default function AssistantPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">Asistente SCADA</h1>
      <ScadaAssistant />
    </div>
  );
}
