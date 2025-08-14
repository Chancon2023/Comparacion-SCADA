
# Pasos de integración en tu proyecto (Vite + React)

## 1) Copiar archivos
Copia las carpetas/archivos de este paquete dentro de tu repo:
```
src/lib/supabaseClient.js
src/api/persistence.js
src/pages/Admin.jsx
src/pages/Login.jsx
supabase/schema.sql
.env.example
```
Mantén la estructura.

## 2) Variables de entorno
- Duplica `.env.example` a **`.env`** (local) y en Netlify crea los mismos `Environment variables`.
- Rellena:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## 3) Rutas
En tu router (por ejemplo `src/main.jsx` o donde declares `<Routes/>`):
```jsx
import Login from "./pages/Login.jsx";
import Admin from "./pages/Admin.jsx";

// dentro de <Routes>
<Route path="/login" element={<Login />} />
<Route path="/admin" element={<Admin />} />
```

## 4) Mostrar datos persistentes
- Para **alertas / pros / contras** guardados por el Admin:
```jsx
import { listFindings } from "../api/persistence";

useEffect(() => {
  (async () => {
    const items = await listFindings(); // [{id, platform, type, text, created_at}, ...]
    setExternalFindings(items);
  })();
}, []);
```
- Para **pesos** (weights) de features:
```jsx
import { getWeights } from "../api/persistence";

const weights = await getWeights(); // { Seguridad: 2, Redundancia: 1.5, Integración: 1.2, ...}
```

- Para **ajustes de puntuación** (overrides) por plataforma/feature:
```jsx
import { listFeatureScores } from "../api/persistence";

const overrides = await listFeatureScores();
// Estructura sugerida: [{ platform, feature, score: -1|0|1|2, note }]
// Al calcular tu radar/ranking, si hay override, úsalo.
```

> **Tip**: Mantén los cálculos en `utils.js` o donde los tengas y suma estas
> colecciones (externalFindings / weights / overrides) como *inputs*.

## 5) Seguridad
- El login permite email/contraseña (Supabase Auth). El Admin observa y edita.
- Los visitantes NO requieren login → solo leen datos públicos.
- En Supabase, configura RLS con políticas:
  - `SELECT` para `anon` (lectura pública).
  - `INSERT/UPDATE/DELETE` solo para rol `authenticated`.
  - Opcional: restringir por email del admin (ver ejemplo en `schema.sql`).

## 6) Despliegue
- Empuja a GitHub.
- En Netlify agrega variables de entorno (Build settings → Environment).
- Build: `npm run build`.
