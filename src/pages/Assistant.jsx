// src/pages/Assistant.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import UploadPanel from "../components/UploadPanel"; // Reutiliza tu panel de carga actual
import { loadDocuments } from "../lib/localRag";
import * as RAG from "../lib/localRag";
import { getLocalAISatus, loadLocalAI } from "../lib/qaLocal";

export default function Assistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hola, soy tu asistente SCADA. Puedo basarme en documentos locales (PDF/TXT/CSV/JSON/Excel) que cargues arriba. ¿Qué necesitas?" },
  ]);
  const [busy, setBusy] = useState(false);
  const [smart, setSmart] = useState(true);
  const status = getLocalAISatus();
  const [docsCount, setDocsCount] = useState(0);

  useEffect(() => {
    const docs = loadDocuments();
    setDocsCount(docs.length);
  }, [messages]);

  const onAsk = async () => {
    const q = question.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setQuestion("");
    setBusy(true);
    try {
      const res = await RAG.answer(q, { smart });
      setMessages((m) => [...m, { role: "assistant", text: res.text, sources: res.sources }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "Hubo un error procesando tu pregunta. Intenta de nuevo." }]);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAsk();
    }
  };

  const preloadModels = async () => {
    try {
      await loadLocalAI();
      // fuerza un render
      setMessages((m) => [...m, { role: "system", text: "Modelos locales cargados. Puedes preguntar con 'IA local' activada." }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "system", text: "No se pudieron cargar los modelos locales. Seguiré con modo rápido." }]);
    }
  };

  useEffect(() => {
    // Arranque perezoso si el usuario activa smart
    if (smart && !status.ready && !status.loading) {
      preloadModels();
    }
  }, [smart]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Panel de carga */}
      <div className="mb-4">
        <UploadPanel />
        <div className="text-xs text-slate-600 mt-2">
          Documentos cargados: <span className="font-semibold">{docsCount}</span>
        </div>
      </div>

      {/* Toggle "Inteligencia local" */}
      <div className="flex items-center gap-3 bg-slate-50 border rounded-xl p-3 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={smart}
            onChange={(e) => setSmart(e.target.checked)}
          />
          <span>Usar <b>IA local</b> (embeddings + QA en el navegador)</span>
        </label>
        <span className="text-xs text-slate-500">
          Estado: {status.loading ? "cargando modelos…" : (status.ready ? "listo" : "inactivo")}
        </span>
      </div>

      {/* Chat */}
      <div className="space-y-3">
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} text={m.text} sources={m.sources} />
        ))}
      </div>

      {/* Input */}
      <div className="mt-4 flex items-center gap-2">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ej: ¿qué SCADA cumple mejor NTSyCS para subestaciones?"
          rows={2}
          className="flex-1 rounded-xl border p-3"
        />
        <button
          onClick={onAsk}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-50"
        >
          {busy ? "Pensando…" : "Enviar"}
        </button>
      </div>

      {/* Nota */}
      <p className="text-xs text-slate-500 mt-3">
        Tip: activa “IA local” para respuestas más precisas. La primera vez tardará en descargar los modelos (se guardan en caché).
      </p>
    </div>
  );
}

function MessageBubble({ role, text, sources }) {
  const isUser = role === "user";
  if (role === "system") {
    return (
      <div className="text-[11px] text-slate-500">{text}</div>
    );
  }
  return (
    <div className={`max-w-[90%] rounded-2xl p-3 ${isUser ? "ml-auto bg-slate-900 text-white" : "bg-slate-100"}`}>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{text}</div>
      {sources?.length ? (
        <div className="mt-2 text-[11px] text-slate-600">
          <div className="font-medium mb-1">Fuentes</div>
          <ul className="list-disc pl-4 space-y-1">
            {sources.map((s, idx) => (
              <li key={idx}>
                <span className="font-semibold">{s.source}:</span> {s.preview}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
