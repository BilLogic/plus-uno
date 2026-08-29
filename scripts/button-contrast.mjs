/**
 * The pure half of `check:button-contrast` (#312).
 *
 * WHAT THIS MEASURES, AND WHY IT IS NOT THE a11y RATCHET'S JOB.
 * `check:storybook` runs axe over what the stories render. Nothing renders a
 * filled `warning` button, so nothing measured one, so a 3.70:1 label sat in the
 * theme map for as long as it has existed. An a11y ratchet can only ever see the
 * combinations someone thought to write a story for; a theme map is a generator,
 * and the thing to check is the generator's OUTPUT — all of it, whether or not a
 * story exists.
 *
 * The second assertion has no accessibility rule behind it at all. `tertiary`
 * and `info` resolve to the same colour on every fill, so two names render one
 * appearance and a caller choosing between them is making a distinction the
 * interface does not draw. No tool compares two token values for equality
 * because no tool knows they were meant to differ. The map is where that
 * intention lives, so the map is where it can be checked.
 *
 * HOW A GROUND IS BUILT, per `Button.scss`'s variant generation:
 *
 *   filled                   ground = Main            label = OnMain
 *   tonal                    ground = StateLayer over the page  label = TextSafe
 *   outline / ghost / text   ground = the page        label = TextSafe
 *
 * State layers are 8%-alpha colours, so `tonal` has to be COMPOSITED before it
 * is read. Reading `rgba(113, 92, 0, 0.08)` as if it were solid gives 1.3:1 and
 * a page of failures that are not there — the same arithmetic mistake #268's
 * audit made and had to correct.
 *
 * Exported piece by piece so the tests can drive each step over hand-built
 * input rather than over the repo, which is what lets them assert the failures
 * as well as the passes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

export const TOKENS_FILE = 'design-system/src/tokens/_colors.scss';
export const BUTTON_SCSS = 'design-system/src/components/actions/Button/Button.scss';

/** The page a button sits on when its own fill draws no ground. */
export const PAGE_TOKEN = '--color-surface';

/** WCAG AA for body text. Buttons are body text; none of ours is 24px regular. */
export const AA_TEXT = 4.5;

/**
 * Follow `--a: var(--b)` until a literal colour or a dead end.
 *
 * This is not a nicety. `--color-info` IS `var(--color-tertiary)` in the token
 * file — the duplicate #312 measured in a browser is an alias written in one
 * line, and a resolver that stopped at the first `var()` would report it as an
 * unreadable token instead of as the alias it is.
 *
 * The `seen` set is the cycle guard: `--a: var(--b); --b: var(--a);` is a
 * stylesheet that compiles and a resolver that does not return.
 *
 * @param {string} token
 * @param {Map<string, string>} values
 * @param {Set<string>} [seen]
 * @returns {string|undefined} the literal value, or undefined
 */
export function resolveToken(token, values, seen = new Set()) {
  if (seen.has(token)) return undefined;
  seen.add(token);
  const value = values.get(token);
  if (value === undefined) return undefined;
  const alias = /^var\(\s*(--[a-z0-9-]+)\s*(?:,[^)]*)?\)$/i.exec(value.trim());
  return alias ? resolveToken(alias[1], values, seen) : value;
}

/**
 * `#rgb`, `#rrggbb`, `rgb(...)` and `rgba(...)` to `{r, g, b, a}` with channels
 * 0-255 and alpha 0-1. Anything else is null rather than a guess — a token this
 * cannot read is reported as unreadable, not silently scored.
 *
 * @param {string} value
 * @returns {{r: number, g: number, b: number, a: number}|null}
 */
export function parseColour(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim().toLowerCase();

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(text);
  if (hex) {
    const digits = hex[1].length === 3
      ? hex[1].split('').map((d) => d + d).join('')
      : hex[1];
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
      a: 1,
    };
  }

  const fn = /^rgba?\(([^)]+)\)$/.exec(text);
  if (!fn) return null;
  const parts = fn[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.slice(0, 3).some((n) => !Number.isFinite(n))) return null;
  if (parts.slice(0, 3).some((n) => n < 0 || n > 255)) return null;
  const alpha = parts.length > 3 ? parts[3] : 1;
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: alpha };
}

/**
 * Lay `top` over `bottom`. `bottom` is assumed opaque, which it is here: the
 * page is a solid colour and only state layers carry alpha.
 *
 * @param {{r: number, g: number, b: number, a: number}} top
 * @param {{r: number, g: number, b: number, a: number}} bottom
 */
