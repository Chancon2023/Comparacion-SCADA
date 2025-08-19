# Fix papaparse/pdfjs for Netlify (ready-to-push)

**Qué hace:** instala `papaparse`, `pdfjs-dist` y `xlsx` automáticamente en Netlify
y marca esas libs como `external` en Vite para que no rompan el bundle.

## Cómo usar
1. Coloca **estos archivos en la raíz** del repo (crea carpetas si faltan):
   - `package.json`
   - `netlify.toml`
   - `vite.config.js`
   - `src/lib/localRag.js`
2. Commit + push a GitHub.
3. Netlify reconstruirá con `npm run prebuild && npm run build`.
