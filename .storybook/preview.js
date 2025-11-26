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
  import('../design-system/components/Toast/index.js').then(m => {
    cleanupFunctions.clearAllToasts = m.clearAllToasts || (() => {});
  }).catch(() => {}),
  import('../design-system/components/Tooltip/index.js').then(m => {
    cleanupFunctions.destroyAllTooltips = m.destroyAllTooltips || (() => {});
  }).catch(() => {}),
]);

/** @type { import('@storybook/html-vite').Preview } */
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
          'Components',
          'Specs',
          [
            'Specs/Universal',
            ['Specs/Universal', 'Specs/Universal/Elements', 'Specs/Universal/Tables', 'Specs/Universal/Cards', 'Specs/Universal/Modals', 'Specs/Universal/Sections', 'Specs/Universal/Pages'],
            'Specs/Admin',
            'Specs/Home',
            ['Specs/Home', 'Specs/Home/Elements', 'Specs/Home/Tables', 'Specs/Home/Cards', 'Specs/Home/Modals', 'Specs/Home/Sections', 'Specs/Home/Pages'],
            'Specs/Login',
            ['Specs/Login', 'Specs/Login/Elements', 'Specs/Login/Tables', 'Specs/Login/Cards', 'Specs/Login/Modals', 'Specs/Login/Sections', 'Specs/Login/Pages'],
            'Specs/Profile',
            ['Specs/Profile', 'Specs/Profile/Elements', 'Specs/Profile/Tables', 'Specs/Profile/Cards', 'Specs/Profile/Modals', 'Specs/Profile/Sections', 'Specs/Profile/Pages'],
            'Specs/Training',
            ['Specs/Training', 'Specs/Training/Elements', 'Specs/Training/Tables', 'Specs/Training/Cards', 'Specs/Training/Modals', 'Specs/Training/Sections', 'Specs/Training/Pages'],
            'Specs/Toolkit',
            ['Specs/Toolkit', 'Specs/Toolkit/Elements', 'Specs/Toolkit/Tables', 'Specs/Toolkit/Cards', 'Specs/Toolkit/Modals', 'Specs/Toolkit/Sections', 'Specs/Toolkit/Pages'],
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
      options: {
        light: {
          name: 'light',
          value: '#ffffff',
        },

        dark: {
          name: 'dark',
          value: '#1a1a1a',
        },

        surface: {
          name: 'surface',
          value: 'var(--color-surface)',
        },

        "surface-container": {
          name: 'surface-container',
          value: 'var(--color-surface-container)',
        }
      }
    },
    viewport: {
      options: {
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

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;

