import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Important for Electron
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Externalize deps that shouldn't be bundled
      external: ['electron']
    }
  },
  server: {
    port: 5173,
    strictPort: true, // Prevent Vite from choosing a different port
    host: true // Allow access from Electron
  }
})
