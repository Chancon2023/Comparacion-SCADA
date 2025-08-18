Smart Assistant Patch (Netlify + OpenAI)
========================================

Este paquete hace que tu Asistente sea "más inteligente" agregando un **Netlify Function** que llama a OpenAI.
Además, mantiene un **ranking local** con tu dataset (si existe `public/data/scada_dataset.json`).

Contenido
---------
- `netlify/functions/assist.js`  → función serverless que llama a OpenAI Chat Completions.
- `src/components/AssistantChat.jsx` → chat actualizado que:
  - usa el serverless para respuestas "tipo GPT"
  - mezcla un Top-3 local desde el dataset si existe

Instalación
-----------
1) Copia las carpetas a tu proyecto respetando rutas.
2) En **Netlify**, define el env var: `OPENAI_API_KEY` (Site settings → Build & deploy → Environment).
3) Asegúrate de que Netlify detecte funciones en `netlify/functions/`.
   - Si no tienes `netlify.toml`, crea uno con:
     ```toml
     [build]
     functions = "netlify/functions"
     publish = "dist"
     command = "npm run build"
     ```
4) (Opcional) Crea `public/data/scada_dataset.json` con tu contenido.
5) Ejecuta localmente (si usas Netlify CLI para funciones): `netlify dev`
   - O en dev normal: `npm run dev` (el endpoint serverless solo funcionará en Netlify).
6) Sube a GitHub y deja que Netlify vuelva a construir.

Notas
-----
- Si no configuras `OPENAI_API_KEY`, el chat igual responde, pero solo con la parte local (o mensajes de aviso).
- El modelo en `assist.js` es `gpt-4o-mini`. Puedes cambiarlo por otro en la llamada a la API.
- El serverless acepta: `{ prompt, dataset (opcional), prefs (opcional) }`.