# Fix build dependencies (Netlify + Vite)

**Qué hace este patch**
- Asegura que `vite` esté instalado (era el motivo del error 127: `vite: not found`).
- Añade `papaparse` y `pdfjs-dist` como dependencias para `src/lib/localRag.js`.
- Configura `vite.config.js` para **externalizar** `papaparse` y `pdfjs-dist` y evitar fallos de Rollup.
- Ajusta `netlify.toml` para que Netlify ejecute `npm ci && npm run build`.

## Cómo usar
1. Descarga este zip y **reemplaza** (o agrega) estos archivos en la raíz del repo:
   - `package.json`
   - `vite.config.js`
   - `netlify.toml`
2. Haz commit y push a GitHub (main o la rama que tengas conectada a Netlify).
3. Netlify hará el deploy. Si el build aún se queja por caché, limpia el cache en Netlify y vuelve a desplegar.

> Si en tu proyecto ya existen estos archivos con contenido propio,
> aplica los cambios manualmente respetando tus scripts/ajustes.
