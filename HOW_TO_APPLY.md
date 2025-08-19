# Cómo aplicar el patch

### Opción A — Usando `git apply` (recomendada)
1. Descarga y descomprime este zip en la raíz del repo.
2. Aplica el diff de dependencias:
   ```bash
   git apply package.json.patch
   ```
   > Si el diff falla por espacios, puedes abrir `package.json.patch` y copiar manualmente el bloque de `"dependencies"` (solo agrega las líneas nuevas).

3. Copia el archivo `src/lib/localRag.js` de este patch sobre tu proyecto (mismo path).
4. Sube los cambios a GitHub:
   ```bash
   git add package.json src/lib/localRag.js
   git commit -m "fix: install pdfjs-dist + localRag dynamic import"
   git push origin <tu-rama>
   ```
5. Netlify instalará automáticamente las dependencias nuevas y el build debe pasar.

### Opción B — Editando `package.json` a mano
- Abre tu `package.json` y **agrega** dentro de `"dependencies"`:
  ```json
  "pdfjs-dist": "^3.11.174",
  "papaparse": "^5.4.1"
  ```
- Guarda, sube a GitHub y reemplaza `src/lib/localRag.js` con el de este patch.
- Listo.
