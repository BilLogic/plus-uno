import React, { useEffect } from 'react';

/**
 * Storybook preview configuration for PLUS Design System
 */

import '../packages/plus-ds/src/styles/main.scss';
import './storybook-overrides.css';

// Cleanup functions - using dummy no-ops as legacy components are being phased out or moved
const cleanupFunctions = {
  clearAllToasts: () => { },
  destroyAllTooltips: () => { },
};

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
        method: 'alphabetical',
        order: [
          'Styles',
          ['Introduction', 'Icons', 'Typography', 'Layout', 'Colors', 'Elevation', 'Patterns', ['Introduction', 'Elements', 'Cards', 'Modals', 'Sections', 'Tables', 'Surfaces', 'SurfaceContainer']],
          'Assets',
          ['Assets', 'Assets/Logo', 'Assets/Images'],
          'Forms',
          'Components',
          'Data Visualizations',
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
    (Story) => {
      useEffect(() => {
        // Cleanup functions
        try {
          cleanupFunctions.clearAllToasts();
        } catch (e) { }

        try {
          cleanupFunctions.destroyAllTooltips();
        } catch (e) { }

        // Remove modals and scrims
        const modals = document.querySelectorAll('.plus-modal');
        modals.forEach(modal => modal.remove());

        const allDivs = document.querySelectorAll('div');
        allDivs.forEach(div => {
          const style = window.getComputedStyle(div);
          const inlineStyle = div.style;
          if (style.position === 'fixed' &&
            (inlineStyle.zIndex === '1000' || parseInt(style.zIndex) >= 1000) &&
            (div.querySelector('.plus-modal') ||
              inlineStyle.backgroundColor === 'var(--color-scrim)' ||
              style.backgroundColor.includes('rgba'))) {
            div.remove();
          }
        });
      });

      return React.createElement('div', {
        style: { padding: '2rem', minHeight: '100vh', backgroundColor: 'var(--color-surface, #ffffff)' }
      }, React.createElement(Story));
    },
  ],

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;
