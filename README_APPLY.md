# Patch: quitar Supabase y volver a dataset estático (v3.7.x)

Este paquete elimina cualquier dependencia de **Supabase** y deja la app 100% estática.
Incluye archivos listos para **reemplazar** en tu repo.

## Qué hace
- Reemplaza `src/pages/Ranking.jsx` y `src/pages/RadarDetail.jsx` para leer el dataset desde `/public/data` usando `fetch`.
- Añade/actualiza `src/components/utils.js` con todas las utilidades exportadas que usan las páginas (evita errores como *"classForCell is not exported"*).
- Provee un **stub** `src/lib/supabase.js` que NO usa red (si quedó algún import suelto no romperá el build).
- Incluye `public/data/weights.json` (pesos) y un `public/data/scada_dataset.json` **ejemplo** (reemplázalo por tu dataset real).

> **Importante:** elimina cualquier `<script ...>` que hayas agregado antes de `<!doctype html>` en `index.html`. Vite necesita que el `<!doctype html>` esté en la primera línea.

## Cómo aplicar
1. Copia el contenido de este zip sobre tu repo, respetando rutas.
2. Verifica que existan estas rutas en tu repo:
   - `src/components/utils.js`
   - `src/pages/Ranking.jsx`
   - `src/pages/RadarDetail.jsx`
   - `src/lib/supabase.js` (stub)
   - `public/data/weights.json`
   - `public/data/scada_dataset.json`
3. (Opcional) Reemplaza `public/data/scada_dataset.json` con tu dataset real.
4. Ejecuta localmente:
   ```bash
   npm install
   npm run build
   ```
5. Sube a GitHub y deja que Netlify vuelva a construir.

## Notas
- Si tu proyecto tenía imports a `@/lib/supabase` o `../lib/supabase`, el stub lo cubrirá. Puedes borrar esos imports si quieres, pero **no es necesario**.
- Si te aparece otro error por *"module not exported"* en utilidades, ahora `src/components/utils.js` exporta explícitamente: `COLORS`, `classForCell`, `scoreValue`, `prepareData`, `computeRadarRow`.
- El ranking usa pesos desde `public/data/weights.json` (puedes editarlos en producción sin recompilar).

¡Listo! 🚀
