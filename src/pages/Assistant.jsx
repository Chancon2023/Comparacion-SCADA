import React, { useRef, useState } from "react";
import UploadPanel from "../components/UploadPanel";
import { answerQuery } from "../lib/localRag";

export default function Assistant() {
  const inputRef = useRef(null);
  const [msgs, setMsgs] = useState([
    { role: "assistant", text: "Hola, soy tu asistente SCADA. Puedo orientarte sobre NTSyCS, SITR, IEC 62443 y selección de plataformas. Sube la documentación con el botón 'Cargar documentos' y pregúntame." }
  ]);
  const [indexed, setIndexed] = useState(null);
  const [sending, setSending] = useState(false);

  const send = async () => {
    const q = inputRef.current?.value?.trim();
    if (!q) return;
    setMsgs(m => [...m, { role: "user", text: q }]);
    inputRef.current.value = "";
    setSending(true);
    try {
      const res = await answerQuery(q);
      setMsgs(m => [...m, { role: "assistant", text: res.answer }]);
    } catch (e) {
      setMsgs(m => [...m, { role: "assistant", text: `No pude consultar el motor. Detalle: ${e.message}` }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Asistente</h1>
      <UploadPanel onIndexed={setIndexed} />

      <div className="mt-4 text-sm text-slate-600">
        {indexed ? (
          <>Indexados <strong>{indexed.fragments}</strong> fragmentos de <strong>{indexed.count}</strong> archivo(s).</>
        ) : (
          <>Aún no has cargado documentos. Usa “Cargar documentos”.</>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={m.role === "user"
              ? "bg-slate-900 text-white rounded-xl px-4 py-3"
              : "bg-slate-100 rounded-xl px-4 py-3"}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          ref={inputRef}
          className="flex-1 border rounded-xl px-3 py-2"
          placeholder="Ej: ¿qué SCADA cumple mejor NTSyCS para subestaciones?"
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          className="px-4 py-2 rounded-xl bg-slate-900 text-white"
          onClick={send}
          disabled={sending}
        >
          {sending ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </div>
  );
}
