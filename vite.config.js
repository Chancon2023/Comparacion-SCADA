import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Ajustes para que Vite pre-optimice libs que estaban fallando en Netlify
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      "react-router-dom",
      "recharts",
      "framer-motion",
      "papaparse",
      "pdfjs-dist",
      "jspdf",
      "html2canvas"
    ]
  },
  build: {
    // Por si tu proyecto tiene dependencias CJS antiguas
    commonjsOptions: {
      include: [/node_modules/]
    },
    sourcemap: false
  }
});
