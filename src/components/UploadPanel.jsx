// src/components/UploadPanel.jsx
import React, { useState } from "react";

// Soportamos: PDF, TXT/MD, CSV/JSON y Excel (XLS/XLSX)
const ACCEPT = ".pdf,.txt,.md,.csv,.json,.xls,.xlsx";

// Carga dinámica de PDF.js (ESM) desde CDN para no romper el build
const PDFJS_VERSION = "3.11.174";
async function ensurePdfJs() {
  // ESM build
  const pdfMod = await import(
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`
  );
  // Worker del mismo CDN
  pdfMod.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
  return pdfMod; // { getDocument, GlobalWorkerOptions, ... }
}

// Carga dinámica de SheetJS (XLSX) (ESM) desde CDN
async function ensureXlsx() {
  // +esm entrega módulo ESM
  const xlsx = await import("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm");
  return xlsx; // { read, utils, ... }
}

function readFileAsText(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result ?? ""));
    fr.onerror = rej;
    fr.readAsText(file);
  });
}

async function parsePdf(arrayBuffer) {
  const pdfjs = await ensurePdfJs();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let out = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const text = tc.items.map((i) => i.str).join(" ");
    out.push(text);
  }
  return out.join("\n\n");
}

async function parseXlsx(arrayBuffer) {
  const xlsx = await ensureXlsx();
  const wb = xlsx.read(arrayBuffer, { type: "array" });
  let out = [];
  // Todas las hojas -> CSV simple
  wb.SheetNames.forEach((name) => {
    const ws = wb.Sheets[name];
    // sheet_to_csv funciona bien para “texto” fácil de indexar
    const csv = xlsx.utils.sheet_to_csv(ws, { FS: ",", RS: "\n" });
    out.push(`# ${name}\n${csv}`);
  });
  return out.join("\n\n");
}

export default function UploadPanel({ onComplete }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const handleFiles = async (files) => {
    const arr = Array.from(files ?? []);
    if (arr.length === 0) return;

    setBusy(true);
    setStatus("Procesando…");

    const docs = [];
    for (const f of arr) {
      const ext = (f.name.split(".").pop() || "").toLowerCase();
      try {
        let text = "";
        if (ext === "pdf") {
          const buf = await f.arrayBuffer();
          text = await parsePdf(buf);
        } else if (ext === "xlsx" || ext === "xls") {
          const buf = await f.arrayBuffer();
          text = await parseXlsx(buf);
        } else if (ext === "json") {
          const raw = await readFileAsText(f);
          try {
            const obj = JSON.parse(raw);
            text = JSON.stringify(obj, null, 2);
          } catch {
            text = raw;
          }
        } else {
          // txt/md/csv -> texto directo
          text = await readFileAsText(f);
        }

        // Pequeña limpieza y hard limit para evitar “megatextos”
        text = String(text || "").replace(/\u0000/g, " ").trim();
        if (text.length > 800_000) {
          text = text.slice(0, 800_000) + "\n\n[Truncado por tamaño]";
        }

        docs.push({
          id: crypto.randomUUID(),
          name: f.name,
          size: f.size,
          type: f.type || `.${ext}`,
          text,
          ts: Date.now(),
        });
      } catch (e) {
        console.warn("No pude leer", f.name, e);
      }
    }

    setBusy(false);
    setStatus(`Listo: ${docs.length} documento(s)`);
    onComplete?.(docs);
  };

  return (
    <div className="rounded-2xl border bg-white p-4 md:p-5">
      <div className="text-sm mb-3">
        Sube <strong>PDF, TXT/MD, CSV/JSON y Excel (XLS/XLSX)</strong>.
        <br />
        El análisis es local (en tu navegador); los textos se almacenan en{" "}
        <code>localStorage</code>.
      </div>

      <input
        type="file"
        multiple
        accept={ACCEPT}
        onChange={(e) => handleFiles(e.target.files)}
        className="block w-full text-sm"
      />

      <div className="text-xs text-slate-500 mt-2">
        {busy ? "Procesando…" : status}
      </div>
    </div>
  );
}
