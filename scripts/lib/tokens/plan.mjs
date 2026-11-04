/**
 * The deep-foundations plan (ADR-038): container and element role tokens, and
 * motion, as one file this repo owns, the way `scripts/lib/color/plans/`
 * owns color (ADR-035). `scripts/generate-design-tokens.mjs` renders this
 * into SCSS and a Figma variables payload; nothing here reads Figma or the
 * network.
 *
 * NUMBERING. Every value here is a reference to the existing `--space-*` /
 * `--radius-*` primitive ladder in `design-system/src/tokens/_scales.scss`
 * (PLUS ×16 numbering: `--space-100` is 16px, per Bill 2026-11-03). This plan
 * does not re-declare that ladder — it is already generator-owned and already
 * on the right numbering — it only spends it on role names. Flipping the
 * primitive ladder's OWN generator onto this plan-based pipeline (today it
 * still reads Figma JSON exports in `scripts/generate-all-tokens.js`) is a
 * follow-up, left alone here because ~200 components already read it and nothing
 * about its values needs to change.
 *
 * DENSITY. Every role comes in `default` / `compact` / `spacious` for a
 * container, `default` / `compact` for an element — the `spacing` prop's own
 * words, not `sm`/`md`/`lg`. Values are picked to match what the three older
 * size vocabularies (`_spacing_semantics.scss`'s `--size-*`,
 * `_frame_layers.scss`'s bare `--card-*`/`--modal-*`/`--section-*`/`--surface-*`)
 * already resolve to wherever one of them is unambiguous, so adopting a role
 * token changes a token name, never a pixel. Where the three disagreed with
 * each other (gap and radius do), or named only one step where this plan
 * wants three (Page pad), the value here is this plan's own call, noted below.
 */

/** Container roles: `--{card|section|modal|page}-pad[-x|-y]-{default|compact|spacious}`. */
export const CONTAINER_PAD_ROLES = [
  {
    // Matches `--card-pad-sm/md/lg` in `_frame_layers.scss` exactly (16/20/24);
    // Card pads on one axis, so there is no `-x`/`-y` split.
    container: 'card',
    axis: null,
    steps: { compact: '--space-100', default: '--space-125', spacious: '--space-150' },
  },
  {
    // Matches `--size-section-pad-x-sm/md/lg` in `_spacing_semantics.scss`
    // (16/24/36), except `spacious`: 36px has no rung on the `--space-*`
    // ladder, so this plan rounds down to the next one, 32px. A family PR
    // that needs 36 exactly keeps its own `--plus-<name>-*` token for it.
    container: 'section',
    axis: 'x',
    steps: { compact: '--space-100', default: '--space-150', spacious: '--space-200' },
  },
  {
    container: 'section',
    axis: 'y',
    steps: { compact: '--space-100', default: '--space-150', spacious: '--space-200' },
  },
  {
    // Matches `--size-modal-pad-x-sm/md/lg` (10/16/20).
    container: 'modal',
    axis: 'x',
    steps: { compact: '--space-0625', default: '--space-100', spacious: '--space-125' },
  },
  {
    // Matches `--size-modal-pad-y-sm/md/lg` (8/12/16).
    container: 'modal',
    axis: 'y',
    steps: { compact: '--space-050', default: '--space-075', spacious: '--space-100' },
  },
  {
    // `--size-surface-pad-x` (32px) and `_frame_layers.scss`'s `--page-pad`
    // (16px, responsive to 24px at 1440px) each name one step, not three; Page
    // keeps the layout pad's default (32, the value every current Page reads)
    // and this plan adds compact/spacious around it as its own call.
    container: 'page',
    axis: 'x',
    steps: { compact: '--space-150', default: '--space-200', spacious: '--space-250' },
  },
  {
    // `--size-surface-pad-y` is 24px; same reasoning as pad-x.
    container: 'page',
    axis: 'y',
    steps: { compact: '--space-100', default: '--space-150', spacious: '--space-200' },
  },
];

