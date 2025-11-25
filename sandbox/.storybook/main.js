const path = require('path');

/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  stories: [
    '../../design-system/components/organisms/**/*.stories.@(js|jsx|ts|tsx)',
    '../../design-system/components/molecules/**/*.stories.@(js|jsx|ts|tsx)',
    '../../design-system/components/atoms/**/*.stories.@(js|jsx|ts|tsx)',
    '../../design-system/components/*.stories.@(js|jsx|ts|tsx)',
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
    
    // Add alias for design-system components FIRST (more specific aliases should come first)
    // Map @/js/components to design-system/components/local
    config.resolve.alias['@/js/components'] = path.resolve(designSystemPath, 'components/local');
    
    // Add alias for src directory - use absolute path (for backward compatibility)
    config.resolve.alias['@'] = srcPath;
    config.resolve.alias['@design-system'] = designSystemPath;
    
    // Ensure proper resolution of .js files
    if (!config.resolve.extensions) {
      config.resolve.extensions = ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'];
    }
    
    // Configure Vite to resolve modules from project root
    config.resolve.preserveSymlinks = false;
    
    // Ensure CSS is processed and available
    config.css = config.css || {};
    config.css.postcss = config.css.postcss || {};
    
    return config;
  },
};

module.exports = config;
