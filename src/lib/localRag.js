// src/lib/localRag.js
// Carga y parsing local de documentos + almacenamiento en localStorage

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import Papa from "papaparse";
import * as XLSX from "xlsx";

// Fijar el worker por CDN para evitar bundlearlo (Netlify/Vite friendly)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

// ------ Utils de lectura ------
const readAsText = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => res(String(r.result || ""));
    r.readAsText(file);
  });

const readAsArrayBuffer = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => res(r.result);
    r.readAsArrayBuffer(file);
  });

// ------ Parsers por tipo ------
async function parsePDF(file) {
  const data = await readAsArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let out = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((t) => t.str).join(" ").replace(/\s+/g, " ");
    out.push(text);
  }
  return out.join("\n\n");
}

async function parseTXT(file) {
  return readAsText(file);
}

async function parseCSV(file) {
  const text = await readAsText(file);
  const parsed = Papa.parse(text, { skipEmptyLines: true });
  // Lo convertimos a texto simple (una fila por línea)
  const rows = (parsed.data || []).map((row) => row.join(" | "));
  return rows.join("\n");
}

async function parseXLSX(file) {
  const buf = await readAsArrayBuffer(file);
  const wb = XLSX.read(buf, { type: "array" });
  const texts = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(ws, { strip: true });
    texts.push(`--- Hoja: ${sheetName} ---\n${csv}`);
  }
  return texts.join("\n\n");
}

// ------ API pública ------
export async function parseFilesToDocs(files = []) {
  const docs = [];
  for (const f of files) {
    const name = f.name || "documento";
    const ext = name.toLowerCase().split(".").pop();

    try {
      let text = "";
      if (ext === "pdf") text = await parsePDF(f);
      else if (ext === "txt" || ext === "md") text = await parseTXT(f);
      else if (ext === "csv" || ext === "json") text = await parseCSV(f);
      else if (ext === "xls" || ext === "xlsx") text = await parseXLSX(f);
      else {
        // fallback: intentar como texto
        text = await parseTXT(f);
      }

      // Filtramos vacíos
      if (text && text.trim()) {
        docs.push({
          id: crypto.randomUUID(),
          name,
          size: f.size || 0,
          type: ext,
          text,
          addedAt: Date.now(),
        });
      }
    } catch (e) {
      console.warn(`No se pudo parsear ${name}:`, e);
    }
  }
  return docs;
}

const LS_KEY = "local_rag_docs_v1";

export function loadDocs() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDocs(newDocs = []) {
  const prev = loadDocs();
  const merged = [...prev, ...newDocs];
  localStorage.setItem(LS_KEY, JSON.stringify(merged));
  return merged;
}

export function clearDocs() {
  localStorage.removeItem(LS_KEY);
}

export function searchLocal(query, limit = 5) {
  // Búsqueda simple por scoring de palabras (naive)
  const q = (query || "").toLowerCase().split(/\s+/).filter(Boolean);
  const corpus = loadDocs();

  const scored = corpus
    .map((d) => {
      const text = (d.text || "").toLowerCase();
      const score = q.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
      return { ...d, score };
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}
