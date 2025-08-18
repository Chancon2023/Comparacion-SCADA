import React from "react";
import AssistantChat from "../components/AssistantChat";

export default function AssistantPage() {
  return (
    <div className="px-4 md:px-8 py-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-4">Asistente SCADA (Beta)</h1>
      <AssistantChat />
    </div>
  );
}
