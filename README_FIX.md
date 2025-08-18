# Netlify Fix Patch — Supabase + PDF (v3.7.1)

Este patch arregla:

1) **Error Vite `index.html`** (parse5 / misplaced-doctype) causado por meter etiquetas `<script>` de CDN.
   → Se reemplaza `index.html` por uno limpio de Vite, **sin** CDNs. Las libs se consumen por `npm`.

2) **`default is not exported by src/lib/supabase.js`**.
   → Nuevo `src/lib/supabase.js` exporta **named y default** (para ambos estilos de import).

3) **Placeholder de dataset** para compilar si aún importas `../data/scada_dataset.json` en tiempo de build.

4) **Conclusión de Minería + Exportar PDF** en `src/components/MiningConclusion.jsx` (usa `jspdf` + `html2canvas` por npm).


## Archivos incluidos para *reemplazar*

- `index.html` (limpio, sin CDN)
- `src/lib/supabase.js` (con `export default` y `export const supabase`)
- `src/components/MiningConclusion.jsx` (botón PDF sin dependencias extra)
- `src/data/scada_dataset.json` (placeholder seguro)

> **No** sobreescribimos tus páginas. Solo añade `<MiningConclusion />` donde quieras en `Ranking.jsx` u Home.


## Dependencias requeridas

Asegúrate de tener estas deps (Netlify instalará desde `package.json`):

```bash
npm i @supabase/supabase-js jspdf html2canvas
```

> **NO** agregues CDNs en `index.html`.


## Variables de entorno (Netlify)

- `VITE_SUPABASE_URL = https://xiuduaymdnawvqofwmfv.supabase.co`
- `VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdWR1YXltZG5hd3Zxb2Z3bWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDE4NDksImV4cCI6MjA3MDc3Nzg0OX0.Q0VeV1yV8xg5V8YxRc_pGWBBej_KVo6rN2UrgfRy8kc


## Inserta la Conclusión en Ranking

En `src/pages/Ranking.jsx`:

```jsx
import MiningConclusion from "../components/MiningConclusion";

// ...dentro del JSX, después del ranking:
<MiningConclusion />
```


## Commit sugerido

```bash
git add index.html src/lib/supabase.js src/components/MiningConclusion.jsx src/data/scada_dataset.json
git commit -m "fix(netlify): index limpio, supabase default export, mining conclusion + pdf, dataset placeholder"
git push
```

Si vuelve a fallar, revisa que **NO** quede ninguna etiqueta `<script src="https://cdn.jsdelivr.net/...">` en `index.html`.
