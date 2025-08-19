# Fix de build: `pdfjs-dist/legacy/build/pdf` (Vite + React + Netlify)

Este patch soluciona el error de compilación:

```
Rollup failed to resolve import "pdfjs-dist/legacy/build/pdf" from "src/lib/localRag.js"
```

## Qué incluye
1. **`src/lib/localRag.js`** — versión segura que usa *import dinámico* de PDF.js (evita problemas de bundling).
2. **`package.json.patch`** — diff unificado (formato `git apply`) que **agrega** las dependencias:
   - `"pdfjs-dist": "^3.11.174"`
   - `"papaparse": "^5.4.1"` (opcional, útil si parseas CSV)
3. **`HOW_TO_APPLY.md`** — pasos para aplicar en GitHub/Netlify.

> No se elimina nada de tu proyecto: solo se **agregan** dependencias y se **reemplaza** el archivo `src/lib/localRag.js`.
