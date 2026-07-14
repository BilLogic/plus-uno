import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

/** ESM-safe __dirname */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

/**
 * Vite config for the Storybook-spec live app replica.
 */
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      '@tutors.plus/design-system': path.resolve(repoRoot, 'design-system/src/index.js'),
      '@': path.resolve(repoRoot, 'design-system/src'),
      '@plus-ds': path.resolve(repoRoot, 'design-system/src'),
      react: path.resolve(repoRoot, 'node_modules/react'),
      'react-dom': path.resolve(repoRoot, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom', 'framer-motion'],
  },
  server: {
    port: 3030,
    host: true,
    strictPort: false,
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        loadPaths: [
          path.resolve(repoRoot, 'design-system/src/tokens'),
          path.resolve(repoRoot, 'design-system/src/styles'),
          path.resolve(repoRoot, 'design-system/src/forms'),
        ],
        silenceDeprecations: ['import', 'legacy-js-api'],
      },
    },
  },
});
