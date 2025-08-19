// src/lib/localRag.js

const LS_KEY = "scada_local_corpus_v1";

// ----- util de almacenamiento -----
export function readCorpus() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeCorpus(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr || []));
}

export function clearCorpus() {
  localStorage.removeItem(LS_KEY);
}

export function getLocalCorpusCount() {
  return readCorpus().length;
}

// ----- carga y parsing de archivos -----
export async function addFilesToLocalCorpus(files) {
  const corpus = readCorpus();
  let added = 0;
  const errors = [];

  for (const f of files) {
    try {
      const text = await extractTextFromFile(f);
      if (!text || !text.trim()) {
        errors.push({ file: f.name, reason: "Vacío o no se pudo leer" });
        continue;
      }
      corpus.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: f.name,
        size: f.size,
        type: f.type || guessType(f.name),
        text: text.slice(0, 2_000_000), // tope por si suben PDFs gigantes
        addedAt: new Date().toISOString(),
      });
      added++;
    } catch (e) {
      errors.push({ file: f.name, reason: e?.message || String(e) });
    }
  }

  writeCorpus(corpus);
  return { added, errors };
}

function guessType(name) {
  const ext = name.split(".").pop()?.toLowerCase();
  const map = { pdf: "application/pdf", txt: "text/plain", md: "text/markdown",
    csv: "text/csv", json: "application/json", xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
  return map[ext] || "application/octet-stream";
}

async function extractTextFromFile(file) {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "txt" || ext === "md" || ext === "csv" || ext === "json") {
    return await file.text();
  }

  if (ext === "pdf") {
    // PDF.js ESM (sin instalar nada extra en tu proyecto: import dinámico)
    const buf = await file.arrayBuffer();
    const pdfjs = await import("pdfjs-dist/build/pdf");
    // worker vía CDN para evitar warnings en Vite/Netlify
    pdfjs.GlobalWorkerOptions.workerSrc =
      "https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.mjs";
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    let out = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((it) => it.str).filter(Boolean);
      out += strings.join(" ") + "\n";
    }
    return out;
  }

  if (ext === "xls" || ext === "xlsx") {
    // SheetJS (XLS/XLSX) vía import dinámico (ESM)
    const { read, utils } = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = read(buf, { type: "array" });
    let text = "";
    wb.SheetNames.forEach((name) => {
      const ws = wb.Sheets[name];
      const csv = utils.sheet_to_csv(ws, { FS: ",", RS: "\n" });
      text += `\n=== Hoja: ${name} ===\n${csv}\n`;
    });
    return text;
  }

  // fallback: intenta como texto
  try {
    return await file.text();
  } catch {
    return "";
  }
}

// ----- búsqueda muy simple (keyword matching) -----
export function searchCorpus(query, { topK = 5 } = {}) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return [];

  const corpus = readCorpus();
  const tokens = q.split(/\s+/).filter(Boolean);

  const scored = corpus
    .map((doc) => {
      const t = (doc.text || "").toLowerCase();
      let score = 0;
      for (const tok of tokens) {
        const matches = t.split(tok).length - 1;
        score += matches;
      }
      return { doc, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(({ doc, score }) => ({
    name: doc.name,
    snippet: makeSnippet(doc.text, tokens, 240),
    score,
  }));
}

function makeSnippet(text, tokens, maxLen) {
  const lower = text.toLowerCase();
  let idx = -1;
  for (const t of tokens) {
    const pos = lower.indexOf(t);
    if (pos >= 0) { idx = pos; break; }
  }
  if (idx < 0) idx = 0;
  const start = Math.max(0, idx - Math.floor(maxLen / 2));
  return (text || "").slice(start, start + maxLen).replace(/\s+/g, " ");
}
