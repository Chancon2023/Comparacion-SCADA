import React, { useState } from "react";
import UploadPanel from "../components/UploadPanel";
import { searchCorpus, getLocalCorpusCount } from "../lib/localRag";

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hola, soy tu asistente SCADA. Puedo orientarte sobre NTSyCS, SITR, IEC 62443 y selección de plataformas. Sube documentación y te respondo en base a eso o pregúntame en general." }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const q = input.trim();
    if (!q) return;

    const mine = { role: "user", text: q };
    setMessages((m) => [...m, mine]);
    setInput("");
    setBusy(true);

    try {
      // Busca en el corpus local
      const hits = searchCorpus(q, { topK: 5 });
      let reply = "";

      if (hits.length) {
        reply += `He encontrado ${hits.length} resultado(s) en tus documentos (${getLocalCorpusCount()} total).\n\n`;
        hits.forEach((h, i) => {
          reply += `• ${i + 1}) ${h.name}\n   ${h.snippet}\n\n`;
        });
        reply +=
          "Resumen: las líneas anteriores son fragmentos donde aparecen tus términos. Si quieres, sube más documentos o haz la pregunta con mayor contexto (norma, capítulo, requisito, etc.).";
      } else {
        reply =
          "Aún no veo coincidencias en tus documentos locales. Puedes usar el botón 'Cargar documentos' arriba y volver a preguntar. También puedo responder en términos generales si me indicas el enfoque.";
      }

      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "No pude consultar la base local. Detalle: " +
            (e?.message || String(e)),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* PANEL DE CARGA (aquí está el botón) */}
      <UploadPanel />

      {/* Chat */}
      <div className="rounded-xl border bg-white p-3 md:p-4">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[90%] rounded-2xl px-4 py-2 bg-slate-900 text-white"
                  : "max-w-[90%] rounded-2xl px-4 py-2 bg-slate-50"
              }
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ej: ¿qué SCADA cumple mejor NTSyCS para subestaciones?"
            className="flex-1 rounded-xl border px-3 py-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button
            onClick={send}
            disabled={busy}
            className="px-4 py-2 rounded-xl border bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
