/**
 * The tokens module's node-side half: where tokens live, what the families
 * are, and whether two values are the same value (#620).
 *
 * `tokens.mjs` beside this file owns the token GRAMMAR and the WCAG maths, and
 * owns them for the BROWSER: it imports nothing Node-only, so a Storybook
 * story and `node --test` load the same contrast formula. Its header has named
 * this file since #506 and said what belongs in it — "anything that needs the
 * filesystem" — and for two releases the file did not exist, so every check
 * answered the three questions below privately: seventeen hardcoded the token
 * directory, the family map was restated beside them, and `scripts/` carried
 * two color keys and two dimension normalizers that agreed neither with each
 * other nor with `parseColor`. #621 moved the checks and the generators on to
 * this file; #622 retired the docs check's remaining color key, alias
 * resolver and declaration regex, and replaced the registry generator's
 * `var()` — the loosest in the tree.
 *
 * ─── THE THREE QUESTIONS ────────────────────────────────────────────────────
 *
 *   THE CORPUS    `tokenSources` / `tokenCorpus` — the token stylesheets and
 *                 the table they define, read once, aliases followed. Moving
 *                 `design-system/src/tokens` becomes one edit here.
 *   THE FAMILIES  `FAMILIES` / `familyOf` — which family a token NAME is in.
 *   EQUALITY      `colorKey` / `dimensionKey` / `valueKey` / `sameValue` —
 *                 whether two VALUES are the same value.
 *
 * ─── IT READS THROUGH THE CORPUS, AND THAT IS THE POINT ─────────────────────
 *
 * There is no `fs` import in this file and no repo root of its own. The
 * listing is `documents()` and the read is `text()`, both from
 * `scripts/lib/corpus.mjs` — the harness's ONE reader of repo files — and the
 * root defaults to the one that module exports.
 *
 * A first implementation of this file was reviewed and held for doing the
 * opposite: it walked the token directory with its own `fs.readdirSync` and
 * resolved its own `REPO_ROOT` from `import.meta.url`. That is the defect this
 * module exists to remove, committed by the module removing it. A module whose
 * headline is "the corpus is resolved once" cannot ship a second way to
 * resolve it, and the second root is the expensive half: a listing rooted at
 * one tree and a read rooted at another disagree silently, and only under a
 * fixture.
 *
 * So every function takes a `root` and never consults `process.cwd()`, the
 * rule `corpus.mjs` states for itself (#469) and for the same reason — a
 * checker that takes a root can be tested against a fixture tree.
 *
 * ─── WHY A FAMILY IS A NAME QUESTION AND A KIND IS A VALUE QUESTION ─────────
 *
 * `familyOf` classifies by prefix and stops there; nothing here says a family
 * "is" a color or "is" a dimension, because two of them are not. `--ds-*`
 * holds `--ds-text` (a color), `--ds-shadow-raised` (an elevation) and
 * `--ds-opacity-disabled` (a number), and `--type-*` holds a whole `font` shorthand. A kind table keyed
 * on the family would be wrong for those the day it was written.
 *
 * AND A NAME SUFFIX IS NOT A DERIVATION. `familyOf` reads a prefix, and the
 * families below say nothing about how one token's value relates to another's —
 * deliberately, because within the color family the names promise a
 * relationship the values do not always keep. A role's state-overlay token
 * reads as that role at 8, 12 or 16%. Today 114 of the 117 overlays are exactly
 * that, but until 2026-09-29 thirty were washes of a different color than
 * their name pointed at, because the solids were re-picked in Figma and the
 * washes never followed. The one remaining exception, shadow, is pinned in
 * `tokens-node.test.js`, and `colorKey` keeps alpha partly so a comparison
 * across that pairing cannot report an agreement nobody wrote.
 *
 * So the kind of a value is read off the VALUE — which is also the lesson
 * `check:size-fallbacks` records for itself: it selects dimension tokens by
 * what they resolve to rather than by a prefix list, "so a new family is
 * covered the day it is minted". `valueKey` is that rule, once.
 *
 * ─── THE COLOR KEY IS WIDER THAN `parseColor` AND FINER THAN THE NORMALIZER
 *
 * WIDER. `parseColor` in the browser half reads `#rgb`, `#rrggbb`, `rgb()`
 * and `rgba()`, and null for anything else — right for it, since what it feeds
 * is WCAG maths that needs channels. But `check:docs-token-literals` scans
 * stylesheets that contain `#abcd`, `#aabbccdd` and `hsl()`, and a module that
 * answered null for those is a module that check cannot call. That is exactly
 * why it kept its own key until #622. This one reads every form either rival
 * reads, and canonicalises rather than spelling: `hsl(0, 100%, 50%)`,
 * `rgb(100%, 0%, 0%)`, `#f00` and `#FF0000` all key as `#ff0000`, where the
 * docs check's retired key is syntactic and called the first two of those
 * different colors.
 *
 * FINER, AND THE NUMBER IS MEASURED. Alpha is part of this key and was not
 * part of `normalizeColor`, the normalizer `scripts/token-fallbacks.mjs`
 * carried until #621 moved the fallback checks here: `parseColor` followed by
 * `toHex`, and `toHex` drops alpha. Over the live token corpus that is not a
 * rounding difference: 315 pairs of color tokens are EQUAL under the old
 * normalizer and UNEQUAL under this key — every one of them a translucent
 * state overlay keyed against a solid of the same channels, such
 * as an 8% overlay (`rgba(68, 92, 106, 0.08)`) against the solid
 * `#445c6a`.
 *
 * A caller migrating on to this key therefore has to MEASURE its own output
 * rather than assume it — which #621 did for both fallback checks, and their
 * reports came out byte-identical. What makes that true today is narrower than
 * the key and is pinned in `tokens-node.test.js` rather than asserted as an
 * invariant: no comparison either check makes pairs an opaque hex against a
 * translucent token, because `fallbackUsages` captures a fallback with
 * `[^),]+` and then demands the `var()`'s closing `)`, so the 25 sites writing
 * `var(--x, rgba(…))` are not matched AT ALL and never reach a
 * comparison in any form. That is a fact about the capture, not a property of
 * the key — the day a check reads a whole `rgba()` fallback, 315 pairs' worth
 * of behavior changes, and the test says so where an "output unchanged"
 * assertion would have hidden it.
 *
 * ALPHA IS PART OF THE KEY, then, deliberately: `rgba(0,0,0,.5)` keys as
 * `#00000080`, because a state overlay compared against a solid by a key that
 * forgot alpha reports agreement with something nobody wrote.
 *
 * OUT OF RANGE IS NOT A COLOR. `rgb(300, 0, 0)` keys as null rather than
 * clamping to red, which is `parseColor`'s rule and for its reason: a typo
 * that clamped would report agreement with something nobody wrote.
 *
 * NAMED COLORS ARE NOT READ. `white` and `transparent` key as null. Neither
 * rival reads them either — both scan for `#`, `rgb` or `hsl` — and the 148 CSS
 * color names are a table this module would have to carry and keep.
 */

