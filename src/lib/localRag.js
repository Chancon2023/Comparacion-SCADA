
// src/lib/localRag.js
// Cliente-side RAG muy liviano (PDF, TXT/MD, CSV/JSON, XLS/XLSX)
// Exporta: loadDocs(files), answerQuery(question, options), clearIndex()

import MiniSearch from 'minisearch'

let mini = null
let loadedFiles = 0
let totalChunks = 0

function newIndex () {
  mini = new MiniSearch({
    fields: ['text', 'title'],
    storeFields: ['title', 'source', 'chunk', 'id'],
    searchOptions: {
      boost: { title: 2 },
      fuzzy: 0.2,
      prefix: true
    }
  })
  loadedFiles = 0
  totalChunks = 0
}

function ensureIndex () {
  if (!mini) newIndex()
}

function extOf (file) {
  const n = file.name || ''
  const i = n.lastIndexOf('.')
  return i >= 0 ? n.slice(i + 1).toLowerCase() : ''
}

function chunkText (text, size = 900, overlap = 150) {
  const chunks = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + size, text.length)
    const slice = text.slice(start, end).trim()
    if (slice) chunks.push(slice)
    start = end - overlap
    if (start < 0) start = 0
  }
  return chunks
}

async function textFromPDF (file) {
  // Carga pdfjs de forma dinámica para evitar problemas de bundling
  const pdfjs = await import('pdfjs-dist/build/pdf')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.js?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default

  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buf }).promise
  let all = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    const text = content.items.map(it => it.str).join(' ').replace(/\s+/g, ' ')
    // conservamos por página para mejores citas
    const chunks = chunkText(text)
    chunks.forEach((ch, idx) => {
      all.push({ text: ch, hint: `p.${p}` })
    })
  }
  return all
}

async function textFromTxt (file) {
  const t = await file.text()
  return chunkText(t).map(ch => ({ text: ch }))
}

async function textFromCSV (file) {
  const Papa = (await import('papaparse')).default
  const text = await file.text()
  const parsed = Papa.parse(text, { header: true })
  const rows = parsed.data || []
  const str = rows.map(r => Object.values(r).join(' | ')).join('\n')
  return chunkText(str).map(ch => ({ text: ch }))
}

async function textFromJSON (file) {
  const t = await file.text()
  let data
  try { data = JSON.parse(t) } catch (e) { data = t }
  const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  return chunkText(str).map(ch => ({ text: ch }))
}

async function textFromXLS (file) {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf)
  let out = ''
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    out += `\n# ${name}\n${csv}`
  }
  return chunkText(out).map(ch => ({ text: ch }))
}

async function parseFile (file) {
  const type = (file.type || '').toLowerCase()
  const ext = extOf(file)
  if (type.includes('pdf') || ext === 'pdf') return textFromPDF(file)
  if (type.includes('csv') || ext === 'csv') return textFromCSV(file)
  if (type.includes('json') || ext === 'json') return textFromJSON(file)
  if (ext === 'xls' || ext === 'xlsx') return textFromXLS(file)
  // txt / md / others -> text
  return textFromTxt(file)
}

/**
 * Carga e indexa documentos (FileList o Array<File>)
 * Devuelve { files, fragments }
 */
export async function loadDocs (files) {
  ensureIndex()
  const list = Array.from(files || [])
  let docs = []
  for (const f of list) {
    const parts = await parseFile(f)
    parts.forEach((p, i) => {
      const doc = {
        id: `${loadedFiles + 1}-${i + 1}`,
        title: f.name,
        source: `${f.name}${p.hint ? ` ${p.hint}` : ''}`,
        chunk: i + 1,
        text: p.text
      }
      docs.push(doc)
    })
    loadedFiles += 1
  }
  totalChunks += docs.length
  await mini.addAllAsync(docs)
  // persistencia ligera
  try {
    localStorage.setItem('rag:index:stats', JSON.stringify({ files: loadedFiles, fragments: totalChunks }))
  } catch {}
  return { files: loadedFiles, fragments: totalChunks }
}

export function clearIndex () {
  newIndex()
  try { localStorage.removeItem('rag:index:stats') } catch {}
}

function uniqueBy (arr, key) {
  const seen = new Set()
  const out = []
  for (const it of arr) {
    const k = it[key]
    if (!seen.has(k)) {
      seen.add(k); out.push(it)
    }
  }
  return out
}

/**
 * Busca en el índice y arma una respuesta corta + referencias
 * @returns { text: string, refs: Array<{source:string, title:string}> }
 */
export async function answerQuery (question, options = {}) {
  ensureIndex()
  const topK = options.topK ?? 5
  const res = mini.search(question, { combineWith: 'AND' }) || []
  if (!res.length) {
    return {
      text: 'No encontré coincidencias en los documentos cargados. Puedes subir más archivos o reformular la consulta.',
      refs: []
    }
  }
  const top = res.slice(0, topK)
  const bullets = top.map(r => {
    const t = (r.text || '').trim().replace(/\s+/g, ' ')
    const snippet = t.length > 220 ? t.slice(0, 220) + '…' : t
    return `• ${snippet}  —  (${r.source})`
  })
  const refs = uniqueBy(top.map(r => ({ source: r.source, title: r.title })), 'source')
  const text = `Basado en los documentos cargados, esto es lo más relevante:\n\n${bullets.join('\n')}\n\n` +
               `Sugerencia: si quieres más precisión, sube normativa NTSyCS/SITR/IEC 62443 o planillas de evaluación.`
  return { text, refs }
}

// Estado ligero para la UI (opcional)
export function getIndexStats () {
  try {
    const raw = localStorage.getItem('rag:index:stats')
    if (raw) return JSON.parse(raw)
  } catch {}
  return { files: loadedFiles, fragments: totalChunks }
}

export default {
  loadDocs,
  answerQuery,
  clearIndex,
  getIndexStats
}
