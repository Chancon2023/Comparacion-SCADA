
Local RAG fix patch
===================

Incluye `src/lib/localRag.js` con las funciones **loadDocs**, **answerQuery** y **clearIndex**,
soportando PDF / TXT / MD / CSV / JSON / XLS/XLSX con **imports dinámicos** para evitar
errores de bundling en Netlify/Vite.

### Dependencias a agregar en package.json
```
npm i minisearch pdfjs-dist papaparse xlsx
```

> Si ya tenías un `Assistant.jsx` que hace:
> ```js
> import { loadDocs, answerQuery, clearIndex } from "../lib/localRag";
> ```
> no necesitas tocarlo. Solo reemplaza `src/lib/localRag.js` por el de este patch.
