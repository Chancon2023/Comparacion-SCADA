# Live Weights + Reseñas (Supabase) — Patch

Este paquete añade:
- `src/lib/supabaseClient.js`
- `src/hooks/useSupabaseWeights.js`
- `src/components/MiningConclusion.jsx` (sin dependencias externas de iconos)

## 1) Dependencias
```
npm i @supabase/supabase-js jspdf html2canvas
```

## 2) Variables de entorno (ya deberías tenerlas en Netlify/GitHub)
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ADMIN_EMAIL=tu@correo.com
```

## 3) Usar pesos/reseñas en Ranking.jsx
Abre `src/pages/Ranking.jsx` y añade **arriba**:

```jsx
import useSupabaseWeights from '../hooks/useSupabaseWeights';
import MiningConclusion from '../components/MiningConclusion';
```

Dentro del componente `Ranking`:

```jsx
const { weights: liveWeights, reviews: liveReviews } = useSupabaseWeights();
```

### Dónde aplicarlo
Allí donde calculas el puntaje total, mezcla tus pesos locales con los `liveWeights`:

```jsx
// ejemplo:
const effectiveWeights = { ...LOCAL_WEIGHTS, ...(liveWeights || {}) };

// cuando iteres características:
score += (value || 0) * (effectiveWeights[featureKey] ?? 1);
```

Y donde dibujas pros/cons de cada plataforma, fusiona las reseñas locales con `liveReviews[platform]` si existe:

```jsx
const pros = [...(localPros || []), ...((liveReviews?.[platform]?.pros) || [])];
const cons = [...(localCons || []), ...((liveReviews?.[platform]?.cons) || [])];
const notes = [...(localNotes || []), ...((liveReviews?.[platform]?.notes) || [])];
```

### Botón de Volver
Añade, cerca del título del ranking:

```jsx
<button onClick={() => window.history.back()} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200">
  ← Volver
</button>
```

### Conclusión bajo el ranking
Al final del JSX de la página Ranking, coloca:
```jsx
<MiningConclusion />
```

## 4) Usar pesos en RadarDetail.jsx
En `src/pages/RadarDetail.jsx`:

```jsx
import useSupabaseWeights from '../hooks/useSupabaseWeights';

const { weights: liveWeights } = useSupabaseWeights();
const weights = { ...LOCAL_WEIGHTS, ...(liveWeights || {}) };

// y usa `weights` en lugar de los pesos fijos al calcular el radar.
```

## 5) Commit & Deploy
- Añade estos archivos al repo
- Ajusta los puntos de mezcla de pesos y reseñas donde calculas el score/radar
- `git add . && git commit -m "live weights + conclusion + pdf" && git push`
- Netlify tomará los envs y desplegará.

> Si necesitas que te entregue **Ranking.jsx** y **RadarDetail.jsx** completos ya cableados a tu versión, pásame (o adjunta) esos archivos actuales y te devuelvo los reemplazos exactos.