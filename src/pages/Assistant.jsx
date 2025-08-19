// src/pages/Assistant.jsx
import React, { useEffect, useRef, useState } from "react";
import UploadPanel from "../components/UploadPanel";
import { loadDocs, answerQuery } from "../lib/localRag";

export default function Assistant() {
  const [docs, setDocs] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: "sys-hello",
      role: "assistant",
      text:
        "Hola, soy tu asistente SCADA. Puedo orientarte sobre NTSyCS, SITR, IEC 62443 y selección de plataformas.",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    setDocs(loadDocs());
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onLoadedDocs = (d) => setDocs(d);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text }]);

    // Si no hay docs, responde genérico
    if (!docs.length) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            "Aún no has cargado documentos. Usa el botón “Elegir archivos” arriba y pregunta de nuevo. " +
            "También puedo responder en términos generales si lo indicas.",
        },
      ]);
      return;
    }

    const { answer, sources } = answerQuery(text, docs);
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text:
          (answer || "No encontré coincidencias.") +
          (sources?.length ? `\n\nFuentes: ${sources.join(", ")}` : ""),
      },
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-semibold mb-2">Asistente</h1>
      <p className="text-slate-600 mb-4">
        Pregunta sobre NTSyCS, SITR, IEC 62443 y selección de SCADA para minería. Carga tu
        documentación para respuestas basadas en ella.
      </p>

      {/* Panel de carga SIEMPRE visible */}
      <UploadPanel onLoaded={onLoadedDocs} />

      <div className="space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] bg-slate-900 text-white rounded-2xl px-4 py-2"
                : "max-w-[85%] bg-slate-50 rounded-2xl px-4 py-2"
            }
          >
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2"
          placeholder="Ej: ¿qué SCADA cumple mejor NTSyCS para subestaciones?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
