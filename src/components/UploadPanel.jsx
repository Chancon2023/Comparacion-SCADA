// src/components/UploadPanel.jsx
import React, { useRef, useState, useEffect } from "react";
import { parseFilesToDocs, saveDocs, loadDocs, clearDocs } from "../lib/localRag";

export default function UploadPanel() {
  const inp = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(loadDocs().length);
  }, []);

  const onAdd = async () => {
    const files = Array.from(inp.current?.files || []);
    if (!files.length) return;
    const docs = await parseFilesToDocs(files);
    const merged = saveDocs(docs);
    setCount(merged.length);
    // limpia selección
    if (inp.current) inp.current.value = "";
  };

  const onClear = () => {
    clearDocs();
    setCount(0);
  };

  return (
    <div className="mb-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
      <div className="text-sm text-slate-600 mb-2">
        Sube <b>PDF, TXT/MD, CSV/JSON y Excel (XLS/XLSX)</b>. El análisis es local
        (en tu navegador) y se guarda en <code>localStorage</code>.
      </div>

      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
        <input
          ref={inp}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.csv,.json,.xls,.xlsx"
          className="block w-full md:w-auto"
        />
        <button
          onClick={onAdd}
          className="px-3 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
        >
          Cargar documentos
        </button>
        <button
          onClick={onClear}
          className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-white"
        >
          Vaciar índice
        </button>

        <span className="text-sm text-slate-600 md:ml-2">
          {count ? `Indexados: ${count}` : "Aún no has cargado documentos."}
        </span>
      </div>
    </div>
  );
}
