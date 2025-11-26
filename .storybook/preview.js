/**
 * Storybook preview configuration for PLUS Design System
 * Dependencies (Bootstrap, jQuery, Font Awesome, PLUS CSS) are loaded via preview-head.html
 * 
 * Note: CSS is loaded via preview-head.html to avoid Vite module resolution issues
 * The CSS file at /dist/css/main.css contains all color tokens and component styles
 */

// Cleanup functions - loaded dynamically in decorator to avoid blocking Storybook startup
const cleanupFunctions = {
  clearAllToasts: () => {},
  destroyAllTooltips: () => {},
};

// Load cleanup functions asynchronously
Promise.all([
  import('../design-system/components/molecules/Toast/index.js').then(m => {
    cleanupFunctions.clearAllToasts = m.clearAllToasts || (() => {});
  }).catch(() => {}),
  import('../design-system/components/molecules/Tooltip/index.js').then(m => {
    cleanupFunctions.destroyAllTooltips = m.destroyAllTooltips || (() => {});
  }).catch(() => {}),
]);

/** @type { import('@storybook/html').Preview } */
const preview = {
  parameters: {
    docs: {
      source: {
        type: 'code',
      },
    },
    options: {
      storySort: {
        method: 'configure',
        order: [
          'Styles',
          ['Styles', 'Styles/Icons', 'Styles/Typography', 'Styles/Layout', 'Styles/Colors', 'Styles/Elevation'],
          'Assets',
          ['Assets', 'Assets/Logo', 'Assets/Images'],
          'Atoms',
          'Molecules',
          'Organisms',
          [
            'Organisms/Universal',
            ['Organisms/Universal', 'Organisms/Universal/Elements', 'Organisms/Universal/Tables', 'Organisms/Universal/Cards', 'Organisms/Universal/Modals', 'Organisms/Universal/Sections', 'Organisms/Universal/Pages'],
            'Organisms/Admin',
            'Organisms/Home',
            ['Organisms/Home', 'Organisms/Home/Elements', 'Organisms/Home/Tables', 'Organisms/Home/Cards', 'Organisms/Home/Modals', 'Organisms/Home/Sections', 'Organisms/Home/Pages'],
            'Organisms/Login',
            ['Organisms/Login', 'Organisms/Login/Elements', 'Organisms/Login/Tables', 'Organisms/Login/Cards', 'Organisms/Login/Modals', 'Organisms/Login/Sections', 'Organisms/Login/Pages'],
            'Organisms/Profile',
            ['Organisms/Profile', 'Organisms/Profile/Elements', 'Organisms/Profile/Tables', 'Organisms/Profile/Cards', 'Organisms/Profile/Modals', 'Organisms/Profile/Sections', 'Organisms/Profile/Pages'],
            'Organisms/Training',
            ['Organisms/Training', 'Organisms/Training/Elements', 'Organisms/Training/Tables', 'Organisms/Training/Cards', 'Organisms/Training/Modals', 'Organisms/Training/Sections', 'Organisms/Training/Pages'],
            'Organisms/Toolkit',
            ['Organisms/Toolkit', 'Organisms/Toolkit/Elements', 'Organisms/Toolkit/Tables', 'Organisms/Toolkit/Cards', 'Organisms/Toolkit/Modals', 'Organisms/Toolkit/Sections', 'Organisms/Toolkit/Pages'],
          ],
          'Introduction',
        ],
      },
    },
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'surface',
          value: 'var(--color-surface)',
        },
        {
          name: 'surface-container',
          value: 'var(--color-surface-container)',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1280px',
            height: '800px',
          },
        },
      },
    },
  },
  decorators: [
    (story) => {
      // Clear all toasts before rendering a new story
      // This prevents toasts from previous stories from persisting
      try {
        cleanupFunctions.clearAllToasts();
      } catch (e) {
        // Silently fail if toast module isn't loaded yet
      }
      
      // Destroy all tooltips before rendering a new story
      // This prevents tooltips from previous stories from persisting
      try {
        cleanupFunctions.destroyAllTooltips();
      } catch (e) {
        // Silently fail if tooltip module isn't loaded yet
      }
      
      // Create a container with proper structure
      const container = document.createElement('div');
      container.style.padding = '2rem';
      container.style.minHeight = '100vh';
      container.style.backgroundColor = 'var(--color-surface, #ffffff)';
      
      // Append the story content
      const storyElement = story();
      if (storyElement) {
        container.appendChild(storyElement);
      }
      
      return container;
    },
  ],
};

export default preview;

