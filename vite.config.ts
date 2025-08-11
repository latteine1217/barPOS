import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle 分析工具 - 只在建置時生成
    visualizer({
      filename: 'dist/stats.html',
      open: false, // 不自動開啟瀏覽器
      gzipSize: true,
      brotliSize: true,
    }),
    // 暫時停用 TypeScript 檢查，漸進式遷移中
    // checker({
    //   typescript: true,
    //   eslint: {
    //     lintCommand: 'eslint "./src/**/*.{ts,tsx,js,jsx}"',
    //   },
    // }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
  base: './', // Important for Electron
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Externalize deps that shouldn't be bundled
      external: ['electron'],
      output: {
        // 簡化分包配置
        manualChunks: {
          // React 相關
          vendor: ['react', 'react-dom'],
          // 第三方庫
          supabase: ['@supabase/supabase-js'],
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true, // Prevent Vite from choosing a different port
    host: true, // Allow access from Electron
    middlewareMode: false // Run dev server normally
  },
})