export function composite(top, bottom) {
  const mix = (t, b) => Math.round(t * top.a + b * (1 - top.a));
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

/** WCAG relative luminance. */
export function luminance({ r, g, b }) {
  const channel = (value) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio, rounded the way the reports quote it. */
export function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
}

/**
 * Every `--color-*: value;` in the token stylesheet, as a Map.
 *
 * Only the `:root` light values are read. A dark-mode sweep is a second job and
 * a bigger one — it needs the dark page as well as the dark tokens — and saying
 * so here is better than a half-measure that looks like both.
 *
 * @param {string} source
 */
export function tokenValues(source) {
  const values = new Map();
  const pattern = /(--color-[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let match = pattern.exec(source);
  while (match) {
    if (!values.has(match[1])) values.set(match[1], match[2].trim());
    match = pattern.exec(source);
  }
  return values;
}

/**
 * The `$btn-themes` map, as `{ style, main, onMain, state, text }`.
 *
 * Parsed from the stylesheet rather than duplicated here, so a style added to
 * the map is measured without anyone remembering to add it in two places —
 * which is the failure mode #304 was: thirteen advertised, eight implemented.
 *
 * @param {string} source
 */
export function themeMap(source) {
  const block = /\$btn-themes:\s*\(([\s\S]*?)\n\);/.exec(source);
  if (!block) return [];
  const rows = [];
  const pattern = /'([a-z-]+)':\s*\(([^)]*)\)/g;
  let match = pattern.exec(block[1]);
  while (match) {
    const slots = match[2].split(',').map((s) => s.trim().replace(/^'|'$/g, ''));
    rows.push({ style: match[1], main: slots[0], onMain: slots[1], state: slots[2], text: slots[3] });
    match = pattern.exec(block[1]);
  }
  return rows;
}

/**
 * Ground and label for one style × fill, resolved to colours.
 *
 * @returns {{ground: object, label: object}|{unresolved: string[]}}
 */
export function combination(theme, fill, values) {
  const page = parseColour(resolveToken(PAGE_TOKEN, values));
  const need = fill === 'filled' ? [theme.main, theme.onMain] : [theme.state, theme.text];
  const unresolved = [PAGE_TOKEN, ...need].filter((token) => !parseColour(resolveToken(token, values)));
  if (unresolved.length) return { unresolved };

  const label = parseColour(resolveToken(fill === 'filled' ? theme.onMain : theme.text, values));
  if (fill === 'filled') return { ground: parseColour(resolveToken(theme.main, values)), label };
  if (fill === 'tonal') return { ground: composite(parseColour(resolveToken(theme.state, values)), page), label };
  return { ground: page, label };
}

export const FILLS = ['filled', 'tonal', 'outline', 'ghost', 'text'];

/**
 * Every combination the map generates, measured.
 *
 * @returns {{style: string, fill: string, ratio: number|null, unresolved?: string[]}[]}
 */
export function sweep(themes, values) {
  const rows = [];
  for (const theme of themes) {
    for (const fill of FILLS) {
      const built = combination(theme, fill, values);
      if (built.unresolved) {
        rows.push({ style: theme.style, fill, ratio: null, unresolved: built.unresolved });
      } else {
        rows.push({ style: theme.style, fill, ratio: contrast(built.label, built.ground) });
      }
    }
  }
  return rows;
}

/** `#rrggbb` for a resolved colour, so two grounds can be compared by name. */
export function toHex({ r, g, b }) {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Styles whose FILLED ground is identical to another's.
 *
 * Filled is the discriminator: it is the only fill that paints the style's own
 * colour, so two styles sharing it share their whole appearance.
 *
 * @returns {string[][]} groups of two or more style names
 */
export function duplicateGrounds(themes, values) {
  const byHex = new Map();
  for (const theme of themes) {
    const built = combination(theme, 'filled', values);
    if (built.unresolved) continue;
    const hex = toHex(built.ground);
    if (!byHex.has(hex)) byHex.set(hex, []);
    byHex.get(hex).push(theme.style);
  }
  return [...byHex.values()].filter((group) => group.length > 1).map((group) => group.sort());
}

/**
 * Findings, as the check reports them. A baseline entry silences a finding and
 * nothing else: entries are `"style/fill"` for contrast and `"a+b"` for a
 * duplicate pair, and an entry that no longer matches anything is itself a
 * finding — a ratchet that cannot shrink is a list.
 */
export function findings(themes, values, baseline = { contrast: [], duplicates: [] }) {
  const found = [];
  const seenContrast = new Set();
  const seenDuplicates = new Set();

  for (const row of sweep(themes, values)) {
    if (row.ratio === null) {
      found.push(`${row.style}/${row.fill}: cannot resolve ${row.unresolved.join(', ')}`);
      continue;
    }
    if (row.ratio >= AA_TEXT) continue;
    const key = `${row.style}/${row.fill}`;
    seenContrast.add(key);
    if (baseline.contrast.includes(key)) continue;
    found.push(`${key}: label is ${row.ratio}:1 against its ground, under ${AA_TEXT}:1`);
  }

  for (const group of duplicateGrounds(themes, values)) {
    const key = group.join('+');
    seenDuplicates.add(key);
    if (baseline.duplicates.includes(key)) continue;
    found.push(`${key}: these styles render the same filled ground, so the names are a distinction the interface does not draw`);
  }

  for (const key of baseline.contrast) {
    if (!seenContrast.has(key)) found.push(`baseline entry "${key}" no longer fails — remove it`);
  }
  for (const key of baseline.duplicates) {
    if (!seenDuplicates.has(key)) found.push(`baseline entry "${key}" no longer duplicates — remove it`);
  }

  return found;
}

/** Reads the repo. Separated so every function above stays testable on strings. */
export function readRepo(root = REPO_ROOT) {
  const tokens = fs.readFileSync(path.join(root, TOKENS_FILE), 'utf8');
  const button = fs.readFileSync(path.join(root, BUTTON_SCSS), 'utf8');
  return { values: tokenValues(tokens), themes: themeMap(button) };
}
