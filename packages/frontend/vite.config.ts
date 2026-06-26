/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ filename: 'stats.html', open: false })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@synapse/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand', 'socket.io-client', 'lucide-react', '@tanstack/react-virtual'],
        },
      },
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': 'http://localhost:4000',
      '/files': 'http://localhost:4000',
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
