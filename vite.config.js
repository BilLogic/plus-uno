/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'module';
import { nodeModulesDirFrom } from './scripts/node-modules-dir.mjs';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** #282 — see scripts/node-modules-dir.mjs, where this is explained and tested. */
const nodeModulesDir = () => nodeModulesDirFrom((id) => require.resolve(id));

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
    strictPort: false,
    fs: {
      // #282. This repo does its work in git worktrees under `.claude/worktrees/`,
      // which carry no `node_modules` of their own — Node resolves every
      // dependency UPWARD to the primary checkout's, which is OUTSIDE the Vite
      // root. Vite will not serve a file outside the allow list, and Vitest's
      // browser tester asks for its setup file by ABSOLUTE PATH: it prefixes
      // `/@fs/` only for a Windows drive letter (`/^\w:/.test(filepath)` in
      // @vitest/browser's tester), so on macOS the request is
      // `http://localhost:PORT/Users/…/node_modules/…/setup-file.js` and 404s.
      //
      // The cost was the whole gate: all 388 story files aborted before a single
      // test ran, so `check:storybook` — 1137 tests and the a11y ratchet — could
      // only ever be exercised in CI or by hand in the primary checkout.
      //
      // This one entry covers the browser test server too. @vitest/browser
      // rebuilds `server` for a browser project, but it SPREADS what is already
      // there before appending its own paths, so the entry survives. Measured
      // with the caches cleared each time: with it, 10 tests pass; without it,
      // `no tests` and a 404 for the setup file.
      //
      // `nodeModulesDir()` and not its parent: `npm run storybook` binds
      // `--host 0.0.0.0`, and allowing the checkout above would put every
      // untracked file in the primary checkout on the LAN.
      allow: [dirname, nodeModulesDir()].filter(Boolean)
    }
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
          path.resolve(dirname, 'design-system/src/styles')
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
        // `framer-motion` and `react-router-dom` were added after the flake came
        // back on 2026-08-29 and took three PRs red at once, each naming a
        // DIFFERENT innocent story file. The log says what the comment above
        // predicted it would:
        //
        //     [vite] (client) ✨ new dependencies optimized: framer-motion, react-router-dom
        //     [vitest] Vite unexpectedly reloaded a test.
        //     [vite] (client) ✨ optimized dependencies changed. reloading
        //
        // NEITHER IS IMPORTED BY ANYTHING UNDER THE STORY GLOBS — searched across
        // `design-system/src` and `.storybook`, statically, and there is no hit.
        // That is not a contradiction, it is the mechanism: a dependency no static
        // scan can reach is precisely the one that arrives mid-run. `include`
        // forces it into the first pass anyway, which is the whole point of the
        // field, and pre-bundling a package the suite may never execute costs one
        // optimise pass and nothing else.
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
            'framer-motion',
            'prop-types',
            'react-dom/client',
            'react-dom/test-utils',
            'react-router-dom',
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
