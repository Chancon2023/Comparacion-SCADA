import React, { useState } from "react";
import { askAssistant } from "../lib/ai";

export default function AssistantChat() {
  const [messages, setMessages] = useState([
    { role: "model", text: "Hola, soy tu asistente SCADA. ¿Qué necesitas?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  const send = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    const next = [...messages, { role: "user", text: content }];
    setMessages(next);
    setLoading(true);
    setNote("");

    try {
      // Llama a la function (asegura que el primer elemento sea 'user')
      const startIndex = Math.max(0, next.findIndex(m => m.role === "user"));
      const slice = startIndex >= 0 ? next.slice(startIndex) : next;
      const answer = await askAssistant(slice, { temperature: 0.4 });
      setMessages(prev => [...prev, { role: "model", text: answer || "(sin respuesta)" }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "model", text: `No pude consultar el motor inteligente. Detalle: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 md:p-6">
      {note && (
        <div className="mb-3 text-xs px-3 py-2 rounded bg-amber-50 text-amber-900 border border-amber-200">
          {note}
        </div>
      )}

      <div className="space-y-3 mb-4 max-h-[55vh] overflow-y-auto">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`px-3 py-2 rounded-xl max-w-[85%] ${
              m.role === "user" ? "ml-auto bg-slate-900 text-white" : "bg-slate-100 text-slate-900"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && <div className="text-xs text-slate-500">Pensando…</div>}
      </div>

      <div className="flex items-center gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2 outline-none"
          placeholder="Ej: ¿qué SCADA cumple mejor NTSyCS para subestaciones?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-60"
          disabled={loading}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
