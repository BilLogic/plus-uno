const path = require('path');

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../packages/plus-ds/src/assets/**/*.stories.@(js|jsx|ts|tsx)',
    '../packages/plus-ds/src/components/**/*.stories.@(js|jsx|ts|tsx)',
    '../packages/plus-ds/src/forms/**/*.stories.@(js|jsx|ts|tsx)',
    '../packages/plus-ds/src/specs/**/*.stories.@(js|jsx|ts|tsx)',
    '../packages/plus-ds/src/styles/**/*.stories.@(js|jsx|ts|tsx)',
    '../packages/plus-ds/src/styles/**/*.mdx',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-vitest'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
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
  staticDirs: [
    // Only include dist if it exists
    ...(require('fs').existsSync(path.resolve(__dirname, '../packages/plus-ds/dist')) 
      ? [{ from: path.resolve(__dirname, '../packages/plus-ds/dist'), to: '/dist' }] 
      : []),
    // Keeping legacy assets mapping if potentially needed, but standardizing primarily on new package
    { from: path.resolve(__dirname, '../packages/plus-ds/src/assets'), to: '/assets' },
  ],
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

    // Config css
    config.css = config.css || {};
    config.css.preprocessorOptions = config.css.preprocessorOptions || {};
    config.css.preprocessorOptions.scss = {
      includePaths: [path.resolve(srcPath, 'components')]
    };

    // Use staticDirs instead
    config.publicDir = false;

    // Allow serving from root and package src
    config.server = config.server || {};
    config.server.fs = config.server.fs || {};
    config.server.fs.allow = [
      ...(config.server.fs.allow || []),
      rootDir,
      srcPath
    ];

    return config;
  },
};

module.exports = config;
