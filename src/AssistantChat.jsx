import React, { useState } from "react";

const FN_URL =
  import.meta.env.PROD
    ? "/.netlify/functions/chat"
    : "/api/chat"; // gracias al redirect de netlify.toml

export default function AssistantChat() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([
    { role: "assistant", content: "¡Hola! Soy tu asistente SCADA. ¿En qué te ayudo?" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || loading) return;

    setHistory((h) => [...h, { role: "user", content: text }]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "Dominio SCADA Chile, NTSyCS, SITR, IEC 61850/62443, mejores prácticas." },
            ...history,
            { role: "user", content: text },
          ],
        }),
      });

      if (!res.ok) {
        // Muestra detalle para depurar
        const detail = await res.text();
        throw new Error(`HTTP ${res.status} – ${detail}`);
      }

      const data = await res.json();
      const reply = data.reply ?? "No pude generar respuesta.";
      setHistory((h) => [...h, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error(err);
      setError("Servicio no disponible. Revisa la función y tu OPENAI_API_KEY.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="rounded-2xl border bg-white p-4 space-y-3 min-h-[280px]">
        {history.map((m, i) => (
          <div
            key={i}
            className={m.role === "assistant" ? "text-slate-900" : "text-blue-700"}
          >
            <strong>{m.role === "assistant" ? "Asistente: " : "Tú: "}</strong>
            <span>{m.content}</span>
          </div>
        ))}
        {loading && <div className="text-sm text-slate-500">Pensando…</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2"
          placeholder="Pregunta sobre NTSyCS, IEC 61850, integraciones, etc."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl px-4 py-2 bg-gray-900 text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
