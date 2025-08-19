// src/lib/localRag.js
// RAG local con parsing de PDF/Excel/TXT y recuperación BM25+TFIDF

import * as pdfjsLib from "pdfjs-dist";
import PdfWorker from "pdfjs-dist/build/pdf.worker?worker";
import * as XLSX from "xlsx";

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

const STORAGE_KEY = "rag_docs_v2";

// --------------------------- Utils ---------------------------

const normWords = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9áéíóúñü\s.-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (s) => normWords(s).split(/\s+/).filter(Boolean);

// cortes por títulos, bullets y punto final
function smartSplit(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const blocks = [];
  let buf = [];

  const pushBuf = () => {
    if (!buf.length) return;
    blocks.push(buf.join(" ").replace(/\s+/g, " ").trim());
    buf = [];
  };

  for (const line of lines) {
    const isTitle = /^(\d+(\.\d+)+|cap[ií]tulo|secci[oó]n|anexo|parte)\b/i.test(line);
    const isBullet = /^[-–•●\*\u2022]/.test(line);
    if (isTitle && buf.length) pushBuf();
    buf.push(line);
    if (isTitle || isBullet) pushBuf();
  }
  pushBuf();

  // si quedó muy granular, juntamos por punto
  const out = [];
  for (const b of blocks) {
    const sents = b.split(/(?<=\.)\s+/);
    for (const s of sents) {
      if (s.trim()) out.push(s.trim());
    }
  }
  return out;
}

function chunkText(text, meta, target = 900, overlap = 160) {
  const segs = smartSplit(text);
  const chunks = [];
  let buf = [];

  const flush = () => {
    if (!buf.length) return;
    const joined = buf.join(" ").trim();
    if (joined) chunks.push({ ...meta, text: joined });
    buf = [];
  };

  for (const s of segs) {
    const next = [...buf, s].join(" ");
    if (next.length > target && buf.length) {
      flush();
      // overlap: reinsertamos el final del chunk anterior
      const back = s.slice(Math.max(0, s.length - overlap));
      buf = [back];
    }
    buf.push(s);
  }
  flush();
  return chunks;
}

// --------------------------- Parsers ---------------------------

async function parsePdf(file) {
  const ab = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  const all = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const text = content.items.map((i) => ("str" in i ? i.str : i?.item?.str) || "").join(" ");
    all.push({ page: p, text });
  }
  return all;
}

async function parseExcel(file) {
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: "array" });
  const out = [];
  wb.SheetNames.forEach((name) => {
    const sheet = wb.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: " ", RS: "\n" });
    out.push({ page: name, text: csv });
  });
  return out;
}

async function parseTextLike(file) {
  const txt = await file.text();
  return [{ page: 1, text: txt }];
}

// --------------------------- Public API: parse + persist ---------------------------

export async function parseFilesToDocs(fileList) {
  const files = Array.from(fileList || []);
  const docs = [];

  for (const f of files) {
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    let pages = [];
    if (ext === "pdf") pages = await parsePdf(f);
    else if (["xls", "xlsx"].includes(ext)) pages = await parseExcel(f);
    else pages = await parseTextLike(f);

    const baseMeta = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: f.name,
      source: f.name,
      uploadedAt: new Date().toISOString(),
    };

    let chunks = [];
    for (const p of pages) {
      const meta = { ...baseMeta, page: p.page };
      chunks = chunks.concat(chunkText(p.text, meta));
    }
    docs.push({ ...baseMeta, chunks });
  }
  return docs;
}

export function saveDocs(docs) {
  const current = loadDocs();
  const merged = [...current, ...docs];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged.length;
}

export function loadDocs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearDocs() {
  localStorage.removeItem(STORAGE_KEY);
}

// --------------------------- Index + Search ---------------------------

