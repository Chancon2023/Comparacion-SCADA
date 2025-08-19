// src/pages/Assistant.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import UploadPanel from "../components/UploadPanel";
import { answerWithLocalRag, loadDocs, saveDocs } from "../lib/localRag";

export default function Assistant() {
  const [docs, setDocs] = useState([]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", content: "Hola, soy tu asistente SCADA. Puedo orientarte sobre NTSyCS, SITR, IEC 62443 y selección de plataformas para minería. Sube documentación en 'Cargar documentos' y pregúntame." }
  ]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    setDocs(loadDocs());
  }, []);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onAddDocs = (newDocs) => {
    const merged = [...docs, ...newDocs];
    setDocs(merged);
    saveDocs(merged);
    setMessages(m => [...m, { role: "bot", content: `He cargado ${newDocs.length} documento(s). Ya puedes preguntar.` }]);
  };

  const send = async () => {
    const q = input.trim();
    if (!q) return;
    setMessages(m => [...m, { role: "user", content: q }]);
    setInput("");
    setBusy(true);
    try {
      const { answer, sources } = await answerWithLocalRag(q, docs);
      const srcBlock = sources?.length
        ? "\n\n**Fuentes**:\n" + sources.map(s => `- ${s.name}`).join("\n")
        : "";
      setMessages(m => [...m, { role: "bot", content: answer + srcBlock }]);
    } catch (e) {
      console.error(e);
      setMessages(m => [...m, { role: "bot", content: "Ocurrió un error al consultar los documentos." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Asistente</h1>
      <p className="text-sm text-slate-600 mb-4">
        Pregunta sobre NTSyCS, SITR, IEC 62443 y selección de SCADA para minería. Carga tu documentación para que las respuestas se basen en ella.
      </p>

      <UploadPanel onAdd={onAddDocs} />

      <div className="text-xs text-slate-500 mb-3">
        Documentos en memoria: <strong>{docs.length}</strong>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={
                "inline-block rounded-2xl px-3 py-2 " +
                (m.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50")
              }
            >
              <div className="prose prose-slate max-w-none whitespace-pre-wrap">
                {m.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2"
          placeholder="Ej: ¿qué SCADA cumple mejor NTSyCS para subestaciones?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy}
        />
        <button
          onClick={send}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50"
        >
          {busy ? "Pensando…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}