import { REPO_ROOT, documents, text } from '../../../scripts/lib/corpus.mjs';

import { resolveToken, tokenDeclarationPattern } from './tokens.mjs';

/**
 * Where tokens live, as one repo-relative posix string. This is the constant
 * the seventeen hardcoded copies collapse into.
 */
export const TOKEN_DIR = 'design-system/src/tokens';

/**
 * Where the generated color tokens live (ADR-035): the `--palette-*` ramps, the
 * `--ds-*` semantic and elevation tokens in four modes and the Figma spec, all
 * written by `npm run generate:color-tokens`.
 */
export const COLOR_TOKEN_DIR = `${TOKEN_DIR}/color`;

/** The stylesheets in `COLOR_TOKEN_DIR` that define tokens. */
export const COLOR_PALETTE_FILE = '_palette.scss';
export const COLOR_SEMANTIC_FILE = '_semantic.scss';
export const COLOR_ELEVATION_FILE = '_elevation.scss';
export const COLOR_TOKEN_FILES = [COLOR_PALETTE_FILE, COLOR_SEMANTIC_FILE, COLOR_ELEVATION_FILE];

/** The same files, repo-relative, for a check that reads them by path. */
export const COLOR_TOKEN_PATHS = COLOR_TOKEN_FILES.map((file) => `${COLOR_TOKEN_DIR}/${file}`);

/**
 * The color prefixes a check reads: the `--ds-*` tokens. A check that reads
 * color names reads this list rather than spelling the prefix itself.
 */
export const COLOR_PREFIXES = ['--ds-'];

/**
 * What a color VALUE can resolve through: the `--ds-*` tokens and the ramps they
 * alias. A check resolving `--ds-text` has to be able to follow
 * it to `--palette-neutral-1000`, and a component never names the ramps.
 */
