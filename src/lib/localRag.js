// src/lib/localRag.js
// Motor RAG local (mejorado):
// - Indexa PDFs/TXT/CSV/JSON/Excel (parsing en UploadPanel)
// - Guarda chunks + metadata en localStorage
// - Búsqueda híbrida: BM25 + Embeddings (MiniLM) + MMR
// - Respuesta extractiva con modelo QA local (XLM-R SQuAD2)
// - Todo 100% local (sin APIs).

import { loadLocalAI, getLocalAISatus, embed, embedBatch, rerankWithEmbeddings, qa, selectMMR } from "./qaLocal";

const KEY = "localRAG:v2:docs";

// --------------------------- Storage --------------------------------
export function saveDocuments(docs) {
  localStorage.setItem(KEY, JSON.stringify(docs));
}

export function loadDocuments() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("loadDocuments error", e);
    return [];
  }
}

export function clearDocuments() {
  localStorage.removeItem(KEY);
}

// --------------------------- Chunks & Index -------------------------
// Divide texto en chunks cortos ~800-1200 caracteres
function chunkText(text, { min = 800, max = 1200, overlap = 150 } = {}) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + max, text.length);
    // intenta cortar en punto
    const slice = text.slice(i, end);
    let cut = slice.lastIndexOf(". ");
    if (cut < min) cut = slice.lastIndexOf("\n");
    if (cut < min) cut = slice.lastIndexOf(" ");
    if (cut < min) cut = max;
    out.push(text.slice(i, i + cut).trim());
    i = i + cut - overlap;
    if (i < 0) i = 0;
  }
  return out.filter(Boolean);
}

function tokenize(text) {
  return (text.toLowerCase().match(/[a-záéíóúñ0-9\/\.\-_%]+/gi) || []);
}

// BM25 simple
function buildBM25Index(chunks) {
  const N = chunks.length;
  const docFreq = new Map();
  const tokenized = chunks.map(c => tokenize(c.text));
  for (const toks of tokenized) {
    const unique = new Set(toks);
    for (const t of unique) docFreq.set(t, (docFreq.get(t) || 0) + 1);
  }
  const idfs = new Map();
  for (const [t, df] of docFreq) {
    idfs.set(t, Math.log((N - df + 0.5) / (df + 0.5) + 1));
  }
  function score(query, idx) {
    const qToks = tokenize(query);
    const toks = tokenized[idx];
    const freq = new Map();
    for (const t of toks) freq.set(t, (freq.get(t) || 0) + 1);
    const k1 = 1.5, b = 0.75;
    const avgdl = tokenized.reduce((a, b) => a + b.length, 0) / N;
    const dl = toks.length;
    let s = 0;
    for (const t of qToks) {
      const f = freq.get(t) || 0;
      const idf = idfs.get(t) || 0;
      s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * dl / avgdl));
    }
    return s;
  }
  return { score };
}

// Construye el índice híbrido (BM25 + embeddings lazies)
export async function buildIndexFromRaw(docs = []) {
  // docs: [{id, name, type, text}]
  const chunks = [];
  let id = 0;
  for (const d of docs) {
    const parts = chunkText(d.text);
    for (const c of parts) {
      chunks.push({ id: id++, text: c, meta: { source: d.name } });
    }
  }
  const bm25 = buildBM25Index(chunks);
  return { chunks, bm25 };
}

// --------------------------- Search & Answer ------------------------
export async function answer(question, { smart = true, topK = 6 } = {}) {
  const docs = loadDocuments();
  if (!docs.length) {
    return {
      text: "Aún no has cargado documentos. Usa el botón “Cargar documentos” y luego pregunta de nuevo.",
      sources: [],
    };
  }

  // Build (o cachear) índice sencillo en cada consulta (rápido en navegador)
  const { chunks, bm25 } = await buildIndexFromRaw(docs);

  // 1) Ranking lexical (BM25)
  let prelim = chunks.map(c => ({
    ...c,
    bm25: bm25.score(question, c.id),
  }));
  prelim.sort((a, b) => b.bm25 - a.bm25);
  prelim = prelim.slice(0, Math.max(20, topK * 2));

  // 2) Si smart, reranking con embeddings + MMR
  let finalCtx = prelim.slice(0, topK);
  if (smart) {
    await loadLocalAI();
    const reranked = await rerankWithEmbeddings(question, prelim, { topK: Math.max(10, topK * 2) });
    finalCtx = selectMMR(reranked, { topK, lambda: 0.65 });
  }

  const context = finalCtx.map(c => c.text).join("\n\n");
  const sources = finalCtx.map(c => ({
    source: c.meta?.source || "desconocido",
    preview: c.text.slice(0, 200) + (c.text.length > 200 ? "…" : ""),
  }));

  if (!smart) {
    // Respuesta determinista (no IA): extracto + bullets
    const snippet = context.slice(0, 800);
    return {
      text:
        "Respuesta basada en tus documentos (modo rápido, sin IA):\n\n" +
        snippet +
        (context.length > 800 ? "…" : ""),
      sources,
    };
  }

  // 3) QA extractivo local (modelo)
  try {
    const res = await qa(question, context);
    let ans = res?.answer?.trim();
    const conf = typeof res?.score === "number" ? res.score : 0;
    if (!ans || conf < 0.05) {
      // fallback cuando el modelo no encuentra span claro
      return {
        text:
          "No encontré una respuesta extractiva clara en los fragmentos. " +
          "Revisa las fuentes destacadas o formula la pregunta con más contexto.",
        sources,
      };
    }
    return {
      text: ans + `\n\n(confianza: ${(conf * 100).toFixed(1)}%)`,
      sources,
    };
  } catch (e) {
    console.warn("QA local falló, devolviendo resumen", e);
    const snippet = context.slice(0, 800);
    return {
      text:
        "Respuesta basada en tus documentos (resumen porque el modelo no respondió):\n\n" +
        snippet +
        (context.length > 800 ? "…" : ""),
      sources,
    };
  }
}
