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
        // Pin the setup graph's dependencies (see #157).
        //
        // The browser-mode Vite server pre-bundles whatever its pre-run scan can
        // reach statically, then discovers the rest at runtime. A dependency
        // discovered mid-run forces a re-optimisation, which reloads the page —
        // Vitest's own browser provider warns that this "may cause tests to fail,
        // lead to flaky behaviour" and prescribes exactly this field. A test file
        // whose setup import is in flight when the reload lands aborts with a
        // spurious error naming .storybook/vitest.setup.ts, which is the shape the
        // flake took: 7 of 382 files, one run in three, on a cold dep cache.
        //
        // `axe-core` and `storybook/test` are the two that were resolving at
        // runtime — addon-a11y reaches axe through a dynamic `import("axe-core")`,
        // so no static scan can see it. The rest are the setup file's own imports,
        // pinned so the first optimise pass is the only one.
        //
        // To check: delete node_modules/.cache/storybook, run the suite, and read
        // `optimized` in .cache/storybook/*/sb-vitest/deps/_metadata.json. Every
        // name below must be there. If a new dependency starts arriving at runtime,
        // Vitest prints "Vite unexpectedly reloaded a test" — add it here.
        optimizeDeps: {
          include: [
            '@storybook/addon-a11y/preview',
            '@storybook/addon-vitest/internal/setup-file',
            '@storybook/addon-vitest/internal/test-utils',
            '@storybook/react-vite',
            'axe-core',
            'prop-types',
            'react-dom/client',
            'react-dom/test-utils',
            'storybook/internal/preview/runtime',
            'storybook/preview-api',
            'storybook/test'
          ]
        },
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
          // Vitest replaces config arrays rather than merging them, so naming a
          // setup file here deletes the ones @storybook/addon-vitest injects from
          // its own `config()` hook. The addon then re-adds a browser setup file
          // later, from `configureVitest`, against a different config object — and
          // the project ends up with a setup graph assembled across two phases.
          // Name the addon's entry explicitly so the list is whole and ordered.
          //
          // Storybook prints an info box offering to let you delete
          // .storybook/vitest.setup.ts, on the grounds that since 10.3 the addon
          // applies preview annotations itself. Do not take it: without a local
          // setProjectAnnotations the addon loads
          // setup-file-with-project-annotations.js instead, whose graph fails to
          // import under Vite 8 ("aria-query does not provide an export named
          // 'elementRoles'") and every story file aborts. Measured, not assumed.
          setupFiles: [
            '@storybook/addon-vitest/internal/setup-file',
            '.storybook/vitest.setup.ts'
          ]
        }
      }]
    }
  } : {})
});
