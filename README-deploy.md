# Deploy Fix Patch (Vite + Netlify)

Este patch incluye:
- `package.json` con **vite**, **tailwindcss**, **postcss**, **autoprefixer**, **papaparse** y **pdfjs-dist**.
- `vite.config.js` marcando **papaparse** y **pdfjs-dist** como `external` para evitar errores de Rollup en Netlify.
- Config de **Tailwind**: `postcss.config.cjs` y `tailwind.config.cjs`.
- `netlify.toml` para usar `npm ci && npm run build` y publicar `dist/`.

## Cómo usar
1. Copia/pega estos archivos en la raíz del repo (sobrescribe si corresponde).
2. Haz commit y push a GitHub.
3. Netlify instalará dependencias y compilará.

> Si tu proyecto ya tiene `netlify.toml`, conserva el tuyo y solo toma el `command` y `publish` si son distintos.
