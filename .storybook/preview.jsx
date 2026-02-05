import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../packages/plus-ds/src/styles/main.scss';
import './storybook-overrides.css';
// Load design system styles so stories that import components directly (e.g. @/components/Modal)
// still get .plus-modal, tokens, and other global styles from main.scss
import '../packages/plus-ds/src/styles/main.scss';

/**
 * Storybook preview configuration for PLUS Design System
 */

// ---- Console noise filters (Storybook-only) ---------------------------------
// Goal: keep the console clean for design review by hiding known, non-actionable
// warnings coming from Storybook internals / Highcharts.
//
// IMPORTANT: We only filter *specific* message substrings to avoid masking real
// errors during development.
const SUPPRESSED_CONSOLE_SUBSTRINGS = [
  // Storybook internal deprecation (doesn't break anything today)
  'The `active` prop on `Button` is deprecated and will be removed in Storybook 11.',
  // Highcharts accessibility module reminder (we’ll handle accessibility later)
  'Highcharts warning: Consider including the "accessibility.js" module',
];

const shouldSuppressConsoleMessage = (args) => {
  const text = args
    .map((a) => (typeof a === 'string' ? a : ''))
    .join(' ');
  return SUPPRESSED_CONSOLE_SUBSTRINGS.some((s) => text.includes(s));
};

// Patch console once (Vite HMR can re-run modules)
if (!globalThis.__PLUS_STORYBOOK_CONSOLE_PATCHED__) {
  globalThis.__PLUS_STORYBOOK_CONSOLE_PATCHED__ = true;

  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  console.warn = (...args) => {
    if (shouldSuppressConsoleMessage(args)) return;
    originalWarn(...args);
  };

  console.error = (...args) => {
    if (shouldSuppressConsoleMessage(args)) return;
    originalError(...args);
  };
}

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
            ['TrainingLessons', 'Onboarding'],
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
