import Papa from "papaparse";
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const STORAGE_KEY = "local_rag_docs_v1";

async function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function fileToText(file) {
  const name = file.name.toLowerCase();
  const ext = name.split(".").pop();

  if (ext === "pdf") {
    const buf = await fileToArrayBuffer(file);
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((i) => i.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  }

  if (ext === "csv") {
    const text = await file.text();
    const parsed = Papa.parse(text, { header: false });
    return parsed.data.map((row) => row.join(",")).join("\n");
  }

  if (ext === "json") {
    const text = await file.text();
    try {
      const obj = JSON.parse(text);
      return typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
    } catch (e) {
      return text;
    }
  }

  if (ext === "xlsx" || ext === "xls") {
    const buf = await fileToArrayBuffer(file);
    const wb = XLSX.read(buf, { type: "array" });
    let out = "";
    wb.SheetNames.forEach((sn) => {
      const sheet = wb.Sheets[sn];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      out += `# ${sn}\n${csv}\n`;
    });
    return out;
  }

  return await file.text();
}

export async function parseFilesToDocs(fileList) {
  const files = Array.from(fileList || []);
  const docs = [];
  for (const file of files) {
    const text = await fileToText(file);
    docs.push({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      name: file.name,
      text,
      meta: { size: file.size, type: file.type }
    });
  }
  saveDocs(docs);
  return docs;
}

export function saveDocs(docs) {
  try {
    const existing = loadDocs();
    const merged = [...existing, ...docs].slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn("No se pudo guardar documentos en localStorage:", e);
  }
}

export function loadDocs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearDocs() {
  localStorage.removeItem(STORAGE_KEY);
}