export const COLOR_VALUE_PREFIXES = [...COLOR_PREFIXES, '--palette-'];

/**
 * Files that carry primitives, which a component never names; callers rank on
 * it. The scales are the size primitives and the palette is the color
 * equivalent.
 */
const PRIMITIVE_FILES = new Set(['_scales.scss', `color/${COLOR_PALETTE_FILE}`]);

/**
 * The token stylesheets, sorted by name and read whole.
 *
 * Sorted because two callers care: a "first definition wins" corpus and a
 * "last definition wins" one both depend on the order, and a directory listing
 * is not ordered on every filesystem. `documents` sorts, and this file relies
 * on that rather than re-sorting.
 *
 * FLAT, and the glob is what makes it flat: `tokens/*` matches one segment, so
 * `tokens/source/` — the Figma exports the SCSS is GENERATED from — is not
 * read, and reading both would count every token twice. The one directory
 * read below it is `tokens/color/`, by name and only its `COLOR_TOKEN_FILES`:
 * the generated color tokens live there because a generator owns the whole
 * directory, and a token the corpus cannot see is a token no check can.
 * They come after the flat sheets, so `file` reads `color/_semantic.scss`.
 *
 * FORGIVING, not `strict`. A token directory that is not there comes back
 * empty rather than throwing: every check over this corpus already has a floor
 * that says "no token files" in its own words, and a throw from here would
 * take the check's report with it. Strict is for a walk whose number is the
 * finding; here the number is the caller's.
 *
 * @param {{root?: string}} [options]
 * @returns {{path: string, file: string, text: string}[]} `path` root-relative
 */
export function tokenSources({ root = REPO_ROOT } = {}) {
  const color = documents(`${COLOR_TOKEN_DIR}/*`, { root, ext: ['.scss', '.css'] }).filter((rel) =>
    COLOR_TOKEN_FILES.includes(rel.slice(COLOR_TOKEN_DIR.length + 1)),
  );
  // The token ladder (`tokens/ladder/`, generated from scripts/lib/tokens/plan.mjs) holds the semantics,
  // pattern, component and layer tokens beside the Figma-exported ones.
  const ladder = documents(`${TOKEN_DIR}/ladder/*`, { root, ext: ['.scss', '.css'] });
  return [...documents(`${TOKEN_DIR}/*`, { root, ext: ['.scss', '.css'] }), ...color, ...ladder].map((rel) => ({
    path: rel,
    file: rel.slice(TOKEN_DIR.length + 1),
    text: text(rel, { root }),
  }));
}

/**
 * The whole token table: every declaration in the token sources, with its
 * alias chain followed to the literal at the end of it.
 *
 * @typedef {object} TokenEntry
 * @property {string} raw      what the stylesheet literally says
 * @property {string} value    the literal at the end of the alias chain, or
 *                             `raw` when there is no literal (a cycle, or a
 *                             `var()` for a token nothing defines)
 * @property {boolean} resolved whether `value` is a literal or just `raw` again
 * @property {string} file     the stylesheet it was defined in
 * @property {boolean} primitive whether that file holds primitives (`PRIMITIVE_FILES`)
 * @property {string|null} family
 *
 * PRECEDENCE IS THE CALLER'S, because the two answers in the tree are both
 * right about their own question. `first` is `readTokens`' rule and means the
 * `:root` light value — the first block in `color/_semantic.scss`. `last` is how the
 * cascade actually resolves and is what the fallback checks compare against.
 * Measured over this repo's token sources the two agree; they would stop
 * agreeing the day a token is redefined, and that is the day a caller wants to
 * have said which it meant.
 *
 * @param {object} [options]
 * @param {string} [options.root]
 * @param {string|string[]} [options.prefix] e.g. `--ds-`, or a list such
 *        as `COLOR_PREFIXES`; defaults to every token
 * @param {'first'|'last'} [options.precedence]
 * @returns {Map<string, TokenEntry>}
 */
