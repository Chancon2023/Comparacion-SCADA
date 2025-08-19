// src/lib/localRag.js
// Browser-only local RAG: parse PDF/TXT/CSV/MD/JSON/XLS/XLSX in the client.
// No new npm deps: we load pdf.js & xlsx via ESM CDN at runtime.

const STORAGE_KEY = "RAG_DOCS_V1";

export function loadDocs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("loadDocs error", e);
    return [];
  }
}

export function saveDocs(docs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch (e) {
    console.error("saveDocs error", e);
  }
}

function extOf(name='') {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i+1).toLowerCase() : "";
}

async function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    reader.readAsText(file);
  });
}

async function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    reader.readAsArrayBuffer(file);
  });
}

// --- PDF via pdf.js from CDN (ESM) ---
async function pdfToText(file) {
  // pdfjs v4.x
  const pdfjsLib = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.3.136/build/pdf.min.mjs");
  // set worker
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.3.136/build/pdf.worker.min.mjs";

  const data = await readAsArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  let text = "";
  const maxPages = Math.min(pdf.numPages, 200); // prevent huge PDFs
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => it.str);
    text += strings.join(" ") + "\n";
  }
  return text;
}

// --- Excel via SheetJS from CDN (ESM) ---
async function excelToText(file) {
  // +esm variant works in browser modules
  const XLSX = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm");
  const data = await readAsArrayBuffer(file);
  const wb = XLSX.read(data, { type: "array" });
  let out = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    // Convert to CSV and then plain text
    const csv = XLSX.utils.sheet_to_csv(ws);
    out.push(`# ${sheetName}\n${csv}`);
  }
  return out.join("\n\n");
}

async function jsonToText(file) {
  try {
    const raw = await readAsText(file);
    const obj = JSON.parse(raw);
    // Pretty print keys & values (flatten simple objects)
    return typeof obj === "object" ? JSON.stringify(obj, null, 2) : String(obj);
  } catch {
    return await readAsText(file);
  }
}

export async function fileToText(file) {
  const type = (file.type || "").toLowerCase();
  const extension = extOf(file.name);

  // Broad type checks then fall back to extension
  if (type.includes("pdf") || extension === "pdf") return pdfToText(file);

  if (
    type.includes("sheet") ||
    type.includes("excel") ||
    ["xlsx", "xls"].includes(extension)
  ) return excelToText(file);

  if (
    type.includes("csv") ||
    extension === "csv"
  ) return await readAsText(file);

  if (type.includes("json") || extension === "json") return jsonToText(file);

  // plain text / markdown
  return await readAsText(file);
}

// Turn Files into internal docs [{id, name, text}]
export async function parseFilesToDocs(fileList) {
  const docs = [];
  const arr = Array.from(fileList || []);
  for (const f of arr) {
    try {
      const text = await fileToText(f);
      if (text && text.trim()) {
        docs.push({
          id: crypto.randomUUID(),
          name: f.name,
          text,
        });
      }
    } catch (e) {
      console.warn("Error parsing file", f?.name, e);
    }
  }
  return docs;
}

// --- Very small retriever: split in chunks and score by token overlap ---
function normalize(s="") {
  return s
    .normalize("NFKD")
    .replace(/[^\w\sáéíóúñüÁÉÍÓÚÑÜ/.-]/g, " ")
    .toLowerCase();
}

function tokenize(s="") {
  return normalize(s).split(/\s+/).filter(Boolean);
}

function chunkText(text, chunkSize = 1200, overlap = 120) {
  const tokens = tokenize(text);
  const chunks = [];
  for (let i = 0; i < tokens.length; i += (chunkSize - overlap)) {
    const slice = tokens.slice(i, i + chunkSize);
    if (!slice.length) break;
    chunks.push(slice.join(" "));
  }
  return chunks;
}

function score(query, chunk) {
  const q = new Set(tokenize(query));
  const c = tokenize(chunk);
  let hits = 0;
  for (const t of c) if (q.has(t)) hits++;
  // normalize by length
  return hits / Math.sqrt(c.length + 1);
}

export function buildIndex(docs) {
  // Build array of {docId, name, chunk, score?}
  const index = [];
  for (const d of docs) {
    const chunks = chunkText(d.text);
    for (const ch of chunks) index.push({ docId: d.id, name: d.name, chunk: ch });
  }
  return index;
}

export function searchIndex(index, query, k = 6) {
  const scored = index.map((it) => ({ ...it, _score: score(query, it.chunk) }));
  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, k).filter(x => x._score > 0);
}

export function snippet(s, n = 320) {
  if (s.length <= n) return s;
  return s.slice(0, n) + "...";
}

export async function answerWithLocalRag(question, docs) {
  if (!docs?.length) {
    return {
      answer:
        "Aún no has cargado documentos. Sube normativa/plantillas con el botón **Cargar documentos** y vuelve a preguntar.",
      sources: [],
    };
  }
  const index = buildIndex(docs);
  const hits = searchIndex(index, question, 6);

  if (!hits.length) {
    return {
      answer:
        "No encontré coincidencias directas en los documentos cargados. Si lo deseas, puedo sugerir términos para que investigues en la web o subir más documentos relacionados.",
      sources: [],
    };
  }
  // Compose a simple answer with top snippets
  const bullets = hits.map(
    (h, i) => `• **${h.name}** → ${snippet(h.chunk, 220)}`
  );
  const answer = [
    "Con base en los documentos cargados, estos son los pasajes más relevantes para tu consulta:",
    "",
    ...bullets,
    "",
    "Si necesitas, puedo refinar la búsqueda con más palabras clave o filtrar por un documento específico."
  ].join("\n");

  const sources = hits.map((h) => ({
    name: h.name,
    excerpt: snippet(h.chunk, 280),
    score: h._score,
  }));
  return { answer, sources };
}