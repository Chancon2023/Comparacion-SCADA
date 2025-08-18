# Patch sin Supabase ni jspdf (solo reemplazar)
Este paquete contiene archivos listos para **reemplazar** en tu proyecto Vite (v3.7.1).

## Qué incluye
- `index.html` — limpio (sin CDNs). **Reemplaza** tu `index.html` en la raíz del proyecto.
- `src/components/MiningConclusion.jsx` — componente listo que **no usa dependencias externas** (imprime la sección y permite “Guardar como PDF” desde el diálogo de impresión del navegador).

## Cómo usar
1) Copia `index.html` a la raíz del repo (reemplaza el actual).
2) Copia `src/components/MiningConclusion.jsx` dentro de tu proyecto.
3) Abre `src/pages/Ranking.jsx` y asegúrate de:
   - **Quitar** cualquier `import "jspdf"` o `import "html2canvas"`.
   - **Quitar** cualquier referencia a Supabase (`import supabase from "../lib/supabase"`), si permanece por error.
   - **Agregar**:
     ```jsx
     import MiningConclusion from "../components/MiningConclusion";
     ```
   - Y en el JSX, **debajo de la lista/tabla** del ranking:
     ```jsx
     <MiningConclusion />
     ```
4) Asegúrate de no tener ningún `<script src="https://...jspdf...">` en `index.html`.
5) Ejecuta:
   ```bash
   npm ci
   npm run build
   ```

## Nota
- El botón **Imprimir / PDF** usa `window.print()` en una ventana con sólo la conclusión. No hay dependencias externas, por lo que evita errores de bundling en Netlify.
- Si ves un 404 de `favicon.ico` en consola, es inofensivo para build. Puedes colocar un `public/favicon.ico` opcionalmente.
