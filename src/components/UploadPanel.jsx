import React, { useRef, useState } from "react";
import { loadDocs, clearIndex } from "../lib/localRag";

export default function UploadPanel({ onIndexed }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState(null);

  const handleLoad = async () => {
    const files = Array.from(inputRef.current?.files || []);
    if (!files.length) return;
    setBusy(true);
    try {
      const res = await loadDocs(files);
      setMeta(res);
      onIndexed?.(res);
    } finally {
      setBusy(false);
    }
  };

  const handleClear = () => {
    clearIndex();
    setMeta(null);
    onIndexed?.({ count: 0, fragments: 0 });
  };

  return (
    <div className="bg-white rounded-xl border p-4 flex flex-col gap-3">
      <div className="text-sm text-slate-600">
        Sube <strong>PDF, TXT/MD, CSV/JSON y Excel (XLS/XLSX)</strong>.
        El análisis es local (en tu navegador).
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={inputRef} type="file" multiple className="hidden" onChange={() => {}} />
        <button
          className="px-3 py-2 rounded-lg bg-slate-900 text-white"
          onClick={() => inputRef.current?.click()}
        >
          Elegir archivos
        </button>
        <button
          className="px-3 py-2 rounded-lg border"
          onClick={handleLoad}
          disabled={busy}
        >
          {busy ? "Cargando…" : "Cargar documentos"}
        </button>
        <button className="px-3 py-2 rounded-lg border" onClick={handleClear}>
          Borrar índice
        </button>
        {meta && (
          <span className="text-xs text-slate-500 ml-2">
            Indexados {meta.fragments} fragmentos de {meta.count} archivo(s)
          </span>
        )}
      </div>
    </div>
  );
}
