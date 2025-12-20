const path = require('path');

/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../new-ds/assets/**/*.stories.@(js|jsx|ts|tsx)',
    '../new-ds/components/**/*.stories.@(js|jsx|ts|tsx)',
    '../new-ds/forms/**/*.stories.@(js|jsx|ts|tsx)',
    '../new-ds/patterns/**/*.stories.@(js|jsx|ts|tsx)',
    '../new-ds/patterns/**/*.mdx',
    '../new-ds/specs/**/*.stories.@(js|jsx|ts|tsx)',
    '../new-ds/styles/**/*.stories.@(js|jsx|ts|tsx)',
    '../new-ds/styles/**/*.mdx',
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
    { from: path.resolve(__dirname, '../dist'), to: '/dist' },
    { from: path.resolve(__dirname, '../legacy-ds/assets'), to: '/assets' },
  ],
  viteFinal: async (config) => {
    // Configure path aliases for component imports
    const rootDir = path.resolve(__dirname, '..');
    const srcPath = path.resolve(rootDir, 'new-ds');
    const designSystemPath = path.resolve(rootDir, 'legacy-ds');

    // Set Vite root to project root for proper path resolution
    config.root = rootDir;

    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    // Add alias for design-system components FIRST (more specific aliases should come first)
    // Map @/js/components to design-system/components
    config.resolve.alias['@/js/components'] = path.resolve(designSystemPath, 'components');

    // Add alias for src directory - use absolute path (for backward compatibility)
    config.resolve.alias['@'] = srcPath;
    config.resolve.alias['@design-system'] = designSystemPath;

    // Ensure Vite can resolve relative paths from project root
    // This helps with dynamic imports in story files
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
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = config.optimizeDeps.include || [];

    // Ensure CSS is processed and available
    config.css = config.css || {};
    config.css.postcss = config.css.postcss || {};
    
    // Configure SCSS preprocessor options (matching vite.config.js)
    // Merge with existing options if they exist
    config.css.preprocessorOptions = config.css.preprocessorOptions || {};
    const existingLoadPaths = config.css.preprocessorOptions.scss?.loadPaths || [];
    config.css.preprocessorOptions.scss = {
      api: 'modern-compiler',
      loadPaths: [
        ...new Set([ // Use Set to avoid duplicates
          ...existingLoadPaths,
          path.resolve(rootDir, 'develop/tokens'),
          path.resolve(rootDir, 'legacy-ds/components'),
          path.resolve(rootDir, 'new-ds/forms'),
          path.resolve(rootDir, 'new-ds/components')
        ])
      ],
      silenceDeprecations: ['legacy-js-api']
    };

    // Improve module resolution for better compatibility
    config.build = config.build || {};
    config.build.commonjsOptions = {
      include: [/node_modules/],
      transformMixedEsModules: true,
    };

    // Improve error handling for module resolution
    config.resolve.dedupe = config.resolve.dedupe || [];
    config.resolve.dedupe.push('@storybook/react-vite');

    // Better handling of dynamic imports
    config.optimizeDeps = config.optimizeDeps || {};

    // Ensure story files are properly handled as modules
    config.optimizeDeps.include = config.optimizeDeps.include || [];
    config.optimizeDeps.include.push(
      'legacy-ds/components/index.js',
      'legacy-ds/components/**/*.js'
    );

    // Configure static asset serving
    // Disable default publicDir to use staticDirs instead
    config.publicDir = false;

    // Ensure static assets are properly served
    config.server = config.server || {};
    config.server.fs = config.server.fs || {};
    // Allow Vite to access the entire project root and design-system directory
    config.server.fs.allow = [
      ...(config.server.fs.allow || []),
      rootDir, // Allow access to entire project root
      path.resolve(rootDir, 'legacy-ds'),
      path.resolve(rootDir, 'legacy-ds/assets'),
      path.resolve(rootDir, 'legacy-ds/components'),
      path.resolve(rootDir, 'legacy-ds/specs'),
      path.resolve(rootDir, 'legacy-ds/styles'),
    ];

    // Enable HMR and file watching
    config.server.watch = {
      ...config.server.watch,
      usePolling: false,
      interval: 100,
    };

    // Ensure HMR is enabled
    config.server.hmr = {
      ...config.server.hmr,
      overlay: true,
    };

    return config;
  },
};

module.exports = config;
