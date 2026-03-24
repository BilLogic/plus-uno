import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
// Design system: tokens, .plus-modal, and other globals for stories that import @/ components
import '../design-system/src/styles/main.scss';
// Docs-only Tailwind + shadcn (no Preflight; see storybook-tailwind.css)
import '../design-system/src/storybook-docs/storybook-tailwind.css';
import './storybook-overrides.css';

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
      toc: {
        title: 'On this page',
        /**
         * Storybook’s TOC uses Tocbot, which scrolls via `window.scrollTo` + `getBoundingClientRect`.
         * That path ignores CSS `scroll-padding-top` (see storybook-overrides.css). Defaults (±40px)
         * are too small for the preview chrome, so “Layout” stops mid-viewport and scrollspy
         * still marks the previous section active. Match our scroll-padding (6rem ≥768px; 5rem below).
         */
        unsafeTocbotOptions: {
          headingsOffset: 96,
          scrollSmoothOffset: -96,
        },
      },
      source: {
        type: 'code',
      },
    },
    options: {
      storySort: {
        order: [
          'PLUS Docs',
          ['Introduction', 'Components', 'Guidelines', 'Tokens'],
          'Styles',
          ['Introduction', 'Icons', 'Typography', 'Layout', 'Colors', 'Elevation', 'Patterns', ['Introduction', 'Elements', 'Cards', 'Modals', 'Sections', 'Tables', 'Surfaces', 'SurfaceContainer']],
          'Assets',
          'Forms',
          [
            'Label and Caption',
            'Input',
            'Textarea',
            'Textarea ver 2',
            'Number Input',
            'Select',
            'Cascader',
            'Checkbox',
            'Radio',
            'Switch',
            'Range',
            'Multiple Choice',
            'Choice Grid',
            'File Upload',
            'Date Picker',
            'Time Picker',
            'Rating',
            'Input Group',
            'Scale',
          ],
          'Components',
          [
            'Accordion',
            'Alert',
            'Badge',
            'Breadcrumb',
            'Button',
            'ButtonGroup',
            'Card',
            'Carousel',
            'Collapse',
            'Divider',
            'Dropdown',
            'Jumbotron',
            'ListGroup',
            'Loading',
            'MediaObject',
            'Modal',
            'NavPills',
            'NavTabs',
            'Pagination',
            'Popover',
            'Progress',
            'RichTextEditor',
            'Scrollspy',
            'SidebarTab',
            'SuperCompPill',
            'Toast',
            'Tooltip',
          ],
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
