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
    alias: {
      '@': path.resolve(__dirname, './packages/plus-ds/src'),
      '~': path.resolve(__dirname, './node_modules')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        loadPaths: [
          path.resolve(dirname, 'develop/tokens'),
          path.resolve(dirname, 'packages/plus-ds/src/styles'),
          path.resolve(dirname, 'packages/plus-ds/src/forms')
        ],
        silenceDeprecations: ['legacy-js-api']
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