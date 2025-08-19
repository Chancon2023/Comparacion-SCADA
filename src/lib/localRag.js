// src/lib/localRag.js
import { Document as FlexDoc } from "flexsearch";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/build/pdf";
import * as XLSX from "xlsx";

// Configurar worker de pdfjs para que Vite lo empaquete correctamente
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

export function createIndex() {
  // Índice con almacenamiento de documentos para poder mostrar citas
  const index = new FlexDoc({
    document: {
      id: "id",
      index: ["body", "title", "source"],
      store: ["id", "body", "title", "source"],
    },
    tokenize: "forward",
    cache: true,
  });
  return index;
}

export async function fileToChunks(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  let text = "";

  if (ext === "pdf") text = await pdfToText(file);
  else if (ext === "xlsx" || ext === "xls") text = await xlsxToText(file);
  else if (["txt", "md", "csv", "json"].includes(ext)) text = await file.text();
  else throw new Error(`Formato no soportado: .${ext}`);

  return chunkText(text, 900, 120).map((body, i) => ({
    id: `${file.name}-${i}`,
    title: file.name,
    source: file.name,
    body,
  }));
}

// -------- Extractores --------

async function pdfToText(file) {
  const url = URL.createObjectURL(file);
  const pdf = await getDocument(url).promise;
  let text = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map((i) => i.str).join(" ") + "\\n";
  }
  URL.revokeObjectURL(url);
  return text;
}

function xlsxToText(file) {
  const wb = XLSX.read(file, { type: "array" });
  return wb.SheetNames.map((name) => {
    const sheet = XLSX.utils.sheet_to_csv(wb.Sheets[name]);
    return `# ${name}\\n${sheet}`;
  }).join("\\n");
}

function chunkText(t, size = 900, overlap = 120) {
  const words = t.replace(/\\s+/g, " ").split(" ");
  const chunks = [];
  for (let i = 0; i < words.length; i += size - overlap) {
    chunks.push(words.slice(i, i + size).join(" "));
  }
  return chunks;
}

// --- “Respuesta” sin LLM: juntar fragmentos con coincidencias ---

export function answerFromSnippets(q, snippets) {
  const top = snippets.slice(0, 5);
  const bullets = top.map(
    (s) => `- ${highlight(s.body, q)} _(fuente: ${s.source})_`
  );
  return (
    `Respuesta basada en los documentos cargados:\\n\\n` +
    bullets.join("\\n") +
    `\\n\\nSugerencia: si necesitas mayor precisión, sube documentos más específicos o pregunta algo más concreto.`
  );
}

function highlight(text, q) {
  const terms = q.toLowerCase().split(/\\W+/).filter(Boolean);
  let out = text;
  for (const t of terms) {
    const re = new RegExp(`(${escapeReg(t)})`, "ig");
    out = out.replace(re, "<b>$1</b>");
  }
  const limit = 500;
  return out.length > limit ? out.slice(0, limit) + "…" : out;
}

function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
}