/** Element roles: `--element-{pad|gap|radius}-{default|compact}`. */
export const ELEMENT_ROLES = [
  // Matches `--element-pad-x-sm/md` in `_scales.scss` exactly (8/12).
  { kind: 'pad', steps: { compact: '--space-050', default: '--space-075' } },
  // Matches `--element-stack-sm/md` / `--element-inline-sm/md` in `_scales.scss` (4/8).
  { kind: 'gap', steps: { compact: '--space-025', default: '--space-050' } },
  // This plan's own call: halves `--element-radius-lg` (8) for compact, where
  // `--element-radius-sm` in `_scales.scss` is already 2, not 4 — the two
  // legacy ladders disagree here, so this is a fresh number, not an alias.
  { kind: 'radius', steps: { compact: '--radius-0125', default: '--radius-025' } },
];

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
 * Old names this plan's role tokens make redundant, aliased for one cycle so
 * a caller that has not migrated keeps resolving. Each alias is **value-exact
 * by construction**: the role step it points at was picked (above) to equal
 * what the old name already resolves to, so flipping a component onto the new
 * name never has to wait for this file to change anything.
 *
 * ONLY THE UNAMBIGUOUS, NON-RESPONSIVE NAMES ARE HERE. Left out, deliberately:
 *  - `--page-pad` (`_frame_layers.scss`) steps at the 1440px breakpoint; an
 *    alias at `:root` would silently drop that step. It stays hand-authored.
 *  - gap and radius old names: `_spacing_semantics.scss` and `_frame_layers.scss`
 *    disagree with each other on what "sm" means for a gap or a radius, so
 *    there is no single old value a role token could alias without changing
 *    one of the two silently. These stay on the ratchet
 *    (`npm run check:old-size-tokens`) for a family PR to resolve by hand.
 *
 * A family PR's row deletes the OLD declaration (in `_spacing_semantics.scss`
 * or `_frame_layers.scss`) once its callers move to the role token; this list
 * then loses that line in the same PR, by hand, alongside it.
 *
 * The original six (`--size-element-pad-x-md/sm`, `--card-pad-md/sm/lg`,
 * `--modal-pad`) migrated their callers and lost both rows; the list is empty
 * until the next old name becomes unambiguous enough to alias.
 */
export const LEGACY_ALIASES = [];

/** The five old-name prefixes the "still on old size tokens" ratchet tracks. */
export const OLD_SIZE_PREFIXES = ['--size-element-', '--card-', '--section-', '--modal-', '--page-'];

