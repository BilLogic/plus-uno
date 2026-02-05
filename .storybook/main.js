import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    // Prefer brace expansion here (more consistently supported across globbers than extglob @())
    '../packages/plus-ds/src/**/*.stories.{js,jsx,ts,tsx}',
    // '../packages/plus-ds/src/**/*.mdx',

    // Source of truth in this repo (legacy but still actively used)
    '../design-system/specs/**/*.stories.{js,jsx,ts,tsx}',
    // '../design-system/specs/**/*.mdx',

    // Playground prototypes
    '../playground/prototyping/**/*.stories.{js,jsx,ts,tsx}',
  ],
  addons: [
    '@storybook/addon-links',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {
      strictMode: true,
    },
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
  },
  features: {
    storyStoreV7: true,
  },
  docs: {
    autodocs: true,
  },
  server: {
    host: '127.0.0.1',
    port: 6006,
  },
  staticDirs: (() => {
    const staticDirs = [];
    const rootDistPath = path.resolve(__dirname, '../dist');
    const distPath = path.resolve(__dirname, '../packages/plus-ds/dist');
    const assetsPath = path.resolve(__dirname, '../packages/plus-ds/src/assets');

    // Include root dist directory for CSS files
    if (fs.existsSync(rootDistPath)) {
      staticDirs.push({ from: rootDistPath, to: '/dist' });
    }
    // Only include directories that exist
    if (fs.existsSync(distPath) && fs.readdirSync(distPath).length > 0) {
      staticDirs.push({ from: distPath, to: '/packages-dist' });
    }
    if (fs.existsSync(assetsPath)) {
      staticDirs.push({ from: assetsPath, to: '/assets' });
    }

    return staticDirs;
  })(),
  viteFinal: async (config) => {
    // Configure path aliases for component imports
    const rootDir = path.resolve(__dirname, '..');
    const srcPath = path.resolve(rootDir, 'packages/plus-ds/src');

    // Set Vite root to project root for proper path resolution
    config.root = rootDir;

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
      config.resolve.extensions = ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'];
    }

    // Configure Vite to resolve modules from project root
    config.resolve.preserveSymlinks = false;

    // Ensure story files are treated as ES modules
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.esbuildOptions = config.optimizeDeps.esbuildOptions || {};
    config.optimizeDeps.esbuildOptions.loader = config.optimizeDeps.esbuildOptions.loader || {};
    config.optimizeDeps.esbuildOptions.loader['.js'] = 'jsx';

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
        path.resolve(rootDir, 'develop/tokens'),
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
    // Allow 127.0.0.1 hostname for Vite
    config.server.allowedHosts = ['127.0.0.1', 'localhost'];

    // Improve HMR stability
    config.server.hmr = config.server.hmr || {};
    config.server.hmr.overlay = true;

    // Ensure proper CSS module handling
    config.css.modules = config.css.modules || {};
    config.css.modules.localsConvention = 'camelCase';

    return config;
  },
};

export default config;
