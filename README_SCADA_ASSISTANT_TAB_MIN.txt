# Asistente SCADA – Pestaña dedicada

## Archivos
- `src/pages/Assistant.jsx` → Página `/assistant`
- `src/components/AssistantChat.jsx` → Componente del chat (UI + lógica)

## 1) Registrar ruta
En `src/App.jsx`:
```jsx
import AssistantPage from "./pages/Assistant";
// ...
<Routes>
  {/* otras rutas… */}
  <Route path="/assistant" element={<AssistantPage />} />
</Routes>
```

## 2) Agregar link en Navbar
En `src/components/Navbar.jsx` (o equivalente):
```jsx
import { NavLink } from "react-router-dom";
// ...
<NavLink to="/assistant" className={({ isActive }) =>
  `px-3 py-2 rounded-xl ${isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`
}>
  Asistente
</NavLink>
```

## 3) Dataset opcional
Si tienes `public/data/scada_dataset.json` (array):
```json
[
  {
    "name": "zenon Energy Edition (NCS)",
    "tags": ["minería","iec 61850","iec 62443","prp","hsr"],
    "features": ["web html5","dms","gis","historian"],
    "pros": ["Plataforma unificada","Compatibilidad entre versiones"],
    "cons": ["Costo a validar"]
  }
]
```
El chat recomienda Top-3 si existe el dataset; si no existe, igual responde.

## 4) Problemas de “pantalla en blanco”
- Verifica errores en consola. Usualmente son por **ruta no registrada** o **import con nombre/case incorrecto**.
- Asegúrate de que el archivo se llame **Assistant.jsx** con ese mismo `case` y que el import coincida exactamente.
- En Netlify/Linux, el FS es *case-sensitive*; en Windows puede no fallar, pero en build sí.

## 5) Ejecutar
```bash
npm run dev
# o build
npm run build && npm run preview
```
