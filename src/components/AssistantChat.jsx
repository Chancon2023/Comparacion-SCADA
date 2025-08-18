// src/components/AssistantChat.jsx
import React, { useState, useRef } from "react";
import { askGemini } from "../lib/llm";

const SYSTEM = `Eres un asistente experto en SCADA para la industria eléctrica y minera en Chile.
Conoces NTSyCS, SITR, IEC 62443, IEC 61850, protocolos (IEC 60870, DNP3, Modbus) y buenas prácticas.
Entrega respuestas breves, con pasos accionables y advertencias ("red flags") cuando corresponda.
Cuando te pidan ranking/recomendación, explica qué criterio usas y advierte que deben validarlo en pruebas.`;

export default function AssistantChat() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hola, soy tu asistente SCADA. ¿Qué necesitas?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const send = async (e) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question) return;
    setInput("");

    const next = [...messages, { role: "user", content: question }];
    setMessages(next);
    setLoading(true);
    try {
      const answer = await askGemini(question, {
        systemPrompt: SYSTEM,
        history: next.slice(0, -1),
      });
      setMessages([...next, { role: "assistant", content: answer || "(sin respuesta)" }]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            `No pude consultar el motor inteligente.\n\nDetalle: ${err?.message || err?.toString?.() || "error desconocido"}`,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollTo?.(0, listRef.current.scrollHeight), 50);
    }
  };

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={
                "inline-block rounded-2xl px-3 py-2 " +
                (m.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 border border-slate-200")
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-sm text-slate-500">Pensando…</div>
        )}
      </div>

      <form onSubmit={send} className="flex gap-2 p-3 border-t bg-slate-50">
        <input
          className="flex-1 rounded-xl border px-3 py-2 outline-none focus:ring"
          placeholder="Pregúntame sobre NTSyCS, IEC 61850, ranking SCADA, etc."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          disabled={loading}
          className="rounded-xl px-4 py-2 bg-slate-900 text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
