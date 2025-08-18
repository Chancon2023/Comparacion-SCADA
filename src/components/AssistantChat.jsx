import React, { useState } from "react";
import { askGemini } from "../lib/llm";

const SYSTEM_PROMPT = `
Eres un asistente experto en SCADA para el mercado chileno.
Conoces NTSyCS, SITR, IEC 62443/61850/60870, prácticas de ciberseguridad,
redundancia (PRP/HSR), soporte local, TCO, compatibilidad entre versiones y
criterios para minería. Responde en español (Chile), claro y accionable.
Cuando convenga, sugiere cómo verificar con documentación o pruebas.
`;

export default function AssistantChat() {
  const [messages, setMessages] = useState([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "assistant", content: "Hola, soy tu asistente SCADA. ¿En qué te ayudo hoy?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    const resp = await askGemini(next);
    setBusy(false);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: resp.text || "No pude generar respuesta." },
    ]);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-3">
        {messages
          .filter((m) => m.role !== "system")
          .map((m, i) => (
            <div
              key={i}
              className={
                m.role === "assistant"
                  ? "rounded-xl bg-gray-50 p-3"
                  : "rounded-xl bg-slate-900 text-white p-3 ml-auto max-w-[80%]"
              }
              style={m.role === "assistant" ? {} : { textAlign: "right" }}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
        {busy && <div className="text-sm text-slate-500">Pensando…</div>}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 border rounded-xl px-3 py-2"
          placeholder="Pregunta (p.ej., ¿qué SCADA se adapta mejor a NTSyCS para subestaciones?)"
        />
        <button
          onClick={send}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
