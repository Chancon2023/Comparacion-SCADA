# Local Assistant Patch (sin APIs)
Archivos listos para **reemplazar / agregar** en tu proyecto Vite + React.

## Archivos incluidos
- `src/lib/localRag.js`  → Motor de indexación y búsqueda local (FlexSearch + pdfjs + xlsx)
- `src/pages/Assistant.jsx` → Nueva pantalla del asistente con **uploader** y chat local

## Instalación
1. Instala dependencias:
   ```bash
   npm i flexsearch pdfjs-dist xlsx
   ```
2. Copia los archivos en sus rutas (`src/lib/` y `src/pages/`).
3. Asegura la ruta en `App.jsx`:
   ```jsx
   import Assistant from "./pages/Assistant";
   // ...
   <Route path="/assistant" element={<Assistant />} />
   ```
4. En el `Navbar`, enlaza a `/assistant`.

## Uso
- Abre la pestaña **Asistente**.
- Sube tus documentos **PDF, XLSX/XLS, TXT, MD, CSV, JSON**.
- Pregunta en el chat: el motor devuelve fragmentos relevantes con **citas**.
- El índice se guarda en `localStorage` (sobrevive a recargas).

> Todo corre en tu navegador. **No** usa Netlify Functions ni APIs.