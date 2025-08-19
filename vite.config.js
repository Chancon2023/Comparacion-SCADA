import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Evita que Rollup intente empaquetar libs que causan problemas en Netlify
      external: [
        'papaparse',
        'pdfjs-dist',
        'pdfjs-dist/legacy/build/pdf'
      ]
    }
  },
  optimizeDeps: {
    // asegúrate de que vite detecte papaparse en dev/preview
    include: ['papaparse']
  }
})
