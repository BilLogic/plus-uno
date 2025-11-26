const path = require('path');

/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: [
    '../design-system/styles/**/*.stories.@(js|jsx|ts|tsx)',
    '../design-system/components/atoms/**/*.stories.@(js|jsx|ts|tsx)',
    '../design-system/components/molecules/**/*.stories.@(js|jsx|ts|tsx)',
    '../design-system/components/organisms/**/*.stories.@(js|jsx|ts|tsx)',
    '../design-system/assets/**/*.stories.@(js|jsx|ts|tsx)',
    '../design-system/components/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
  ],
  framework: {
    name: '@storybook/html-vite',
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: false,
  },
  features: {
    storyStoreV7: true,
  },
  docs: {
    autodocs: false,
  },
  staticDirs: [
    { from: path.resolve(__dirname, '../dist'), to: '/dist' },
    { from: path.resolve(__dirname, '../public'), to: '/public' },
    { from: path.resolve(__dirname, '../design-system/assets'), to: '/assets' },
  ],
  viteFinal: async (config) => {
    // Configure path aliases for component imports
    const rootDir = path.resolve(__dirname, '..');
    const srcPath = path.resolve(rootDir, 'src');
    const designSystemPath = path.resolve(rootDir, 'design-system');
    
    // Set Vite root to project root for proper path resolution
    config.root = rootDir;
    
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    
    // Add alias for design-system components FIRST (more specific aliases should come first)
    // Map @/js/components to design-system/components (molecules)
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
    
    // Ensure proper ES module handling
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = config.optimizeDeps.include || [];
    
    // Ensure CSS is processed and available
    config.css = config.css || {};
    config.css.postcss = config.css.postcss || {};
    
    // Improve module resolution for better compatibility
    config.build = config.build || {};
    config.build.commonjsOptions = {
      include: [/node_modules/],
      transformMixedEsModules: true,
    };
    
    // Improve error handling for module resolution
    config.resolve.dedupe = config.resolve.dedupe || [];
    config.resolve.dedupe.push('@storybook/html');
    
    // Better handling of dynamic imports
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.force = config.optimizeDeps.force || [];
    
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
      path.resolve(rootDir, 'design-system'),
      path.resolve(rootDir, 'design-system/assets'),
      path.resolve(rootDir, 'design-system/components'),
      path.resolve(rootDir, 'design-system/styles'),
    ];
    
    return config;
  },
};

module.exports = config;
