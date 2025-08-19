import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config. If your project already has a vite.config.{js,ts}, keep your file
// and just ensure @vitejs/plugin-react is present. This minimal config fixes
// "vite not found" and rolls with the default settings.
export default defineConfig({
  plugins: [react()]
})
