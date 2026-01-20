import React from 'react';
import './storybook-overrides.css';

/**
 * Storybook preview configuration for PLUS Design System
 */

// Cleanup functions - using dummy no-ops as legacy components are being phased out or moved
const cleanupFunctions = {
  clearAllToasts: () => { },
  destroyAllTooltips: () => { },
};

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    docs: {
      source: {
        type: 'code',
      },
    },
    options: {
      storySort: {
        order: [
          'Styles',
          ['Introduction', 'Icons', 'Typography', 'Layout', 'Colors', 'Elevation', 'Patterns', ['Introduction', 'Elements', 'Cards', 'Modals', 'Sections', 'Tables', 'Surfaces', 'SurfaceContainer']],
          'Assets',
          'Forms',
          'Components',
          'Data Visualizations',
          'Specs',
          [
            'Universal',
            ['Elements', ['SmartBadges'], 'Cards', 'Tables', 'Sections', 'Modals', 'Pages'],
            'Login',
            ['Elements', 'Cards', 'Tables', 'Sections', 'Modals', 'Pages'],
            'Home',
            ['Elements', 'Cards', 'Tables', 'Sections', 'Modals', 'Pages'],
            'Profile',
            ['Elements', 'Cards', 'Tables', 'Sections', 'Modals', 'Pages'],
            'Training',
            ['Lessons', 'Onboarding'],
            'Toolkit',
            ['Elements', 'Cards', 'Tables', 'Sections', 'Modals', 'Pages'],
            'Admin',
            [
              'Group Admin',
              ['Elements', 'Cards', 'Tables', 'Sections', 'Modals', 'Pages'],
              'Session Admin',
              ['Elements', 'Cards', 'Tables', 'Sections', 'Modals', 'Pages'],
              'Student Admin',
              ['Elements', 'Cards', 'Tables', 'Sections', 'Modals', 'Pages'],
              'Tutor Admin',
              ['Elements', 'Cards', 'Tables', 'Sections', 'Modals', 'Pages'],
            ],
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
      return <Story />;
    },
  ],

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;
