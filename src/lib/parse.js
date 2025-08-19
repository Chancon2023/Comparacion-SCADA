
import * as XLSX from "xlsx";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?worker&url";

// Configura pdf.js worker (Vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const uid = () => Math.random().toString(36).slice(2);

export async function parseFiles(fileList) {
  const out = [];
  for (const file of Array.from(fileList)) {
    const name = file.name || "archivo";
    const lower = name.toLowerCase();
    let text = "";
    let meta = { name };

    try {
      if (lower.endsWith(".pdf")) {
        text = await extractPdfText(file);
      } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        text = await extractExcelText(file);
      } else if (lower.endsWith(".csv")) {
        text = await file.text();
      } else if (lower.endsWith(".json")) {
        const raw = await file.text();
        const obj = JSON.parse(raw);
        text = JSON.stringify(obj, null, 2);
      } else if (lower.endsWith(".txt") || lower.endsWith(".md")) {
        text = await file.text();
      } else {
        // intenta como texto
        text = await file.text();
      }
    } catch (e) {
      console.error("parseFiles error:", e);
      throw new Error(`No se pudo leer ${name}: ${e?.message || e}`);
    }

    out.push({
      id: uid(),
      name,
      title: name.replace(/_/g, " "),
      text,
      meta,
    });
  }
  return out;
}

async function extractPdfText(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let full = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const strings = content.items.map((i) => i.str);
    const pageText = strings.join(" ").replace(/\s+/g, " ").trim();
    full.push(`\n\n[página ${p}]\n` + pageText);
  }
  return full.join("\n").trim();
}

async function extractExcelText(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  let chunks = [];
  for (const sname of wb.SheetNames) {
    const sh = wb.Sheets[sname];
    const csv = XLSX.utils.sheet_to_csv(sh);
    chunks.push(`\n\n[hoja ${sname}]\n` + csv);
  }
  return chunks.join("\n").trim();
}
