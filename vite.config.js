/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'module';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Conditionally load vitest plugins only when the packages are available
// This allows Storybook to load vite.config.js without requiring vitest addon
let storybookTest, playwright;
try {
  const vitestAddon = require('@storybook/addon-vitest/vitest-plugin');
  storybookTest = vitestAddon.storybookTest;
  const playwrightModule = require('@vitest/browser-playwright');
  playwright = playwrightModule.playwright;
} catch (e) {
  // Vitest addon not available, skip test configuration
  storybookTest = null;
  playwright = null;
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'framer-motion'],
    alias: {
      '@': path.resolve(__dirname, './packages/plus-ds/src'),
      '@plus-ds': path.resolve(__dirname, './packages/plus-ds/src'),
      '~': path.resolve(__dirname, './node_modules')
    }
  },
  server: {
    port: 3000,
    open: true,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id) return undefined;

          // Vendor splitting to avoid a single oversized app chunk.
          if (id.includes('node_modules')) {
            if (id.includes('/framer-motion/')) {
              return 'vendor-motion';
            }
            if (id.includes('/highcharts') || id.includes('/highcharts-react-official')) {
              return 'vendor-charts';
            }
            if (id.includes('/react-bootstrap/') || id.includes('/bootstrap/')) {
              return 'vendor-bootstrap';
            }
            return 'vendor-core';
          }
          return undefined;
        }
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        loadPaths: [
          path.resolve(dirname, 'packages/plus-ds/src/tokens'),
          path.resolve(dirname, 'packages/plus-ds/src/styles'),
          path.resolve(dirname, 'packages/plus-ds/src/forms')
        ],
        silenceDeprecations: ['import', 'legacy-js-api']
      }
    }
  },
  ...(storybookTest && playwright ? {
    test: {
      projects: [{
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook')
          })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{
              browser: 'chromium'
            }]
          },
          setupFiles: ['.storybook/vitest.setup.ts']
        }
      }]
    }
  } : {})
});
