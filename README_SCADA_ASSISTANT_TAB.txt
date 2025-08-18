# Asistente SCADA – Pestaña exclusiva
Archivos para añadir un tab/página dedicada al chat en tu proyecto (Vite + React v3.7.1).

## Archivos
- `src/components/AssistantChat.jsx` – UI + lógica del chat (sin backend).
- `src/pages/Assistant.jsx` – Página en la ruta `/assistant`.
- `docs/Navbar_add_tab.txt` – Cómo añadir el tab en tu Navbar.
- `docs/App_route_patch.txt` – Cómo registrar la ruta en App.jsx.

## Pasos rápidos
1) Copia los archivos a tu proyecto en las mismas rutas.
2) En tu `App.jsx`, importa y registra la ruta:
   ```jsx
   import AssistantPage from "./pages/Assistant";
   // ...
   <Route path="/assistant" element={<AssistantPage />} />
   ```
3) En tu `Navbar.jsx`, agrega un enlace a `/assistant` (ver `docs/Navbar_add_tab.txt`).
4) (Opcional) Crea `public/data/scada_dataset.json` con tu dataset;
   el asistente lo usará para recomendar plataformas (Top‑3).
5) Ejecuta: `npm run dev` y abre `http://localhost:5173/assistant`.

## Dataset (opcional)
`public/data/scada_dataset.json` debe ser un arreglo de objetos como:
```json
[
  {
    "name": "zenon Energy Edition (NCS)",
    "tags": ["minería","iec 61850","iec 62443","prp","hsr"],
    "features": ["web html5","dms","gis","historian"],
    "pros": ["Plataforma unificada","Compatibilidad entre versiones"],
    "cons": ["Costo a validar en proyecto"]
  }
]
```

## Notas
- Sin dependencias externas. 100% navegador.
- SPA: recuerda el redirect SPA en Netlify.
