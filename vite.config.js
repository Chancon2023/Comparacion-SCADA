import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Keep heavy runtime libs external to avoid deep bundle issues on Netlify
      external: ["papaparse", "pdfjs-dist/legacy/build/pdf", "xlsx"]
    }
  },
  optimizeDeps: {
    // Ensure dev server pre-bundling doesn't try to crawl these
    exclude: ["papaparse", "pdfjs-dist/legacy/build/pdf", "xlsx"]
  }
});
