# Extensión Asistente Local: soporte Excel

Esta actualización añade soporte para **XLSX/XLS/CSV** al asistente local.

## 1) Instalar dependencia
```bash
npm i xlsx
```

## 2) Copiar archivos
- `src/lib/excelLoader.js`
- Aplicar el parche en `src/pages/LocalAssistant.jsx` (o copiar manualmente los cambios del diff).

Cambios clave:
- Importa `extractTextFromExcel`.
- Acepta `.xlsx,.xls,.csv` en el `<input type="file">`.
- Rutea por extensión para usar el extractor de Excel.

## Notas
- El extractor convierte cada hoja a texto, fila por fila, uniendo celdas con `" | "`.
- No evalúa fórmulas: usa los **valores** de las celdas exportados por `xlsx`.
- Para CSV grandes, también funciona porque `xlsx` lo parsea.
- El texto resultante pasa al indexador (MiniSearch) sin salir del navegador.
