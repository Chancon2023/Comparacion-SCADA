// src/pages/Assistant.jsx
import React, { useEffect, useState } from "react";
import { Upload, Send } from "lucide-react";
import { createIndex, fileToChunks, answerFromSnippets } from "../lib/localRag";

export default function Assistant() {
  const [idx] = useState(() => createIndex());
  const [docs, setDocs] = useState([]);
  const [loaded, setLoaded] = useState(0);
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState([
    {
      role: "assistant",
      content:
        "Hola, soy tu asistente local SCADA. Sube PDF/XLSX/TXT/MD/CSV y pregúntame sobre NTSyCS, SITR, IEC 62443 y selección de plataformas.",
    },
  ]);

  // Restaurar índice si existe
  useEffect(() => {
    (async () => {
      const dump = localStorage.getItem("localIndexDump");
      const meta = localStorage.getItem("localDocsMeta");
      if (dump) await idx.import(dump);
      if (meta) {
        const parsed = JSON.parse(meta);
        setDocs(parsed);
        setLoaded(parsed.reduce((a, b) => a + (b.chunks || 0), 0));
      }
    })();
  }, [idx]);

  async function persist(nextDocs) {
    const dump = await idx.export();
    localStorage.setItem("localIndexDump", dump);
    localStorage.setItem("localDocsMeta", JSON.stringify(nextDocs));
  }

  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    let count = 0;
    const nextDocs = [...docs];

    for (const f of files) {
      const chunks = await fileToChunks(f);
      chunks.forEach((rec) => idx.add(rec));
      nextDocs.push({ name: f.name, chunks: chunks.length, size: f.size });
      count += chunks.length;
    }

    setDocs(nextDocs);
    setLoaded((v) => v + count);
    await persist(nextDocs);
  }

  async function ask(e) {
    e?.preventDefault();
    const q = msg.trim();
    if (!q) return;
    setHistory((h) => [...h, { role: "user", content: q }]);
    setMsg("");

    try {
      const results = await idx.search(q, {
        index: ["body", "title"],
        enrich: true,
        limit: 12,
      });

      const flat = Array.from(
        new Set(results.flatMap((r) => r.result.map((d) => d.doc)))
      );

      if (!flat.length) {
        setHistory((h) => [
          ...h,
          {
            role: "assistant",
            content:
              "No encontré coincidencias en los documentos cargados. Sube más material o reformula la pregunta.",
          },
        ]);
        return;
      }

      const answer = answerFromSnippets(q, flat);
      setHistory((h) => [...h, { role: "assistant", content: answer }]);
    } catch (err) {
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: `No pude consultar el motor local. Detalle: ${err.message}`,
        },
      ]);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900">
        <b>Asistente local</b> · Todo corre en tu navegador (sin API).
        Sube documentos y consulta. El índice se guarda en tu navegador.
      </div>

      {/* Uploader */}
      <div className="border rounded-xl p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <Upload size={18} />
          <span>Subir documentos (PDF, XLSX, TXT, MD, CSV)</span>
          <input
            type="file"
            multiple
            onChange={onFiles}
            className="hidden"
            accept=".pdf,.xlsx,.xls,.txt,.md,.csv,.json"
          />
        </label>

        <div className="mt-3 text-sm text-slate-600">
          Documentos cargados: {docs.length} · fragmentos indexados: {loaded}
        </div>

        {!!docs.length && (
          <ul className="mt-2 text-sm list-disc pl-5">
            {docs.map((d, i) => (
              <li key={i}>
                {d.name}{" "}
                <span className="text-slate-400">({d.chunks} trozos)</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chat */}
      <div className="space-y-3">
        {history.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={`inline-block px-4 py-2 rounded-2xl ${
                m.role === "user"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-900"
              }`}
              dangerouslySetInnerHTML={{
                __html: m.content.replace(/\\n/g, "<br/>"),
              }}
            />
          </div>
        ))}
      </div>

      <form onSubmit={ask} className="flex gap-2">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          className="flex-1 border rounded-xl px-4 py-2"
          placeholder="Pregunta (ej: ¿Qué SCADA cumple mejor IEC 62443?)"
        />
        <button className="px-4 py-2 rounded-xl bg-slate-900 text-white flex items-center gap-2">
          <Send size={16} />
          Enviar
        </button>
      </form>
    </div>
  );
}
