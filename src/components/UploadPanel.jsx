// src/components/UploadPanel.jsx
import React, { useRef, useState } from "react";
import { parseFilesToDocs, saveDocs } from "../lib/localRag";

export default function UploadPanel({ onAdd, disabled=false }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState([]);

  const onPick = (e) => {
    setSelected(Array.from(e.target.files || []));
  };

  const handleAdd = async () => {
    if (!selected.length) return;
    setBusy(true);
    try {
      const docs = await parseFilesToDocs(selected);
      if (docs?.length) {
        onAdd?.(docs);
        saveDocs((prev => prev)); // no-op: parent will save; kept for backwards compatibility
      }
      setSelected([]);
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 p-3 rounded-xl border bg-white/70">
      <div className="text-sm text-slate-700 mb-2">
        <strong>Sube PDF, TXT/MD, CSV/JSON y Excel (XLS/XLSX)</strong>.
        El análisis es local (en tu navegador); los textos se guardan en <code>localStorage</code>.
      </div>
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.csv,.json,.xlsx,.xls"
          onChange={onPick}
          className="block w-full md:w-auto"
          disabled={disabled || busy}
        />
        <button
          onClick={handleAdd}
          disabled={disabled || busy || !selected.length}
          className="px-3 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50"
        >
          {busy ? "Procesando..." : `Cargar documentos${selected.length ? ` (${selected.length})` : ""}`}
        </button>
      </div>
    </div>
  );
}