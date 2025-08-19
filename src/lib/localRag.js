// src/lib/localRag.js
import MiniSearch from "minisearch";

let mini = null;
let docStore = [];

// Utilidad: leer archivo como ArrayBuffer
const readAsArrayBuffer = (file) =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsArrayBuffer(file);
  });

// Utilidad: leer archivo como texto
const readAsText = (file) =>
  new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsText(file);
  });

async function parsePDF(file) {
  const data = await readAsArrayBuffer(file);
  // import dinámico para evitar bundling duro
  const pdfjs = await import("pdfjs-dist/build/pdf.js");
  // worker (no estrictamente necesario si no cargas worker dedicado)
  // Si te da warning, ignóralo: solo extraemos texto
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;

  let fullText = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => it.str).join(" ");
    fullText += strings + "\n";
  }
  return fullText;
}

async function parseXLS(file) {
  const ab = await readAsArrayBuffer(file);
  const XLSX = await import("xlsx");
  const wb = XLSX.read(ab, { type: "array" });
  let out = "";
  wb.SheetNames.forEach((s) => {
    const json = XLSX.utils.sheet_to_json(wb.Sheets[s], { header: 1 });
    json.forEach((row) => (out += row.join(" ") + "\n"));
    out += "\n";
  });
  return out;
}

async function parseCSV(file) {
  const text = await readAsText(file);
  const Papa = await import("papaparse");
  const parsed = Papa.default.parse(text, { skipEmptyLines: true });
  return parsed.data.map((r) => r.join(" ")).join("\n");
}

async function parseJSON(file) {
  const text = await readAsText(file);
  try {
    const obj = JSON.parse(text);
    return typeof obj === "string" ? obj : JSON.stringify(obj);
  } catch {
    return text;
  }
}

async function parseTXT(file) {
  return readAsText(file);
}

async function fileToText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return parsePDF(file);
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return parseXLS(file);
  if (name.endsWith(".csv")) return parseCSV(file);
  if (name.endsWith(".json")) return parseJSON(file);
  // txt / md por defecto
  return parseTXT(file);
}

/**
 * Carga archivos, extrae texto y construye el índice.
 * @param {File[]} files
 * @returns {Promise<{count:number, fragments:number}>}
 */
export async function loadDocs(files) {
  const docs = [];
  let idCounter = 1;

  for (const f of files) {
    try {
      const text = await fileToText(f);
      // fragmentar en trozos ~1000 caracteres para mejor recall
      const chunkSize = 1000;
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        docs.push({
          id: `${idCounter++}`,
          source: f.name,
          text: chunk
        });
      }
    } catch (e) {
      console.warn("No pude parsear", f.name, e);
    }
  }

  // guarda en memoria
  docStore = docs;

  // construye índice
  mini = new MiniSearch({
    fields: ["text", "source"],
    storeFields: ["text", "source"],
    searchOptions: {
      boost: { text: 2 },
      fuzzy: 0.1,
      prefix: true
    }
  });
  mini.addAll(docs);

  // guarda un eco mínimo en localStorage (opcional)
  try {
    localStorage.setItem(
      "localrag_meta",
      JSON.stringify({ count: docs.length, at: Date.now() })
    );
  } catch {}

  return { count: new Set(docs.map(d => d.source)).size, fragments: docs.length };
}

/**
 * Limpia índice y documentos.
 */
export function clearIndex() {
  mini = null;
  docStore = [];
  try { localStorage.removeItem("localrag_meta"); } catch {}
}

/**
 * Busca y arma una respuesta citando los fragmentos más relevantes.
 * @param {string} question
 */
export async function answerQuery(question) {
  if (!mini || docStore.length === 0) {
    return {
      answer: "Primero sube documentos con el botón 'Cargar documentos'.",
      sources: []
    };
  }

  const results = mini.search(question, { limit: 5 });
  if (results.length === 0) {
    return { answer: "No encontré algo directo en los documentos.", sources: [] };
  }

  // arma una respuesta simple concatenando los fragmentos top
  const top = results.slice(0, 3);
  const bullets = top.map(r => {
    const d = docStore.find(x => x.id === r.id);
    const snippet = (d?.text || "").slice(0, 300).replace(/\s+/g, " ");
    return `• ${d?.source || "doc"}: ${snippet}…`;
  }).join("\n");

  const answer =
    `Esto es lo más relevante que encontré:\n\n${bullets}\n\n` +
    `Sugerencia: si necesitas una respuesta normativa, indica el artículo/tema (p.ej. "NTSyCS sección xxxx").`;

  const sources = top.map(r => {
    const d = docStore.find(x => x.id === r.id);
    return { source: d?.source || "doc", id: r.id };
  });

  return { answer, sources };
}