export function tokenCorpus({ root = REPO_ROOT, prefix = '--', precedence = 'first' } = {}) {
  if (precedence !== 'first' && precedence !== 'last') {
    throw new TypeError(
      `tokenCorpus: precedence is 'first' or 'last', not ${JSON.stringify(precedence)}`,
    );
  }

  // The WHOLE table is read whatever the prefix, because an alias chain leaves
  // the family: `--card-stack-md` is `var(--space-050)`, and a caller
  // asking only for `--card-*` still wants the 8px at the end of it. The narrowing happens after the walk.
  const raw = new Map();
  const files = new Map();
  for (const source of tokenSources({ root })) {
    for (const [, name, value] of source.text.matchAll(tokenDeclarationPattern('--'))) {
      if (precedence === 'first' && raw.has(name)) continue;
      raw.set(name, value.trim());
      files.set(name, source.file);
    }
  }

  const prefixes = Array.isArray(prefix) ? prefix : [prefix];
  const corpus = new Map();
  for (const [name, value] of raw) {
    if (!prefixes.some((p) => name.startsWith(p))) continue;
    const literal = resolveToken(name, raw);
    corpus.set(name, {
      raw: value,
      value: literal ?? value,
      resolved: literal !== undefined,
      file: files.get(name),
      primitive: PRIMITIVE_FILES.has(files.get(name)),
      family: familyOf(name),
    });
  }
  return corpus;
}

/* ─── THE FAMILY MAP ───────────────────────────────────────────────────────── */

/**
 * Every family this design system mints, by name prefix.
 *
 * The order here is not the matching order — `familyOf` takes the LONGEST
 * prefix, so `--font-size-100` cannot be read as `--font-` — but it is the order
 * a reader wants: color, then type, then space, then the app shell.
 *
 * A family absent from this list is a token name nothing in the harness can
 * classify, which `tokens-node.test.js` asserts is the empty set over the live
 * corpus. Minting a family means adding a row.
 */
