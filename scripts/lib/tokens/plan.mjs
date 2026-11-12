/**
 * The token plan (ADR-038): the four-tier ladder (semantics, patterns,
 * components, layers) and motion, as one file this repo owns, the way
 * `scripts/lib/color/plans/` owns color (ADR-035). `scripts/generate-design-tokens.mjs`
 * renders it into SCSS and one Figma variables payload; nothing here reads
 * Figma or the network.
 *
 * NUMBERING. Every value here is a reference to the existing `--space-*` /
 * `--radius-*` / `--size-*` primitive ladder in `design-system/src/tokens/_scales.scss`
 * (PLUS ×16 numbering: `--space-100` is 16px, per Bill 2026-11-03). This plan
 * does not re-declare that ladder; it only spends it on tier names.
 *
 * ONE VOCABULARY. A row's `old` names the retired token it replaced; the old
 * declaration is gone from the token files and the generator that wrote it
 * drops it (`RETIRED_TOKENS`). Nothing in the repo reads an `old` name.
 */

/**
 * Motion: duration and easing roles. First pass — ADS-shaped round numbers,
 * not benchmarked live (architecture ticket, not a family rebuild). Adrija
 * refines the actual curves; this plan only has to give every component one
 * place to read a duration and an easing from, per #1698's user story 7.
 */
export const MOTION_DURATIONS = {
  short: '100ms',
  medium: '200ms',
  long: '300ms',
};

export const MOTION_EASINGS = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  entrance: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
};

/**
 * THE FOUR-TIER LADDER (#1756, Bill 2026-11-04: "clean up both token on figma
 * and in code and fully align the two"). One plan, one row per token, most
 * general tier to most specific: primitives -> semantics -> patterns ->
 * components. Figma collection on the left of each tier's row group, code
 * name on the right.
 *
 * Every row owns its value: `ref` is the full CSS value (a `var()` of a
 * primitive, or a literal where no primitive exists), `value` on a net-new row
 * is the primitive's name, and `at` holds the responsive overrides, each keyed
 * by the media query it applies under. `old` documents the retired name a row
 * replaced (null for a net-new token); `type` is the Figma variable type when
 * it is not FLOAT, `codeOnly` keeps a row out of the Figma payload, and
 * `primitive` keeps it out of the SCSS (its code name is a primitive).
 * `use` is the row's intent: one line naming the place or situation the
 * token is for, in the component language. The token agent views carry it
 * (`tokens.json`, `tokens.md`) and `check:token-intent` fails a row without one.
 *
 * A row with `old === new` is not a rename — it is a tier the token was
 * already correctly named for (the Size dimension roles, most of Patterns'
 * bare `Collection/property` names). It is still listed, so the name-map doc
 * is every token, not just the ones that moved, and excluded from SCSS/payload
 * generation below (declaring a name twice is a no-op).
 *
 * SCOPE CALLS RECORDED HERE, so a family PR doesn't have to re-derive them:
 *  - `--focus-ring-radius` has no single existing source (nothing in the repo
 *    binds a radius to a focus ring today); seeded at `--radius-sm` as a first
 *    pass, same as ADR-038 left Motion's curves for Adrija to refine.
 *  - Only `--control-*` is added to the size roles: `_scales.scss` already
 *    carries Icon, Image, Item, Label, Row and Field.
 *  - `color / foundations` -> `color / semantics` and `opacity` -> `color /
 *    opacity`, and Figma's `Element/opacity-disabled` moving into the latter,
 *    are Figma-collection-membership changes only: code already names the one
 *    token involved `--ds-opacity-disabled`, outside this ladder's prefix,
 *    so there is no code row for it — recorded in the payload's collection
 *    rename list instead (`build.mjs`'s `COLLECTION_RENAMES`).
 */
