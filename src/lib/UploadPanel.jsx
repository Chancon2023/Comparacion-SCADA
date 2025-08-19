import React, { useState } from "react";
import { parseFile } from "../lib/docParsers";
import { addDocs, clearDocs, getDocs } from "../lib/localDocs";

export default function UploadPanel() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [docsCount, setDocsCount] = useState(getDocs().length);

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setBusy(true);
    setStatus("Procesando documentos...");
    const parsed = [];
    for (const f of files) {
      const out = await parseFile(f);
      parsed.push(out);
    }
    addDocs(parsed);
    setBusy(false);
    setStatus(`Cargados ${parsed.length} documento(s).`);
    setDocsCount(getDocs().length);
    e.target.value = "";
  };

  const onClear = () => {
    clearDocs();
    setDocsCount(0);
    setStatus("Documentos borrados del navegador.");
  };

  return (
    <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 hover:bg-slate-50">
          <input
            type="file"
            accept=".pdf,.xlsx,.xls,.csv,.txt,.md,.json"
            multiple
            onChange={onFiles}
            className="hidden"
            disabled={busy}
          />
          <span>{busy ? "Leyendo…" : "Cargar documentos"}</span>
        </label>

        <button
          onClick={onClear}
          className="rounded-xl border px-4 py-2 hover:bg-slate-50"
          disabled={busy || docsCount === 0}
        >
          Borrar documentos
        </button>

        <span className="text-sm text-slate-600">
          {docsCount} documento(s) guardados localmente
        </span>
      </div>

      {status && <div className="mt-2 text-sm text-slate-700">{status}</div>}

      <p className="mt-3 text-xs text-slate-500">
        * Los documentos se procesan en tu navegador (no se suben al servidor).
        Se guardan en <code>localStorage</code> para este equipo/navegador.
      </p>
    </div>
  );
}
