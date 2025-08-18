
# Patch Asistente (Gemini + Netlify Function)

1) **Variables en Netlify**
   - Agrega `GEMINI_API_KEY` (sin prefijo `VITE_`). Guarda y vuelve a desplegar.

2) **Archivos de este patch (copiar/reemplazar)**
   - `netlify/functions/assistant-gemini.js`
   - `netlify.toml`
   - `src/lib/ai.js`
   - `src/pages/Assistant.jsx`
   - `src/components/AssistantChat.jsx`

3) **Dependencia para la Function**
   - Añade `"node-fetch": "^3.3.2"` a `dependencies` en tu `package.json` y sube el cambio.
   - No importes `@google/generative-ai` en el cliente.

4) **Rutas**
   - Tu navegación debe incluir `/assistant`.
   - El cliente llama a `/api/assistant` (redirige hacia la Function).

5) **Build en Netlify**
   - Si usas un `netlify.toml` propio, fusiona la sección `[functions]` y el `[[redirects]]`.
   - Tras deploy, abre `/assistant` y prueba.

Listo.
