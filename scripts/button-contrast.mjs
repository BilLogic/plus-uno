/**
 * The pure half of `check:button-contrast` (#312).
 *
 * THE MATHS IS NO LONGER HERE. Luminance, contrast, compositing, color
 * parsing, the token grammar and token resolution moved to
 * `design-system/src/lib/tokens.mjs` (#506), because this file imports `node:fs`
 * and so could never be imported by a Storybook story — which is why five
 * stories carried their own copy of the same arithmetic. What is left here is
 * what is genuinely about BUTTONS: reading the `$btn-appearances` map, building a
 * ground per appearance and state, and reporting.
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
 * The second assertion has no accessibility rule behind it at all. Two
 * appearances that resolve to the same ground and edge render one look, and a
 * caller choosing between them is making a distinction the interface does not
 * draw. No tool compares two token values for equality
 * because no tool knows they were meant to differ. The map is where that
 * intention lives, so the map is where it can be checked.
 *
 * HOW A GROUND IS BUILT, per `Button.scss`'s appearance map: for each
 * appearance and each of rest, hovered and pressed, the ground is that state's
 * token composited over the page, and the label is the appearance's label
 * token. Default and subtle rest on the page itself.
 *
 * Exported piece by piece so the tests can drive each step over hand-built
 * input rather than over the repo, which is what lets them assert the failures
 * as well as the passes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COLOR_TOKEN_PATHS, COLOR_VALUE_PREFIXES, TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import {
  composite,
  contrast,
  parseColor,
  readTokens,
  resolveToken,
  toHex,
} from '../design-system/src/lib/tokens.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

export const TOKENS_FILE = `${TOKEN_DIR}/_colors.scss`;
export const BUTTON_SCSS = 'design-system/src/components/forms-and-inputs/Button/Button.scss';

/**
 * The page a button sits on when its own fill draws no ground. Still the
 * legacy page while every component paints on it; it moves to `--ds-surface`
 * when the pages do.
 */
export const PAGE_TOKEN = '--color-surface';

/** WCAG AA for body text. Buttons are body text; none of ours is 24px regular. */
export const AA_TEXT = 4.5;

/**
 * Every color token in the given stylesheet text, as a Map: `--color-*`,
 * `--ds-*` and the `--palette-*` ramps the `--ds-*` tokens alias.
 *
 * The narrowing to color is the whole difference from the module's
 * `readTokens`: this check resolves colors, and a color that resolved through
 * a spacing token would be a different defect wearing this check's name. The
 * FIRST definition wins, so a `--ds-*` token reads its light value, the first
 * block its generated file writes.
 *
 * @param {string} source
 */
export function tokenValues(source) {
  return readTokens(source, { prefix: COLOR_VALUE_PREFIXES });
}

/**
 * The `$btn-appearances` map, as
 * `{ appearance, ground, label, icon, hovered, pressed, edge }`.
 *
 * Parsed from the stylesheet rather than duplicated here, so an appearance
 * added to the map is measured without anyone remembering to add it in two
 * places. `selected` is the selected state drawn on default and subtle; it is
 * measured like an appearance.
 *
 * @param {string} source
 */
export function themeMap(source) {
  const block = /\$btn-appearances:\s*\(([\s\S]*?)\n\);/.exec(source);
  if (!block) return [];
  const rows = [];
  const pattern = /'([a-z-]+)':\s*\(([^)]*)\)/g;
  let match = pattern.exec(block[1]);
  while (match) {
    const slots = match[2].split(',').map((s) => s.trim().replace(/^'|'$/g, ''));
    rows.push({
      appearance: match[1],
      ground: slots[0],
      label: slots[1],
      icon: slots[2],
      hovered: slots[3],
      pressed: slots[4],
      edge: slots[5],
    });
    match = pattern.exec(block[1]);
  }
  return rows;
}

/** The three grounds an appearance draws, in the order they are read. */
export const STATES = ['rest', 'hovered', 'pressed'];

const GROUND_SLOT = { rest: 'ground', hovered: 'hovered', pressed: 'pressed' };

/**
 * Ground and label for one appearance in one state, resolved to colors. A
 * ground that is transparent, or an alpha step, is composited over the page
 * before it is read: reading `rgba(0, 0, 0, 0.08)` as if it were solid gives a
 * page of failures that are not there.
 *
 * @returns {{ground: object, label: object}|{unresolved: string[]}}
 */
