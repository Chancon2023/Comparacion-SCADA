
// src/pages/Assistant.jsx
import React, { useState, useRef } from "react";
import { loadDocs, answerQuery, clearIndex } from "../lib/localRag";

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hola, soy tu asistente SCADA. Puedo orientarte sobre NTSyCS, SITR, IEC 62443 y selección de plataformas. Sube la documentación (PDF/TXT/CSV/XLSX) con el botón 'Cargar documentos' y pregúntame." }
  ]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const onUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const res = await loadDocs([...files]);
      setMessages((m) => [...m, { role: "assistant", content: res.message }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: "No pude indexar los documentos: " + (err?.message || err) }]);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onAsk = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const q = (form.get("q") || "").toString().trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setBusy(true);
    try {
      const { answer } = await answerQuery(q);
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: "No pude consultar el motor inteligente. Detalle: " + (err?.message || err) }]);
    } finally {
      setBusy(false);
    }
    e.currentTarget.reset();
  };

  const onClear = () => {
    clearIndex();
    setMessages([{ role: "assistant", content: "Índice borrado. Sube documentos nuevamente para consultar." }]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-3 text-sm text-slate-600">
        Sube <strong>PDF, TXT/MD, CSV/JSON y Excel (XLS/XLSX)</strong>. El análisis es local (en tu navegador).
      </div>

      <div className="flex items-center gap-2 mb-5">
        <label className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white shadow cursor-pointer hover:bg-slate-50">
          <input ref={fileRef} onChange={onUpload} type="file" multiple className="hidden" accept=".pdf,.txt,.md,.csv,.json,.xls,.xlsx" />
          Cargar documentos
        </label>
        <button onClick={onClear} className="px-3 py-2 rounded-xl border bg-white shadow hover:bg-slate-50">Borrar índice</button>
        {busy && <span className="text-sm text-slate-500">Trabajando…</span>}
      </div>

      <div className="space-y-3 mb-6">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "assistant" ? "bg-slate-50 rounded-xl p-3" : "bg-slate-900 text-white rounded-xl p-3 ml-auto max-w-[80%]"}>
            {m.content}
          </div>
        ))}
      </div>

      <form onSubmit={onAsk} className="flex items-center gap-2">
        <input name="q" placeholder="Ej: ¿qué SCADA cumple mejor NTSyCS para subestaciones?" className="flex-1 border rounded-xl px-3 py-2" />
        <button disabled={busy} className="px-4 py-2 rounded-xl bg-slate-900 text-white">{busy ? "..." : "Enviar"}</button>
      </form>
    </div>
  );
}
