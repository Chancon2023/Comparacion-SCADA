# Patch: Conclusión de Minería + Exportar PDF

Este patch añade **`src/components/MiningConclusion.jsx`** con la sección fija de **Conclusión para Cliente en la Industria Minera** y el botón **Exportar PDF** (cliente-side).

## 1) Copia de archivos
Copia la carpeta `src/components/MiningConclusion.jsx` dentro de tu proyecto (misma ruta).

## 2) Instala dependencias
En el root del proyecto:
```bash
npm i jspdf html2canvas
```

## 3) Inserta el bloque en la página de Ranking
Edita `src/pages/Ranking.jsx`:

- Arriba, agrega:
```jsx
import MiningConclusion from "../components/MiningConclusion";
```

- Al final del JSX (debajo del ranking), agrega:
```jsx
<MiningConclusion />
```

## 4) Probar
```
npm run dev
# o build + preview
npm run build && npm run preview
```
Abre la página **Ranking**. Verás la sección y el botón **Exportar PDF**.

> Nota: el componente evita dependencias de iconos externas para minimizar riesgos de build en Netlify.
