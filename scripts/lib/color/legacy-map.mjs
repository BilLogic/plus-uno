/**
 * The legacy color tokens (Material roles, `--color-*`, plus the `--surface-*`
 * and `--elevation-light-*` color roles) mapped onto the Atlassian-shaped set,
 * as data. Port of the reference generator's `mapping.py`, the migration map
 * in the color proposal (`docs/plans/2026-10-24-color-system-proposal.md`).
 *
 * Each row: what it covers as written in the proposal (`today`), a pattern
 * over the CSS name (`match`, null for a row that only describes a second use
 * of a name another row matches), the proposed token(s) (`proposed`), a note,
 * and `aliases` — the legacy names this row gives exactly one target, whatever
 * CSS property they sit on. Only those are aliased; a name whose target
 * depends on where it is used (a fill here, an edge or a link there) or on
 * what the element is (state layers) waits for the component sweep, which
 * reads `proposed`.
 *
 * Three rules narrow `aliases` beyond "one target":
 *   - Partners move together (`PAIRS`). A foreground and the grounds it is
 *     drawn on — on-X with X, a container with its on-container, the text on
 *     a surface, the text on a state layer — are aliased together, to a pair
 *     that passes 4.5:1 in light, or not at all. Aliasing one side alone
 *     pairs a new color with a legacy one nobody chose: brand text on the
 *     legacy 16% primary selection fell to 4.44:1. So the brand text and icon,
 *     the brand and secondary containers, secondary text and the surfaces wait
 *     for the sweep with the partners whose targets depend on use.
 *   - Status, info, tertiary and SMART families stay put even where a name
 *     has one target (`--color-danger-text` → `color.text.danger`). Their hues
 *     move under the new ramps, and this step promises a visible change in
 *     brand, neutrals, shadows and the disabled opacity only.
 *   - `--color-disabled-opacity` aliases `opacity.disabled`, the one target of
 *     its own kind; the disabled text and background tokens beside it in
 *     `proposed` are what components move to in the sweep.
 *
 * `legacyCoverage()` checks every legacy name used in `design-system/` and
 * `prototypes/` has a row; `aliasScss()` renders `_legacy-aliases.scss`.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { REPO_ROOT, documents } from '../corpus.mjs';

import { dsName } from './emit.mjs';

const SMART = '(mastering-content|relationship|technology-tools|advocacy|social-emotional)';

/** @type {{today: string, match: RegExp|null, proposed: string, note: string, aliases?: Record<string, string>}[]} */
export const ROWS = [
  { today: '--color-primary (background)', match: /^--color-primary$/, proposed: 'color.background.brand.bold', note: 'One M3 role splits by property: fill here, edge and link below.' },
  { today: '--color-primary (border / text)', match: null, proposed: 'color.border.brand · color.link', note: 'Same name used as an edge or a link color.' },
  { today: '--color-primary-text', match: /^--color-primary-text$/, proposed: 'color.text.brand', note: 'Lagoon 800 for brand text.' },
  { today: '--color-primary-border · -icon', match: /^--color-primary-(border|icon)$/, proposed: 'color.border.brand · color.icon.brand', note: '38 border uses today.',
    aliases: { '--color-primary-border': 'color.border.brand' } },
  { today: '--color-on-primary', match: /^--color-on-primary$/, proposed: 'color.text.inverse · color.icon.inverse', note: 'Shared by every bold fill, not per intent.' },
  { today: '--color-primary-container', match: /^--color-primary-container$/, proposed: 'color.background.brand.subtlest', note: '' },
  { today: '--color-on-primary-container', match: /^--color-on-primary-container$/, proposed: 'color.text (or color.text.brand)', note: '' },
  { today: '--color-inverse-primary', match: /^--color-inverse-primary$/, proposed: 'color.border.focused (dark value) · Field hover exception: decide', note: '' },
  { today: '--color-primary-state-08 / 12 / 16, by role', match: /^--color-primary(-container)?-state-\d+$/,
    proposed: 'on aria-selected, aria-current, active, expanded: color.background.selected · hover on selected: .selected.hovered · otherwise background.neutral.subtle.hovered / .pressed',
    note: 'Mapped by what the element is, not by step: a 16% primary slab on a selected tab would become a 31% one under a step-for-step swap.' },
  { today: '--color-secondary · -text · -border · -container', match: /^--color-(on-)?secondary(-text|-border|-container)?$/,
    proposed: 'color.text.subtle · color.border · color.background.neutral', note: 'Atlassian has no secondary role; secondary-text is subdued text. secondary-border waits for the sweep: Alert holds it to 3:1 as an edge, and color.border is a decorative line.' },
  { today: '--color-secondary-state-*', match: /^--color-secondary(-container)?-state-\d+$/, proposed: 'background.neutral.subtle.hovered / .pressed', note: '' },
  { today: '--color-tertiary family', match: /^--color-(on-)?tertiary(-[a-z]+)*(-state-\d+)?$/, proposed: 'color.*.accent.teal', note: 'Tertiary stops being a role.' },
  { today: '--color-info family', match: /^--color-(on-)?info(-[a-z]+)*(-state-\d+)?$/, proposed: 'color.*.information (blue)', note: 'Info moves to blue so it stops reading as brand.' },
  { today: '--color-{danger,success,warning}', match: /^--color-(danger|success|warning)$/, proposed: 'color.background.{role}.bold · color.border.{role} · color.icon.{role}', note: 'Split by property, as primary.' },
  { today: '--color-{role}-text · -icon · -border · -border-subtle', match: /^--color-(danger|success|warning)-(text|icon|border|border-subtle)$/,
    proposed: 'color.text.{role} · color.icon.{role} · color.border.{role} · color.border.{role}.subtle', note: 'Warning text is yellow.800; warning icon and border yellow.600.' },
  { today: '--color-{role}-container / on-{role}(-container)', match: /^--color-(on-)?(danger|success|warning)(-container)?$/,
    proposed: 'color.background.{role} / color.text.warning.inverse (on warning.bold) or color.text.{role}.bolder', note: 'Warning keeps dark ink on a yellow fill.' },
  { today: '--color-{role}-state-*', match: /^--color-(danger|success|warning)(-container)?-state-\d+$/, proposed: 'color.background.{role}.bold.hovered / .pressed', note: 'Opaque named steps replace overlays.' },
  { today: 'SMART families', match: new RegExp(`^--color-(on-)?${SMART}(-[a-z]+)*(-state-\\d+)?$`),
    proposed: 'color.*.smart.{subject}: mastering-content → teal, relationship → magenta, social-emotional → orange, advocacy → lime, technology-tools → brown',
    note: 'Each subject aliases an accent no role uses, so a subject never reads as a status. The Suggestion chip, today on mastering-content, moves to discovery, the AI-suggestion role.' },
  { today: '--color-surface (#f9f9fc)', match: /^--color-surface$/, proposed: 'elevation.surface.sunken', note: "Matches today's --surface-sunken alias." },
  { today: '--color-surface (text, 3 uses)', match: null, proposed: 'color.text.inverse', note: 'SessionManagementSnackbar, CloseButton and ListGroup use the surface color as ink on a dark ground.' },
  { today: '--color-surface-container-lowest', match: /^--color-surface-container-lowest$/, proposed: 'elevation.surface · .raised · .overlay', note: '' },
  { today: '--color-surface-container · -low · -high · -highest', match: /^--color-surface-container(-low|-high|-highest)?$/,
    proposed: 'elevation.surface.container · .hovered · color.background.neutral', note: '300 uses collapse to translucent container fills; gray stays for recessed areas.' },
  { today: '--color-surface-variant · -bright · -overlay', match: /^--color-surface-(variant|bright|overlay|dim)$/,
    proposed: 'color.background.neutral · elevation.surface · elevation.surface.overlay', note: '' },
  { today: '--color-surface(-container)-state-*', match: /^--color-(surface|surface-container(-[a-z]+)*|surface-variant|surface-bright|surface-dim)-state-\d+$/,
    proposed: 'color.interaction.inverse.hovered / .pressed (dark or colored grounds)', note: 'PLUS addition: white 8/12% in light, ink in dark.' },
  { today: '--color-on-surface', match: /^--color-on-surface$/, proposed: 'color.text · color.icon', note: '657 uses, the most-used color token.' },
  { today: '--color-on-surface-variant', match: /^--color-on-surface-variant$/, proposed: 'color.text.subtle · color.icon.subtle', note: '632 uses.' },
  { today: '--color-on-surface(-variant)-state-08 / 12 / 16', match: /^--color-on-surface(-variant)?-state-\d+$/,
    proposed: 'rows, menus, sidebar items: background.neutral.subtle.hovered / .pressed · avatars, images: color.interaction.hovered / .pressed',
    note: 'color.interaction only where the base fill cannot change.' },
  { today: '--color-outline', match: /^--color-outline$/, proposed: 'color.border.bold · color.border.input', note: '' },
  { today: '--color-outline-variant (border)', match: /^--color-outline-variant$/, proposed: 'color.border', note: '352 uses.' },
  { today: '--color-outline-variant (text / track)', match: null, proposed: 'text: color.text.subtlest · track or bar: color.background.neutral · chart grid: color.border',
    note: 'Split by property; as a text color today it would fall to 1.2:1.' },
  { today: '--color-border (local to a spec page)', match: /^--color-border$/, proposed: 'color.border', note: 'Defined inside one spec page, not in the token set.' },
  { today: '--color-outline-state-12', match: /^--color-outline(-variant)?-state-\d+$/, proposed: 'color.border.bold (hover edge)', note: 'A state layer: its one use is a scrollbar-thumb fill, so it waits for the sweep.' },
  { today: '--color-scrim', match: /^--color-scrim$/, proposed: 'color.blanket', note: '',
    aliases: { '--color-scrim': 'color.blanket' } },
  { today: '--color-disabled-opacity (0.38)', match: /^--color-disabled-opacity$/, proposed: 'opacity.disabled (0.4) + color.text.disabled · color.background.disabled', note: 'Atlassian value; a visible change.',
    aliases: { '--color-disabled-opacity': 'opacity.disabled' } },
  { today: '--color-inverse-surface / inverse-on-surface', match: /^--color-inverse-(surface|on-surface)(-state-\d+)?$/, proposed: 'color.background.neutral.bold / color.text.inverse', note: '',
    aliases: { '--color-inverse-surface': 'color.background.neutral.bold', '--color-inverse-on-surface': 'color.text.inverse' } },
  { today: '--color-shadow-state-08 / 12', match: /^--color-shadow-state-\d+$/, proposed: "the role's .bold.hovered / .bold.pressed", note: 'Overlays over bold fills become opaque steps.' },
  { today: '--color-focus-ring / -inverse', match: /^--color-focus-ring(-inverse)?$/, proposed: 'color.border.focused / color.border.focused.inverse', note: 'Inverse is a PLUS addition.',
    aliases: { '--color-focus-ring': 'color.border.focused', '--color-focus-ring-inverse': 'color.border.focused.inverse' } },
  { today: '--surface-default / raised / overlay / sunken', match: /^--surface-(default|raised|overlay|sunken)$/, proposed: 'elevation.surface / .raised / .overlay / .sunken', note: 'Already Atlassian-shaped.' },
  { today: '--surface-raised-shadow / -overlay-shadow', match: /^--surface-(raised|overlay)-shadow$/, proposed: 'elevation.shadow.raised / .overlay', note: '',
    aliases: { '--surface-raised-shadow': 'elevation.shadow.raised', '--surface-overlay-shadow': 'elevation.shadow.overlay' } },
  { today: '--surface-container, -pad, -stack, -radius', match: /^--surface-(container|pad|stack|radius)(-[a-z0-9]+)*$/, proposed: 'unchanged: spacing and radius, not color', note: 'Out of scope for the color set.' },
  { today: '--elevation-light-1 · -2', match: /^--elevation-light-[12]$/, proposed: 'elevation.shadow.raised', note: 'Pair with elevation.surface.raised.',
    aliases: { '--elevation-light-1': 'elevation.shadow.raised', '--elevation-light-2': 'elevation.shadow.raised' } },
  { today: '--elevation-light-3 · -4 · -5', match: /^--elevation-light-[345]$/, proposed: 'elevation.shadow.overlay', note: 'Pair with elevation.surface.overlay. Level 3 only for now: the modal levels 4 and 5 keep their own shadow, distinct from floating layers, until the sweep moves modals.',
    aliases: { '--elevation-light-3': 'elevation.shadow.overlay' } },
  { today: '~15 hard-coded box-shadow literals', match: null, proposed: 'elevation.shadow.raised · .overlay · .overflow', note: 'Swept with the components.' },
];

