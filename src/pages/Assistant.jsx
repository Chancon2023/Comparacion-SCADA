// src/pages/Assistant.jsx
import React from "react";
import AssistantChat from "../components/AssistantChat";

export default function Assistant() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">Asistente</h1>

      {!import.meta.env.VITE_GEMINI_API_KEY && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
          Nota: el servicio no está disponible (Missing <code>VITE_GEMINI_API_KEY</code>).
        </div>
      )}

      <AssistantChat />
    </div>
  );
}
