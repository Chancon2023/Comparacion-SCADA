
# Local Assistant Patch (RAG sin APIs)
Este patch agrega una pestaña **Asistente (local)** que permite:
- Subir **PDF, Excel, CSV, TXT y MD** (en el navegador).
- Indexar el contenido (chunking + TF‑IDF) sin usar servicios externos.
- Hacer preguntas y recibir respuestas con los fragmentos más relevantes y **citas** (título + página, cuando aplica).
- Persistir **los documentos** en `localStorage` para rehidratar el índice al recargar.

> Requisitos de build (instalar una vez):
```bash
npm i pdfjs-dist xlsx
```
*(si ya tienes estas dependencias, no repitas)*

## Archivos nuevos

Se añaden/actualizan los siguientes archivos (tú solo **copialos** a tu repo):

```
src/pages/AssistantLocal.jsx
src/components/DocDropzone.jsx
src/components/ChatBubble.jsx
src/lib/parse.js
src/lib/tfidf.js
src/workers/ragWorker.js
public/docs/.gitkeep
```

## Cómo integrar en tu app

1) **Copiar los archivos** de este patch a tu proyecto, respetando las rutas.
2) **Agregar la ruta** en `src/App.jsx` (o donde definas las rutas):
```jsx
import AssistantLocal from "./pages/AssistantLocal";

// Dentro de <Routes>:
<Route path="/assistant-local" element={<AssistantLocal />} />
```
3) **Agregar link en el Navbar** (opcional):
```jsx
<NavLink to="/assistant-local" className={...}>Asistente (local)</NavLink>
```
4) Ejecutar:
```bash
npm run dev
```
Abre `http://localhost:5173/assistant-local`.

## Uso
- **Arrastra** o **selecciona** archivos (PDF/Excel/CSV/TXT/MD). El navegador extrae el texto.
- El índice se genera en un **Web Worker** (`ragWorker.js`) usando **TF‑IDF + coseno**.
- Escribe tu pregunta. El asistente devuelve un resumen y **citas** con las mejores coincidencias.
- Tus documentos quedan persistidos en `localStorage` (clave `localRAG_docs_v1`).

> Nota: el procesamiento es completamente **local**. Para mejores PDF, evita escaneados (imágenes sin OCR).
