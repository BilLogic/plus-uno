// This file has been automatically migrated to valid ESM format by Storybook.
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import { resolveManagerThemes } from '../scripts/lib/manager-theme.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../design-system/src/**/*.mdx',
    '../design-system/src/**/*.stories.{js,jsx,ts,tsx}',

    // Playground prototypes selectively included in Storybook
    '../prototypes/tutor-revamp/src/**/*.stories.{js,jsx}',
  ],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-mcp',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y'
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {
      strictMode: true,
    },
  },

  typescript: {
    check: false,
    reactDocgen: 'react-docgen',
  },

  // storyStoreV7 is default in Storybook 10 — no features flag needed.

  staticDirs: (() => {
    const staticDirs = [];
    const rootDistPath = path.resolve(__dirname, '../dist');
    const assetsPath = path.resolve(__dirname, '../design-system/src/assets');

    // Include root dist directory for CSS files
    if (fs.existsSync(rootDistPath)) {
      staticDirs.push({ from: rootDistPath, to: '/dist' });
    }
    if (fs.existsSync(assetsPath)) {
      staticDirs.push({ from: assetsPath, to: '/assets' });
    }

    // The Uno Blueprint logo on the docs' floating links; on the site it is served from public/.
    const blueprintLogos = path.resolve(__dirname, '../public/uno-bot/logos');
    if (fs.existsSync(blueprintLogos)) {
      staticDirs.push({ from: blueprintLogos, to: '/uno-bot/logos' });
    }

    return staticDirs;
  })(),

  // The manager's theme API takes literal colors and the manager cannot read the
  // page's custom properties, so the color tokens are resolved here, per mode, and
  // inlined for manager.js (see scripts/lib/manager-theme.mjs).
  managerHead: (head) => `${head}
<script>window.__PLUS_MANAGER_THEMES__ = ${JSON.stringify(resolveManagerThemes()).replace(/</g, '\\u003c')};</script>`,

  viteFinal: async (config) => {
    // Configure path aliases for component imports
    const rootDir = path.resolve(__dirname, '..');
    const srcPath = path.resolve(rootDir, 'design-system/src');

    // Set Vite root to project root for proper path resolution
    config.root = rootDir;
    config.base = './'; // Ensure relative paths for subdirectory deployment

    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    // Map @ to src
    config.resolve.alias['@'] = srcPath;

    // Ensure Vite can resolve relative paths from project root
    if (!config.resolve.modules) {
      config.resolve.modules = ['node_modules', rootDir];
    } else {
      config.resolve.modules.push(rootDir);
    }

    // Ensure proper resolution of .js files
    if (!config.resolve.extensions) {
      config.resolve.extensions = ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.mdx'];
    } else if (!config.resolve.extensions.includes('.mdx')) {
      config.resolve.extensions.push('.mdx');
    }

    // Configure Vite to resolve modules from project root
    config.resolve.preserveSymlinks = false;

    // Ensure story files are treated as ES modules (Vite 8 / Rolldown)
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.rolldownOptions = config.optimizeDeps.rolldownOptions || {};
    config.optimizeDeps.rolldownOptions.moduleTypes = { '.js': 'jsx' };

    // Ensure proper ES module handling
    config.optimizeDeps.include = config.optimizeDeps.include || [];
    config.optimizeDeps.include.push('react', 'react-dom', 'prop-types');

    // Deduplicate React to avoid invalid hook call errors
    config.resolve.dedupe = config.resolve.dedupe || [];
    config.resolve.dedupe.push('react', 'react-dom');

    // Config css
    config.css = config.css || {};
    config.css.preprocessorOptions = config.css.preprocessorOptions || {};
    config.css.preprocessorOptions.scss = {
      includePaths: [
        path.resolve(srcPath, 'components'),
        path.resolve(rootDir, TOKEN_DIR),
        path.resolve(srcPath, 'styles')
      ],
      api: 'modern-compiler',
      // Keep Storybook terminal output readable (these are Sass 3.0 deprecations in legacy SCSS)
      silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin']
    };

    // Use staticDirs instead
    config.publicDir = false;

    // Allow serving from root and package src
    // Note: server config is set at top level, don't override here
    config.server = config.server || {};
    config.server.fs = config.server.fs || {};
    config.server.fs.allow = [
      ...(config.server.fs.allow || []),
      rootDir,
      srcPath
    ];
    // Allow all hosts so Storybook works at 127.0.0.1 or localhost (dev only)
    config.server.allowedHosts = true;

    // Improve HMR stability
    config.server.hmr = config.server.hmr || {};
    config.server.hmr.overlay = true;

    // Ensure proper CSS module handling
    config.css.modules = config.css.modules || {};
    config.css.modules.localsConvention = 'camelCase';

    return config;
  }
};

export default config;
