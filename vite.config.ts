import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Optimize for production
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'router-vendor': ['react-router-dom'],
          'utils-vendor': ['clsx', 'tailwind-merge', 'date-fns'],
        },
      },
    },
    // Increase chunk size warning limit since we have many features
    chunkSizeWarningLimit: 1000,
  },
  // Enable preview mode for local testing
  preview: {
    port: 3000,
    host: true,
  },
  // Environment variables
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
}); 