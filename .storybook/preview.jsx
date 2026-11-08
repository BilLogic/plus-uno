import React, { useEffect } from 'react';
// Cascade layers (bootstrap, tokens, components): Bootstrap's CSS goes first,
// in the lowest-precedence layer.
import '../design-system/src/styles/bootstrap-layer.css';
// Design system: tokens, .plus-modal, and other globals for stories that import @/ components
import '../design-system/src/styles/main.scss';
// Docs-only Tailwind (no Preflight; see storybook-tailwind.css)
import '../design-system/src/storybook-docs/storybook-tailwind.css';
import './storybook-overrides.css';
import { TocDocsContainer } from './docs-toc.jsx';
import { mountDocsFab } from '../design-system/src/storybook-docs/chrome/mount-docs-fab.js';
import ResponsiveFrame from '../design-system/src/specs/Universal/ResponsiveFrame';
import BrowserFrame from '../design-system/src/storybook-docs/chrome/BrowserFrame';
import { applyColorModes, COLOR_SCHEME_QUERY } from '../design-system/src/storybook-docs/lib/color-modes.js';

/**
 * Storybook preview configuration for PLUS Design System
 */

import { addons } from 'storybook/preview-api';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import { BACKGROUND_OPTIONS, DEFAULT_BACKGROUND } from './backgrounds.js';

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
            "Foundations overview",
            "Tokens",
            "Color",
            "Typography",
            "Spacing",
            "Layout & grid",
            "Elevation",
            "Border",
            "Radius",
            "Iconography",
            "Illustrations",
            "Logos",
            "Motion",
            "Accessibility",
            "Imagery"
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
              "Checkbox",
              "Comment",
              "Date time picker",
              "Date picker",
              "Dropdown menu",
              "File upload",
              "Label & caption",
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
              "Toggle",
              "Inline edit"
            ],
            "Images and icons",
            [
              "Avatar",
              "Logo",
              "Object",
              "Tile",
              "AI icon",
              "Illustrations",
              "Image"
            ],
            "Labels",
            [
              "Count tag",
              "Date tag",
              "Status tag",
              "Tag",
              [
                "Tag",
                "Smart tag"
              ],
              "Tag group",
              "AI label",
              [
                "AI label",
                "Suggestion"
              ]
            ],
            "Layout and structure",
            [
              "Accordion",
              "Carousel",
              "Page header",
              "Scrollbar",
              "Visually hidden"
            ],
            "Loading",
            [
              "Progress bar",
              "Skeleton",
              "Spinner",
              "Generative border"
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
              "Menu group",
              "Pagination",
              "Sidebar tab",
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
              "Table"
            ]
          ],
          "Patterns",
          [
            "Introduction",
            "Frame",
            [
              "Frame",
              "Topbar"
            ],
            "Sidebar",
            "Page",
            [
              "Page",
              "Heading outline"
            ],
            "Panel",
            "Section",
            [
              "Section",
              "Card",
              "Table"
            ],
            "Overlays",
            [
              "Blanket",
              "Modal",
              "Drawer"
            ],
            "Popups",
            "Templates"
          ],
          "AI",
          [
            "Overview",
            "AI chat",
            "AI identity candidates"
          ],
          "Tools",
          [
            "Overview",
            "Documented contract"
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
                "Pages",
                [
                  "Session Info",
                  "Student Reflection",
                  "Session Reflection",
                  "Self Reflection",
                  "Form Feedback",
                  "Reflection Flow"
                ]
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
    plusBrowser: {
      description: 'Browser window chrome around the Frame and page-template stories (docs only)',
      toolbar: {
        title: 'Browser',
        icon: 'browser',
        items: [
          { value: 'none', title: 'No browser' },
          { value: 'chrome', title: 'Chrome' },
          { value: 'safari', title: 'Safari' },
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
    // Browser chrome from the toolbar, around the Frame and page-template
    // stories. A story can opt in or out with parameters.browserFrame ('chrome' | 'safari' | 'none').
    (Story, context) => {
      const framed = /^Patterns\/(Frame\/Frame|Templates)/.test(context.title);
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
    // Global PLUS breakpoint toggle: constrains every Specs story (pages, sections,
    // cards, elements) to the selected width so responsive behavior can be inspected
    // from the toolbar — in docs pages and in canvas view alike. Complements the
    // built-in Viewport tool (canvas-only) and the per-page-story `breakpoint` arg.
    (Story, context) => {
      const bp = context.globals.plusBreakpoint;
      const widths = { md: 768, lg: 1024, xl: 1440 };
      const isSpecs = context.title.startsWith('Specs/');
      // Pages get the responsive DISPLAY WELL. Native fills available space; MD/LG/XL set a
      // minimum width (scroll horizontally when the docs column is narrower, fill when wider).
      // Nesting-safe: stories that already wrap in ResponsiveFrame collapse the inner one.
      const isPage = isSpecs && /\/Pages\//.test(context.title);
      if (isPage) {
        return (
          <ResponsiveFrame breakpoint={bp && widths[bp] ? bp : 'native'}>
            <Story />
          </ResponsiveFrame>
        );
      }
      // Other Specs: same min-width semantics (do not shrink below the selected breakpoint).
      if (bp && widths[bp] && isSpecs) {
        return (
          <div
            style={{
              width: '100%',
              minWidth: `${widths[bp]}px`,
              maxWidth: '100%',
              overflowX: 'auto',
              containerType: 'inline-size',
            }}
          >
            <Story />
          </div>
        );
      }
      return <Story />;
    },
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

  tags: ['autodocs']
};

export default preview;
