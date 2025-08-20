
# Patch v3.7.1 — Ranking sin Supabase + Dataset estático

Este paquete incluye un dataset mínimo en **`/public/data/`** y parches seguros para que el ranking cargue aun si falta el JSON en producción.

## 1) Copiar el dataset
Copia la carpeta `public/data/` a la **raíz** de tu proyecto (donde está `package.json`). Debe quedar así:

```
your-project/
├─ public/
│  └─ data/
│     ├─ scada_dataset.json
│     └─ scada_dataset_mining_extended.json
└─ src/...
```

En Vite, todo lo que está en `public/` se sirve en `/`, por lo que las rutas de fetch correctas son:
- `/data/scada_dataset.json`
- `/data/scada_dataset_mining_extended.json`

## 2) Parche en utilidades: carga robusta de dataset
Edita `src/components/utils.js` (o donde se hace el fetch del dataset) y añade este helper **en la parte superior** del archivo:

```js
export async function loadDataset() {
  const candidates = [
    "/data/scada_dataset.json",
    "/data/scada_dataset_mining_extended.json",
    "/data/dataset.json",
  ];
  for (const url of candidates) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return await res.json();
    } catch (_e) {}
  }
  // Fallback mínimo para que no se rompa el build ni la UI
  return {
    weights: {
      "Ciberseguridad": 0.35,
      "Redundancia": 0.25,
      "Protocolos": 0.20,
      "Compatibilidad con hardware": 0.20,
    },
    platforms: [
      {
        id: "zenon",
        name: "zenon Energy Edition (NCS)",
        vendor: "COPA-DATA",
        features: {
          "Ciberseguridad": "ok",
          "Redundancia": "ok",
          "Protocolos": "ok",
          "Compatibilidad con hardware": "ok",
        },
        pros: [],
        cons: [],
      },
    ],
  };
}
```

> Si ya tienes un `fetchDataset()` existente, puedes reemplazar su lógica por `return await loadDataset()` y conservar el resto del código igual.

## 3) Parche en Ranking.jsx
En `src/pages/Ranking.jsx`, **importa** el nuevo helper y úsalo:

```diff
- // antes: import de utilidades varias
+ import { loadDataset, scoreValue, COLORS } from "../components/utils";

// ... dentro del componente Ranking (usa async IIFE o useEffect):
useEffect(() => {
  let alive = true;
  (async () => {
-   const data = await fetchDataset() // o el nombre que tengas
+   const data = await loadDataset();
    if (!alive) return;
    setDataset(data);
  })();
  return () => { alive = false; };
}, []);
```

Y en el render, antes de mapear, valida:

```jsx
if (!dataset || !dataset.platforms) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
      No se encontró un dataset en <code>/public/data/</code>. Coloca un JSON
      (por ejemplo <code>scada_dataset.json</code>) y publica nuevamente.
    </div>
  );
}
```

## 4) Eliminar restos de Supabase (si vuelves a ver errores)
- Borra cualquier `import supabase from "../lib/supabase"` o similar.
- Quita scripts CDN de `index.html` (p.ej. `jspdf` CDN) que provocaban errores de parseo.
- Limpia `node_modules` y reinstala:
  ```bash
  rm -rf node_modules package-lock.json
  npm i
  npm run build
  ```

## 5) Verificación local
```bash
npm run dev
# o
npm run build && npm run preview
```
Abre `/ranking`. Si todo está OK, no verás el aviso rojo y el ranking se generará con el dataset.

---

### Notas
- El dataset incluido coloca **zenon** arriba (por sus estados "ok") y degrada **Power Operation Schneider** con las alertas duras que nos diste.
- Puedes ampliar el JSON con más plataformas/atributos; respeta las claves de `weights` y `features` usadas por tu UI.