function buildIndex(allChunks) {
  // doc = chunk
  const docs = allChunks.map((c, i) => ({ id: i, text: c.text, meta: c }));
  const N = docs.length;
  const df = new Map(); // term -> doc freq
  const tf = new Map(); // docId -> Map(term -> count)
  const len = new Map();

  for (const d of docs) {
    const counts = new Map();
    const seen = new Set();
    for (const t of tokenize(d.text)) {
      counts.set(t, (counts.get(t) || 0) + 1);
      if (!seen.has(t)) {
        df.set(t, (df.get(t) || 0) + 1);
        seen.add(t);
      }
    }
    tf.set(d.id, counts);
    len.set(d.id, Array.from(counts.values()).reduce((a, b) => a + b, 0));
  }

  const avgdl = Array.from(len.values()).reduce((a, b) => a + b, 0) / Math.max(1, N);
  return { docs, N, df, tf, len, avgdl };
}

function scoreBM25(query, index, k1 = 1.5, b = 0.75) {
  const q = tokenize(query);
  const scores = new Map();
  const { docs, N, df, tf, len, avgdl } = index;

  for (const d of docs) {
    let s = 0;
    const L = len.get(d.id) || 1;
    for (const term of q) {
      const n_q = df.get(term) || 0;
      if (!n_q) continue;
      const idf = Math.log(1 + (N - n_q + 0.5) / (n_q + 0.5));
      const f = (tf.get(d.id)?.get(term) || 0);
      s += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + b * (L / avgdl))));
    }
    if (s) scores.set(d.id, s);
  }
  return scores;
}

function tfidfBoost(query, docText) {
  const q = tokenize(query);
  const d = tokenize(docText);
  if (!q.length || !d.length) return 0;
  let hit = 0;
  for (const t of q) if (d.includes(t)) hit++;
  return hit / q.length;
}

function mmr(ranked, allVec, alpha = 0.75, topK = 8) {
  const picked = [];
  const sim = (a, b) => {
    const ta = new Set(tokenize(allVec[a].text));
    const tb = new Set(tokenize(allVec[b].text));
    const inter = [...ta].filter((x) => tb.has(x)).length;
    return inter / Math.sqrt(Math.max(1, ta.size * tb.size));
    };
  const ids = ranked.map((r) => r.id);
  while (picked.length < Math.min(topK, ids.length)) {
    let best = null;
    let bestScore = -Infinity;
    for (const id of ids) {
      if (picked.includes(id)) continue;
      const rel = ranked.find((r) => r.id === id)?.score || 0;
      let div = 0;
      for (const p of picked) div = Math.max(div, sim(id, p));
      const s = alpha * rel - (1 - alpha) * div;
      if (s > bestScore) {
        bestScore = s;
        best = id;
      }
    }
    if (best == null) break;
    picked.push(best);
  }
  return picked;
}

export function searchDocs(query, k = 8) {
  const store = loadDocs();
  const chunks = store.flatMap((d) => d.chunks.map((c) => ({ ...c, title: d.title, source: d.source })));
  if (!chunks.length) return [];
  const index = buildIndex(chunks);
  const bm = scoreBM25(query, index);
  const scored = index.docs
    .map((d) => {
      const score = (bm.get(d.id) || 0) + 0.25 * tfidfBoost(query, d.text);
      return { id: d.id, score, ...d.meta };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(k * 3, 12));

  const diverseIds = mmr(scored, index.docs, 0.75, k);
  return diverseIds
    .map((id) => scored.find((s) => s.id === id))
    .filter(Boolean);
}

export function answerQuestion(query, k = 6) {
  const hits = searchDocs(query, k);
  if (!hits.length) {
    return {
      text:
        "Aún no encuentro coincidencias en los documentos cargados. Sube PDFs/Excel o intenta con otra formulación (ej.: “requisitos NTSyCS para protecciones en subestaciones”).",
      snippets: [],
    };
  }
  const bullets = hits.map((h) => {
    const where = h.page ? ` · pág. ${h.page}` : "";
    return `• ${h.text}\n  — ${h.title}${where}`;
  });

  const text =
    `Respuesta basada en tus documentos (RAG local):\n\n` +
    bullets.slice(0, k).join("\n\n") +
    `\n\nSugerencia: si necesitas decisión/criterio, pide “síntesis y recomendación” para que agrupe los puntos relevantes.`;

  return { text, snippets: hits };
}