export const TOKEN_LADDER = [
  // ─── Semantics / Pad ──────────────────────────────────────────────────
  { tier: 'semantics', group: 'Pad', new: '--pad-x-xs', old: '--element-pad-x-xs', ref: 'var(--space-025)', use: 'Horizontal padding inside the tightest controls: a CountTag, StatusTag or DateTag.' },
  { tier: 'semantics', group: 'Pad', new: '--pad-x-sm', old: '--element-pad-x-sm', ref: 'var(--space-050)', use: 'Horizontal padding inside a compact control, such as a Button with compact spacing.' },
  { tier: 'semantics', group: 'Pad', new: '--pad-x-md', old: '--element-pad-x-md', ref: 'var(--space-075)', use: 'Horizontal padding inside a default control: a Button, a field, a menu item.' },
  { tier: 'semantics', group: 'Pad', new: '--pad-x-lg', old: null, value: '--space-100', note: 'new step, 16px', use: 'Horizontal padding inside a large control or a roomy row.' },
  { tier: 'semantics', group: 'Pad', new: '--pad-y-sm', old: '--element-pad-y-sm', ref: 'var(--space-0125)', use: 'Vertical padding inside a compact control, such as a compact Button or a Sidebar tab.' },
  { tier: 'semantics', group: 'Pad', new: '--pad-y-md', old: '--element-pad-y-md', ref: 'var(--space-0375)', use: 'Vertical padding inside a default control: a Button, a field, a menu item.' },
  { tier: 'semantics', group: 'Pad', new: '--pad-y-lg', old: null, value: '--space-050', note: 'new step, 8px', use: 'Vertical padding inside a large control or a roomy row.' },

  // ─── Semantics / Stack ────────────────────────────────────────────────
  { tier: 'semantics', group: 'Stack', new: '--stack-sm', old: '--element-stack-sm', ref: 'var(--space-025)', use: 'Vertical gap between tightly related items, such as a label and its control.' },
  { tier: 'semantics', group: 'Stack', new: '--stack-md', old: '--element-stack-md', ref: 'var(--space-050)', use: 'Vertical gap between items in a list or a group of fields.' },
  { tier: 'semantics', group: 'Stack', new: '--stack-lg', old: '--element-stack-lg', ref: 'var(--space-075)', use: 'Vertical gap between groups inside one control or component.' },

  // ─── Semantics / Inline ───────────────────────────────────────────────
  { tier: 'semantics', group: 'Inline', new: '--inline-sm', old: '--element-inline-sm', ref: 'var(--space-025)', use: 'Horizontal gap between an icon and its label inside a control.' },
  { tier: 'semantics', group: 'Inline', new: '--inline-md', old: '--element-inline-md', ref: 'var(--space-050)', use: 'Horizontal gap between items in a row, such as buttons in a ButtonGroup.' },
  { tier: 'semantics', group: 'Inline', new: '--inline-lg', old: '--element-inline-lg', ref: 'var(--space-075)', use: 'Horizontal gap between loosely related items in a row.' },

  // ─── Semantics / Radius (non-control, + control-by-height) ───────────
  { tier: 'semantics', group: 'Radius', new: '--radius-sm', old: '--element-radius-sm', ref: 'var(--radius-0125)', use: 'Corner rounding for small marks: a checkbox, a focus ring, a small tag.' },
  { tier: 'semantics', group: 'Radius', new: '--radius-md', old: '--element-radius-md', ref: 'var(--radius-025)', use: 'Corner rounding for controls and small containers.' },
  { tier: 'semantics', group: 'Radius', new: '--radius-lg', old: '--element-radius-lg', ref: 'var(--radius-050)', use: 'Corner rounding for larger containers that are not a pattern, such as a tile or image.' },
  { tier: 'semantics', group: 'Radius', new: '--radius-full', old: '--element-radius-full', ref: 'var(--radius-full)', primitive: true, note: 'Figma Radius/full; the code name is the --radius-full primitive, so no second declaration', use: 'Fully rounded ends: an avatar, a pill-shaped tag, a toggle track.' },
  { tier: 'semantics', group: 'Radius', new: '--radius-h24', old: '--element-radius-item-sm', ref: 'var(--radius-0375)', note: 'control height 24; 24÷4 = 6', use: 'Corner rounding for a control 24px high.' },
  { tier: 'semantics', group: 'Radius', new: '--radius-h32', old: '--element-radius-item-md', ref: 'var(--radius-050)', note: 'control height 32; 32÷4 = 8', use: 'Corner rounding for a control 32px high.' },
  { tier: 'semantics', group: 'Radius', new: '--radius-h40', old: null, value: '--radius-0625', note: 'new step; control height 40; 40÷4 = 10', use: 'Corner rounding for a control 40px high.' },

  // ─── Semantics / Border (reclassified, unchanged names) ──────────────
  { tier: 'semantics', group: 'Border', new: '--border-default', old: '--border-default', use: 'Width of an ordinary border or divider line.' },
  { tier: 'semantics', group: 'Border', new: '--border-selected', old: '--border-selected', use: 'Width of the border that marks a selected item.' },
  { tier: 'semantics', group: 'Border', new: '--border-focused', old: '--border-focused', use: 'Width of the border on a field that has focus.' },

  // ─── Semantics / Focus (net new) ──────────────────────────────────────
  { tier: 'semantics', group: 'Focus', new: '--focus-ring-width', old: '--size-element-stroke-lg', ref: 'var(--stroke-2)', note: 'matches the outline width repeated across Tag, DateTag, Suggestion and Tabs; reads the 2px stroke primitive', use: 'Width of the keyboard focus ring; also its offset unless the offset must differ.' },
  { tier: 'semantics', group: 'Focus', new: '--focus-ring-offset', old: '--size-element-stroke-lg', ref: 'var(--stroke-2)', note: 'defined for a caller whose ring offset genuinely needs to move independently of its width; every current caller reads --focus-ring-width for both', use: 'Gap between an element and its focus ring, when it must differ from the ring width.' },
  { tier: 'semantics', group: 'Focus', new: '--focus-ring-radius', old: null, value: '--radius-sm', note: 'first pass, no existing source; a family PR refines it', use: 'Corner rounding of the keyboard focus ring.' },

  // ─── Semantics / Grid (dissolved from spacing / layout) ──────────────
  { tier: 'semantics', group: 'Grid', new: '--grid-gutter', old: '--layout-gutter', ref: 'var(--space-100)', use: 'Gap between columns of the page grid.' },
  { tier: 'semantics', group: 'Grid', new: '--grid-columns', old: '--layout-columns', ref: '12', use: 'Column count of the page grid.' },
  { tier: 'semantics', group: 'Grid', new: '--grid-width-column', old: '--layout-width-column', ref: '45.33px', at: { '(min-width: 1024px)': '46.67px', '(min-width: 1440px)': '81.33px' }, use: 'Width of one column of the content grid at the current breakpoint.' },
  { tier: 'semantics', group: 'Grid', new: '--grid-width-column-screen', old: '--layout-width-column-screen', ref: '45.33px', at: { '(min-width: 1024px)': '66.67px', '(min-width: 1440px)': '88px' }, use: 'Width of one column of the full-screen grid at the current breakpoint.' },

  // ─── Semantics / Screen (dissolved from spacing / layout) ────────────
  { tier: 'semantics', group: 'Screen', new: '--screen-width', old: '--layout-width-screen', ref: '768px', at: { '(min-width: 1024px)': '1024px', '(min-width: 1440px)': '1440px' }, use: 'Width of the screen frame at the current breakpoint.' },
  { tier: 'semantics', group: 'Screen', new: '--screen-min-width', old: '--layout-min-width-screen', ref: '768px', at: { '(min-width: 1024px)': '1024px', '(min-width: 1440px)': '1440px' }, use: 'Narrowest the screen frame gets at the current breakpoint.' },
  { tier: 'semantics', group: 'Screen', new: '--screen-max-width', old: '--layout-max-width-screen', ref: '1023px', at: { '(min-width: 1024px)': '1439px', '(min-width: 1440px)': 'none' }, use: 'Widest the screen frame gets at the current breakpoint.' },
  { tier: 'semantics', group: 'Screen', new: '--screen-pad-x', old: '--layout-pad-x-screen', ref: 'var(--space-150)', at: { '(min-width: 1440px)': 'var(--space-200)' }, use: 'Horizontal padding between the screen edge and the page content.' },

  // ─── Semantics / Content (dissolved from spacing / layout) ───────────
  { tier: 'semantics', group: 'Content', new: '--content-max-width', old: '--layout-max-width-content', ref: 'var(--size-7700)', use: 'Widest a page\'s main content column may grow.' },
  { tier: 'semantics', group: 'Content', new: '--content-max-width-reading', old: '--layout-max-width-reading', ref: 'var(--size-5400)', use: 'Widest a column of running text may grow, to keep lines readable.' },
  { tier: 'semantics', group: 'Content', new: '--content-min-width', old: '--layout-min-width-content', ref: 'var(--size-4500)', use: 'Narrowest a page\'s main content column may shrink.' },
  { tier: 'semantics', group: 'Content', new: '--content-width', old: '--layout-width-content', ref: '720px', at: { '(min-width: 1024px)': '736px', '(min-width: 1440px)': '1152px' }, use: 'Width of the main content column at the current breakpoint.' },

  // ─── Semantics / Size (dimension roles; mostly reclassified, + Control) ─
  { tier: 'semantics', group: 'Size', new: '--icon-sm', old: '--icon-sm', use: 'Size of a small icon, such as one inside a compact control.' },
  { tier: 'semantics', group: 'Size', new: '--icon-md', old: '--icon-md', use: 'Size of a default icon beside body text or in a control.' },
  { tier: 'semantics', group: 'Size', new: '--icon-lg', old: '--icon-lg', use: 'Size of a large icon, such as one in an EmptyState or a Tile.' },
  { tier: 'semantics', group: 'Size', new: '--image-xxs', old: '--image-xxs', use: 'Size of the smallest image or avatar, such as one inline with text.' },
  { tier: 'semantics', group: 'Size', new: '--image-xs', old: '--image-xs', use: 'Size of an extra-small image or avatar, such as one in a dense row.' },
  { tier: 'semantics', group: 'Size', new: '--image-sm', old: '--image-sm', use: 'Size of a small image or avatar, such as one in a list row.' },
  { tier: 'semantics', group: 'Size', new: '--image-md', old: '--image-md', use: 'Size of a default image or avatar.' },
  { tier: 'semantics', group: 'Size', new: '--image-lg', old: '--image-lg', use: 'Size of a large image or avatar, such as one in a profile header.' },
  { tier: 'semantics', group: 'Size', new: '--image-xl', old: '--image-xl', use: 'Size of the largest image or avatar, such as an Illustration.' },
  { tier: 'semantics', group: 'Size', new: '--item-height-sm', old: '--item-height-sm', use: 'Height of a compact control or item: a compact Button, a menu item.' },
  { tier: 'semantics', group: 'Size', new: '--item-height-md', old: '--item-height-md', use: 'Height of a default control or item: a Button, a field, a menu item.' },
  { tier: 'semantics', group: 'Size', new: '--label-height-sm', old: '--label-height-sm', use: 'Height of a compact label row, such as a small tag.' },
  { tier: 'semantics', group: 'Size', new: '--label-height-md', old: '--label-height-md', use: 'Height of a default label row, such as a tag.' },
  { tier: 'semantics', group: 'Size', new: '--label-max-width', old: '--label-max-width', use: 'Widest a single-line label may grow before it truncates.' },
  { tier: 'semantics', group: 'Size', new: '--row-height-sm', old: '--row-height-sm', use: 'Height of a compact table or list row.' },
  { tier: 'semantics', group: 'Size', new: '--row-height-md', old: '--row-height-md', use: 'Height of a default table or list row.' },
  { tier: 'semantics', group: 'Size', new: '--row-height-lg', old: '--row-height-lg', use: 'Height of a roomy table or list row.' },
  { tier: 'semantics', group: 'Size', new: '--field-width-xs', old: '--field-width-xs', use: 'Width of a field for a very short value, such as a number or a time.' },
  { tier: 'semantics', group: 'Size', new: '--field-width-sm', old: '--field-width-sm', use: 'Width of a field for a short value, such as a date.' },
  { tier: 'semantics', group: 'Size', new: '--field-width-md', old: '--field-width-md', use: 'Width of a field for a typical value, such as a name.' },
  { tier: 'semantics', group: 'Size', new: '--field-width-lg', old: '--field-width-lg', use: 'Width of a field for a long value, such as an email address.' },
  { tier: 'semantics', group: 'Size', new: '--field-width-xl', old: '--field-width-xl', use: 'Width of a field for the longest single-line values.' },
  { tier: 'semantics', group: 'Size', new: '--field-min-height-sm', old: '--field-min-height-sm', use: 'Shortest a multi-line field may be in its compact form.' },
  { tier: 'semantics', group: 'Size', new: '--field-min-height-lg', old: '--field-min-height-lg', use: 'Shortest a multi-line field may be by default, such as a TextArea.' },
  { tier: 'semantics', group: 'Size', new: '--control-sm', old: '--size-control-sm', ref: 'var(--size-150)', note: 'new role; Control was missing from the Icon/Image/Item/Label/Row/Field set', use: 'Height of a small control: 24px high.' },
  { tier: 'semantics', group: 'Size', new: '--control-md', old: '--size-control-md', ref: 'var(--size-200)', use: 'Height of a default control: 32px high.' },
  { tier: 'semantics', group: 'Size', new: '--control-lg', old: '--size-control-lg', ref: 'var(--size-250)', use: 'Height of a large control: 40px high.' },

  // ─── Patterns / Frame (with Topbar and Sidebar) ──────────────────────
  { tier: 'patterns', group: 'Frame', new: '--frame-topbar-height', old: '--layout-height-topbar', ref: 'var(--height-200)', use: 'Height of the Frame\'s top bar.' },
  { tier: 'patterns', group: 'Frame', new: '--frame-sidebar-width', old: '--layout-width-sidebar', ref: 'var(--width-1500)', use: 'Width of the Frame\'s Sidebar at the current breakpoint.' },
  { tier: 'patterns', group: 'Frame', new: '--frame-sidebar-width-nav', old: '--layout-sidebar-width', ref: '164px', note: 'fixed SideNav width (164), distinct from the responsive sidebar above', use: 'Fixed width of the side navigation inside the Frame.' },
  { tier: 'patterns', group: 'Frame', new: '--frame-sidebar-pad', old: null, value: '--space-075', note: 'the Sidebar pads 12 on every side', use: 'Padding on every side inside the Sidebar.' },
  { tier: 'patterns', group: 'Frame', new: '--frame-sidebar-row-gap', old: null, value: '--space-0125', note: 'two Sidebar rows sit 2 apart', use: 'Vertical gap between two rows in the Sidebar.' },
  { tier: 'patterns', group: 'Frame', new: '--frame-sidebar-group-gap', old: null, value: '--space-100', note: 'two Sidebar groups sit 16 apart', use: 'Vertical gap between two groups of rows in the Sidebar.' },
  { tier: 'patterns', group: 'Frame', new: '--frame-sidebar-row-radius', old: null, ref: 'var(--radius-0375)', note: 'the rounding of a Sidebar row (6)', use: 'Corner rounding of a Sidebar row.' },

  // ─── Patterns / Page ──────────────────────────────────────────────────
  { tier: 'patterns', group: 'Page', new: '--page-pad', old: '--page-pad', use: 'Padding around a Page\'s content at the current breakpoint.' },
  { tier: 'patterns', group: 'Page', new: '--page-pad-x-compact', old: null, value: '--space-150', use: 'Horizontal padding of a Page with compact spacing.' },
  { tier: 'patterns', group: 'Page', new: '--page-pad-x-default', old: null, value: '--space-200', use: 'Horizontal padding of a Page with default spacing.' },
  { tier: 'patterns', group: 'Page', new: '--page-pad-x-spacious', old: null, value: '--space-250', use: 'Horizontal padding of a Page with spacious spacing.' },
  { tier: 'patterns', group: 'Page', new: '--page-pad-y-compact', old: null, value: '--space-100', use: 'Vertical padding of a Page with compact spacing.' },
  { tier: 'patterns', group: 'Page', new: '--page-pad-y-default', old: null, value: '--space-150', use: 'Vertical padding of a Page with default spacing.' },
  { tier: 'patterns', group: 'Page', new: '--page-pad-y-spacious', old: null, value: '--space-200', use: 'Vertical padding of a Page with spacious spacing.' },
  { tier: 'patterns', group: 'Page', new: '--page-stack-sm', old: '--page-stack-sm', use: 'Vertical gap between closely related blocks on a Page, such as a header and its subtitle.' },
  { tier: 'patterns', group: 'Page', new: '--page-stack-md', old: '--page-stack-md', use: 'Vertical gap between sections on a Page.' },
  { tier: 'patterns', group: 'Page', new: '--page-stack-lg', old: '--page-stack-lg', use: 'Vertical gap between major regions of a Page.' },
  { tier: 'patterns', group: 'Page', new: '--page-radius', old: '--page-radius', use: 'Corner rounding of a Page inside the Frame.' },

  // ─── Patterns / Panel (the Frame's right-hand area) ──────────────────
  { tier: 'patterns', group: 'Panel', new: '--panel-min-width', old: null, ref: 'var(--width-2000)', note: 'the narrowest the splitter allows (320)', use: 'Narrowest the Panel may be dragged.' },
  { tier: 'patterns', group: 'Panel', new: '--panel-width-default', old: null, ref: 'var(--width-2500)', note: 'the width a Panel opens at (400)', use: 'Width the Panel opens at.' },
  { tier: 'patterns', group: 'Panel', new: '--panel-max-width', old: null, ref: 'var(--size-4000)', note: 'the widest the splitter allows (640)', use: 'Widest the Panel may be dragged.' },

  // ─── Patterns / Section ───────────────────────────────────────────────
  { tier: 'patterns', group: 'Section', new: '--section-pad-x-compact', old: null, value: '--space-100', use: 'Horizontal padding of a PatternSection with compact spacing.' },
  { tier: 'patterns', group: 'Section', new: '--section-pad-x-default', old: null, value: '--space-150', use: 'Horizontal padding of a PatternSection with default spacing.' },
  { tier: 'patterns', group: 'Section', new: '--section-pad-x-spacious', old: null, value: '--space-200', use: 'Horizontal padding of a PatternSection with spacious spacing.' },
  { tier: 'patterns', group: 'Section', new: '--section-pad-y-compact', old: null, value: '--space-100', use: 'Vertical padding of a PatternSection with compact spacing.' },
  { tier: 'patterns', group: 'Section', new: '--section-pad-y-default', old: null, value: '--space-150', use: 'Vertical padding of a PatternSection with default spacing.' },
  { tier: 'patterns', group: 'Section', new: '--section-pad-y-spacious', old: null, value: '--space-200', use: 'Vertical padding of a PatternSection with spacious spacing.' },
  { tier: 'patterns', group: 'Section', new: '--section-radius', old: null, ref: 'var(--radius-100)', note: 'the rounding of a Section with a fill', use: 'Corner rounding of a PatternSection that has a fill.' },
  { tier: 'patterns', group: 'Section', new: '--section-stack-sm', old: '--section-stack-sm', use: 'Vertical gap between a section header and its content.' },
  { tier: 'patterns', group: 'Section', new: '--section-stack-md', old: '--section-stack-md', use: 'Vertical gap between blocks inside a PatternSection.' },
  { tier: 'patterns', group: 'Section', new: '--section-stack-lg', old: '--section-stack-lg', use: 'Vertical gap between groups of blocks inside a PatternSection.' },
  { tier: 'patterns', group: 'Section', new: '--section-min-width-main', old: '--section-min-width-main', use: 'Narrowest the main column of a two-column PatternSection may shrink.' },
  { tier: 'patterns', group: 'Section', new: '--section-min-width-side', old: '--section-min-width-side', use: 'Narrowest the side column of a two-column PatternSection may shrink.' },

  // ─── Patterns / Card ──────────────────────────────────────────────────
  { tier: 'patterns', group: 'Card', new: '--card-pad-compact', old: null, value: '--space-100', use: 'Padding inside a PatternCard with compact spacing.' },
  { tier: 'patterns', group: 'Card', new: '--card-pad-default', old: null, value: '--space-125', use: 'Padding inside a PatternCard with default spacing.' },
  { tier: 'patterns', group: 'Card', new: '--card-pad-spacious', old: null, value: '--space-150', use: 'Padding inside a PatternCard with spacious spacing.' },
  { tier: 'patterns', group: 'Card', new: '--card-stack-sm', old: '--card-stack-sm', use: 'Vertical gap between tightly related lines in a PatternCard, such as a title and its meta.' },
  { tier: 'patterns', group: 'Card', new: '--card-stack-md', old: '--card-stack-md', use: 'Vertical gap between blocks in a PatternCard.' },
  { tier: 'patterns', group: 'Card', new: '--card-stack-lg', old: '--card-stack-lg', use: 'Vertical gap between a PatternCard\'s header, body and footer.' },
  { tier: 'patterns', group: 'Card', new: '--card-inline-sm', old: '--card-inline-sm', use: 'Horizontal gap between small items in a PatternCard row, such as tags.' },
  { tier: 'patterns', group: 'Card', new: '--card-inline-md', old: '--card-inline-md', use: 'Horizontal gap between items in a PatternCard row, such as actions.' },
  { tier: 'patterns', group: 'Card', new: '--card-inline-lg', old: '--card-inline-lg', use: 'Horizontal gap between columns inside a PatternCard.' },
  { tier: 'patterns', group: 'Card', new: '--card-min-width-sm', old: '--card-min-width-sm', use: 'Narrowest a small PatternCard may shrink in a grid.' },
  { tier: 'patterns', group: 'Card', new: '--card-min-width-md', old: '--card-min-width-md', use: 'Narrowest a default PatternCard may shrink in a grid.' },
  { tier: 'patterns', group: 'Card', new: '--card-min-width-lg', old: '--card-min-width-lg', use: 'Narrowest a large PatternCard may shrink in a grid.' },
  { tier: 'patterns', group: 'Card', new: '--card-radius', old: '--card-radius', use: 'Corner rounding of a PatternCard.' },
  { tier: 'patterns', group: 'Card', new: '--card-radius-sm', old: '--card-radius-sm', use: 'Corner rounding of a small PatternCard or a card nested in another container.' },
  { tier: 'patterns', group: 'Card', new: '--card-max-height-sm', old: '--card-max-height-sm', use: 'Tallest a short scrolling PatternCard may grow.' },
  { tier: 'patterns', group: 'Card', new: '--card-max-height-md', old: '--card-max-height-md', use: 'Tallest a default scrolling PatternCard may grow.' },
  { tier: 'patterns', group: 'Card', new: '--card-max-height-lg', old: '--card-max-height-lg', use: 'Tallest a tall scrolling PatternCard may grow.' },

  // ─── Patterns / Table ─────────────────────────────────────────────────
  { tier: 'patterns', group: 'Table', new: '--table-pad-x-cell', old: '--table-pad-x-cell', use: 'Horizontal padding inside a PatternTable cell.' },
  { tier: 'patterns', group: 'Table', new: '--table-pad-y-cell', old: '--table-pad-y-cell', use: 'Vertical padding inside a PatternTable cell.' },
  { tier: 'patterns', group: 'Table', new: '--table-indent', old: '--table-indent', use: 'Indent of each nested level in a tree table.' },
  { tier: 'patterns', group: 'Table', new: '--table-radius', old: '--table-radius', use: 'Corner rounding of a PatternTable.' },
  { tier: 'patterns', group: 'Table', new: '--table-stack', old: '--table-stack', use: 'Vertical gap between a PatternTable and its toolbar or footer.' },
  { tier: 'patterns', group: 'Table', new: '--table-pad-x-footer', old: '--table-pad-x-footer', use: 'Horizontal padding of a PatternTable footer, such as its Pagination row.' },
  { tier: 'patterns', group: 'Table', new: '--table-min-width-title', old: '--table-min-width-title', use: 'Narrowest a PatternTable\'s title column may shrink.' },

  // ─── Patterns / Blanket (renamed from Overlay) ───────────────────────
  { tier: 'patterns', group: 'Blanket', new: '--blanket-pad-x', old: '--overlay-pad-x', ref: 'var(--space-100)', use: 'Horizontal space between the screen edge and a Modal on its Blanket.' },
  { tier: 'patterns', group: 'Blanket', new: '--blanket-pad-y', old: '--overlay-pad-y', ref: 'var(--space-400)', at: { '(max-height: 639.98px)': 'var(--space-150)' }, use: 'Vertical space between the screen edge and a Modal on its Blanket; shrinks on short screens.' },
  { tier: 'patterns', group: 'Blanket', new: '--blanket-fill', old: '--overlay-scrim', type: 'COLOR', ref: 'rgba(0, 0, 0, 0.38)', note: "the Blanket's own fill color; the old declaration's value, written directly so this file carries no old-language word", use: 'Fill of the Blanket that dims the page behind a Modal.' },
  { tier: 'patterns', group: 'Blanket', new: '--blanket-max-height-modal', old: '--layout-max-height-modal', ref: 'calc(100dvh - 2 * var(--blanket-pad-y))', codeOnly: true, note: 'a calc() of the pad above: code only, no Figma variable', use: 'Tallest a Modal may grow inside its Blanket.' },

  // ─── Patterns / Modal ─────────────────────────────────────────────────
  { tier: 'patterns', group: 'Modal', new: '--modal-pad', old: '--modal-pad', use: 'Padding inside a Modal at the current breakpoint.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-pad-x-compact', old: null, value: '--space-0625', use: 'Horizontal padding of a Modal with compact spacing.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-pad-x-default', old: null, value: '--space-100', use: 'Horizontal padding of a Modal with default spacing.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-pad-x-spacious', old: null, value: '--space-125', use: 'Horizontal padding of a Modal with spacious spacing.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-pad-y-compact', old: null, value: '--space-050', use: 'Vertical padding of a Modal with compact spacing.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-pad-y-default', old: null, value: '--space-075', use: 'Vertical padding of a Modal with default spacing.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-pad-y-spacious', old: null, value: '--space-100', use: 'Vertical padding of a Modal with spacious spacing.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-stack-sm', old: '--modal-stack-sm', use: 'Vertical gap between a Modal\'s title and its description.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-stack-md', old: '--modal-stack-md', use: 'Vertical gap between blocks in a Modal\'s body.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-stack-lg', old: '--modal-stack-lg', use: 'Vertical gap between a Modal\'s header, body and footer.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-inline-sm', old: '--modal-inline-sm', use: 'Horizontal gap between small items in a Modal row.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-inline-md', old: '--modal-inline-md', use: 'Horizontal gap between the actions in a Modal footer.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-inline-lg', old: '--modal-inline-lg', use: 'Horizontal gap between columns in a Modal.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-radius', old: '--modal-radius', use: 'Corner rounding of a Modal.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-width-sm', old: '--layout-width-modal-sm', ref: '384px', at: { '(min-width: 1024px)': '512px', '(min-width: 1440px)': '640px' }, note: 'lifted out of spacing / layout, beside the pattern’s pad/stack tokens', use: 'Width of a small Modal, such as a confirmation.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-width-md', old: '--layout-width-modal-md', ref: '507px', at: { '(min-width: 1024px)': '677px', '(min-width: 1440px)': '848px' }, use: 'Width of a default Modal, such as a short form.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-width-lg', old: '--layout-width-modal-lg', ref: '629px', at: { '(min-width: 1024px)': '843px', '(min-width: 1440px)': '1056px' }, use: 'Width of a large Modal, such as a table or a long form.' },
  { tier: 'patterns', group: 'Page', new: '--page-radius-md', old: null, ref: 'var(--radius-075)', use: 'Corner rounding of a Page frame.' },
  { tier: 'patterns', group: 'Page', new: '--page-border-width', old: null, ref: 'var(--stroke-2)', use: 'Width of the edge drawn around a Page frame.' },
  { tier: 'patterns', group: 'Table', new: '--table-overflow-reach', old: null, ref: 'var(--space-150)', use: 'How far a PatternTable lets a row\'s overflow, such as a focus ring, reach past its clip.' },
  { tier: 'patterns', group: 'Modal', new: '--modal-body-min-height', old: null, ref: 'var(--space-500)', use: 'Minimum height of a Modal\'s body, so a short body does not collapse the dialog.' },

  // ─── Patterns / Popover ───────────────────────────────────────────────
  { tier: 'patterns', group: 'Popover', new: '--popover-pad', old: '--popover-pad', use: 'Padding inside a Popup.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-width-sm', old: '--popover-width-sm', use: 'Width of a small Popup.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-width-md', old: '--popover-width-md', use: 'Width of a default Popup.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-width-lg', old: '--popover-width-lg', use: 'Width of a large Popup.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-width-flag', old: '--popover-width-flag', use: 'Width of a Flag.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-stack-flag', old: '--popover-stack-flag', use: 'Vertical gap between stacked Flags.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-radius', old: '--popover-radius', use: 'Corner rounding of a Popup.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-pad-menu', old: '--popover-pad-menu', use: 'Padding inside a DropdownMenu or listbox.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-min-width-menu', old: '--popover-min-width-menu', use: 'Narrowest a DropdownMenu or listbox may shrink.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-max-width-menu', old: '--popover-max-width-menu', use: 'Widest a DropdownMenu or listbox may grow.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-max-height-menu', old: '--popover-max-height-menu', use: 'Tallest a DropdownMenu or listbox may grow before it scrolls.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-radius-menu-sm', old: '--popover-radius-menu-sm', use: 'Corner rounding of a compact DropdownMenu.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-radius-menu-md', old: '--popover-radius-menu-md', use: 'Corner rounding of a default DropdownMenu.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-pad-y-tooltip', old: '--popover-pad-y-tooltip', use: 'Vertical padding inside a Tooltip.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-max-width-tooltip', old: '--popover-max-width-tooltip', use: 'Widest a Tooltip may grow before its text wraps.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-radius-tooltip', old: '--popover-radius-tooltip', use: 'Corner rounding of a Tooltip.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-gap-screen', old: '--popover-gap-screen', use: 'Space a floating layer keeps from the screen edge, such as a Flag or a listbox.' },
  { tier: 'patterns', group: 'Popover', new: '--popover-offset', old: '--popover-offset', use: 'Gap between a Popup, menu or Tooltip and the element that opened it.' },

  // ─── Patterns / Drawer ────────────────────────────────────────────────
  { tier: 'patterns', group: 'Drawer', new: '--drawer-pad', old: '--drawer-pad', use: 'Padding inside a PatternDrawer.' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-stack-sm', old: '--drawer-stack-sm', use: 'Vertical gap between a PatternDrawer\'s title and its description.' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-stack-md', old: '--drawer-stack-md', use: 'Vertical gap between blocks in a PatternDrawer\'s body.' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-stack-lg', old: '--drawer-stack-lg', use: 'Vertical gap between a PatternDrawer\'s header, body and footer.' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-inline-sm', old: '--drawer-inline-sm', use: 'Horizontal gap between small items in a PatternDrawer row.' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-inline-md', old: '--drawer-inline-md', use: 'Horizontal gap between the actions in a PatternDrawer footer.' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-inline-lg', old: '--drawer-inline-lg', use: 'Horizontal gap between columns in a PatternDrawer.' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-width-sm', old: '--layout-width-drawer-sm', ref: 'var(--modal-width-sm)', use: 'Width of a narrow PatternDrawer.' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-width-md', old: '--layout-width-drawer-md', ref: 'var(--modal-width-md)', use: 'Width of a default PatternDrawer.' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-width-lg', old: '--layout-width-drawer-lg', ref: 'var(--modal-width-lg)', use: 'Width of a wide PatternDrawer.' },

  // ─── Patterns / Focused page ──────────────────────────────────────────
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-pad-x', old: '--focused-page-pad-x', use: 'Horizontal padding of a focused page: a single task with no Sidebar, such as a wizard step.' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-pad-y', old: '--focused-page-pad-y', use: 'Vertical padding of a focused page.' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-stack-sm', old: '--focused-page-stack-sm', use: 'Vertical gap between a focused page\'s title and its description.' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-stack-md', old: '--focused-page-stack-md', use: 'Vertical gap between blocks on a focused page.' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-stack-lg', old: '--focused-page-stack-lg', use: 'Vertical gap between a focused page\'s header, body and actions.' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-inline-sm', old: '--focused-page-inline-sm', use: 'Horizontal gap between small items in a focused page row.' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-inline-md', old: '--focused-page-inline-md', use: 'Horizontal gap between the actions on a focused page.' },

  // ─── Components / Button ──────────────────────────────────────────────
  { tier: 'components', group: 'Button', new: '--button-radius-default', old: '--element-radius-item-sm', ref: 'var(--radius-0375)', note: '32-high control, radius 6', use: 'Corner rounding of a Button with default spacing.' },
  { tier: 'components', group: 'Button', new: '--button-radius-compact', old: '--element-radius-md', ref: 'var(--radius-025)', note: '24-high control, radius 4', use: 'Corner rounding of a Button with compact spacing.' },

  // ─── Components / Calendar ────────────────────────────────────────────
  { tier: 'components', group: 'Calendar', new: '--calendar-day-sm', old: '--layout-calendar-day-sm', ref: '28px', use: 'Size of a day cell in a compact Calendar.' },
  { tier: 'components', group: 'Calendar', new: '--calendar-day-md', old: '--layout-calendar-day-md', ref: '36px', use: 'Size of a day cell in a default Calendar.' },
  { tier: 'components', group: 'Calendar', new: '--calendar-day-lg', old: '--layout-calendar-day-lg', ref: '44px', use: 'Size of a day cell in a large Calendar.' },
  { tier: 'components', group: 'Calendar', new: '--calendar-nav-size', old: '--layout-calendar-nav', ref: '32px', use: 'Size of the Calendar\'s previous and next month buttons.' },

  // ─── Components / Progress indicator ──────────────────────────────────
  { tier: 'components', group: 'Progress indicator', new: '--progress-indicator-dot-size-8', old: null, ref: 'var(--space-050)', note: 'ProgressIndicator size 8', use: 'Dot size of a ProgressIndicator with size 8.' },
  { tier: 'components', group: 'Progress indicator', new: '--progress-indicator-dot-size-12', old: null, ref: 'var(--size-075)', note: 'ProgressIndicator size 12', use: 'Dot size of a ProgressIndicator with size 12.' },

  // ─── Components / Checkbox, Radio ─────────────────────────────────────
  { tier: 'components', group: 'Checkbox', new: '--checkbox-control-size', old: '--layout-control-checkbox', ref: '18px', use: 'Size of the Checkbox box.' },
  { tier: 'components', group: 'Radio', new: '--radio-control-size', old: '--layout-control-radio', ref: '12px', use: 'Size of the Radio circle.' },
  // The `size` prop's px values (Radio group, Choice grid, Range, Toggle) are rows too, so the
  // components read a named token and never a literal. Each name ends in the `size` step it serves.
  { tier: 'components', group: 'Radio', new: '--radio-control-size-10', old: null, ref: '10px', note: 'RadioGroup size 10', use: 'Size of the circle in a RadioGroup with size 10.' },
  { tier: 'components', group: 'Radio', new: '--radio-control-size-14', old: null, ref: '14px', note: 'RadioGroup size 14', use: 'Size of the circle in a RadioGroup with size 14.' },
  { tier: 'components', group: 'Choice grid', new: '--choice-grid-control-size-10', old: null, ref: '10px', note: 'ChoiceGrid size 12', use: 'Size of the control in a ChoiceGrid with size 12.' },
  { tier: 'components', group: 'Choice grid', new: '--choice-grid-control-size-12', old: null, ref: '12px', note: 'ChoiceGrid size 14 and 16', use: 'Size of the control in a ChoiceGrid with size 14 or 16.' },
  { tier: 'components', group: 'Range', new: '--range-dot-size-8', old: null, ref: '8px', note: 'Range size 8', use: 'Thumb size of a Range with size 8.' },
  { tier: 'components', group: 'Range', new: '--range-dot-size-12', old: null, ref: '12px', note: 'Range size 12', use: 'Thumb size of a Range with size 12.' },
  { tier: 'components', group: 'Range', new: '--range-dot-size-16', old: null, ref: '16px', note: 'Range size 16', use: 'Thumb size of a Range with size 16.' },
  { tier: 'components', group: 'Range', new: '--range-dot-size-default', old: null, ref: '20px', note: 'Range with no size', use: 'Thumb size of a Range with no size set.' },
  { tier: 'components', group: 'Range', new: '--range-track-height-4', old: null, ref: '4px', note: 'Range size 8, and the default', use: 'Track height of a Range with size 8 or no size set.' },
  { tier: 'components', group: 'Range', new: '--range-track-height-6', old: null, ref: '6px', note: 'Range size 12', use: 'Track height of a Range with size 12.' },
  { tier: 'components', group: 'Range', new: '--range-track-height-8', old: null, ref: '8px', note: 'Range size 16', use: 'Track height of a Range with size 16.' },
  { tier: 'components', group: 'Toggle', new: '--toggle-track-height-16', old: null, ref: '16px', note: 'Toggle size 16', use: 'Track height of a Toggle with size 16.' },
  { tier: 'components', group: 'Toggle', new: '--toggle-track-height-20', old: null, ref: '20px', note: 'Toggle size 20', use: 'Track height of a Toggle with size 20.' },
  { tier: 'components', group: 'Toggle', new: '--toggle-track-width-16', old: null, ref: '32px', note: 'Toggle size 16', use: 'Track width of a Toggle with size 16.' },
  { tier: 'components', group: 'Toggle', new: '--toggle-track-width-20', old: null, ref: '40px', note: 'Toggle size 20', use: 'Track width of a Toggle with size 20.' },
  { tier: 'components', group: 'Toggle', new: '--toggle-pad', old: null, ref: 'var(--space-0125)', note: 'both sizes', use: 'Gap between a Toggle\'s track and its knob, at both sizes.' },

  // ─── Components / Listbox ─────────────────────────────────────────────
  { tier: 'components', group: 'Listbox', new: '--listbox-max-width', old: '--layout-max-width-listbox', ref: '320px', use: 'Widest a Select or Cascader listbox may grow.' },
  { tier: 'components', group: 'Listbox', new: '--listbox-min-height', old: '--layout-min-height-listbox', ref: '140px', use: 'Shortest a Select or Cascader listbox may be.' },
  { tier: 'components', group: 'Listbox', new: '--listbox-max-height', old: '--layout-max-height-listbox', ref: '300px', use: 'Tallest a Select or Cascader listbox may grow before it scrolls.' },

  // ─── Components / Join row, Option menu ───────────────────────────────
  { tier: 'components', group: 'Join row', new: '--join-row-width', old: '--layout-width-join-row', ref: '520px', use: 'Width of the Home page join row: the Join button with its session Select beside it.' },
  { tier: 'components', group: 'Option menu', new: '--option-menu-width', old: '--layout-width-option-menu', ref: '240px', use: 'Width of a fixed-width option menu.' },

  // ─── Components / sizes once written with primitives ─────────────────
  { tier: 'components', group: 'Button', new: '--button-vertical-size', old: null, ref: 'var(--space-400)', use: 'Height of a Button laid out vertically, with its icon above its label.' },
  { tier: 'components', group: 'Option row', new: '--option-row-indent-step', old: null, ref: 'var(--space-125)', use: 'Indent added for each level of a nested option row.' },
  { tier: 'components', group: 'Option row', new: '--option-row-control-gap', old: null, ref: 'var(--space-0625)', use: 'Horizontal gap between an option row\'s control and its label.' },
  { tier: 'components', group: 'Option row', new: '--option-row-dot-size', old: null, ref: 'var(--space-050)', use: 'Size of the dot in an option row, such as a radio\'s selected mark.' },
  { tier: 'components', group: 'Count tag', new: '--count-tag-dot-size', old: null, ref: 'var(--space-050)', use: 'Size of the dot in a CountTag.' },
  { tier: 'components', group: 'Tag', new: '--tag-dot-size', old: null, ref: 'var(--space-0625)', use: 'Size of the dot in a Tag.' },
  { tier: 'components', group: 'Tag', new: '--tag-pad-end-compact', old: null, ref: 'var(--space-0125)', use: 'Padding at the end of a Tag with compact spacing.' },
  { tier: 'components', group: 'Tag', new: '--tag-gap-compact', old: null, ref: 'var(--space-0125)', use: 'Horizontal gap between a Tag\'s parts with compact spacing.' },
  { tier: 'components', group: 'Tag', new: '--tag-pad-end', old: null, ref: 'var(--space-0375)', use: 'Padding at the end of a Tag with default spacing.' },
  { tier: 'components', group: 'Tag', new: '--tag-gap', old: null, ref: 'var(--space-0375)', use: 'Horizontal gap between a Tag\'s parts with default spacing.' },
  { tier: 'components', group: 'Carousel', new: '--carousel-control-offset', old: null, ref: 'var(--space-0625)', use: 'Distance between a Carousel\'s previous and next controls and its edge.' },
  { tier: 'components', group: 'Carousel', new: '--carousel-control-pad', old: null, ref: 'var(--space-100)', use: 'Padding inside a Carousel\'s previous and next controls.' },
  { tier: 'components', group: 'Carousel', new: '--carousel-control-size', old: null, ref: 'var(--space-300)', use: 'Size of a Carousel\'s previous and next controls.' },
  { tier: 'components', group: 'Carousel', new: '--carousel-slide-min-height-compact', old: null, ref: 'var(--size-1000)', use: 'Minimum height of a Carousel slide with compact spacing.' },
  { tier: 'components', group: 'Carousel', new: '--carousel-slide-min-height', old: null, ref: 'var(--size-1400)', use: 'Minimum height of a Carousel slide with default spacing.' },
  { tier: 'components', group: 'Carousel', new: '--carousel-slide-min-height-spacious', old: null, ref: 'var(--size-2500)', use: 'Minimum height of a Carousel slide with spacious spacing.' },
  { tier: 'components', group: 'Carousel', new: '--carousel-indicator-width-compact', old: null, ref: 'var(--size-300)', use: 'Width of a Carousel\'s slide indicator with compact spacing.' },
  { tier: 'components', group: 'Carousel', new: '--carousel-indicator-width', old: null, ref: 'var(--size-750)', use: 'Width of a Carousel\'s slide indicator with default spacing.' },
  { tier: 'components', group: 'Carousel', new: '--carousel-indicator-height-compact', old: null, ref: 'var(--space-025)', use: 'Height of a Carousel\'s slide indicator with compact spacing.' },
  { tier: 'components', group: 'Carousel', new: '--carousel-indicator-height', old: null, ref: 'var(--space-0375)', use: 'Height of a Carousel\'s slide indicator with default spacing.' },
  { tier: 'components', group: 'Carousel', new: '--carousel-indicator-height-spacious', old: null, ref: 'var(--space-050)', use: 'Height of a Carousel\'s slide indicator with spacious spacing.' },
  { tier: 'components', group: 'Scroll bar', new: '--scroll-bar-size', old: null, ref: 'var(--space-0375)', use: 'Thickness of a scroll bar.' },
  { tier: 'components', group: 'Scroll bar', new: '--scroll-bar-max-height', old: null, ref: 'calc(var(--size-1000) * 2)', use: 'Maximum height of a scrolling area that shows a scroll bar.' },
  { tier: 'components', group: 'Skeleton', new: '--skeleton-height', old: null, ref: 'var(--space-400)', use: 'Height of a block Skeleton.' },
  { tier: 'components', group: 'Skeleton', new: '--skeleton-circle-size', old: null, ref: 'var(--space-200)', use: 'Size of a round Skeleton, such as an avatar placeholder.' },
  { tier: 'components', group: 'Skeleton', new: '--skeleton-text-height', old: null, ref: 'var(--space-100)', use: 'Height of a Skeleton standing in for one line of text.' },
  { tier: 'components', group: 'Skeleton', new: '--skeleton-status-width', old: null, ref: 'var(--space-400)', use: 'Width of a Skeleton standing in for a status tag.' },
  { tier: 'components', group: 'Skeleton', new: '--skeleton-status-width-spacious', old: null, ref: 'calc(var(--space-500) + var(--space-050))', use: 'Width of a Skeleton standing in for a status tag with spacious spacing.' },
  { tier: 'components', group: 'Skeleton', new: '--skeleton-tag-width', old: null, ref: 'calc(var(--space-400) + var(--space-050))', use: 'Width of a Skeleton standing in for a tag.' },
  { tier: 'components', group: 'Skeleton', new: '--skeleton-tag-width-person', old: null, ref: 'var(--space-500)', use: 'Width of a Skeleton standing in for a person tag.' },
  { tier: 'components', group: 'Skeleton', new: '--skeleton-tag-width-narrow', old: null, ref: 'calc(var(--space-250) + var(--space-100))', use: 'Width of a Skeleton standing in for a short tag.' },
  { tier: 'components', group: 'Skeleton', new: '--skeleton-tag-width-widest', old: null, ref: 'calc(var(--space-500) + var(--space-050))', use: 'Width of a Skeleton standing in for the longest tag.' },
  { tier: 'components', group: 'Flag', new: '--flag-min-height', old: null, ref: 'calc(var(--size-1000) + var(--size-750))', use: 'Minimum height of a Flag.' },
  { tier: 'components', group: 'Flag', new: '--flag-pad', old: null, ref: 'var(--space-125)', use: 'Padding inside a Flag.' },
  { tier: 'components', group: 'Flag', new: '--flag-offset', old: null, ref: 'var(--space-125)', use: 'Distance between a Flag and the edge of the screen.' },
  { tier: 'components', group: 'Spotlight', new: '--spotlight-width', old: null, ref: 'var(--width-2500)', use: 'Width of a Spotlight.' },
  { tier: 'components', group: 'Spotlight', new: '--spotlight-media-height', old: null, ref: 'calc(var(--size-750) + var(--space-150))', use: 'Height of the media area in a Spotlight.' },
  { tier: 'components', group: 'Menu group', new: '--menu-group-min-width', old: null, ref: 'var(--size-1400)', use: 'Minimum width of a menu group.' },
  { tier: 'components', group: 'Menu group', new: '--menu-group-pad-x', old: null, ref: 'var(--space-150)', use: 'Horizontal padding of a menu group.' },
  { tier: 'components', group: 'Menu group', new: '--menu-group-gap', old: null, ref: 'var(--space-100)', use: 'Vertical gap between groups in a menu.' },
  { tier: 'components', group: 'Menu group', new: '--menu-group-item-pad-y', old: null, ref: 'var(--space-0625)', use: 'Vertical padding of an item in a menu group.' },
  { tier: 'components', group: 'Popup', new: '--popup-min-width', old: null, ref: 'var(--width-1000)', use: 'Narrowest an auto-width Popup gets, unless its trigger is wider.' },
  { tier: 'components', group: 'Popup', new: '--popup-max-width', old: null, ref: 'var(--width-2000)', use: 'Widest an auto-width Popup grows to fit its content, unless its trigger is wider.' },
  { tier: 'components', group: 'Popup', new: '--popup-clip-reach', old: null, ref: 'var(--space-300)', use: 'How far past its edges a Popup\'s opening clip stays, so the overlay shadow is never cut.' },
  { tier: 'components', group: 'AI chat', new: '--ai-chat-width', old: null, ref: 'var(--width-2500)', use: 'Width of the AI chat when it opens as a popup or floats beside the page.' },
  { tier: 'components', group: 'Popup', new: '--popup-pad', old: null, ref: 'var(--space-125)', use: 'Padding inside a Popup.' },
  { tier: 'components', group: 'Table', new: '--table-cell-max-width', old: null, ref: 'var(--size-300)', use: 'Maximum width of a table cell before its text truncates.' },
  { tier: 'components', group: 'Avatar', new: '--avatar-size-96', old: null, ref: 'calc(var(--space-300) * 2)', use: 'Size of an extra-large UserAvatar, such as in a profile header.' },
  { tier: 'components', group: 'Avatar', new: '--avatar-size-128', old: null, ref: 'calc(var(--space-400) * 2)', use: 'Size of the largest UserAvatar, such as on a profile page.' },

  // ─── Components / Tile (reclassified, unchanged names) ───────────────
  { tier: 'components', group: 'Tile', new: '--tile-radius-sm', old: '--tile-radius-sm', use: 'Corner rounding of a small Tile.' },
  { tier: 'components', group: 'Tile', new: '--tile-radius-lg', old: '--tile-radius-lg', use: 'Corner rounding of a large Tile.' },

  // ─── Components / Spinner, Progress bar (Bill 2026-11-04: one component
  // each, so they move out of SIZE_ROLES in generate-all-tokens.js straight to
  // this tier, not through Semantics' size roles) ───────────────────────
  { tier: 'components', group: 'Spinner', new: '--spinner-size-sm', old: null, value: '--space-100', use: 'Size of a small Spinner, such as one inside a Button.' },
  { tier: 'components', group: 'Spinner', new: '--spinner-size-md', old: null, value: '--space-150', use: 'Size of a default Spinner.' },
  { tier: 'components', group: 'Spinner', new: '--spinner-size-lg', old: null, value: '--space-300', use: 'Size of a large Spinner, such as one loading a whole section.' },
  { tier: 'components', group: 'Progress bar', new: '--progress-bar-height', old: null, value: '--space-050', use: 'Height of a ProgressBar track.' },

  // ─── Layers (own non-spacing family, code only) ───────────────────────
  { tier: 'layers', group: 'Layer', new: '--layer-card', old: '--layout-z-index-card', ref: '100', use: 'Stacking order of a card raised above page content, such as a sticky table part.' },
  { tier: 'layers', group: 'Layer', new: '--layer-navigation', old: '--layout-z-index-navigation', ref: '200', use: 'Stacking order of the Frame\'s top bar and Sidebar.' },
  { tier: 'layers', group: 'Layer', new: '--layer-dialog', old: '--layout-z-index-dialog', ref: '300', use: 'Stacking order of a non-modal dialog over the page, below popups.' },
  { tier: 'layers', group: 'Layer', new: '--layer-popup', old: '--layout-z-index-popup', ref: '400', use: 'Stacking order of a Popup, DropdownMenu or listbox.' },
  { tier: 'layers', group: 'Layer', new: '--layer-blanket', old: '--layout-z-index-scrim', ref: '500', note: "the Blanket's z-index; the old declaration's value, written directly so this file carries no old-language word", use: 'Stacking order of the Blanket behind a Modal.' },
  { tier: 'layers', group: 'Layer', new: '--layer-modal', old: '--layout-z-index-modal', ref: '510', use: 'Stacking order of a Modal, above its Blanket.' },
  { tier: 'layers', group: 'Layer', new: '--layer-flag', old: '--layout-z-index-flag', ref: '600', use: 'Stacking order of a Flag, above any Modal.' },
  { tier: 'layers', group: 'Layer', new: '--layer-spotlight', old: '--layout-z-index-spotlight', ref: '700', use: 'Stacking order of a Spotlight, above Flags.' },
  { tier: 'layers', group: 'Layer', new: '--layer-tooltip', old: '--layout-z-index-tooltip', ref: '800', use: 'Stacking order of a Tooltip, above everything else.' },
];

