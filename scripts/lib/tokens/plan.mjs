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
 *  - `--size-icon-*` / `--size-indicator-*` / `--size-row-*` / `--size-media-*`
 *    (the `SIZE_ROLES` in `generate-all-tokens.js`) are a second, overlapping
 *    size-role vocabulary this ladder does not fold in yet — only `Control`
 *    is missing from `_scales.scss`'s Icon/Image/Item/Label/Row/Field set, so
 *    only `--control-*` is added here. Reconciling Icon/Row/Media across both
 *    vocabularies is a follow-up a family PR scopes on its own.
 *  - The legacy spec-page grid (`--breakpoint-*`, `--col-*`, `--layout-grid-gap`
 *    in `_layout.scss`) is out of this ladder: `_layout.scss` already calls it
 *    legacy and routes new work at the screen/content grid tokens instead, so
 *    there is nothing current to re-home it to.
 *  - `color / foundations` -> `color / semantics` and `opacity` -> `color /
 *    opacity`, and Figma's `Element/opacity-disabled` moving into the latter,
 *    are Figma-collection-membership changes only: code already names the one
 *    token involved `--color-disabled-opacity`, outside this ladder's prefix,
 *    so there is no code row for it — recorded in the payload's collection
 *    rename list instead (`build.mjs`'s `COLLECTION_RENAMES`).
 */
export const TOKEN_LADDER = [
  // ─── Semantics / Pad ──────────────────────────────────────────────────
  { tier: 'semantics', group: 'Pad', new: '--pad-x-xs', old: '--element-pad-x-xs', ref: 'var(--space-025)' },
  { tier: 'semantics', group: 'Pad', new: '--pad-x-sm', old: '--element-pad-x-sm', ref: 'var(--space-050)' },
  { tier: 'semantics', group: 'Pad', new: '--pad-x-md', old: '--element-pad-x-md', ref: 'var(--space-075)' },
  { tier: 'semantics', group: 'Pad', new: '--pad-x-lg', old: null, value: '--space-100', note: 'new step; matches the old --size-element-pad-x-lg (16px)' },
  { tier: 'semantics', group: 'Pad', new: '--pad-y-sm', old: '--element-pad-y-sm', ref: 'var(--space-0125)' },
  { tier: 'semantics', group: 'Pad', new: '--pad-y-md', old: '--element-pad-y-md', ref: 'var(--space-0375)' },
  { tier: 'semantics', group: 'Pad', new: '--pad-y-lg', old: null, value: '--space-050', note: 'new step; matches the old --size-element-pad-y-lg (8px)' },

  // ─── Semantics / Stack ────────────────────────────────────────────────
  { tier: 'semantics', group: 'Stack', new: '--stack-sm', old: '--element-stack-sm', ref: 'var(--space-025)' },
  { tier: 'semantics', group: 'Stack', new: '--stack-md', old: '--element-stack-md', ref: 'var(--space-050)' },
  { tier: 'semantics', group: 'Stack', new: '--stack-lg', old: '--element-stack-lg', ref: 'var(--space-075)' },

  // ─── Semantics / Inline ───────────────────────────────────────────────
  { tier: 'semantics', group: 'Inline', new: '--inline-sm', old: '--element-inline-sm', ref: 'var(--space-025)' },
  { tier: 'semantics', group: 'Inline', new: '--inline-md', old: '--element-inline-md', ref: 'var(--space-050)' },
  { tier: 'semantics', group: 'Inline', new: '--inline-lg', old: '--element-inline-lg', ref: 'var(--space-075)' },

  // ─── Semantics / Radius (non-control, + control-by-height) ───────────
  { tier: 'semantics', group: 'Radius', new: '--radius-sm', old: '--element-radius-sm', ref: 'var(--radius-0125)' },
  { tier: 'semantics', group: 'Radius', new: '--radius-md', old: '--element-radius-md', ref: 'var(--radius-025)' },
  { tier: 'semantics', group: 'Radius', new: '--radius-lg', old: '--element-radius-lg', ref: 'var(--radius-050)' },
  { tier: 'semantics', group: 'Radius', new: '--radius-full', old: '--element-radius-full', ref: 'var(--radius-full)', primitive: true, note: 'Figma Radius/full; the code name is the --radius-full primitive, so no second declaration' },
  { tier: 'semantics', group: 'Radius', new: '--radius-h24', old: '--element-radius-item-sm', ref: 'var(--radius-0375)', note: 'control height 24; 24÷4 = 6' },
  { tier: 'semantics', group: 'Radius', new: '--radius-h32', old: '--element-radius-item-md', ref: 'var(--radius-050)', note: 'control height 32; 32÷4 = 8' },
  { tier: 'semantics', group: 'Radius', new: '--radius-h40', old: null, value: '--radius-0625', note: 'new step; control height 40; 40÷4 = 10' },

  // ─── Semantics / Border (reclassified, unchanged names) ──────────────
  { tier: 'semantics', group: 'Border', new: '--border-default', old: '--border-default' },
  { tier: 'semantics', group: 'Border', new: '--border-selected', old: '--border-selected' },
  { tier: 'semantics', group: 'Border', new: '--border-focused', old: '--border-focused' },

  // ─── Semantics / Focus (net new) ──────────────────────────────────────
  { tier: 'semantics', group: 'Focus', new: '--focus-ring-width', old: '--size-element-stroke-lg', ref: 'var(--size-border-stroke-stroke-200)', note: 'matches the outline width repeated across Tag, DateTag, Suggestion and Tabs; reads the 2px stroke primitive' },
  { tier: 'semantics', group: 'Focus', new: '--focus-ring-offset', old: '--size-element-stroke-lg', ref: 'var(--size-border-stroke-stroke-200)', note: 'defined for a caller whose ring offset genuinely needs to move independently of its width; every current caller reads --focus-ring-width for both' },
  { tier: 'semantics', group: 'Focus', new: '--focus-ring-radius', old: null, value: '--radius-sm', note: 'first pass, no existing source; a family PR refines it' },

  // ─── Semantics / Grid (dissolved from spacing / layout) ──────────────
  { tier: 'semantics', group: 'Grid', new: '--grid-gutter', old: '--layout-gutter', ref: 'var(--space-100)' },
  { tier: 'semantics', group: 'Grid', new: '--grid-columns', old: '--layout-columns', ref: '12' },
  { tier: 'semantics', group: 'Grid', new: '--grid-width-column', old: '--layout-width-column', ref: '45.33px', at: { '(min-width: 1024px)': '47.33px', '(min-width: 1440px)': '80.67px' } },
  { tier: 'semantics', group: 'Grid', new: '--grid-width-column-screen', old: '--layout-width-column-screen', ref: '45.33px', at: { '(min-width: 1024px)': '66.67px', '(min-width: 1440px)': '88px' } },
  { tier: 'semantics', group: 'Grid', new: '--grid-pad-left-container', old: '--layout-pad-left-container', ref: 'var(--space-050)', at: { '(min-width: 1024px)': 'var(--space-0)' } },

  // ─── Semantics / Screen (dissolved from spacing / layout) ────────────
  { tier: 'semantics', group: 'Screen', new: '--screen-width', old: '--layout-width-screen', ref: '768px', at: { '(min-width: 1024px)': '1024px', '(min-width: 1440px)': '1440px' } },
  { tier: 'semantics', group: 'Screen', new: '--screen-min-width', old: '--layout-min-width-screen', ref: '768px', at: { '(min-width: 1024px)': '1024px', '(min-width: 1440px)': '1440px' } },
  { tier: 'semantics', group: 'Screen', new: '--screen-max-width', old: '--layout-max-width-screen', ref: '1023px', at: { '(min-width: 1024px)': '1439px', '(min-width: 1440px)': 'none' } },
  { tier: 'semantics', group: 'Screen', new: '--screen-pad-x', old: '--layout-pad-x-screen', ref: 'var(--space-150)', at: { '(min-width: 1440px)': 'var(--space-200)' } },

  // ─── Semantics / Content (dissolved from spacing / layout) ───────────
  { tier: 'semantics', group: 'Content', new: '--content-max-width', old: '--layout-max-width-content', ref: 'var(--size-7700)' },
  { tier: 'semantics', group: 'Content', new: '--content-max-width-reading', old: '--layout-max-width-reading', ref: 'var(--size-5400)' },
  { tier: 'semantics', group: 'Content', new: '--content-min-width', old: '--layout-min-width-content', ref: 'var(--size-4500)' },
  { tier: 'semantics', group: 'Content', new: '--content-width', old: '--layout-width-content', ref: '720px', at: { '(min-width: 1024px)': '744px', '(min-width: 1440px)': '1144px' } },

  // ─── Semantics / Size (dimension roles; mostly reclassified, + Control) ─
  { tier: 'semantics', group: 'Size', new: '--icon-sm', old: '--icon-sm' },
  { tier: 'semantics', group: 'Size', new: '--icon-md', old: '--icon-md' },
  { tier: 'semantics', group: 'Size', new: '--icon-lg', old: '--icon-lg' },
  { tier: 'semantics', group: 'Size', new: '--image-xxs', old: '--image-xxs' },
  { tier: 'semantics', group: 'Size', new: '--image-xs', old: '--image-xs' },
  { tier: 'semantics', group: 'Size', new: '--image-sm', old: '--image-sm' },
  { tier: 'semantics', group: 'Size', new: '--image-md', old: '--image-md' },
  { tier: 'semantics', group: 'Size', new: '--image-lg', old: '--image-lg' },
  { tier: 'semantics', group: 'Size', new: '--image-xl', old: '--image-xl' },
  { tier: 'semantics', group: 'Size', new: '--item-height-sm', old: '--item-height-sm' },
  { tier: 'semantics', group: 'Size', new: '--item-height-md', old: '--item-height-md' },
  { tier: 'semantics', group: 'Size', new: '--label-height-sm', old: '--label-height-sm' },
  { tier: 'semantics', group: 'Size', new: '--label-height-md', old: '--label-height-md' },
  { tier: 'semantics', group: 'Size', new: '--label-max-width', old: '--label-max-width' },
  { tier: 'semantics', group: 'Size', new: '--row-height-sm', old: '--row-height-sm' },
  { tier: 'semantics', group: 'Size', new: '--row-height-md', old: '--row-height-md' },
  { tier: 'semantics', group: 'Size', new: '--row-height-lg', old: '--row-height-lg' },
  { tier: 'semantics', group: 'Size', new: '--field-width-xs', old: '--field-width-xs' },
  { tier: 'semantics', group: 'Size', new: '--field-width-sm', old: '--field-width-sm' },
  { tier: 'semantics', group: 'Size', new: '--field-width-md', old: '--field-width-md' },
  { tier: 'semantics', group: 'Size', new: '--field-width-lg', old: '--field-width-lg' },
  { tier: 'semantics', group: 'Size', new: '--field-width-xl', old: '--field-width-xl' },
  { tier: 'semantics', group: 'Size', new: '--field-min-height-sm', old: '--field-min-height-sm' },
  { tier: 'semantics', group: 'Size', new: '--field-min-height-lg', old: '--field-min-height-lg' },
  { tier: 'semantics', group: 'Size', new: '--control-sm', old: '--size-control-sm', ref: 'var(--size-150)', note: 'new role; Control was missing from the Icon/Image/Item/Label/Row/Field set' },
  { tier: 'semantics', group: 'Size', new: '--control-md', old: '--size-control-md', ref: 'var(--size-200)' },
  { tier: 'semantics', group: 'Size', new: '--control-lg', old: '--size-control-lg', ref: 'var(--size-250)' },

  // ─── Patterns / Frame (with Topbar and Sidebar) ──────────────────────
  { tier: 'patterns', group: 'Frame', new: '--frame-pad', old: '--frame-pad' },
  { tier: 'patterns', group: 'Frame', new: '--frame-stack', old: '--frame-stack' },
  { tier: 'patterns', group: 'Frame', new: '--frame-topbar-height', old: '--layout-height-topbar', ref: 'var(--height-200)' },
  { tier: 'patterns', group: 'Frame', new: '--frame-sidebar-width', old: '--layout-width-sidebar', ref: 'var(--width-1500)' },
  { tier: 'patterns', group: 'Frame', new: '--frame-sidebar-width-nav', old: '--layout-sidebar-width', ref: '164px', note: 'fixed SideNav width (164), distinct from the responsive sidebar above' },

  // ─── Patterns / Page ──────────────────────────────────────────────────
  { tier: 'patterns', group: 'Page', new: '--page-pad', old: '--page-pad' },
  { tier: 'patterns', group: 'Page', new: '--page-pad-x-compact', old: null, value: '--space-150' },
  { tier: 'patterns', group: 'Page', new: '--page-pad-x-default', old: null, value: '--space-200' },
  { tier: 'patterns', group: 'Page', new: '--page-pad-x-spacious', old: null, value: '--space-250' },
  { tier: 'patterns', group: 'Page', new: '--page-pad-y-compact', old: null, value: '--space-100' },
  { tier: 'patterns', group: 'Page', new: '--page-pad-y-default', old: null, value: '--space-150' },
  { tier: 'patterns', group: 'Page', new: '--page-pad-y-spacious', old: null, value: '--space-200' },
  { tier: 'patterns', group: 'Page', new: '--page-stack-sm', old: '--page-stack-sm' },
  { tier: 'patterns', group: 'Page', new: '--page-stack-md', old: '--page-stack-md' },
  { tier: 'patterns', group: 'Page', new: '--page-stack-lg', old: '--page-stack-lg' },
  { tier: 'patterns', group: 'Page', new: '--page-radius', old: '--page-radius' },

  // ─── Patterns / Section ───────────────────────────────────────────────
  { tier: 'patterns', group: 'Section', new: '--section-pad-x-compact', old: null, value: '--space-100' },
  { tier: 'patterns', group: 'Section', new: '--section-pad-x-default', old: null, value: '--space-150' },
  { tier: 'patterns', group: 'Section', new: '--section-pad-x-spacious', old: null, value: '--space-200' },
  { tier: 'patterns', group: 'Section', new: '--section-pad-y-compact', old: null, value: '--space-100' },
  { tier: 'patterns', group: 'Section', new: '--section-pad-y-default', old: null, value: '--space-150' },
  { tier: 'patterns', group: 'Section', new: '--section-pad-y-spacious', old: null, value: '--space-200' },
  { tier: 'patterns', group: 'Section', new: '--section-stack-sm', old: '--section-stack-sm' },
  { tier: 'patterns', group: 'Section', new: '--section-stack-md', old: '--section-stack-md' },
  { tier: 'patterns', group: 'Section', new: '--section-stack-lg', old: '--section-stack-lg' },
  { tier: 'patterns', group: 'Section', new: '--section-min-width-main', old: '--section-min-width-main' },
  { tier: 'patterns', group: 'Section', new: '--section-min-width-side', old: '--section-min-width-side' },

  // ─── Patterns / Card ──────────────────────────────────────────────────
  { tier: 'patterns', group: 'Card', new: '--card-pad-compact', old: null, value: '--space-100' },
  { tier: 'patterns', group: 'Card', new: '--card-pad-default', old: null, value: '--space-125' },
  { tier: 'patterns', group: 'Card', new: '--card-pad-spacious', old: null, value: '--space-150' },
  { tier: 'patterns', group: 'Card', new: '--card-stack-sm', old: '--card-stack-sm' },
  { tier: 'patterns', group: 'Card', new: '--card-stack-md', old: '--card-stack-md' },
  { tier: 'patterns', group: 'Card', new: '--card-stack-lg', old: '--card-stack-lg' },
  { tier: 'patterns', group: 'Card', new: '--card-inline-sm', old: '--card-inline-sm' },
  { tier: 'patterns', group: 'Card', new: '--card-inline-md', old: '--card-inline-md' },
  { tier: 'patterns', group: 'Card', new: '--card-inline-lg', old: '--card-inline-lg' },
  { tier: 'patterns', group: 'Card', new: '--card-min-width-sm', old: '--card-min-width-sm' },
  { tier: 'patterns', group: 'Card', new: '--card-min-width-md', old: '--card-min-width-md' },
  { tier: 'patterns', group: 'Card', new: '--card-min-width-lg', old: '--card-min-width-lg' },
  { tier: 'patterns', group: 'Card', new: '--card-radius', old: '--card-radius' },
  { tier: 'patterns', group: 'Card', new: '--card-radius-sm', old: '--card-radius-sm' },
  { tier: 'patterns', group: 'Card', new: '--card-max-height-sm', old: '--card-max-height-sm' },
  { tier: 'patterns', group: 'Card', new: '--card-max-height-md', old: '--card-max-height-md' },
  { tier: 'patterns', group: 'Card', new: '--card-max-height-lg', old: '--card-max-height-lg' },

  // ─── Patterns / Table ─────────────────────────────────────────────────
  { tier: 'patterns', group: 'Table', new: '--table-pad-x-cell', old: '--table-pad-x-cell' },
  { tier: 'patterns', group: 'Table', new: '--table-pad-y-cell', old: '--table-pad-y-cell' },
  { tier: 'patterns', group: 'Table', new: '--table-indent', old: '--table-indent' },
  { tier: 'patterns', group: 'Table', new: '--table-radius', old: '--table-radius' },
  { tier: 'patterns', group: 'Table', new: '--table-stack', old: '--table-stack' },
  { tier: 'patterns', group: 'Table', new: '--table-pad-x-footer', old: '--table-pad-x-footer' },
  { tier: 'patterns', group: 'Table', new: '--table-min-width-title', old: '--table-min-width-title' },

  // ─── Patterns / Blanket (renamed from Overlay) ───────────────────────
  { tier: 'patterns', group: 'Blanket', new: '--blanket-pad-x', old: '--overlay-pad-x', ref: 'var(--space-100)' },
  { tier: 'patterns', group: 'Blanket', new: '--blanket-pad-y', old: '--overlay-pad-y', ref: 'var(--space-400)', at: { '(max-height: 639.98px)': 'var(--space-150)' } },
  { tier: 'patterns', group: 'Blanket', new: '--blanket-fill', old: '--overlay-scrim', type: 'COLOR', ref: 'rgba(0, 0, 0, 0.38)', note: "the Blanket's own fill color; the old declaration's value, written directly so this file carries no old-language word" },
  { tier: 'patterns', group: 'Blanket', new: '--blanket-max-height-modal', old: '--layout-max-height-modal', ref: 'calc(100dvh - 2 * var(--blanket-pad-y))', codeOnly: true, note: 'a calc() of the pad above: code only, no Figma variable' },

  // ─── Patterns / Modal ─────────────────────────────────────────────────
  { tier: 'patterns', group: 'Modal', new: '--modal-pad', old: '--modal-pad' },
  { tier: 'patterns', group: 'Modal', new: '--modal-pad-x-compact', old: null, value: '--space-0625' },
  { tier: 'patterns', group: 'Modal', new: '--modal-pad-x-default', old: null, value: '--space-100' },
  { tier: 'patterns', group: 'Modal', new: '--modal-pad-x-spacious', old: null, value: '--space-125' },
  { tier: 'patterns', group: 'Modal', new: '--modal-pad-y-compact', old: null, value: '--space-050' },
  { tier: 'patterns', group: 'Modal', new: '--modal-pad-y-default', old: null, value: '--space-075' },
  { tier: 'patterns', group: 'Modal', new: '--modal-pad-y-spacious', old: null, value: '--space-100' },
  { tier: 'patterns', group: 'Modal', new: '--modal-stack-sm', old: '--modal-stack-sm' },
  { tier: 'patterns', group: 'Modal', new: '--modal-stack-md', old: '--modal-stack-md' },
  { tier: 'patterns', group: 'Modal', new: '--modal-stack-lg', old: '--modal-stack-lg' },
  { tier: 'patterns', group: 'Modal', new: '--modal-inline-sm', old: '--modal-inline-sm' },
  { tier: 'patterns', group: 'Modal', new: '--modal-inline-md', old: '--modal-inline-md' },
  { tier: 'patterns', group: 'Modal', new: '--modal-inline-lg', old: '--modal-inline-lg' },
  { tier: 'patterns', group: 'Modal', new: '--modal-radius', old: '--modal-radius' },
  { tier: 'patterns', group: 'Modal', new: '--modal-width-sm', old: '--layout-width-modal-sm', ref: '384px', at: { '(min-width: 1024px)': '512px', '(min-width: 1440px)': '640px' }, note: 'lifted out of spacing / layout, beside the pattern’s pad/stack tokens' },
  { tier: 'patterns', group: 'Modal', new: '--modal-width-md', old: '--layout-width-modal-md', ref: '507px', at: { '(min-width: 1024px)': '677px', '(min-width: 1440px)': '848px' } },
  { tier: 'patterns', group: 'Modal', new: '--modal-width-lg', old: '--layout-width-modal-lg', ref: '629px', at: { '(min-width: 1024px)': '843px', '(min-width: 1440px)': '1056px' } },

  // ─── Patterns / Popover ───────────────────────────────────────────────
  { tier: 'patterns', group: 'Popover', new: '--popover-pad', old: '--popover-pad' },
  { tier: 'patterns', group: 'Popover', new: '--popover-width-sm', old: '--popover-width-sm' },
  { tier: 'patterns', group: 'Popover', new: '--popover-width-md', old: '--popover-width-md' },
  { tier: 'patterns', group: 'Popover', new: '--popover-width-lg', old: '--popover-width-lg' },
  { tier: 'patterns', group: 'Popover', new: '--popover-width-flag', old: '--popover-width-flag' },
  { tier: 'patterns', group: 'Popover', new: '--popover-stack-flag', old: '--popover-stack-flag' },
  { tier: 'patterns', group: 'Popover', new: '--popover-radius', old: '--popover-radius' },
  { tier: 'patterns', group: 'Popover', new: '--popover-pad-menu', old: '--popover-pad-menu' },
  { tier: 'patterns', group: 'Popover', new: '--popover-min-width-menu', old: '--popover-min-width-menu' },
  { tier: 'patterns', group: 'Popover', new: '--popover-max-width-menu', old: '--popover-max-width-menu' },
  { tier: 'patterns', group: 'Popover', new: '--popover-max-height-menu', old: '--popover-max-height-menu' },
  { tier: 'patterns', group: 'Popover', new: '--popover-radius-menu-sm', old: '--popover-radius-menu-sm' },
  { tier: 'patterns', group: 'Popover', new: '--popover-radius-menu-md', old: '--popover-radius-menu-md' },
  { tier: 'patterns', group: 'Popover', new: '--popover-pad-y-tooltip', old: '--popover-pad-y-tooltip' },
  { tier: 'patterns', group: 'Popover', new: '--popover-max-width-tooltip', old: '--popover-max-width-tooltip' },
  { tier: 'patterns', group: 'Popover', new: '--popover-radius-tooltip', old: '--popover-radius-tooltip' },
  { tier: 'patterns', group: 'Popover', new: '--popover-gap-screen', old: '--popover-gap-screen' },
  { tier: 'patterns', group: 'Popover', new: '--popover-offset', old: '--popover-offset' },

  // ─── Patterns / Drawer ────────────────────────────────────────────────
  { tier: 'patterns', group: 'Drawer', new: '--drawer-pad', old: '--drawer-pad' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-stack-sm', old: '--drawer-stack-sm' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-stack-md', old: '--drawer-stack-md' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-stack-lg', old: '--drawer-stack-lg' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-inline-sm', old: '--drawer-inline-sm' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-inline-md', old: '--drawer-inline-md' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-inline-lg', old: '--drawer-inline-lg' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-width-sm', old: '--layout-width-drawer-sm', ref: 'var(--modal-width-sm)' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-width-md', old: '--layout-width-drawer-md', ref: 'var(--modal-width-md)' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-width-lg', old: '--layout-width-drawer-lg', ref: 'var(--modal-width-lg)' },

  // ─── Patterns / Focused page ──────────────────────────────────────────
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-pad-x', old: '--focused-page-pad-x' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-pad-y', old: '--focused-page-pad-y' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-stack-sm', old: '--focused-page-stack-sm' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-stack-md', old: '--focused-page-stack-md' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-stack-lg', old: '--focused-page-stack-lg' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-inline-sm', old: '--focused-page-inline-sm' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-inline-md', old: '--focused-page-inline-md' },

  // ─── Components / Button ──────────────────────────────────────────────
  { tier: 'components', group: 'Button', new: '--button-radius-default', old: '--element-radius-item-sm', ref: 'var(--radius-0375)', note: '32-high control, radius 6' },
  { tier: 'components', group: 'Button', new: '--button-radius-compact', old: '--element-radius-md', ref: 'var(--radius-025)', note: '24-high control, radius 4' },

  // ─── Components / Calendar ────────────────────────────────────────────
  { tier: 'components', group: 'Calendar', new: '--calendar-day-sm', old: '--layout-calendar-day-sm', ref: '28px' },
  { tier: 'components', group: 'Calendar', new: '--calendar-day-md', old: '--layout-calendar-day-md', ref: '36px' },
  { tier: 'components', group: 'Calendar', new: '--calendar-day-lg', old: '--layout-calendar-day-lg', ref: '44px' },
  { tier: 'components', group: 'Calendar', new: '--calendar-nav-size', old: '--layout-calendar-nav', ref: '32px' },

  // ─── Components / Checkbox, Radio ─────────────────────────────────────
  { tier: 'components', group: 'Checkbox', new: '--checkbox-control-size', old: '--layout-control-checkbox', ref: '18px' },
  { tier: 'components', group: 'Radio', new: '--radio-control-size', old: '--layout-control-radio', ref: '12px' },
  // The `size` prop's px values (Radio group, Choice grid, Range, Toggle) are rows too, so the
  // components read a named token and never a literal. Each name ends in the `size` step it serves.
  { tier: 'components', group: 'Radio', new: '--radio-control-size-10', old: null, ref: '10px', note: 'RadioGroup size 10' },
  { tier: 'components', group: 'Radio', new: '--radio-control-size-14', old: null, ref: '14px', note: 'RadioGroup size 14' },
  { tier: 'components', group: 'Choice grid', new: '--choice-grid-control-size-10', old: null, ref: '10px', note: 'ChoiceGrid size 12' },
  { tier: 'components', group: 'Choice grid', new: '--choice-grid-control-size-12', old: null, ref: '12px', note: 'ChoiceGrid size 14 and 16' },
  { tier: 'components', group: 'Range', new: '--range-dot-size-8', old: null, ref: '8px', note: 'Range size 8' },
  { tier: 'components', group: 'Range', new: '--range-dot-size-12', old: null, ref: '12px', note: 'Range size 12' },
  { tier: 'components', group: 'Range', new: '--range-dot-size-16', old: null, ref: '16px', note: 'Range size 16' },
  { tier: 'components', group: 'Range', new: '--range-dot-size-default', old: null, ref: '20px', note: 'Range with no size' },
  { tier: 'components', group: 'Range', new: '--range-track-height-4', old: null, ref: '4px', note: 'Range size 8, and the default' },
  { tier: 'components', group: 'Range', new: '--range-track-height-6', old: null, ref: '6px', note: 'Range size 12' },
  { tier: 'components', group: 'Range', new: '--range-track-height-8', old: null, ref: '8px', note: 'Range size 16' },
  { tier: 'components', group: 'Toggle', new: '--toggle-track-height-16', old: null, ref: '16px', note: 'Toggle size 16' },
  { tier: 'components', group: 'Toggle', new: '--toggle-track-height-20', old: null, ref: '20px', note: 'Toggle size 20' },
  { tier: 'components', group: 'Toggle', new: '--toggle-track-width-16', old: null, ref: '32px', note: 'Toggle size 16' },
  { tier: 'components', group: 'Toggle', new: '--toggle-track-width-20', old: null, ref: '40px', note: 'Toggle size 20' },
  { tier: 'components', group: 'Toggle', new: '--toggle-pad', old: null, ref: 'var(--space-0125)', note: 'both sizes' },

  // ─── Components / Listbox ─────────────────────────────────────────────
  { tier: 'components', group: 'Listbox', new: '--listbox-max-width', old: '--layout-max-width-listbox', ref: '320px' },
  { tier: 'components', group: 'Listbox', new: '--listbox-min-height', old: '--layout-min-height-listbox', ref: '140px' },
  { tier: 'components', group: 'Listbox', new: '--listbox-max-height', old: '--layout-max-height-listbox', ref: '300px' },

  // ─── Components / Join row, Option menu ───────────────────────────────
  { tier: 'components', group: 'Join row', new: '--join-row-width', old: '--layout-width-join-row', ref: '520px' },
  { tier: 'components', group: 'Option menu', new: '--option-menu-width', old: '--layout-width-option-menu', ref: '240px' },

  // ─── Components / Tile (reclassified, unchanged names) ───────────────
  { tier: 'components', group: 'Tile', new: '--tile-radius-sm', old: '--tile-radius-sm' },
  { tier: 'components', group: 'Tile', new: '--tile-radius-lg', old: '--tile-radius-lg' },

  // ─── Components / Spinner, Progress bar (Bill 2026-11-04: one component
  // each, so they move out of SIZE_ROLES in generate-all-tokens.js straight to
  // this tier, not through Semantics' size roles) ───────────────────────
  { tier: 'components', group: 'Spinner', new: '--spinner-size-sm', old: null, value: '--space-100', note: 'matches the old --size-spinner-sm (16px)' },
  { tier: 'components', group: 'Spinner', new: '--spinner-size-md', old: null, value: '--space-150', note: 'matches the old --size-spinner-md (24px)' },
  { tier: 'components', group: 'Spinner', new: '--spinner-size-lg', old: null, value: '--space-300', note: 'matches the old --size-spinner-lg (48px)' },
  { tier: 'components', group: 'Progress bar', new: '--progress-bar-height', old: null, value: '--space-050', note: 'matches the old --size-progressbar-height (8px)' },

  // ─── Layers (own non-spacing family, code only) ───────────────────────
  { tier: 'layers', group: 'Layer', new: '--layer-card', old: '--layout-z-index-card', ref: '100' },
  { tier: 'layers', group: 'Layer', new: '--layer-navigation', old: '--layout-z-index-navigation', ref: '200' },
  { tier: 'layers', group: 'Layer', new: '--layer-dialog', old: '--layout-z-index-dialog', ref: '300' },
  { tier: 'layers', group: 'Layer', new: '--layer-popup', old: '--layout-z-index-popup', ref: '400' },
  { tier: 'layers', group: 'Layer', new: '--layer-blanket', old: '--layout-z-index-scrim', ref: '500', note: "the Blanket's z-index; the old declaration's value, written directly so this file carries no old-language word" },
  { tier: 'layers', group: 'Layer', new: '--layer-modal', old: '--layout-z-index-modal', ref: '510' },
  { tier: 'layers', group: 'Layer', new: '--layer-flag', old: '--layout-z-index-flag', ref: '600' },
  { tier: 'layers', group: 'Layer', new: '--layer-spotlight', old: '--layout-z-index-spotlight', ref: '700' },
  { tier: 'layers', group: 'Layer', new: '--layer-tooltip', old: '--layout-z-index-tooltip', ref: '800' },
];

/**
 * Retired names with no ladder row of their own, and what each reads now.
 * Every replacement resolves to the same pixels the retired name did, so a
 * caller moving over changes a name, never a size.
 *  - `--size-element-*`: the old Figma element vocabulary, split by property
 *    onto the semantics Pad / Stack / Radius steps. Two of its values have no
 *    semantic step (a 4px vertical pad, a 10px gap) and read the primitive
 *    instead, and its 1.5px and 3px strokes read the stroke primitive.
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
  '--size-element-stroke-md': '--size-border-stroke-stroke-150',
  '--size-element-stroke-lg': '--stroke-2',
  '--size-element-stroke-xl': '--size-border-stroke-stroke-300',
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

/** Every retired name. The generators drop them and `check:old-size-tokens` holds their uses at zero. */
export const RETIRED_TOKENS = new Set(retiredRenames().keys());
