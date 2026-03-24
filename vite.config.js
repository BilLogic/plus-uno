/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'module';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Conditionally load Tailwind CSS vite plugin (used by Storybook docs, not required for prototype app)
let tailwindcss;
try {
  tailwindcss = require('@tailwindcss/vite').default;
} catch (e) {
  tailwindcss = null;
}

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
  plugins: [tailwindcss ? tailwindcss() : null, react()].filter(Boolean),
  resolve: {
    dedupe: ['react', 'react-dom', 'framer-motion'],
    alias: {
      '@': path.resolve(__dirname, './design-system/src'),
      '@plus-ds': path.resolve(__dirname, './design-system/src'),
      '~': path.resolve(__dirname, './node_modules')
    }
  },
  server: {
    port: 4100,
    open: true,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        // Vendor splitting to avoid a single oversized app chunk.
        // manualChunks is deprecated in Vite 8 — migrate to codeSplitting when stable.
        manualChunks(id) {
          if (!id) return undefined;

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
          path.resolve(dirname, 'design-system/src/tokens'),
          path.resolve(dirname, 'design-system/src/styles'),
          path.resolve(dirname, 'design-system/src/forms')
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
