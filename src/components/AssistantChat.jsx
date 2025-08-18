// src/components/AssistantChat.jsx
import React, { useState, useRef } from "react";
import { askGemini } from "../lib/ai";

export default function AssistantChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hola, soy tu asistente SCADA. Puedo orientarte sobre NTSyCS, SITR, IEC 62443 y mejores prácticas de selección. ¿Qué necesitas?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const scrollToEnd = () => {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const q = (input || "").trim();
    if (!q) return;

    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const reply = await askGemini(next, q);
      setMessages((prev) => [...prev, { role: "assistant", content: reply || "…" }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "No pude consultar el motor inteligente. Detalle: " +
            (err?.message || String(err)),
        },
      ]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 md:p-6 h-[70vh] flex flex-col">
      <div className="flex-1 overflow-auto space-y-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-900"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Haz una pregunta (p. ej.: ¿qué SCADA cumple mejor la NTSyCS para subestaciones?)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Pensando…" : "Enviar"}
        </button>
      </form>
    </div>
  );
}
