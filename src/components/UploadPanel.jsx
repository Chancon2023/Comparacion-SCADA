// src/components/UploadPanel.jsx
import React, { useRef, useState } from "react";
import { parseFilesToDocs, saveDocs, loadDocs, clearDocs } from "../lib/localRag";

export default function UploadPanel({ onLoaded }) {
  const inputRef = useRef(null);
  const [count, setCount] = useState(loadDocs().length);

  const handlePick = () => inputRef.current?.click();

  const handleFiles = async (ev) => {
    const files = Array.from(ev.target.files || []);
    if (!files.length) return;
    const docs = await parseFilesToDocs(files);
    const prev = loadDocs();
    saveDocs([...prev, ...docs]);
    setCount(loadDocs().length);
    onLoaded?.(loadDocs());
    ev.target.value = ""; // reset input
  };

  const handleClear = () => {
    clearDocs();
    setCount(0);
    onLoaded?.([]);
  };

  return (
    <div className="mb-4 p-3 rounded-xl border bg-white shadow-sm">
      <div className="text-sm text-slate-700 mb-2">
        Sube <strong>PDF, TXT/MD, CSV/JSON y Excel (XLS/XLSX)</strong>. El análisis es local
        (navegador) y se guarda en <code>localStorage</code>.
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.csv,.json,.xls,.xlsx"
          onChange={handleFiles}
          className="hidden"
        />
        <button
          onClick={handlePick}
          className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
        >
          Elegir archivos
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-2 rounded-lg border hover:bg-slate-50"
        >
          Vaciar documentos
        </button>

        <div className="ml-auto text-sm text-slate-600 self-center">
          Documentos cargados: <strong>{count}</strong>
        </div>
      </div>
    </div>
  );
}