export const FAMILIES = [
  {
    family: 'ds',
    prefix: '--ds-',
    what: 'the color, elevation and opacity tokens, generated per mode (ADR-035)',
  },
  { family: 'palette', prefix: '--palette-', what: 'the color ramps the `--ds-` tokens alias; never named by a component' },
  { family: 'page', prefix: '--page-', what: 'the Page: its pad, stack, radius and border width' },
  { family: 'panel', prefix: '--panel-', what: 'the Panel: its minimum, default and maximum width' },
  { family: 'frame', prefix: '--frame-', what: 'the Frame: the topbar height and the sidebar widths' },
  { family: 'font-size', prefix: '--font-size-', what: 'the font size primitives, by rem × 100' },
  { family: 'line-height', prefix: '--line-height-', what: 'line height primitives, by rem × 100' },
  { family: 'heading', prefix: '--heading-', what: 'a heading text style: the `font` shorthand' },
  { family: 'body', prefix: '--body-', what: 'a body text style: the `font` shorthand' },
  { family: 'metric', prefix: '--metric-', what: 'a metric text style: the `font` shorthand' },
  { family: 'code', prefix: '--code', what: 'the code text style, relative to the text around it' },
  {
    family: 'type',
    prefix: '--type-',
    what: 'the typography family, weight and tracking variables',
  },
  { family: 'size', prefix: '--size-', what: 'the size primitives (`--size-200`)' },
  { family: 'space', prefix: '--space-', what: 'the space primitives, named by rem × 100' },
  { family: 'radius', prefix: '--radius-', what: 'the radius primitives' },
  { family: 'stroke', prefix: '--stroke-', what: 'the stroke-width primitives' },
  { family: 'pad-x', prefix: '--pad-x-', what: 'the horizontal pad inside an element, xs to lg' },
  { family: 'pad-y', prefix: '--pad-y-', what: 'the vertical pad inside an element, sm to lg' },
  { family: 'stack', prefix: '--stack-', what: 'the gap between rows, sm to lg' },
  { family: 'inline', prefix: '--inline-', what: 'the gap between things side by side, sm to lg' },
  { family: 'focus-ring', prefix: '--focus-ring-', what: 'the focus ring width, offset and radius' },
  { family: 'grid', prefix: '--grid-', what: 'the content grid: gutter, columns, column widths' },
  { family: 'screen', prefix: '--screen-', what: 'the screen at a breakpoint: width, range and side pad' },
  { family: 'content', prefix: '--content-', what: 'the content column: width, minimum, maximum and reading width' },
  { family: 'control', prefix: '--control-', what: 'control heights, 24, 32 and 40' },
  { family: 'height', prefix: '--height-', what: 'the common height scale' },
  { family: 'width', prefix: '--width-', what: 'the common width scale' },
  { family: 'item', prefix: '--item-', what: 'control heights, 24 and 32' },
  { family: 'row', prefix: '--row-height-', what: 'table and list row heights (not `--row-`, which a component-local `--row-index` uses)' },
  { family: 'label', prefix: '--label-', what: 'Tag, Status and Count sizes' },
  { family: 'field', prefix: '--field-', what: 'field widths and multi-line minimums' },
  { family: 'icon', prefix: '--icon-', what: 'drawn icon sizes' },
  { family: 'image', prefix: '--image-', what: 'avatar and tile sizes' },
  { family: 'border', prefix: '--border-', what: 'stroke widths by state' },
  { family: 'elevation', prefix: '--elevation-', what: 'the shadow ladder' },
  { family: 'layout', prefix: '--layout-', what: 'app-shell measurements' },
  { family: 'section', prefix: '--section-', what: 'a span of the page grid: its stacks and column minimums' },
  { family: 'card', prefix: '--card-', what: 'card pad, stack, inline, minimum width and radius' },
  { family: 'table', prefix: '--table-', what: 'table cell pad and maximum width, footer pad-x, tree indent, minimum title width, radius and overflow shadow reach' },
  { family: 'blanket', prefix: '--blanket-', what: 'the full-screen layer under a modal: its pad, fill and height limit' },
  { family: 'button', prefix: '--button-', what: 'Button radius, where a size has no shared radius role, and the vertical button size' },
  { family: 'calendar', prefix: '--calendar-', what: 'calendar day and navigation button sizes' },
  { family: 'checkbox', prefix: '--checkbox-', what: 'the checkbox box size' },
  { family: 'radio', prefix: '--radio-', what: 'the radio dot size, and the RadioGroup size steps' },
  { family: 'choice-tile', prefix: '--choice-tile-', what: 'the choice tile width' },
  { family: 'choice-grid', prefix: '--choice-grid-', what: 'the Choice grid control width at each size' },
  { family: 'range', prefix: '--range-', what: 'the Range dot and track sizes' },
  { family: 'toggle', prefix: '--toggle-', what: 'the Toggle track height and width at each size, and its pad' },
  { family: 'listbox', prefix: '--listbox-', what: 'listbox width and height limits' },
  { family: 'join-row', prefix: '--join-row-', what: 'the Home Join row width' },
  { family: 'option-menu', prefix: '--option-menu-', what: 'the option menu width' },
  { family: 'spinner', prefix: '--spinner-', what: 'Spinner sizes' },
  { family: 'progress-bar', prefix: '--progress-bar-', what: 'Progress bar height' },
  { family: 'progress-indicator', prefix: '--progress-indicator-', what: 'Progress indicator dot sizes' },
  { family: 'option-row', prefix: '--option-row-', what: 'the option row indent step, control gap and radio dot' },
  { family: 'count-tag', prefix: '--count-tag-', what: 'the Count tag dot' },
  { family: 'tag', prefix: '--tag-', what: 'the Tag dot, and the Date and Status tag end pad and gap' },
  { family: 'carousel', prefix: '--carousel-', what: 'Carousel control offset, pad and size, slide minimum heights and indicator sizes' },
  { family: 'scroll-bar', prefix: '--scroll-bar-', what: 'the scroll bar thumb size and the default maximum height' },
  { family: 'skeleton', prefix: '--skeleton-', what: 'Skeleton preset heights and widths' },
  { family: 'flag', prefix: '--flag-', what: 'the Flag minimum height, pad and offset' },
  { family: 'spotlight', prefix: '--spotlight-', what: 'the Spotlight media height' },
  { family: 'ai-chat', prefix: '--ai-chat-', what: 'the AI chat width' },
  { family: 'menu-group', prefix: '--menu-group-', what: 'Menu group minimum width, pad and gap' },
  { family: 'popup', prefix: '--popup-', what: 'the Popup pad' },
  { family: 'avatar', prefix: '--avatar-', what: 'the two largest Avatar sizes, 96 and 128' },
  { family: 'layer', prefix: '--layer-', what: 'the z-index scale, card to tooltip' },
  { family: 'motion', prefix: '--motion-', what: 'motion durations and easings' },
  { family: 'modal', prefix: '--modal-', what: 'modal dialog pad, stack, inline, radius and body floor' },
  { family: 'focused-page', prefix: '--focused-page-', what: 'the focused page frame: its pad, stacks and inline gaps' },
  { family: 'popover', prefix: '--popover-', what: 'menus, popups, tooltips and flags: pad, widths, radii, placement' },
  { family: 'tile', prefix: '--tile-', what: 'Tile radius where a size has no shared radius role' },
  { family: 'col', prefix: '--col-', what: 'grid column widths' },
  { family: 'breakpoint', prefix: '--breakpoint-', what: 'breakpoint minima' },
];

