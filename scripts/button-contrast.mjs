/**
 * The pure half of `check:button-contrast` (#312).
 *
 * THE MATHS IS NO LONGER HERE. Luminance, contrast, compositing, colour
 * parsing, the token grammar and token resolution moved to
 * `design-system/src/lib/tokens.mjs` (#506), because this file imports `node:fs`
 * and so could never be imported by a Storybook story — which is why five
 * stories carried their own copy of the same arithmetic. What is left here is
 * what is genuinely about BUTTONS: reading the `$btn-themes` map, building a
 * ground per style × fill, and reporting.
 *
 * The re-exports #506 left here as a bridge are gone (#507): `text-contrast.mjs`
 * and `focus-ring.mjs` import the maths from the module itself, so there is one
 * import path to it rather than two. The RATCHET went with the maths in #506
 * and moved again in #599, to `scripts/lib/ratchet.mjs`, which is also where
 * this check's record shape is declared — and in #600 the rest of the record
 * went with it, so this file no longer imports the classifier at all. What it
 * still exports is its own: `tokenValues`, `PAGE_TOKEN`, `AA_TEXT`, the button
 * sweep, the two sides the record is written in, and the wording.
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

import { TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import {
  composite,
  contrast,
  parseColour,
  readTokens,
  resolveToken,
  toHex,
} from '../design-system/src/lib/tokens.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

export const TOKENS_FILE = `${TOKEN_DIR}/_colors.scss`;
export const BUTTON_SCSS = 'design-system/src/components/actions/Button/Button.scss';

/** The page a button sits on when its own fill draws no ground. */
export const PAGE_TOKEN = '--color-surface';

/** WCAG AA for body text. Buttons are body text; none of ours is 24px regular. */
export const AA_TEXT = 4.5;

/**
 * Every `--color-*: value;` in the token stylesheet, as a Map.
 *
 * The `--color-` narrowing is the whole difference from the module's
 * `readTokens`: this check resolves colours, and a colour that resolved through
 * a spacing token would be a different defect wearing this check's name.
 *
 * @param {string} source
 */
export function tokenValues(source) {
  return readTokens(source, { prefix: '--color-' });
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
 * The two sides of the record, measured — in the shape
 * `docs/evals/button-contrast-baseline.json` holds them, which is two arrays of
 * keys: `"style/fill"` for contrast and `"a+b"` for a duplicate pair. This is
 * what `scripts/lib/ratchet.mjs` is handed (#600), and it is the whole of what
 * this module says about the record.
 */
export function measured(themes, values) {
  return {
    contrast: sweep(themes, values)
      .filter((row) => row.ratio !== null && row.ratio < AA_TEXT)
      .map((row) => `${row.style}/${row.fill}`),
    duplicates: duplicateGrounds(themes, values).map((group) => group.join('+')),
  };
}

/**
 * The WORDING of both ratchets' verdicts, and the one finding neither ratchet
 * can have an opinion about — a combination whose ground will not resolve.
 *
 * A baseline entry silences a finding and nothing else, and an entry that no
 * longer matches anything is itself a finding: a ratchet that cannot shrink is
 * a list. THE ORDER is preserved deliberately — an unresolved combination is
 * reported in sweep position, interleaved with the contrast findings, so a
 * reader walks the map the way the map is written.
 *
 * @param {object[]} themes
 * @param {Map<string, string>} values
 * @param {{contrast?: {fresh?: string[], stale?: string[]},
 *          duplicates?: {fresh?: string[], stale?: string[]}}} verdicts
 *        what the ratchet said about each of the record's two sets. Empty is
 *        "nothing moved", not "nothing is recorded": which keys are new is
 *        `scripts/lib/ratchet.mjs`'s call, and this function has no record.
 */
export function findings(themes, values, verdicts = {}) {
  const { contrast = {}, duplicates = {} } = verdicts;
  const rows = sweep(themes, values);
  const unrecordedContrast = new Set(contrast.fresh ?? []);

  const found = [];

  for (const row of rows) {
    if (row.ratio === null) {
      found.push(`${row.style}/${row.fill}: cannot resolve ${row.unresolved.join(', ')}`);
      continue;
    }
    const key = `${row.style}/${row.fill}`;
    if (unrecordedContrast.has(key)) {
      found.push(`${key}: label is ${row.ratio}:1 against its ground, under ${AA_TEXT}:1`);
    }
  }

  for (const key of duplicates.fresh ?? []) {
    found.push(`${key}: these styles render the same filled ground, so the names are a distinction the interface does not draw`);
  }

  for (const key of contrast.stale ?? []) {
    found.push(`baseline entry "${key}" no longer fails — remove it`);
  }
  for (const key of duplicates.stale ?? []) {
    found.push(`baseline entry "${key}" no longer duplicates — remove it`);
  }

  return found;
}

/** Reads the repo. Separated so every function above stays testable on strings. */
export function readRepo(root = REPO_ROOT) {
  const tokens = fs.readFileSync(path.join(root, TOKENS_FILE), 'utf8');
  const button = fs.readFileSync(path.join(root, BUTTON_SCSS), 'utf8');
  return { values: tokenValues(tokens), themes: themeMap(button) };
}
