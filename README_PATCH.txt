# SCADA Live Patch (Supabase + Radar loader)

Este paquete contiene **3 archivos** listos para reemplazar/añadir en tu proyecto (Vite + React).

## Archivos
- `src/lib/supabase.js`  → cliente y helpers (weights/reviews)
- `src/pages/Ranking.jsx` → ranking leyendo **pesos + reseñas** en vivo
- `src/pages/RadarDetail.jsx` → carga dataset por `fetch` (sin import estático) y pondera por pesos

## Pasos
1) Copia estas rutas en tu repo respetando el árbol `src/...`.
2) Asegura dependencia:
   ```bash
   npm i @supabase/supabase-js
   ```
3) En Netlify (o `.env.local`) define:
   ```env
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_ADMIN_EMAIL=sebastian.contreras@krontec.cl
   ```
4) Sube/commitea y despliega.

## Dataset
El loader busca automáticamente en estas rutas (en este orden):
```
/data/scada_dataset_mining_extended_v371.json
/data/scada_dataset.json
/scada_dataset_mining_extended_v371.json
/scada_dataset.json
```
Coloca tu JSON en cualquiera de esas ubicaciones (por ejemplo `public/data/...`).

## Tablas Supabase
- **weights**: columnas sugeridas → `id (uuid)`, `feature (text)`, `weight (numeric)`, `critical (bool?)`
- **reviews**: columnas sugeridas → `id (uuid)`, `platform (text)`, `type ("pro"/"con")`, `text (text)`

Si Supabase no responde, el ranking usa pesos locales por defecto y no rompe el build.

¡Listo! 🚀