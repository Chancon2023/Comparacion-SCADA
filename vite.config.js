import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config tuned for Netlify build:
// - externalize heavy libs so Rollup doesn't try to inline them
//   (avoids missing-resolution warnings in CI environments)
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        'papaparse',
        'pdfjs-dist',
        'pdfjs-dist/build/pdf',
        'pdfjs-dist/legacy/build/pdf'
      ]
    }
  },
  // Avoid optimizeDeps trying to prebundle these at build/preview time
  optimizeDeps: {
    exclude: ['papaparse', 'pdfjs-dist']
  }
})
