import React, { useEffect } from 'react';
// Design system: tokens, .plus-modal, and other globals for stories that import @/ components
import '../design-system/src/styles/main.scss';
import './storybook-overrides.css';
import '../design-system/src/storybook-docs/docs-rhythm.css';
import { TocDocsContainer } from './docs-toc.jsx';
import { mountDocsFab } from '../design-system/src/storybook-docs/chrome/mount-docs-fab.js';
import BrowserFrame from '../design-system/src/storybook-docs/chrome/BrowserFrame';
import { applyColorModes, COLOR_SCHEME_QUERY } from '../design-system/src/storybook-docs/lib/color-modes.js';

/**
 * Storybook preview configuration for PLUS Design System
 */

import { addons } from 'storybook/preview-api';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import { BACKGROUND_OPTIONS, DEFAULT_BACKGROUND } from './backgrounds.js';
import { assertContained } from '../design-system/src/storybook-docs/lib/contained-demos';

// ---- Docs floating button (AI agent, Marketplace, Uno Blueprint) -----------------------
mountDocsFab();

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

// ---- Color and contrast modes -----------------------------------------------
// The toolbar's Color mode and Contrast globals become attributes on <html>;
// see design-system/src/storybook-docs/lib/color-modes.js.

/** Applies the modes before the story renders, and tracks the OS while on auto. */
const ColorModes = ({ colorMode, contrastMode, children }) => {
  applyColorModes(colorMode, contrastMode);
  useEffect(() => {
    if (colorMode !== 'auto' || !window.matchMedia) return undefined;
    const query = window.matchMedia(COLOR_SCHEME_QUERY);
    const onChange = () => applyColorModes(colorMode, contrastMode);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [colorMode, contrastMode]);
  return children;
};

// The decorator above only runs when a story renders, and a toolbar switch can
// reach the preview while no story render is there to take it: a docs page whose
// canvases have not mounted yet or are mid-render, or an MDX page with no story
// at all. The update then lands in the globals store and never on <html>, and the
// page keeps the old mode until something else re-renders it. So the preview also
// applies the modes straight from the channel's globals events. (Inferred from
// the symptom, a manager URL on dark with the preview on light, and confirmed by
// the fix: 20 of 20 check:docs-chrome runs against one server, where it had been
// failing about one in six.)
//
// Kept on globalThis and re-attached on every module run, so an HMR edit to this
// handler replaces the old one instead of leaving it listening.
const fromChannel = (payload) => {
  const globals = payload?.globals ?? payload?.userGlobals;
  if (!globals) return;
  applyColorModes(globals.plusColorMode || 'light', globals.plusContrastMode || 'no-preference');
};
if (addons.hasChannel?.()) {
  const channel = addons.getChannel();
  const previous = globalThis.__PLUS_COLOR_MODE_HANDLER__;
  for (const event of [SET_GLOBALS, GLOBALS_UPDATED]) {
    if (previous) channel.off(event, previous);
    channel.on(event, fromChannel);
  }
  globalThis.__PLUS_COLOR_MODE_HANDLER__ = fromChannel;
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
      container: TocDocsContainer,
      toc: {
        title: 'On this page',
        /**
         * Storybook's default is `h3` alone. ADR-025 promoted the 49 component
         * docs pages' sections from `###` to `##` for the outline, and that
         * silently emptied their TOC — "On this page" listed only the `<h3>` the
         * ResourcesBlock renders. The other 338 MDX pages still write `###`, so
         * the selector has to span both rather than move.
         */
        headingSelector: 'h2, h3',
        /**
         * Storybook’s TOC uses Tocbot, which scrolls via `window.scrollTo` + `getBoundingClientRect`.
         * That path ignores CSS `scroll-padding-top` (see storybook-overrides.css). Defaults (±40px)
         * are too small for the preview chrome, so “Layout” stops mid-viewport and scrollspy
         * still marks the previous section active. Match our scroll-padding (6rem ≥768px; 5rem below).
         *
         * `collapseDepth: 2` collapses every list nested under an `h2` entry, so `h3` entries show only
         * under the `h2` the reader is in (Tocbot expands the active entry's list as the reader scrolls
         * and storybook-overrides.css hides the collapsed ones). Entries that are `h3` at the top level
         * on `###`-only pages are the root list, which is never collapsed.
         */
        unsafeTocbotOptions: {
          collapseDepth: 2,
          headingsOffset: 96,
          scrollSmoothOffset: -96,
        },
      },
      source: {
        type: 'code',
      },
      /**
       * Canvases show their code behind a "Show code" button rather than open or
       * absent: the code is one click away for a developer and out of a
       * designer's way. A page overrides it by naming `sourceState` on its own
       * Canvas (`none` where code would only distract).
       */
      canvas: {
        sourceState: 'hidden',
      },
    },

    options: {
      storySort: {
        // AUTO-GENERATED between the IA-SORT markers from storybook.taxonomy.json (the IA
        // single source of truth). Storybook statically parses this parameter, so the value
        // must be a literal — edit the taxonomy, then run: node scripts/sync-storybook-sort.mjs
        /* IA-SORT-START */
        order: [
          "Get started",
          [
            "Design",
            "Develop",
            "With AI",
            "Content design",
            "About"
          ],
          "Foundations",
          [
            "Overview",
            "Tokens",
            "Accessibility",
            "Spacing",
            "Grid",
            "Color",
            "Typography",
            "Motion",
            [
              "Principles",
              "Physics",
              "Choreography",
              "Playground",
              "Transitions",
              "Durations and easings"
            ],
            "Iconography",
            "Illustrations",
            "Logos",
            "Elevation",
            "Border",
            "Radius"
          ],
          "Templates",
          [
            "Templates and patterns",
            "Overview",
            "Frame",
            "Page",
            [
              "Page",
              "Heading outline"
            ],
            "Section",
            [
              "Section",
              "Card",
              "Table"
            ],
            "Form",
            "Modal",
            [
              "Modal",
              "Backdrop"
            ],
            "Panel",
            [
              "Panel"
            ],
            "Popup",
            [
              "Popup"
            ]
          ],
          "Patterns",
          [
            "Overview"
          ],
          "Components",
          [
            "Forms and inputs",
            [
              "Button",
              [
                "Button",
                "Icon button",
                "Link button",
                "Link icon button",
                "Split button",
                "Filter button",
                "Button group",
                "Close button",
                "Vertical button"
              ],
              "Calendar",
              "Checkbox",
              "Comment",
              "Date time picker",
              [
                "Date time picker",
                "Date picker",
                "Time picker"
              ],
              "Dropdown menu",
              "Fieldset",
              "File upload",
              "Filter menu",
              "Form",
              "Popup select",
              "Radio",
              [
                "Radio",
                "Radio group",
                "Choice grid"
              ],
              "Range",
              "Rating",
              "Rich text editor",
              "Select",
              [
                "Select",
                "Cascader",
                "Tree select"
              ],
              "Tag input",
              "Text area",
              "Text field",
              "Toggle"
            ],
            "Images and icons",
            [
              "Avatar",
              "Avatar group",
              "Icon",
              "Illustration",
              "Image",
              "Logo",
              "Object",
              "Tile"
            ],
            "Labels",
            [
              "Change tag",
              "Count tag",
              "Date tag",
              "Status tag",
              "Tag",
              [
                "Tag",
                "Smart tag"
              ],
              "Tag group"
            ],
            "Layout and structure",
            [
              "Accordion",
              "Carousel",
              "Page header",
              "Panel",
              "Scrollbar"
            ],
            "Loading",
            [
              "Progress bar",
              "Skeleton",
              "Spinner"
            ],
            "Messaging",
            [
              "Banner",
              "Empty state",
              "Flag",
              "Inline message",
              "Modal dialog",
              "Section message",
              "Spotlight"
            ],
            "Navigation",
            [
              "Breadcrumbs",
              "Link",
              "Navigation system",
              [
                "Navigation system",
                "Sidebar tab"
              ],
              "Pagination",
              "Tabs"
            ],
            "Overlays and layering",
            [
              "Popup",
              "Tooltip"
            ],
            "Status indicators",
            [
              "Progress indicator",
              "Progress tracker"
            ],
            "Text and data display",
            [
              "Code",
              [
                "Code",
                "Code block"
              ],
              "Heading",
              "Inline edit",
              "Static table",
              "Dynamic table",
              "Tree table",
              "Visually hidden"
            ]
          ],
          "AI UI",
          [
            "About AI UI",
            "AI interaction guidelines",
            "Foundations",
            [
              "Color",
              "Elevation",
              "Motion",
              "Voice and tone"
            ],
            "Components",
            [
              "Button",
              "Icon",
              "Illustration",
              "Generative border",
              "Prompt input",
              "Prompt starters",
              "Suggestion",
              "Skills tag",
              "AI message",
              [
                "AI message",
                "AI sources",
                "AI feedback"
              ]
            ],
            "Patterns",
            [
              "AI chat"
            ]
          ],
          "Data visualizations",
          [
            "Color",
            "Comparison",
            "Correlation",
            "Distribution",
            "Flow & relationships",
            "Part-to-whole",
            "Temporal"
          ],
          "Libraries",
          [
            "Overview",
            "Base UI",
            "Font Awesome",
            "Highcharts",
            "Motion"
          ],
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
      options: BACKGROUND_OPTIONS,
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
      // Fail story tests / CI on accessibility violations (addon-a11y + addon-vitest).
      test: 'error',
      context: {
        // Base UI's own focus-sentinel spans (Menu, Popover): inert,
        // `aria-hidden`, briefly focusable on purpose to steer Tab around a
        // floating layer. Not a component defect to fix — excluded from the
        // scan the way any inert implementation detail would be.
        exclude: ['[data-base-ui-focus-guard]'],
      },
    }
  },

  globalTypes: {
    plusBrowser: {
      description: 'Browser window chrome around the Template stories (docs only)',
      toolbar: {
        title: 'Browser',
        icon: 'browser',
        items: [
          { value: 'none', title: 'No browser' },
          { value: 'chrome', title: 'Chrome' },
          { value: 'safari', title: 'Safari' },
          { value: 'edge', title: 'Edge' },
        ],
        dynamicTitle: true,
      },
    },
    plusColorMode: {
      description: 'Color mode, set as data-color-mode on <html>; auto follows the OS',
      toolbar: {
        title: 'Color mode',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'auto', title: 'Auto (follow the OS)' },
        ],
        dynamicTitle: true,
      },
    },
    plusContrastMode: {
      description: 'Contrast mode, set as data-contrast-mode on <html>; auto follows the OS',
      toolbar: {
        title: 'Contrast',
        icon: 'contrast',
        items: [
          { value: 'no-preference', title: 'Standard contrast' },
          { value: 'more', title: 'More contrast' },
          { value: 'auto', title: 'Auto (follow the OS)' },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    // Browser chrome from the toolbar, around the Template stories only: the
    // Template carries the browser, the Frame is the app alone. A story can opt
    // in or out with parameters.browserFrame ('chrome' | 'safari' | 'none').
    (Story, context) => {
      const framed = /^Patterns\/Templates/.test(context.title);
      const browser = context.parameters.browserFrame || (framed ? context.globals.plusBrowser : 'none');
      return (
        <BrowserFrame browser={browser || 'none'}>
          <Story />
        </BrowserFrame>
      );
    },
    // Color and contrast modes from the toolbar, on <html> (see applyColorModes).
    (Story, context) => (
      <ColorModes
        colorMode={context.globals.plusColorMode || 'light'}
        contrastMode={context.globals.plusContrastMode || 'no-preference'}
      >
        <Story />
      </ColorModes>
    ),
    (Story, context) => {
      // Docs-only: disable pointer interaction on static component examples so
      // scroll stays stable. Canvas / Interactive / Overview stay fully usable
      // (Controls, play functions, a11y checks).
      if (
        context.viewMode === 'docs' &&
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
      value: DEFAULT_BACKGROUND
    },
    plusBrowser: 'none',
    plusColorMode: 'light',
    plusContrastMode: 'no-preference',
  },

  tags: ['autodocs'],

  // A demo shown in the docs stays inside its canvas: no modal, Blanket or
  // fixed Flag stack over the docs page (test-only `!dev` stories are exempt).
  afterEach: assertContained,
};

export default preview;
