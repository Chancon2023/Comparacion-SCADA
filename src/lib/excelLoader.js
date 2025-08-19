// src/lib/excelLoader.js
// Extrae texto desde archivos Excel (XLSX/XLS/CSV) para el asistente local.
// Requiere: npm i xlsx
import * as XLSX from "xlsx";

export async function extractTextFromExcel(file) {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  let text = "";

  wb.SheetNames.forEach((name) => {
    const ws = wb.Sheets[name];
    // header:1 -> matriz de filas
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true });
    text += `\n\n### Hoja: ${name}\n`;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      const line = row.map((c) => (c == null ? "" : String(c))).join(" | ");
      if (line.trim()) text += line + "\n";
    }
  });

  return { text, meta: { pages: null } };
}
