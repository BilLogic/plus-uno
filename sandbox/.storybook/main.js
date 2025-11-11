const path = require('path');

/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: ['../../design-system/components/atoms-molecules/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
  ],
  framework: {
    name: '@storybook/html-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: [
    { from: '../../dist', to: '/dist' },
    { from: '../public', to: '/public' },
  ],
  viteFinal: async (config) => {
    // Configure path aliases for component imports
    const rootDir = path.resolve(__dirname, '../..');
    const srcPath = path.resolve(rootDir, 'src');
    const designSystemPath = path.resolve(rootDir, 'design-system');
    
    // Set Vite root to project root for proper path resolution
    config.root = rootDir;
    
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    
    // Add alias for src directory - use absolute path (for backward compatibility)
    config.resolve.alias['@'] = srcPath;
    // Add alias for design-system components - map @/js/components to design-system/components/local
    config.resolve.alias['@/js/components'] = path.resolve(designSystemPath, 'components/local');
    config.resolve.alias['@design-system'] = designSystemPath;
    
    // Ensure proper resolution of .js files
    if (!config.resolve.extensions) {
      config.resolve.extensions = ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'];
    }
    
    // Configure Vite to resolve modules from project root
    config.resolve.preserveSymlinks = false;
    
    return config;
  },
};

module.exports = config;