/**
 * THE FOUR-TIER LADDER (#1756, Bill 2026-11-04: "clean up both token on figma
 * and in code and fully align the two"). One plan, one row per token, most
 * general tier to most specific: primitives -> semantics -> patterns ->
 * components. Figma collection on the left of each tier's row group, code
 * name on the right.
 *
 * Every row is additive in this PR: `old` names (where one exists) keep their
 * declaration untouched, unmigrated, and still resolve exactly as they do
 * today — a caller only reads a `new` name once a family PR moves it, same
 * cycle `LEGACY_ALIASES` above already uses for the first six role tokens.
 * `old: null` rows are the net-new tokens this ladder introduces (a step a
 * tier was missing, or a role nothing named yet); `value` on those is a
 * literal referencing the primitive ladder directly, never a raw number.
 *
 * A row with `old === new` is not a rename — it is a tier the token was
 * already correctly named for (the Size dimension roles, most of Patterns'
 * bare `Collection/property` names). It is still listed, so the name-map doc
 * is every token, not just the ones that moved, and excluded from SCSS/payload
 * generation below (aliasing a name to itself is a no-op).
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
  { tier: 'semantics', group: 'Pad', new: '--pad-x-xs', old: '--element-pad-x-xs' },
  { tier: 'semantics', group: 'Pad', new: '--pad-x-sm', old: '--element-pad-x-sm' },
  { tier: 'semantics', group: 'Pad', new: '--pad-x-md', old: '--element-pad-x-md' },
  { tier: 'semantics', group: 'Pad', new: '--pad-x-lg', old: null, value: '--space-100', note: 'new step; matches the old --size-element-pad-x-lg (16px)' },
  { tier: 'semantics', group: 'Pad', new: '--pad-y-sm', old: '--element-pad-y-sm' },
  { tier: 'semantics', group: 'Pad', new: '--pad-y-md', old: '--element-pad-y-md' },
  { tier: 'semantics', group: 'Pad', new: '--pad-y-lg', old: null, value: '--space-050', note: 'new step; matches the old --size-element-pad-y-lg (8px)' },

  // ─── Semantics / Stack ────────────────────────────────────────────────
  { tier: 'semantics', group: 'Stack', new: '--stack-sm', old: '--element-stack-sm' },
  { tier: 'semantics', group: 'Stack', new: '--stack-md', old: '--element-stack-md' },
  { tier: 'semantics', group: 'Stack', new: '--stack-lg', old: '--element-stack-lg' },

  // ─── Semantics / Inline ───────────────────────────────────────────────
  { tier: 'semantics', group: 'Inline', new: '--inline-sm', old: '--element-inline-sm' },
  { tier: 'semantics', group: 'Inline', new: '--inline-md', old: '--element-inline-md' },
  { tier: 'semantics', group: 'Inline', new: '--inline-lg', old: '--element-inline-lg' },

  // ─── Semantics / Radius (non-control, + control-by-height) ───────────
  { tier: 'semantics', group: 'Radius', new: '--radius-sm', old: '--element-radius-sm' },
  { tier: 'semantics', group: 'Radius', new: '--radius-md', old: '--element-radius-md' },
  { tier: 'semantics', group: 'Radius', new: '--radius-lg', old: '--element-radius-lg' },
  { tier: 'semantics', group: 'Radius', new: '--radius-full', old: '--element-radius-full' },
  { tier: 'semantics', group: 'Radius', new: '--radius-h24', old: '--element-radius-item-sm', note: 'control height 24; 24÷4 = 6' },
  { tier: 'semantics', group: 'Radius', new: '--radius-h32', old: '--element-radius-item-md', note: 'control height 32; 32÷4 = 8' },
  { tier: 'semantics', group: 'Radius', new: '--radius-h40', old: null, value: '--radius-0625', note: 'new step; control height 40; 40÷4 = 10' },

  // ─── Semantics / Border (reclassified, unchanged names) ──────────────
  { tier: 'semantics', group: 'Border', new: '--border-default', old: '--border-default' },
  { tier: 'semantics', group: 'Border', new: '--border-selected', old: '--border-selected' },
  { tier: 'semantics', group: 'Border', new: '--border-focused', old: '--border-focused' },

  // ─── Semantics / Focus (net new) ──────────────────────────────────────
  { tier: 'semantics', group: 'Focus', new: '--focus-ring-width', old: '--size-element-stroke-lg', ref: 'var(--size-border-stroke-stroke-200)', note: 'matches the outline width already repeated across Tag, DateTag, Suggestion, NavTabs; reads the stroke primitive --size-element-stroke-lg itself resolves to, so this stays off the old-size-token ratchet' },
  { tier: 'semantics', group: 'Focus', new: '--focus-ring-offset', old: '--size-element-stroke-lg', ref: 'var(--size-border-stroke-stroke-200)', note: 'defined for a caller whose ring offset genuinely needs to move independently of its width; every current caller reads --focus-ring-width for both (outline and outline-offset are the same value everywhere today, including the plus-state mixin, which takes one shared $ring-offset param)' },
  { tier: 'semantics', group: 'Focus', new: '--focus-ring-radius', old: null, value: '--radius-sm', note: 'first pass, no existing source; a family PR refines it' },

  // ─── Semantics / Grid (dissolved from spacing / layout) ──────────────
  { tier: 'semantics', group: 'Grid', new: '--grid-gutter', old: '--layout-gutter' },
  { tier: 'semantics', group: 'Grid', new: '--grid-columns', old: '--layout-columns' },
  { tier: 'semantics', group: 'Grid', new: '--grid-width-column', old: '--layout-width-column' },
  { tier: 'semantics', group: 'Grid', new: '--grid-width-column-screen', old: '--layout-width-column-screen' },
  { tier: 'semantics', group: 'Grid', new: '--grid-pad-left-container', old: '--layout-pad-left-container' },

  // ─── Semantics / Screen (dissolved from spacing / layout) ────────────
  { tier: 'semantics', group: 'Screen', new: '--screen-width', old: '--layout-width-screen' },
  { tier: 'semantics', group: 'Screen', new: '--screen-min-width', old: '--layout-min-width-screen' },
  { tier: 'semantics', group: 'Screen', new: '--screen-max-width', old: '--layout-max-width-screen' },
  { tier: 'semantics', group: 'Screen', new: '--screen-pad-x', old: '--layout-pad-x-screen' },

  // ─── Semantics / Content (dissolved from spacing / layout) ───────────
  { tier: 'semantics', group: 'Content', new: '--content-max-width', old: '--layout-max-width-content' },
  { tier: 'semantics', group: 'Content', new: '--content-max-width-reading', old: '--layout-max-width-reading' },
  { tier: 'semantics', group: 'Content', new: '--content-min-width', old: '--layout-min-width-content' },
  { tier: 'semantics', group: 'Content', new: '--content-width', old: '--layout-width-content' },

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
  { tier: 'semantics', group: 'Size', new: '--control-sm', old: '--size-control-sm', note: 'new role; Control was missing from the Icon/Image/Item/Label/Row/Field set' },
  { tier: 'semantics', group: 'Size', new: '--control-md', old: '--size-control-md' },
  { tier: 'semantics', group: 'Size', new: '--control-lg', old: '--size-control-lg' },

  // ─── Patterns / Frame (with Topbar and Sidebar) ──────────────────────
  { tier: 'patterns', group: 'Frame', new: '--frame-pad', old: '--frame-pad' },
  { tier: 'patterns', group: 'Frame', new: '--frame-stack', old: '--frame-stack' },
  { tier: 'patterns', group: 'Frame', new: '--frame-topbar-height', old: '--layout-height-topbar' },
  { tier: 'patterns', group: 'Frame', new: '--frame-sidebar-width', old: '--layout-width-sidebar' },
  { tier: 'patterns', group: 'Frame', new: '--frame-sidebar-width-nav', old: '--layout-sidebar-width', note: 'fixed SideNav width (164), distinct from the responsive sidebar above' },

  // ─── Patterns / Page ──────────────────────────────────────────────────
  { tier: 'patterns', group: 'Page', new: '--page-pad', old: '--page-pad' },
  { tier: 'patterns', group: 'Page', new: '--page-stack-sm', old: '--page-stack-sm' },
  { tier: 'patterns', group: 'Page', new: '--page-stack-md', old: '--page-stack-md' },
  { tier: 'patterns', group: 'Page', new: '--page-stack-lg', old: '--page-stack-lg' },
  { tier: 'patterns', group: 'Page', new: '--page-radius', old: '--page-radius' },

  // ─── Patterns / Section ───────────────────────────────────────────────
  { tier: 'patterns', group: 'Section', new: '--section-stack-sm', old: '--section-stack-sm' },
  { tier: 'patterns', group: 'Section', new: '--section-stack-md', old: '--section-stack-md' },
  { tier: 'patterns', group: 'Section', new: '--section-stack-lg', old: '--section-stack-lg' },
  { tier: 'patterns', group: 'Section', new: '--section-min-width-main', old: '--section-min-width-main' },
  { tier: 'patterns', group: 'Section', new: '--section-min-width-side', old: '--section-min-width-side' },

  // ─── Patterns / Card ──────────────────────────────────────────────────
  { tier: 'patterns', group: 'Card', new: '--card-pad-sm', old: '--card-pad-sm' },
  { tier: 'patterns', group: 'Card', new: '--card-pad-md', old: '--card-pad-md' },
  { tier: 'patterns', group: 'Card', new: '--card-pad-lg', old: '--card-pad-lg' },
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
  { tier: 'patterns', group: 'Blanket', new: '--blanket-pad-x', old: '--overlay-pad-x' },
  { tier: 'patterns', group: 'Blanket', new: '--blanket-pad-y', old: '--overlay-pad-y' },
  { tier: 'patterns', group: 'Blanket', new: '--blanket-fill', old: '--overlay-scrim', ref: 'rgba(0, 0, 0, 0.38)', note: "the Blanket's own fill color; the old declaration's value, written directly so this file carries no old-language word" },
  { tier: 'patterns', group: 'Blanket', new: '--blanket-max-height-modal', old: '--layout-max-height-modal' },

  // ─── Patterns / Modal ─────────────────────────────────────────────────
  { tier: 'patterns', group: 'Modal', new: '--modal-pad', old: '--modal-pad' },
  { tier: 'patterns', group: 'Modal', new: '--modal-stack-sm', old: '--modal-stack-sm' },
  { tier: 'patterns', group: 'Modal', new: '--modal-stack-md', old: '--modal-stack-md' },
  { tier: 'patterns', group: 'Modal', new: '--modal-stack-lg', old: '--modal-stack-lg' },
  { tier: 'patterns', group: 'Modal', new: '--modal-inline-sm', old: '--modal-inline-sm' },
  { tier: 'patterns', group: 'Modal', new: '--modal-inline-md', old: '--modal-inline-md' },
  { tier: 'patterns', group: 'Modal', new: '--modal-inline-lg', old: '--modal-inline-lg' },
  { tier: 'patterns', group: 'Modal', new: '--modal-radius', old: '--modal-radius' },
  { tier: 'patterns', group: 'Modal', new: '--modal-width-sm', old: '--layout-width-modal-sm', note: 'lifted out of spacing / layout, beside the pattern’s pad/stack tokens' },
  { tier: 'patterns', group: 'Modal', new: '--modal-width-md', old: '--layout-width-modal-md' },
  { tier: 'patterns', group: 'Modal', new: '--modal-width-lg', old: '--layout-width-modal-lg' },

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
  { tier: 'patterns', group: 'Drawer', new: '--drawer-width-sm', old: '--layout-width-drawer-sm' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-width-md', old: '--layout-width-drawer-md' },
  { tier: 'patterns', group: 'Drawer', new: '--drawer-width-lg', old: '--layout-width-drawer-lg' },

  // ─── Patterns / Focused page ──────────────────────────────────────────
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-pad-x', old: '--focused-page-pad-x' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-pad-y', old: '--focused-page-pad-y' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-stack-sm', old: '--focused-page-stack-sm' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-stack-md', old: '--focused-page-stack-md' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-stack-lg', old: '--focused-page-stack-lg' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-inline-sm', old: '--focused-page-inline-sm' },
  { tier: 'patterns', group: 'Focused page', new: '--focused-page-inline-md', old: '--focused-page-inline-md' },

  // ─── Components / Button ──────────────────────────────────────────────
  { tier: 'components', group: 'Button', new: '--button-radius-default', old: '--element-radius-item-sm', note: '32-high control, radius 6' },
  { tier: 'components', group: 'Button', new: '--button-radius-compact', old: '--element-radius-md', note: '24-high control, radius 4' },

  // ─── Components / Calendar ────────────────────────────────────────────
  { tier: 'components', group: 'Calendar', new: '--calendar-day-sm', old: '--layout-calendar-day-sm' },
  { tier: 'components', group: 'Calendar', new: '--calendar-day-md', old: '--layout-calendar-day-md' },
  { tier: 'components', group: 'Calendar', new: '--calendar-day-lg', old: '--layout-calendar-day-lg' },
  { tier: 'components', group: 'Calendar', new: '--calendar-nav-size', old: '--layout-calendar-nav' },

  // ─── Components / Checkbox, Radio ─────────────────────────────────────
  { tier: 'components', group: 'Checkbox', new: '--checkbox-control-size', old: '--layout-control-checkbox' },
  { tier: 'components', group: 'Radio', new: '--radio-control-size', old: '--layout-control-radio' },

  // ─── Components / Listbox ─────────────────────────────────────────────
  { tier: 'components', group: 'Listbox', new: '--listbox-max-width', old: '--layout-max-width-listbox' },
  { tier: 'components', group: 'Listbox', new: '--listbox-min-height', old: '--layout-min-height-listbox' },
  { tier: 'components', group: 'Listbox', new: '--listbox-max-height', old: '--layout-max-height-listbox' },

  // ─── Components / Join row, Option menu ───────────────────────────────
  { tier: 'components', group: 'Join row', new: '--join-row-width', old: '--layout-width-join-row' },
  { tier: 'components', group: 'Option menu', new: '--option-menu-width', old: '--layout-width-option-menu' },

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
  { tier: 'layers', group: 'Layer', new: '--layer-card', old: '--layout-z-index-card' },
  { tier: 'layers', group: 'Layer', new: '--layer-navigation', old: '--layout-z-index-navigation' },
  { tier: 'layers', group: 'Layer', new: '--layer-dialog', old: '--layout-z-index-dialog' },
  { tier: 'layers', group: 'Layer', new: '--layer-popup', old: '--layout-z-index-popup' },
  { tier: 'layers', group: 'Layer', new: '--layer-blanket', old: '--layout-z-index-scrim', ref: '500', note: "the Blanket's z-index; the old declaration's value, written directly so this file carries no old-language word" },
  { tier: 'layers', group: 'Layer', new: '--layer-modal', old: '--layout-z-index-modal' },
  { tier: 'layers', group: 'Layer', new: '--layer-flag', old: '--layout-z-index-flag' },
  { tier: 'layers', group: 'Layer', new: '--layer-spotlight', old: '--layout-z-index-spotlight' },
  { tier: 'layers', group: 'Layer', new: '--layer-tooltip', old: '--layout-z-index-tooltip' },
];
