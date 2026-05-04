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
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
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
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      external: ['electron'],
      output: {
        // 進階分包：將大型第三方庫獨立成 chunk，便於快取與並行載入
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          // React 與 ReactDOM 一定要同一個 chunk
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'react';
          }

          if (id.includes('node_modules/@supabase/')) {
            return 'supabase';
          }

          if (id.includes('node_modules/recharts/') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-vendor/')) {
            return 'charts';
          }

          if (id.includes('node_modules/date-fns/')) {
            return 'date-fns';
          }

          if (id.includes('node_modules/lodash/') ||
              id.includes('node_modules/lodash-es/')) {
            return 'lodash';
          }

          if (id.includes('node_modules/zustand/') ||
              id.includes('node_modules/immer/')) {
            return 'state';
          }

          if (id.includes('node_modules/@capacitor/')) {
            return 'capacitor';
          }

          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
})