export function combination(theme, state, values) {
  const page = parseColor(resolveToken(PAGE_TOKEN, values));
  const groundToken = theme[GROUND_SLOT[state]];
  const resolved = resolveToken(groundToken, values);
  const ground = resolved === 'transparent' ? page : parseColor(resolved);
  const label = parseColor(resolveToken(theme.label, values));
  const unresolved = [];
  if (!page) unresolved.push(PAGE_TOKEN);
  if (!ground) unresolved.push(groundToken);
  if (!label) unresolved.push(theme.label);
  if (unresolved.length) return { unresolved };
  return { ground: composite(ground, page), label };
}

/**
 * Every combination the map generates, measured.
 *
 * @returns {{appearance: string, state: string, ratio: number|null, unresolved?: string[]}[]}
 */
export function sweep(themes, values) {
  const rows = [];
  for (const theme of themes) {
    for (const state of STATES) {
      const built = combination(theme, state, values);
      if (built.unresolved) {
        rows.push({ appearance: theme.appearance, state, ratio: null, unresolved: built.unresolved });
      } else {
        rows.push({ appearance: theme.appearance, state, ratio: contrast(built.label, built.ground) });
      }
    }
  }
  return rows;
}

/**
 * Appearances that draw the same thing at rest: the same ground and the same
 * edge. The two rows with one ground, default and subtle, are told apart by
 * the edge only default draws.
 *
 * @returns {string[][]} groups of two or more appearance names
 */
export function duplicateGrounds(themes, values) {
  const byLook = new Map();
  for (const theme of themes) {
    const built = combination(theme, 'rest', values);
    if (built.unresolved) continue;
    const edge = theme.edge === 'transparent' ? 'transparent' : resolveToken(theme.edge, values);
    const key = `${toHex(built.ground)} ${edge}`;
    if (!byLook.has(key)) byLook.set(key, []);
    byLook.get(key).push(theme.appearance);
  }
  return [...byLook.values()].filter((group) => group.length > 1).map((group) => group.sort());
}

/**
 * The two sides of the record, measured — two arrays of keys, one per set of
 * `scripts/baselines/button-contrast-baseline.json`: `"appearance/state"` for
 * contrast and `"a+b"` for a duplicate pair. This is
 * what `scripts/lib/ratchet.mjs` is handed (#600), and it is the whole of what
 * this module says about the record.
 */
export function measured(themes, values) {
  return {
    contrast: sweep(themes, values)
      .filter((row) => row.ratio !== null && row.ratio < AA_TEXT)
      .map((row) => `${row.appearance}/${row.state}`),
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
      found.push(`${row.appearance}/${row.state}: cannot resolve ${row.unresolved.join(', ')}`);
      continue;
    }
    const key = `${row.appearance}/${row.state}`;
    if (unrecordedContrast.has(key)) {
      found.push(`${key}: label is ${row.ratio}:1 against its ground, under ${AA_TEXT}:1`);
    }
  }

  for (const key of duplicates.fresh ?? []) {
    found.push(`${key}: these appearances draw the same ground and edge, so the names are a distinction the interface does not draw`);
  }

  for (const key of contrast.stale ?? []) {
    found.push(`baseline entry "${key}" no longer fails — remove it`);
  }
  for (const key of duplicates.stale ?? []) {
    found.push(`baseline entry "${key}" no longer duplicates — remove it`);
  }

  return found;
}

/**
 * Reads the repo. Separated so every function above stays testable on strings.
 *
 * The values are the legacy color file, then the generated `--palette-*` and
 * `--ds-*` sets, so a theme map naming `--ds-background-brand-bold` resolves it
 * exactly as it resolves `--color-primary`. The legacy file is required, as it
 * always was; the generated ones are read when they are there.
 */
export function readRepo(root = REPO_ROOT) {
  const tokens = [
    fs.readFileSync(path.join(root, TOKENS_FILE), 'utf8'),
    ...COLOR_TOKEN_PATHS.map((file) => path.join(root, file))
      .filter((file) => fs.existsSync(file))
      .map((file) => fs.readFileSync(file, 'utf8')),
  ].join('\n');
  const button = fs.readFileSync(path.join(root, BUTTON_SCSS), 'utf8');
  return { values: tokenValues(tokens), themes: themeMap(button) };
}
