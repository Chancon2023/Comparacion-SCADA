// src/components/UploadPanel.jsx
import React, { useState } from "react";
import { parseFilesToDocs, saveDocs, clearDocs, loadDocs } from "../lib/localRag";

export default function UploadPanel({ compact = false, onChange }) {
  const [files, setFiles] = useState([]);
  const [count, setCount] = useState(loadDocs().length);

  const handlePick = (e) => setFiles(Array.from(e.target.files || []));

  const handleLoad = async () => {
    if (!files.length) return;
    const docs = await parseFilesToDocs(files);
    const total = saveDocs(docs);
    setCount(total);
    setFiles([]);
    onChange?.(total);
  };

  const handleClear = () => {
    clearDocs();
    setCount(0);
    onChange?.(0);
  };

  return (
    <div className={`rounded-xl ${compact ? "" : "bg-white shadow"} p-4 border border-slate-200`}>
      <div className="text-sm text-slate-600 mb-2">
        Sube <strong>PDF, TXT/MD, CSV/JSON y Excel (XLS/XLSX)</strong>.
        Los textos se procesan <em>localmente</em> y se guardan en tu navegador (localStorage).
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <input
          type="file"
          multiple
          onChange={handlePick}
          className="block w-full md:w-auto text-sm file:mr-3 file:py-2 file:px-3
                     file:rounded-lg file:border-0 file:bg-slate-900 file:text-white
                     hover:file:bg-slate-800"
          accept=".pdf,.txt,.md,.csv,.json,.xls,.xlsx"
        />
        <button
          onClick={handleLoad}
          className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
        >
          Cargar documentos
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
        >
          Borrar todo
        </button>
        <div className="text-sm text-slate-500 ml-auto">
          Índice local: <span className="font-medium">{count}</span> documentos
        </div>
      </div>
    </div>
  );
}