/** Legacy name -> new token name, in row order. */
export const ALIASES = Object.fromEntries(ROWS.flatMap((row) => Object.entries(row.aliases ?? {})));

/**
 * Foregrounds and the grounds they are drawn on, by legacy name or pattern.
 * Within a group, every name in use is aliased or none is; when all are, each
 * foreground clears 4.5:1 on each ground in light (`pairFailures`).
 *
 * @type {{label: string, fg: (string|RegExp)[], bg: (string|RegExp)[]}[]}
 */
export const PAIRS = [
  { label: 'brand: text and icon on the brand container and the primary state layers',
    fg: ['--color-primary-text', '--color-primary-icon', '--color-on-primary-container'],
    bg: ['--color-primary-container', /^--color-primary(-container)?-state-\d+$/] },
  { label: 'secondary: text on the secondary container and the neutral state layers',
    fg: ['--color-secondary-text', '--color-on-secondary-container'],
    bg: ['--color-secondary-container', /^--color-secondary(-container)?-state-\d+$/, /^--color-on-surface(-variant)?-state-\d+$/] },
  { label: 'surfaces: on-surface text on every surface',
    fg: ['--color-on-surface', '--color-on-surface-variant'],
    bg: ['--color-surface', /^--color-surface-(variant|bright|overlay|dim|container(-[a-z]+)*)$/, /^--surface-(default|raised|overlay|sunken)$/] },
  { label: 'inverse: inverse text on the inverse surface',
    fg: ['--color-inverse-on-surface'],
    bg: ['--color-inverse-surface'] },
];

