/**
 * Storybook preview configuration for PLUS Design System
 * Dependencies (Bootstrap, jQuery, Font Awesome, PLUS CSS) are loaded via preview-head.html
 * 
 * Note: CSS is loaded via preview-head.html to avoid Vite module resolution issues
 * The CSS file at /dist/css/main.css contains all color tokens and component styles
 */

import { clearAllToasts } from '../../design-system/components/local/universal/elements/toast.js';
import { destroyAllTooltips } from '../../design-system/components/local/universal/elements/tooltip.js';

/** @type { import('@storybook/html').Preview } */
const preview = {
  parameters: {
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
        clearAllToasts();
      } catch (e) {
        // Silently fail if toast module isn't loaded yet
      }
      
      // Destroy all tooltips before rendering a new story
      // This prevents tooltips from previous stories from persisting
      try {
        destroyAllTooltips();
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

