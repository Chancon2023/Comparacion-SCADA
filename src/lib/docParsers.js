import * as pdfjsLib from "pdfjs-dist";
import * as XLSX from "xlsx";

// Usa worker de PDF.js desde CDN para evitar problemas de bundling
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.10.111/pdf.worker.min.js";

async function parsePdf(file) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(" ") + "\n";
  }
  return text;
}

async function parseXlsx(file) {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });
  let text = "";
  wb.SheetNames.forEach((name) => {
    const ws = wb.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(ws);
    text += `\n# Hoja: ${name}\n${csv}\n`;
  });
  return text;
}

async function parseText(file) {
  return await file.text();
}

export async function parseFile(file) {
  const name = file.name || "archivo";
  const lower = name.toLowerCase();

  try {
    if (lower.endsWith(".pdf")) {
      const text = await parsePdf(file);
      return { name, text };
    }
    if (
      lower.endsWith(".xlsx") ||
      lower.endsWith(".xls") ||
      lower.endsWith(".csv")
    ) {
      const text = await parseXlsx(file);
      return { name, text };
    }
    // txt / md / json u otros de texto
    const text = await parseText(file);
    return { name, text };
  } catch (e) {
    return { name, text: `[[No se pudo leer el archivo: ${e?.message || e}]]` };
  }
}
