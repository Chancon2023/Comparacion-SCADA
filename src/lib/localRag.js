// src/lib/localRag.js
// Utilidades locales para convertir archivos en "documentos" de texto.
// Esta versión usa import dinámico de PDF.js para evitar errores de bundling en Netlify.

/**
 * Convierte archivos seleccionados a documentos de texto simples.
 * @param {File[]} files
 * @returns {Promise<Array<{id:string,title:string,text:string,source:string}>>}
 */
export async function parseFilesToDocs(files = []) {
  const results = [];
  for (const file of files) {
    const ext = file.name.toLowerCase().split('.').pop();
    try {
      if (ext === 'pdf') {
        const text = await extractTextFromPDF(file);
        results.push({
          id: crypto.randomUUID(),
          title: file.name,
          text,
          source: 'pdf'
        });
      } else if (ext === 'txt' || ext === 'md') {
        const text = await file.text();
        results.push({
          id: crypto.randomUUID(),
          title: file.name,
          text,
          source: ext
        });
      } else if (ext === 'csv') {
        const text = await extractTextFromCSV(file);
        results.push({
          id: crypto.randomUUID(),
          title: file.name,
          text,
          source: 'csv'
        });
      } else if (ext === 'json') {
        const raw = await file.text();
        let text = raw;
        try {
          const obj = JSON.parse(raw);
          text = JSON.stringify(obj, null, 2);
        } catch {}
        results.push({
          id: crypto.randomUUID(),
          title: file.name,
          text,
          source: 'json'
        });
      } else if (ext === 'xlsx' || ext === 'xls') {
        // Si quieres soporte real para Excel, agrega "xlsx" a tus deps e implementa aquí.
        const note = `El archivo ${file.name} es Excel. Para parseo local, agrega la dependencia "xlsx". Por ahora, súbelo como CSV.`;
        results.push({
          id: crypto.randomUUID(),
          title: file.name,
          text: note,
          source: 'excel'
        });
      } else {
        // Desconocido: intentamos leer como texto plano
        const text = await file.text();
        results.push({
          id: crypto.randomUUID(),
          title: file.name,
          text,
          source: ext || 'file'
        });
      }
    } catch (err) {
      results.push({
        id: crypto.randomUUID(),
        title: file.name,
        text: `No se pudo leer ${file.name}. Error: ${err?.message || err}`,
        source: 'error'
      });
    }
  }
  return results;
}

async function extractTextFromCSV(file) {
  try {
    const { Papa } = await import('papaparse'); // dynamic
    const content = await file.text();
    const parsed = Papa.parse(content, { header: true });
    if (parsed?.data?.length) {
      const lines = parsed.data.map((row) => Object.values(row).join(' | ')).join('\\n');
      return lines;
    }
    return content;
  } catch {
    // Fallback: devolver el texto tal cual
    return await file.text();
  }
}

async function extractTextFromPDF(file) {
  const buf = await file.arrayBuffer();
  // Import dinámico de pdfjs (legacy para compatibilidad de browser)
  const pdfjsLib = await import(/* @vite-ignore */ 'pdfjs-dist/legacy/build/pdf');
  // Intento 1: worker desde el propio paquete (soporta Vite >= 4)
  try {
    const worker = await import(/* @vite-ignore */ 'pdfjs-dist/legacy/build/pdf.worker.mjs');
    if (worker && worker.default) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
    }
  } catch {
    // Intento 2: CDN (fallback seguro en producción)
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const loadingTask = pdfjsLib.getDocument({ data: buf });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items.map((it) => ('str' in it ? it.str : '')).join(' ');
    fullText += pageText + '\\n\\n';
  }
  return fullText.trim();
}

/**
 * Guarda documentos en localStorage
 * @param {Array} docs
 * @param {string} key
 */
export function saveDocs(docs, key = 'local_docs') {
  try {
    localStorage.setItem(key, JSON.stringify(docs ?? []));
  } catch {}
}

/**
 * Carga documentos desde localStorage
 * @param {string} key
 * @returns {Array}
 */
export function loadDocs(key = 'local_docs') {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
