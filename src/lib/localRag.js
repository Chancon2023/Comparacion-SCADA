
// src/lib/localRag.js
// Mini-RAG local (browser) con soporte para PDF / TXT / CSV / XLSX.
// - Indexa en localStorage (no se sube nada).
// - Búsqueda con TF‑IDF simple y retorno de pasajes más relevantes.

/* eslint-disable no-undef */

// Utilidades pequeñas
const STORAGE_KEY = "scada_local_rag_index_v1";

function normalize(text) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s\.\,\-\_\(\)\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoChunks(text, chunkSize = 1200, overlap = 120) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    const slice = text.slice(i, end);
    chunks.push(slice);
    if (end === text.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}

// ---------- Lectura de archivos ----------
async function readTextFile(file) {
  const buf = await file.arrayBuffer();
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(buf);
}

async function readCSVFile(file) {
  // Carga papaparse solo si se usa
  const Papa = (await import(/* @vite-ignore */ "papaparse")).default;
  const text = await readTextFile(file);
  const parsed = Papa.parse(text, { header: true });
  const rows = parsed.data || [];
  return rows.map((r) => JSON.stringify(r)).join("\n");
}

async function readXLSXFile(file) {
  const XLSX = await import(/* @vite-ignore */ "xlsx");
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: "array" });
  let txt = "";
  workbook.SheetNames.forEach((name) => {
    const sheet = workbook.Sheets[name];
    txt += XLSX.utils.sheet_to_csv(sheet) + "\n";
  });
  return txt;
}

async function readPDFFile(file) {
  // Usamos pdfjs-dist de forma dinámica para evitar romper el build si falta
  try {
    const pdfjsLib = await import(/* @vite-ignore */ "pdfjs-dist/build/pdf");
    // worker
    try {
      const workerSrc = (await import(/* @vite-ignore */ "pdfjs-dist/build/pdf.worker.js?url")).default;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    } catch (e) {
      // si no podemos resolver el worker, seguimos en modo no worker
      // pdfjs podrá funcionar con worker inline en algunos entornos
    }

    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const strings = content.items.map((it) => it.str).join(" ");
      text += strings + "\n";
    }
    return text;
  } catch (err) {
    console.warn("PDF parse fallback (pdfjs-dist no disponible):", err);
    // fallback pobre: nombre + tamaño
    return `PDF(${file.name}) - no se pudo extraer texto en este entorno.`;
  }
}

// ---------- Indexado ----------
function tfidfIndex(chunks) {
  // Construye un índice TF‑IDF muy simple
  const docs = chunks.map((c, i) => ({ id: i, text: c, terms: normalize(c).split(" ") }));
  const df = new Map();
  docs.forEach((d) => {
    const seen = new Set(d.terms);
    seen.forEach((t) => {
      df.set(t, (df.get(t) || 0) + 1);
    });
  });
  const N = docs.length;
  return { docs, df, N };
}

function scoreQuery(query, index) {
  const qTerms = normalize(query).split(" ");
  const scores = new Map();
  index.docs.forEach((d) => {
    let s = 0;
    qTerms.forEach((t) => {
      if (!t) return;
      const tf = d.terms.filter((x) => x === t).length;
      const idf = Math.log((index.N + 1) / ((index.df.get(t) || 0) + 1));
      s += tf * idf;
    });
    scores.set(d.id, s);
  });
  return [...scores.entries()].sort((a, b) => b[1] - a[1]);
}

// Guarda / carga de localStorage
function saveIndex(index, meta = {}) {
  try {
    const payload = { meta, index };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (_) {}
}

function loadIndex() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

// ---------- API pública ----------

/**
 * loadDocs(files): procesa y arma el índice local en base a los archivos cargados.
 * Retorna: { ok, message }
 */
export async function loadDocs(files) {
  const chunks = [];
  const meta = [];

  for (const file of files) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    let text = "";
    if (ext === "txt" || ext === "md" || ext === "json") {
      text = await readTextFile(file);
    } else if (ext === "csv") {
      text = await readCSVFile(file);
    } else if (ext === "xlsx" || ext === "xls") {
      text = await readXLSXFile(file);
    } else if (ext === "pdf") {
      text = await readPDFFile(file);
    } else {
      text = await readTextFile(file);
    }

    const fileChunks = splitIntoChunks(text);
    fileChunks.forEach((c) => chunks.push(`[${file.name}]\n${c}`));
    meta.push({ name: file.name, size: file.size, type: file.type, chunks: fileChunks.length });
  }

  const index = tfidfIndex(chunks);
  saveIndex(index, { createdAt: Date.now(), files: meta });
  return { ok: true, message: `Indexados ${chunks.length} fragmentos de ${files.length} archivo(s).` };
}

/**
 * answerQuery(question): busca pasajes relevantes y genera una respuesta corta
 * basada en los pasajes top‑k. Retorna { answer, sources }.
 */
export async function answerQuery(question, k = 4) {
  const payload = loadIndex();
  if (!payload) {
    return { answer: "Aún no has cargado documentos. Usa el botón 'Cargar documentos' y vuelve a intentar.", sources: [] };
  }
  const { index } = payload;
  const scored = scoreQuery(question, index).slice(0, k);
  const sources = scored
    .filter(([, s]) => s > 0)
    .map(([id]) => index.docs.find((d) => d.id === id)?.text || "")
    .filter(Boolean);

  if (sources.length === 0) {
    return { answer: "No encontré coincidencias claras en los documentos cargados. Intenta con otra redacción o carga más archivos.", sources: [] };
  }

  // Ensamblado muy simple: une pasajes relevantes y acota longitud
  const merged = sources.join("\n—\n").slice(0, 1400);
  const answer =
    `Respuesta basada en tus documentos:\n\n${merged}\n\n` +
    `Sugerencia: Si necesitas mayor precisión, haz preguntas más específicas (norma, capítulo o requisito).`;

  return { answer, sources };
}

// Limpia índice
export function clearIndex() {
  localStorage.removeItem(STORAGE_KEY);
}