const matches = (spec, name) => (typeof spec === 'string' ? spec === name : spec.test(name));
const members = (specs, names) => names.filter((n) => specs.some((spec) => matches(spec, n)));

/**
 * @param {Iterable<string>} names  the legacy names in play (in use, or defined)
 * @param {{rows: {name: string, light: string}[]}} semantics
 * @param {(a: string, b: string) => number} contrastOf  hex contrast ratio
 * @param {(hex: string, ground: string) => string} compositeOf  alpha over an opaque ground
 * @param {Record<string, string>} [aliases]
 * @returns {string[]}
 */
export function pairFailures(names, semantics, contrastOf, compositeOf, aliases = ALIASES) {
  const all = [...new Set([...names, ...Object.keys(aliases)])];
  const light = Object.fromEntries(semantics.rows.map((r) => [r.name, r.light]));
  const out = [];
  for (const group of PAIRS) {
    const fg = members(group.fg, all);
    const bg = members(group.bg, all);
    const aliased = [...fg, ...bg].filter((n) => aliases[n]);
    if (!aliased.length) continue;
    const bare = [...fg, ...bg].filter((n) => !aliases[n]);
    if (bare.length) {
      out.push(`${group.label}: ${aliased.join(', ')} aliased but ${bare.join(', ')} not; alias partners together or not at all`);
      continue;
    }
    for (const f of fg) {
      for (const b of bg) {
        const ground = compositeOf(light[aliases[b]], '#ffffff');
        const ratio = contrastOf(compositeOf(light[aliases[f]], ground), ground);
        if (ratio < 4.5) out.push(`${group.label}: ${f} on ${b} is ${ratio.toFixed(2)}:1 in light`);
      }
    }
  }
  return out;
}

