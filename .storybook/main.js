import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../design-system/src/**/*.mdx',
    // design-system is the source of truth (includes specs; design-system/specs excluded to avoid duplicate story IDs with Toolkit)
    '../design-system/src/**/*.stories.{js,jsx,ts,tsx}',

    // Playground prototypes selectively included in Storybook
    // '../playground/storybook-ai-agent-llm-api/**/*.stories.{js,jsx,ts,tsx}',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
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
  features: {
    storyStoreV7: true,
  },
  docs: {
    autodocs: true,
  },
  server: {
    host: '0.0.0.0',
    port: 6006,
  },
  staticDirs: (() => {
    const staticDirs = [];
    const rootDistPath = path.resolve(__dirname, '../dist');
    const distPath = path.resolve(__dirname, '../design-system/dist');
    const assetsPath = path.resolve(__dirname, '../design-system/src/assets');

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

    // Tailwind (shadcn doc chrome + MDX); must run before other CSS transforms
    const plugins = config.plugins ?? [];
    const hasTailwind = plugins.some(
      (p) => p && (p.name === '@tailwindcss/vite' || p.name === 'tailwindcss')
    );
    if (!hasTailwind) {
      config.plugins = [tailwindcss(), ...plugins];
    }

    // Config css
    config.css = config.css || {};
    config.css.preprocessorOptions = config.css.preprocessorOptions || {};
    config.css.preprocessorOptions.scss = {
      includePaths: [
        path.resolve(srcPath, 'components'),
        path.resolve(rootDir, 'design-system/src/tokens'),
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
  },
};

export default config;