/** Longest prefix first, so a specific family is never read as its parent. */
const BY_LENGTH = [...FAMILIES].sort((a, b) => b.prefix.length - a.prefix.length);

/**
 * Which family a token NAME is in, or null for a name in none — a
 * component-local custom property such as `--dropdown-cell-x`, which is correct
 * code and not a token (see `check:size-fallbacks` on why it is not a finding).
 *
 * @param {string} name
 * @returns {string|null}
 */
export function familyOf(name) {
  if (typeof name !== 'string') return null;
  // A prefix ending in `-` opens a family; one without names a family of one
  // token, matched whole (`--code`).
  const family = BY_LENGTH.find((f) =>
    f.prefix.endsWith('-') ? name.startsWith(f.prefix) && name.length > f.prefix.length : name === f.prefix,
  );
  return family ? family.family : null;
}

/* ─── ARE THESE TWO VALUES THE SAME ────────────────────────────────────────── */

const HEX = /^#([0-9a-f]{3,8})$/;
/**
 * A whole color function — `rgba(4, 114, 168, 0.08)`, `rgb(4 114 168 / 50%)`,
 * `HSLA(…)` — as a regex SOURCE, unanchored, with the function name in group
 * one and its arguments in group two. Exported so the fallback capture in
 * `scripts/token-fallbacks.mjs` reads exactly the functions this key reads,
 * and the two cannot drift.
 *
 * The name is matched case-insensitively by character class rather than an
 * `i` flag, because a caller splices this into a larger pattern whose token
 * names ARE case-sensitive. The arguments admit no parenthesis, so
 * `rgba(var(--x), 0.5)` is not a color function here.
 */
export const COLOR_FUNCTION_SOURCE = '([rR][gG][bB][aA]?|[hH][sS][lL][aA]?)\\(([^()]*)\\)';
const FUNCTION = new RegExp(`^${COLOR_FUNCTION_SOURCE}$`);

/** `50%` → 0.5, `0.5` → 0.5, anything else → null. */
function alphaOf(part) {
  if (part === undefined) return 1;
  const percent = /^(-?\d*\.?\d+)%$/.exec(part);
  const value = percent ? Number(percent[1]) / 100 : Number(part);
  if (!Number.isFinite(value) || value < 0 || value > 1) return null;
  return value;
}

/** An rgb channel: `0-255`, or a percentage of 255. */
function channelOf(part) {
  const percent = /^(-?\d*\.?\d+)%$/.exec(part);
  const value = percent ? (Number(percent[1]) / 100) * 255 : Number(part);
  if (!Number.isFinite(value) || value < 0 || value > 255) return null;
  return Math.round(value);
}

/** hue in degrees, saturation and lightness as fractions → `{r, g, b}` 0-255. */
function hslToRgb(h, s, l) {
  const hue = (((h % 360) + 360) % 360) / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t) => {
    const v = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (v < 1 / 6) return p + (q - p) * 6 * v;
    if (v < 1 / 2) return q;
    if (v < 2 / 3) return p + (q - p) * (2 / 3 - v) * 6;
    return p;
  };
  return {
    r: Math.round(channel(hue + 1 / 3) * 255),
    g: Math.round(channel(hue) * 255),
    b: Math.round(channel(hue - 1 / 3) * 255),
  };
}

const hex2 = (n) => n.toString(16).padStart(2, '0');

/**
 * A color literal as a comparable key: `#rrggbb`, or `#rrggbbaa` when it is
 * not opaque. Null for anything this cannot read, rather than a guess.
 *
 * Reads `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`
 * and `hsla()`, in comma or space syntax, with an alpha after `/` or after the
 * third comma, and channels as numbers or percentages. See the header for why
 * this is wider than `parseColor`, finer than the normalizer the fallback
 * checks carried before #621, and what the finer half costs a migrating
 * caller.
 *
 * @param {string} value
 * @returns {string|null}
 */
