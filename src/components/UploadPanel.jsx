import React, { useState } from "react";
import { addFilesToLocalCorpus, getLocalCorpusCount } from "../lib/localRag";

export default function UploadPanel() {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const onSelect = (e) => {
    setFiles(Array.from(e.target.files || []));
    setMsg("");
  };

  const onUpload = async () => {
    if (!files.length) {
      setMsg("Selecciona uno o más archivos primero.");
      return;
    }
    setBusy(true);
    setMsg("Procesando… esto puede tardar unos segundos según el tamaño.");
    try {
      const { added, errors } = await addFilesToLocalCorpus(files);
      const total = getLocalCorpusCount();
      let info = `Cargados: ${added}. Total en memoria local: ${total}.`;
      if (errors.length) info += ` Errores: ${errors.length}.`;
      setMsg(info);
      setFiles([]);
    } catch (err) {
      setMsg("Error al cargar: " + (err?.message || String(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-3 md:p-4 mb-4">
      <div className="text-sm text-slate-600 mb-2">
        Sube <strong>PDF, TXT/MD, CSV/JSON y Excel (XLS/XLSX)</strong>.  
        El análisis es local (en tu navegador); los textos se guardan en <code>localStorage</code>.
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          type="file"
          onChange={onSelect}
          multiple
          accept=".pdf,.txt,.md,.csv,.json,.xls,.xlsx"
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border file:px-3 file:py-2 file:bg-slate-50 file:hover:bg-slate-100 file:border-slate-300"
        />
        <button
          onClick={onUpload}
          disabled={busy}
          className="px-4 py-2 rounded-xl border bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {busy ? "Cargando…" : "Cargar documentos"}
        </button>
      </div>

      <div className="text-xs text-slate-500 mt-2">
        Listo: {getLocalCorpusCount()} documento(s)
      </div>

      {msg && (
        <div className="mt-2 rounded-lg border p-2 text-sm bg-slate-50">
          {msg}
        </div>
      )}
    </div>
  );
}
