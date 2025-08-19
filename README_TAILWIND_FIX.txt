# Tailwind Fix Patch
Este patch corrige el error de PostCSS/Tailwind:
**"The `bg-card` class does not exist. If `bg-card` is a custom class, make sure it is defined within a `@layer` directive."**

Archivos incluidos:
- `tailwind.config.js` → añade `theme.extend.colors.card` (y demás tokens) para que `bg-card` exista.
- `src/styles/index.css` → define variables CSS y expone utilidades `.bg-card` y `.text-card-foreground`.

Pasos:
1. Reemplaza estos dos archivos en tu repo.
2. Asegúrate de que tu `content` en `tailwind.config.js` cubra todos tus archivos de React.
3. Vuelve a desplegar en Netlify.

Si antes viste errores por dependencias ausentes en el build de Netlify, instala (y commitea) también:
    npm i -S react-router-dom recharts framer-motion papaparse

Y si tu proyecto no tenía Tailwind completo:
    npm i -D tailwindcss postcss autoprefixer

En `netlify.toml`, usa por ahora:
    command = "npm install --no-audit --no-fund && npm run build"

Con esto debería compilar sin errores de Tailwind.