export function colorKey(value) {
  if (typeof value !== 'string') return null;
  const literal = value.trim().toLowerCase();

  const hex = HEX.exec(literal);
  if (hex) {
    const digits = hex[1];
    // Four and eight digits carry alpha; five and seven are not a color.
    const expanded =
      digits.length === 3 || digits.length === 4
        ? [...digits].map((d) => d + d).join('')
        : digits.length === 6 || digits.length === 8
          ? digits
          : null;
    if (!expanded) return null;
    const alpha = expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) : 255;
    return alpha === 255 ? `#${expanded.slice(0, 6)}` : `#${expanded}`;
  }

  const fn = FUNCTION.exec(literal);
  if (!fn) return null;
  const parts = fn[2]
    .split(/[,/\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;

  const alpha = alphaOf(parts[3]);
  if (alpha === null) return null;

  let rgb;
  if (fn[1].startsWith('rgb')) {
    const channels = parts.slice(0, 3).map(channelOf);
    if (channels.some((c) => c === null)) return null;
    rgb = { r: channels[0], g: channels[1], b: channels[2] };
  } else {
    const hue = /^(-?\d*\.?\d+)(deg)?$/.exec(parts[0]);
    const saturation = /^(-?\d*\.?\d+)%?$/.exec(parts[1]);
    const lightness = /^(-?\d*\.?\d+)%?$/.exec(parts[2]);
    if (!hue || !saturation || !lightness) return null;
    const s = Number(saturation[1]) / 100;
    const l = Number(lightness[1]) / 100;
    if (s < 0 || s > 1 || l < 0 || l > 1) return null;
    rgb = hslToRgb(Number(hue[1]), s, l);
  }

  const base = `#${hex2(rgb.r)}${hex2(rgb.g)}${hex2(rgb.b)}`;
  return alpha === 1 ? base : `${base}${hex2(Math.round(alpha * 255))}`;
}

/**
 * A dimension literal as a comparable key. `rem` is 16px and only 16px, the
 * assumption both rivals already make and for the same reason: nothing here
 * renders anything, and a repo that changed its root font size revisits both.
 *
 * A PERCENTAGE IS NOT CONVERTED TO PX, which is the point rather than a
 * shortcut: `--radius-full` is `9999px` and falls back to `50%`
 * eleven times, and on a non-square box those are different shapes.
 *
 * A BARE `0` is `0px`, because zero is zero, and that is the one place the two
 * normalizers this replaces disagreed: `normalizeDimension`, retired from
 * `scripts/token-fallbacks.mjs` by #621, read it, and the docs check's key,
 * retired by #622, answered null. This takes the reading that loses nothing —
 * the check that answered null was passing up a comparison it could have made.
 * A bare number is otherwise NOT a length (`line-height: 1.5` is a ratio), and
 * `em` is relative to the element's own font size, which this cannot know;
 * guessing 16px there would report agreement with a number nobody wrote. So
 * `0em` is null rather than `0px` — not because zero is unclear, but because
 * both rivals refuse it and a widening nobody asked for is a migration
 * surprise.
 *
 * @param {string} value
 * @returns {string|null}
 */
export function dimensionKey(value) {
  if (typeof value !== 'string') return null;
  const match = /^(-?\d*\.?\d+)(px|rem|em|%)?$/.exec(value.trim().toLowerCase());
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return null;
  if (!match[2]) return n === 0 ? '0px' : null;
  if (match[2] === 'em') return null;
  if (match[2] === '%') return `${n}%`;
  return `${match[2] === 'rem' ? n * 16 : n}px`;
}

/**
 * A value as a comparable key, whichever kind it is — the kind read off the
 * value rather than off the token's name (see the header).
 *
 * Color is tried first and the two cannot collide: no string is both a color
 * and a length.
 *
 * @param {string} value
 * @returns {string|null}
 */
export function valueKey(value) {
  return colorKey(value) ?? dimensionKey(value);
}

/**
 * ARE THESE TWO VALUES THE SAME VALUE. The one answer.
 *
 * Two values this cannot key are NOT thereby equal: `inherit` and
 * `currentColor` are both unreadable and plainly different, and answering true
 * for a pair it could not read is how a check reports agreement it never
 * established. A caller that needs to know the difference between "different"
 * and "could not compare" asks `valueKey` for each side, which is what the
 * fallback audits do when they count the incomparable.
 *
 * @param {string} a
 * @param {string} b
 */
export function sameValue(a, b) {
  const key = valueKey(a);
  return key !== null && key === valueKey(b);
}
