
import React, { useRef, useState } from "react";
import { parseFiles } from "../lib/parse";

export default function DocDropzone({ onParsed }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = async (fileList) => {
    setError(null);
    setBusy(true);
    try {
      const docs = await parseFiles(fileList);
      onParsed?.(docs);
    } catch (e) {
      console.error(e);
      setError(e?.message || "No se pudo procesar el archivo");
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length) handleFiles(files);
  };

  const onPick = (e) => {
    const files = e.target.files;
    if (files && files.length) handleFiles(files);
    e.target.value = ""; // reset
  };

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-gray-50 cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Procesando…" : "Arrastra aquí tus archivos o haz clic para seleccionar"}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.txt,.md,.csv,.xlsx,.xls,.json"
        onChange={onPick}
      />
      {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
    </div>
  );
}