/**
 * Retired names with no ladder row of their own, and what each reads now.
 * Every replacement resolves to the same pixels the retired name did, so a
 * caller moving over changes a name, never a size.
 *  - `--size-element-*`: the old Figma element vocabulary, split by property
 *    onto the semantics Pad / Stack / Radius steps. Two of its values have no
 *    semantic step (a 4px vertical pad, a 10px gap) and read the primitive
 *    instead, and its 1.5px and 3px strokes take the 2px stroke.
 *  - `--element-{pad|gap|radius}-{default|compact}`: the role tokens this
 *    plan's first pass wrote; no "roles" concept survives (Bill, 2026-11-04).
 *  - `--card-pad-{sm|md|lg}`: the same 16/20/24 as `--card-pad-{compact|default|spacious}`.
 */
export const RETIRED_RENAMES = {
  '--size-element-pad-x-lg': '--pad-x-lg',
  '--size-element-pad-x-md': '--pad-x-md',
  '--size-element-pad-x-sm': '--pad-x-sm',
  '--size-element-pad-x-xs': '--pad-x-xs',
  '--size-element-pad-y-lg': '--pad-y-lg',
  '--size-element-pad-y-md': '--pad-y-md',
  '--size-element-pad-y-sm': '--space-025',
  '--size-element-gap-xs': '--stack-sm',
  '--size-element-gap-sm': '--stack-md',
  '--size-element-gap-md': '--space-0625',
  '--size-element-gap-lg': '--stack-lg',
  '--size-element-radius-sm': '--radius-md',
  '--size-element-radius-md': '--radius-md',
  '--size-element-radius-lg': '--radius-lg',
  '--size-element-radius-full': '--radius-full',
  '--size-element-stroke-sm': '--stroke-1',
  '--size-element-stroke-md': '--stroke-2',
  '--size-element-stroke-lg': '--stroke-2',
  '--size-element-stroke-xl': '--stroke-2',
  '--size-element-border': '--border-default',
  '--element-radius-full': '--radius-full',
  '--element-pad-default': '--pad-x-md',
  '--element-pad-compact': '--pad-x-sm',
  '--element-gap-default': '--stack-md',
  '--element-gap-compact': '--stack-sm',
  '--element-radius-default': '--radius-md',
  '--element-radius-compact': '--radius-sm',
  '--card-pad-sm': '--card-pad-compact',
  '--card-pad-md': '--card-pad-default',
  '--card-pad-lg': '--card-pad-spacious',
};

/** Retired name -> its replacement: the explicit table above, then each ladder row's `old` (first row wins). */
export function retiredRenames() {
  const map = new Map(Object.entries(RETIRED_RENAMES));
  for (const row of TOKEN_LADDER) {
    if (row.old && row.old !== row.new && !map.has(row.old)) map.set(row.old, row.new);
  }
  return map;
}

/** Every retired name. The generators drop them and `check:old-system` bans their uses. */
export const RETIRED_TOKENS = new Set(retiredRenames().keys());