/** The row a legacy name falls under, or undefined. */
export const rowFor = (name) => ROWS.find((row) => row.match?.test(name));

/**
 * Every alias target must be a token the generator emits.
 *
 * @param {{rows: {name: string}[], shadows: {name: string}[], opacity: {name: string}[]}} semantics
 * @returns {string[]} one message per alias whose target does not exist
 */
export function missingTargets({ rows, shadows, opacity }) {
  const known = new Set([...rows, ...shadows, ...opacity].map((t) => t.name));
  return Object.entries(ALIASES)
    .filter(([, token]) => !known.has(token))
    .map(([legacy, token]) => `${legacy} aliases ${token}, which the generator does not emit`);
}

/**
 * `_legacy-aliases.scss`. On `:root` and on any element carrying a mode
 * attribute, so a legacy name resolves against the mode in force there rather
 * than inheriting the value computed at the root.
 *
 * @param {string} header  first line, ending in "\n"
 */
export function aliasScss(header) {
  const lines = Object.entries(ALIASES).map(([legacy, token]) => `  ${legacy}: var(${dsName(token)});\n`);
  return `${header}:root,\n[data-color-mode],\n[data-contrast-mode] {\n${lines.join('')}}\n`;
}

/** Where legacy names are used: the design system and the prototypes, stylesheets and components. */
export const SCAN_ROOTS = ['design-system', 'prototypes'];
const SCAN_EXT = ['.scss', '.css', '.js', '.jsx', '.ts', '.tsx', '.mdx'];
const USE = /var\(\s*(--(?:color|surface|elevation)-[a-z0-9-]*[a-z0-9])/g;
const DEFINE = /(--(?:color|surface|elevation)-[a-z0-9-]*[a-z0-9])\s*:/g;
/** The generated folder defines the aliases, and tests plant fixture names; neither is a use. */
const SKIP = (rel) => rel.startsWith('design-system/src/tokens/color/') || /\.test\.[jt]sx?$/.test(rel);

/**
 * Every legacy name used with `var()` in the scanned trees, and whether each
 * has a row. A name used and defined nowhere is not this map's to place —
 * check:undefined-tokens owns it — so it is listed apart and never fails here.
 *
 * @param {{root?: string}} [options]
 * @returns {{used: Map<string, number>, unmapped: [string, number][], undefinedNames: string[]}}
 */
const scanned = new Map();
export function legacyCoverage({ root = REPO_ROOT } = {}) {
  if (!scanned.has(root)) scanned.set(root, scan(root));
  return scanned.get(root);
}

/** One walk of the scanned trees; `legacyCoverage` memoizes it per root, since a check run reads it twice. */
function scan(root) {
  const used = new Map();
  const defined = new Set();
  for (const base of SCAN_ROOTS) {
    for (const rel of documents(base, { root, ext: SCAN_EXT })) {
      if (SKIP(rel)) continue;
      const text = readFileSync(join(root, rel), 'utf8');
      for (const [, name] of text.matchAll(USE)) used.set(name, (used.get(name) ?? 0) + 1);
      for (const [, name] of text.matchAll(DEFINE)) defined.add(name);
    }
  }
  const undefinedNames = [...used.keys()].filter((n) => !defined.has(n)).sort();
  const unmapped = [...used].filter(([n]) => defined.has(n) && !rowFor(n)).sort((a, b) => b[1] - a[1]);
  return { used, unmapped, undefinedNames };
}
