// src/lib/localRag.js
// Carga/parseo de documentos y RAG simple (BM25-like muy básico)

import Papa from "papaparse";

// Utilities
const textFromArrayBuffer = (ab) => new TextDecoder("utf-8").decode(new Uint8Array(ab));
const normalize = (s) =>
  (s || "")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s\-_.:,;()]/gu, "")
    .trim()
    .toLowerCase();

export async function parseFilesToDocs(files = []) {
  const docs = [];
  for (const file of files) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    try {
      if (ext === "pdf") {
        const ab = await file.arrayBuffer();
        const text = await extractPdfText(ab);
        docs.push({ id: crypto.randomUUID(), name: file.name, type: "pdf", text });
      } else if (ext === "xlsx" || ext === "xls") {
        const ab = await file.arrayBuffer();
        const text = await extractExcelText(ab);
        docs.push({ id: crypto.randomUUID(), name: file.name, type: "excel", text });
      } else if (ext === "csv") {
        const txt = await file.text();
        const parsed = Papa.parse(txt, { header: true });
        const text = JSON.stringify(parsed.data);
        docs.push({ id: crypto.randomUUID(), name: file.name, type: "csv", text });
      } else if (ext === "json") {
        const txt = await file.text();
        // minimiza para ahorrar espacio
        const text = JSON.stringify(JSON.parse(txt));
        docs.push({ id: crypto.randomUUID(), name: file.name, type: "json", text });
      } else {
        // txt / md / otros legibles como texto
        const txt = await file.text();
        docs.push({ id: crypto.randomUUID(), name: file.name, type: "text", text: txt });
      }
    } catch (e) {
      console.warn("No pude leer", file.name, e);
    }
  }
  return docs;
}

// --- PDF (pdfjs-dist via import dinámico + worker CDN) ---
async function extractPdfText(arrayBuffer) {
  // Import ESM legacy compatible con Vite/Rollup/Netlify
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Usa worker por CDN (evita que el bundler lo resuelva)
  pdfjs.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/legacy/build/pdf.worker.min.js";

  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let all = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const str = content.items.map((it) => ("str" in it ? it.str : "")).join(" ");
    all.push(str);
  }
  return all.join("\n");
}

// --- Excel ---
async function extractExcelText(arrayBuffer) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const out = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    // lo convertimos a CSV y lo apilamos
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ",", RS: "\n" });
    out.push(`## Hoja: ${name}\n${csv}`);
  }
  return out.join("\n\n");
}

// Persistencia local
const LS_KEY = "local_docs_v1";

export function saveDocs(docs) {
  const slim = docs.map((d) => ({ ...d, text: d.text })); // guardamos todo el texto
  localStorage.setItem(LS_KEY, JSON.stringify(slim));
}

export function loadDocs() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function clearDocs() {
  localStorage.removeItem(LS_KEY);
}

// --- RAG simple: búsqueda por similitud de coseno + TF ---
export function answerQuery(query, docs, { maxSnippets = 3 } = {}) {
  const q = normalize(query);
  if (!q || !docs?.length) return { answer: "", sources: [] };

  const qTokens = tokenSet(q);
  const scored = [];
  for (const d of docs) {
    const body = normalize(d.text);
    const score = cosineScore(qTokens, tokenSet(body));
    if (score > 0) scored.push({ doc: d, score });
  }
  scored.sort((a, b) => b.score - a.score);

  const picked = scored.slice(0, Math.min(maxSnippets, scored.length));
  const answer =
    picked.length === 0
      ? "No encontré coincidencias en los documentos cargados."
      : picked
          .map(
            (s, i) =>
              `(${i + 1}) [${s.doc.name}] ${makeSnippet(s.doc.text, qTokens, 420)}`
          )
          .join("\n\n");

  return { answer, sources: picked.map((p) => p.doc.name) };
}

// Helpers de similitud
function tokenSet(text) {
  return (text || "")
    .split(/\s+/)
    .filter(Boolean)
    .reduce((m, t) => (m.set(t, (m.get(t) || 0) + 1), m), new Map());
}

function cosineScore(aMap, bMap) {
  let dot = 0,
    aLen = 0,
    bLen = 0;
  for (const [, v] of aMap) aLen += v * v;
  for (const [, v] of bMap) bLen += v * v;
  for (const [t, v] of aMap) {
    const w = bMap.get(t) || 0;
    dot += v * w;
  }
  const denom = Math.sqrt(aLen) * Math.sqrt(bLen) || 1;
  return dot / denom;
}

function makeSnippet(text, qTokens, maxLen = 420) {
  const low = text.toLowerCase();
  let idx = -1;
  for (const [tok] of qTokens) {
    const j = low.indexOf(tok.toLowerCase());
    if (j >= 0 && (idx < 0 || j < idx)) idx = j;
  }
  if (idx < 0) idx = 0;
  const start = Math.max(0, idx - Math.floor(maxLen / 3));
  const snip = text.slice(start, start + maxLen).replace(/\s+/g, " ").trim();
  return (start > 0 ? "…" : "") + snip + (start + maxLen < text.length ? "…" : "");
}
