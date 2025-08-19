
PATCH – Local RAG estable (arregla `answerQuery` y errores de build)

1) Añade estas dependencias al package.json (si no están):
   "papaparse": "^5.4.1",
   "xlsx": "^0.18.5",
   "pdfjs-dist": "^3.11.174"

   (Opcional, si tu app usa estas libs en otras páginas:)
   "recharts": "^2.9.0",
   "framer-motion": "^10.18.0",
   "react-router-dom": "^6.23.0"

2) Copia los archivos del zip en tu repo:
   - src/lib/localRag.js
   - src/pages/Assistant.jsx
   - vite.config.js
   - netlify.toml

3) Sube a GitHub y deja que Netlify reconstruya.

Notas:
- `localRag.js` ahora exporta **answerQuery** (antes faltaba), por eso fallaba el import en Assistant.jsx.
- PDF: se importa `pdfjs-dist` de forma dinámica y con worker opcional para minimizar problemas.
- Si Tailwind se queja por clases inexistentes, usa `bg-white` en lugar de clases personalizadas.
