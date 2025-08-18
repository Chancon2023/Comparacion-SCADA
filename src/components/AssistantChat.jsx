import React, { useState, useRef, useEffect } from "react";

/**
 * AssistantChat.jsx (Gemini-ready)
 * Conecta con /netlify/functions/assist (Gemini) y mantiene el formato messages[]
 * compatible con system / user / assistant.
 */
export default function AssistantChat() {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "Eres un asistente experto en SCADA para minería en Chile. Conoces NTSyCS, SITR, IEC 61850/60870-5-104/62443, " +
        "y comparas productos como zenon, Power Operation, Hitachi NMS, Spectrum Power, etc. " +
        "Responde de forma práctica y cita si mencionas normativa específica. Si no tienes certeza, indícalo y sugiere validaciones.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const ask = async () => {
    const text = input.trim();
    if (!text) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const resp = await fetch("/.netlify/functions/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        const msg =
          data && data.error
            ? `Nota: el servicio no está disponible (${data.error}).`
            : "Nota: el servicio no está disponible.";
        setMessages((m) => [...m, { role: "assistant", content: msg }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply || "(sin respuesta)" }]);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `Nota: error de red o servidor (${String(err)})`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-semibold mb-3">Asistente SCADA (Gemini)</h2>
      <p className="text-sm text-slate-600 mb-4">
        Este asistente usa el modelo Gemini 1.5 Flash a través de una función serverless (tu clave no se expone en el navegador).
      </p>

      <div className="border rounded-2xl p-4 md:p-6 bg-white shadow">
        <div className="space-y-3 max-h-[55vh] overflow-auto pr-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "text-sm md:text-base bg-slate-50 border rounded-xl p-3"
                  : m.role === "assistant"
                  ? "text-sm md:text-base bg-emerald-50 border border-emerald-200 rounded-xl p-3"
                  : "text-xs text-slate-500"
              }
            >
              <div className="font-medium mb-1">
                {m.role === "user" ? "Tú" : m.role === "assistant" ? "Asistente" : "Sistema"}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
          {loading && <div className="text-sm text-slate-500">Pensando…</div>}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 flex gap-2">
          <textarea
            className="flex-1 rounded-xl border p-3 text-sm focus:outline-none focus:ring focus:ring-slate-200"
            rows={2}
            placeholder="Escribe tu pregunta…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            onClick={ask}
            disabled={loading}
            className="rounded-xl px-4 py-3 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
