import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const plusDsSrc = path.resolve(__dirname, '../../../../packages/plus-ds/src');

/**
 * Vite config for Research Assistant Chat prototype.
 * Resolves plus-ds tokens and design system from monorepo.
 */
const projectRoot = path.resolve(__dirname, '../../../../');

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: [
      /** plus-ds internal files use @/; regex ensures resolution from any importer. */
      { find: /^@\/(.*)$/, replacement: `${plusDsSrc}/$1` },
      /** App and plus-ds use @plus-ds/ for specs and components. */
      { find: /^@plus-ds\/(.*)$/, replacement: `${plusDsSrc}/$1` },
      /** Single React instance – prevents "useContext of null" and blank page from multiple React copies. */
      { find: 'react', replacement: path.join(projectRoot, 'node_modules/react') },
      { find: 'react-dom', replacement: path.join(projectRoot, 'node_modules/react-dom') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [plusDsSrc, path.join(plusDsSrc, 'styles')],
      },
    },
  },
  server: {
    port: 3010,
    strictPort: false,
  },
});
