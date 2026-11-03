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
    // `--size-surface-pad-x` (32px) and `_frame_layers.scss`'s `--surface-pad`
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
 *  - `--surface-pad` (`_frame_layers.scss`) steps at the 1440px breakpoint; an
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
 */
export const LEGACY_ALIASES = [
  { old: '--size-element-pad-x-md', role: '--element-pad-default' },
  { old: '--size-element-pad-x-sm', role: '--element-pad-compact' },
  { old: '--card-pad-md', role: '--card-pad-default' },
  { old: '--card-pad-sm', role: '--card-pad-compact' },
  { old: '--card-pad-lg', role: '--card-pad-spacious' },
  { old: '--modal-pad', role: '--modal-pad-x-default' },
];

/** The five old-name prefixes the "still on old size tokens" ratchet tracks. */
export const OLD_SIZE_PREFIXES = ['--size-element-', '--card-', '--section-', '--modal-', '--surface-'];
