// src/pages/Assistant.jsx
import React from "react";
import AssistantChat from "../components/AssistantChat";

export default function Assistant() {
  const hasKey = !!import.meta.env.VITE_GEMINI_API_KEY;
  const model = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {!hasKey && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900 text-sm">
          Nota: el servicio no está disponible (Missing VITE_GEMINI_API_KEY en environment).
        </div>
      )}
      <h1 className="text-2xl md:text-3xl font-semibold mb-2">Asistente</h1>
      <p className="text-sm text-slate-600 mb-6">
        Modelo activo: <code>{model}</code>. Puedes cambiarlo vía <code>VITE_GEMINI_MODEL</code>.
      </p>
      <AssistantChat />
    </div>
  );
}
