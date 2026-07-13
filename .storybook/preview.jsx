import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
// Design system: tokens, .plus-modal, and other globals for stories that import @/ components
import '../design-system/src/styles/main.scss';
// Docs-only Tailwind + shadcn (no Preflight; see storybook-tailwind.css)
import '../design-system/src/storybook-docs/storybook-tailwind.css';
import './storybook-overrides.css';
import StorybookAIAgent from '../playground/storybook-ai-agent-llm-api/StorybookAIAgent';

/**
 * Storybook preview configuration for PLUS Design System
 */

import { createRoot } from 'react-dom/client';

// ---- Global AI Agent Setup ---------------------------------
// We inject the AI Agent globally so it is available on pure Docs pages
// that do not contain any Story blocks (where decorators would not run).

const GlobalAgentWrapper = () => {
  const [context, setContext] = useState('Storybook Docs');
  
  useEffect(() => {
    window.__setAIContext = setContext;
  }, []);

  return <StorybookAIAgent pageContext={context} />;
};

if (typeof window !== 'undefined' && !window.__PLUS_AI_AGENT_ROOT__) {
  window.__PLUS_AI_AGENT_ROOT__ = true;
  
  const injectAgent = () => {
    let container = document.getElementById('plus-ai-agent-global');
    if (!container) {
      container = document.createElement('div');
      container.id = 'plus-ai-agent-global';
      document.body.appendChild(container);
    }
    const root = createRoot(container);
    root.render(<GlobalAgentWrapper />);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // wait a tick for body to be ready if in interactive
    setTimeout(injectAgent, 0);
  } else {
    window.addEventListener('DOMContentLoaded', injectAgent);
  }
}

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
        // AUTO-GENERATED between the IA-SORT markers from storybook.taxonomy.json (the IA
        // single source of truth). Storybook statically parses this parameter, so the value
        // must be a literal — edit the taxonomy, then run: node scripts/sync-storybook-sort.mjs
        /* IA-SORT-START */
        order: [
          "Getting started",
          [
            "Introduction"
          ],
          "Foundations",
          [
            "Introduction",
            "Color",
            "Typography",
            "Layout & grid",
            "Grid",
            "Spacing",
            "Patterns",
            [
              "Introduction",
              "Surfaces",
              "Surface container",
              "Card",
              "Section",
              "Modal",
              "Table"
            ],
            "Elevation",
            "Iconography",
            "Logos",
            "Imagery",
            "Design tokens",
            "Accessibility"
          ],
          "Components",
          [
            "Actions",
            [
              "Button",
              "Button group"
            ],
            "Forms and inputs",
            [
              "Cascader",
              "Checkbox",
              "Choice grid",
              "Date picker",
              "Date & time picker",
              "Dropdown",
              "File upload",
              "Input",
              "Input group",
              "Label & caption",
              "Multiple choice",
              "Number input",
              "Radio",
              "Range",
              "Rating",
              "Rich text editor",
              "Scale",
              "Select",
              "Switch",
              "Textarea",
              "Tree select"
            ],
            "Layout and structure",
            [
              "Accordion",
              "Card",
              "Carousel",
              "Collapse",
              "Divider",
              "Jumbotron",
              "List group",
              "Media object",
              "Scroll bar"
            ],
            "Messaging",
            [
              "Alert",
              "Modal",
              "Toast"
            ],
            "Navigation",
            [
              "Breadcrumb",
              "Nav pills",
              "Nav tabs",
              "Pagination",
              "Scrollspy",
              "Sidebar tab"
            ],
            "Overlays",
            [
              "Popover",
              "Tooltip"
            ],
            "Status and loading",
            [
              "Badge",
              "Loading",
              "Progress"
            ]
          ],
          "Data visualizations",
          [
            "Comparison",
            "Correlation",
            "Distribution",
            "Flow & relationships",
            "Part-to-whole",
            "Temporal"
          ],
          "Specs",
          [
            "Universal",
            [
              "Overview",
              "Elements",
              [
                "Smart Badges"
              ],
              "Cards",
              "Tables",
              "Modals",
              "Sections",
              "Pages"
            ],
            "Login",
            [
              "Overview",
              "Elements",
              "Cards",
              "Tables",
              "Modals",
              "Sections",
              "Pages"
            ],
            "Home",
            [
              "Overview",
              "Elements",
              "Cards",
              "Tables",
              "Modals",
              "Sections",
              "Pages"
            ],
            "Profile",
            [
              "Overview",
              "Elements",
              "Cards",
              "Tables",
              "Modals",
              "Sections",
              "Pages"
            ],
            "Training",
            [
              "Overview",
              "Onboarding",
              [
                "Overview",
                "Elements",
                "Cards",
                "Tables",
                "Modals",
                "Sections",
                "Pages"
              ],
              "Lessons",
              [
                "Overview",
                "Elements",
                "Cards",
                "Tables",
                "Modals",
                "Sections",
                "Pages"
              ]
            ],
            "Toolkit",
            [
              "Overview",
              "Pre-Session",
              [
                "Overview",
                "Elements",
                "Cards",
                "Tables",
                "Modals",
                "Sections",
                "Pages"
              ],
              "In-Session",
              [
                "Overview",
                "Elements",
                "Cards",
                "Tables",
                "Modals",
                "Sections",
                "Pages"
              ],
              "Post-Session",
              [
                "Overview",
                "Elements",
                "Cards",
                "Tables",
                "Modals",
                "Sections",
                "Pages"
              ]
            ],
            "Admin",
            [
              "Overview",
              "Tutor",
              [
                "Overview",
                "Elements",
                "Cards",
                "Tables",
                "Modals",
                "Sections",
                "Pages"
              ],
              "Session",
              [
                "Overview",
                "Elements",
                "Cards",
                "Tables",
                "Modals",
                "Sections",
                "Pages"
              ],
              "Student",
              [
                "Overview",
                "Elements",
                "Cards",
                "Tables",
                "Modals",
                "Sections",
                "Pages"
              ],
              "Group",
              [
                "Overview",
                "Elements",
                "Cards",
                "Tables",
                "Modals",
                "Sections",
                "Pages"
              ]
            ]
          ],
          "Deprecated",
          "*"
        ],
        /* IA-SORT-END */
      },
    },

    actions: { argTypesRegex: '^on[A-Z].*' },

    controls: {
      exclude: ['id', 'className', 'name', 'defaultValue', 'onChange', 'onInput', 'onFocus', 'onBlur'],
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
      // PLUS breakpoints — mirror the Figma foundations (Layout & Grid → Breakpoint set).
      // No mobile: the product targets md and up. Values match --breakpoint-*-min tokens.
      options: {
        md: {
          name: 'MD — medium (tablet, 768px)',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        lg: {
          name: 'LG — large (desktop, 1024px)',
          styles: {
            width: '1024px',
            height: '768px',
          },
        },
        xl: {
          name: 'XL — extra large (HD, 1440px)',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },

  globalTypes: {
    plusBreakpoint: {
      description: 'Constrain any Specs story to a PLUS breakpoint width (works in docs and canvas)',
      toolbar: {
        title: 'Breakpoint',
        icon: 'ruler',
        items: [
          { value: '', title: 'Native (no constraint)' },
          { value: 'md', title: 'MD — 768px' },
          { value: 'lg', title: 'LG — 1024px' },
          { value: 'xl', title: 'XL — 1440px' },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    // Global PLUS breakpoint toggle: constrains every Specs story (pages, sections,
    // cards, elements) to the selected width so responsive behavior can be inspected
    // from the toolbar — in docs pages and in canvas view alike. Complements the
    // built-in Viewport tool (canvas-only) and the per-page-story `breakpoint` arg.
    (Story, context) => {
      const bp = context.globals.plusBreakpoint;
      const widths = { md: 768, lg: 1024, xl: 1440 };
      if (bp && widths[bp] && context.title.startsWith('Specs/')) {
        return (
          <div style={{ width: `${widths[bp]}px`, maxWidth: '100%', containerType: 'inline-size' }}>
            <Story />
          </div>
        );
      }
      return <Story />;
    },
    (Story, context) => {
      // Provide dynamic context to the AI Agent so the LLM knows which screen/story it's looking at
      const activeContext = `${context.title} — ${context.name}`;
      if (typeof window !== 'undefined' && window.__setAIContext) {
        setTimeout(() => window.__setAIContext(activeContext), 0);
      }

      // Disable pointer interaction for static docs examples (keeps scroll/canvas stable).
      // Allow 'Interactive' and 'Overview' so docs canvases with Controls stay usable.
      if (
        context.name !== 'Interactive' &&
        context.name !== 'Overview' &&
        context.title.startsWith('Components/')
      ) {
         return (
           <div style={{ pointerEvents: 'none' }}>
             <Story />
           </div>
         );
      }

      return <Story />;
    },
  ],

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  },

  tags: ['autodocs']
};

export default preview;
