/**
 * The pure half of `check:intent-roles` (#368).
 *
 * WHAT THE ROLE TOKENS ARE. `design-system/src/tokens/_color_roles.scss` names
 * two roles the seven intent colors never had: `--color-X-icon` and
 * `--color-X-border`. Six of the seven borders resolve to the base, because the
 * base already clears WCAG 1.4.11's 3:1 on all five surface steps. Warning does
 * not — #9f8205 falls to 2.87:1 on `--color-surface-container-highest` — so
 * `--color-warning-border` is the one role with a value of its own.
 *
 * WHAT THIS MEASURES. Every `border*` and `outline*` declaration in the design
 * system's stylesheets that paints its edge from an intent BASE rather than
 * from the base's `-border` role. On 2026-08-29 there were 135 of them and the
 * role tokens had no users at all, which is the state the roles file described
 * itself as leaving behind: "these tokens have no users yet, so this file
 * changes no pixel — it is the vocabulary that the uses can then be moved onto,
 * one at a time, against a ratchet." This is that ratchet.
 *
 * WHY A RENAME THAT CHANGES NO PIXEL IS WORTH DOING. `border-color:
 * var(--color-danger)` and `border-color: var(--color-danger-border)` resolve to
 * the same bytes today. They do not say the same thing. The first is a use of
 * the bold fill color that happens to land on an edge; the second is a
 * declaration that an edge was intended and 3:1 was the bar it was chosen
 * against. The value can then move for borders alone — which is exactly what
 * warning needs and what no amount of care at 110 call sites can deliver.
 *
 * ─── WHAT IT DELIBERATELY CANNOT SEE ────────────────────────────────────────
 *
 *  1. INLINE STYLES. `style={{ borderColor: 'var(--color-primary)' }}` in JSX
 *     is invisible here; the corpus is stylesheets. `SidebarTab.jsx` alone
 *     carries an `outline` in a style object.
 *  2. WHETHER THE EDGE SHOULD BE AN EDGE. A `border-bottom` used as a two-pixel
 *     underline on a selected tab is a border to this scanner and arguably a
 *     graphic to a designer. Both are held to 3:1, so the distinction changes
 *     nothing about the bar.
 *  3. A FOCUS RING IS NOT QUITE A BORDER. All 24 `outline` uses take
 *     `--color-primary`, and Atlassian names that role separately —
 *     `color.border.focused` beside `color.border`. We have no
 *     `--color-X-focus-ring`, so those 24 are RECORDED here rather than
 *     migrated: renaming them to `-border` would assert an equivalence nobody
 *     has decided. That is a finding about a missing token, not a defect in the
 *     call sites.
 *  4. THE GROUND. Unlike `check:text-contrast`, this measures no ratio. It asks
 *     which vocabulary a declaration uses. The contrast argument lives in
 *     `_color_roles.scss` beside the values.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { documents } from './lib/corpus.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');

/** Stylesheets that consume tokens. The files that DEFINE them are not scanned. */
export const CORPUS = 'design-system/src';

export const INTENTS = ['primary', 'secondary', 'tertiary', 'danger', 'success', 'warning', 'info'];

/**
 * An edge declaration and its value.
 *
 * The property alternation is explicit so that `border-radius`, `border-width`
 * and `border-style` — which carry no color — cannot match. The value part
 * spans newlines on purpose: `border:\n  1px solid var(--color-primary);` is
 * one declaration written across two lines and a line-anchored scanner misses
 * it. `[^;{}]` stops the match at the end of the declaration rather than
 * running into the next rule.
 */
export const EDGE = new RegExp(
  '(^|[\\s;{])(border(?:-(?:top|right|bottom|left))?(?:-color)?|outline(?:-color)?)\\s*:\\s*([^;{}]*);',
  'g',
);

const BASE = new RegExp(`var\\(\\s*(--color-(?:${INTENTS.join('|')}))\\s*[,)]`, 'g');

export function stylesheets(root = REPO_ROOT, dir = CORPUS) {
  // `tokens/` DEFINES the roles; `--color-danger-border: var(--color-danger)`
  // is the definition of the role, not a call site that skipped it.
  return documents(dir, { root, ext: ['.scss', '.css'] }).filter(
    (file) => !file.includes('/tokens/'),
  );
}

/** `border`/`outline` uses of an intent BASE, one entry per token occurrence. */
export function edgeUses(files, root = REPO_ROOT) {
  const uses = [];
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    for (const declaration of source.matchAll(EDGE)) {
      const property = declaration[2];
      const kind = property.startsWith('outline') ? 'outline' : 'border';
      for (const token of declaration[3].matchAll(BASE)) {
        const at = declaration.index + declaration[0].indexOf(token[0]);
        uses.push({
          file,
          line: source.slice(0, at).split('\n').length,
          property,
          kind,
          token: token[1],
          role: `${token[1]}-border`,
        });
      }
    }
  }
  return uses;
}

/**
 * A STATE COLOR MIXED BY HAND (`foundations/color.md` rule 2: "Use state
 * layers for interaction — never hardcode hover/active colors").
 *
 * `color-mix(in srgb, var(--color-primary), black 8%)` and
 * `filter: brightness(0.92)` are both a hover color computed at the call site.
 * The system already names that darkening: `--color-shadow-state-08/12/16`
 * are the black washes at 8, 12 and 16%, and laid over the fill as a
 * `background-image` they composite to the same color the mix produced. A
 * mix with `transparent` is an alpha, not a darkening, and is not counted.
 * Comments are stripped first, so a sentence about the old mix is not a use.
 */
export const MIXED = /color-mix\([^;{}]*?(?<![-\w])(?:black|white)(?![-\w(])|filter\s*:\s*brightness\(/g;

/**
 * Blank out comments, keeping every newline so line numbers hold. A `//`
 * after `:` or `(` is a URL (`https://`, `url(//cdn…)`), not a comment.
 */
const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:(])\/\/[^\n]*/g, (c, lead) => lead + ' '.repeat(c.length - lead.length));

/** Hand-mixed state colors, one entry per occurrence. */
export function mixedUses(files, root = REPO_ROOT) {
  const uses = [];
  for (const file of files) {
    const source = stripComments(fs.readFileSync(path.join(root, file), 'utf8'));
    for (const match of source.matchAll(MIXED)) {
      uses.push({ file, line: source.slice(0, match.index).split('\n').length, kind: 'mix' });
    }
  }
  return uses;
}

/** `{ [file]: { mix } }` — what the `mixedStates` record is compared against. */
export function mixCounts(uses) {
  const out = {};
  for (const use of uses) {
    out[use.file] = out[use.file] ?? { mix: 0 };
    out[use.file].mix += 1;
  }
  return out;
}

/** The verdicts on the `mixedStates` set, worded. */
export function mixFailures(uses, { failures: verdicts = [], stale = [], unreviewed = [] } = {}) {
  const found = [];
  for (const verdict of verdicts) {
    if (verdict.kind === 'new') {
      const lines = uses.filter((u) => u.file === verdict.key).map((u) => u.line);
      found.push(
        `${verdict.key} mixes a state color by hand and is not in the baseline: line ${lines.join(', ')}. ` +
          'Lay `--color-shadow-state-08/12/16` (or the role\'s own `-state-NN`) over the fill instead.',
      );
      continue;
    }
    const lines = uses.filter((u) => u.file === verdict.key).map((u) => u.line).join(', ');
    found.push(
      verdict.kind === 'rose'
        ? `${verdict.key} has ${verdict.count} hand-mixed state color(s), up from ${verdict.recorded} (line ${lines}). Use a state layer.`
        : `${verdict.key} has ${verdict.count} hand-mixed state color(s), down from ${verdict.recorded} — ` +
          'the ratchet moved and the record did not. Lower the baseline to match.',
    );
  }
  for (const { key } of stale) {
    found.push(`${key} is recorded under mixedStates and no longer mixes a state color. Delete its entry.`);
  }
  for (const key of unreviewed) {
    found.push(`${key} is recorded under mixedStates without a reason. Say why, or move it onto a state layer.`);
  }
  return found;
}

/**
 * A ROLE SLOT IN A THEME MAP. Button and Dropdown carry their intent colors as
 * quoted Sass maps — `'danger': ('--color-danger', …, '--color-danger-border')`
 * — and the edge is painted from `var(#{$col-border})` far from the name, so
 * `edgeUses` cannot see which token a map row hands its edge. The map says
 * which slot is the edge: a slot where any intent row names its own `-border`
 * role. An intent row that puts its BASE in that slot is a use, and each one is
 * a finding outright. There is no record of these, and none is expected,
 * because a map row is one string to change.
 */
const MAP_ROW = /'([\w-]+)'\s*:\s*\(([^()]*)\)/g;

export function themeMapUses(files, root = REPO_ROOT) {
  const uses = [];
  for (const file of files) {
    const source = stripComments(fs.readFileSync(path.join(root, file), 'utf8'));
    const rows = [];
    for (const match of source.matchAll(MAP_ROW)) {
      if (!INTENTS.includes(match[1])) continue;
      const slots = [...match[2].matchAll(/'([^']*)'/g)].map((m) => m[1].trim());
      rows.push({ intent: match[1], slots, line: source.slice(0, match.index).split('\n').length });
    }
    const edgeSlots = new Set();
    for (const { intent, slots } of rows) {
      slots.forEach((slot, i) => {
        if (slot === `--color-${intent}-border`) edgeSlots.add(i);
      });
    }
    for (const { intent, slots, line } of rows) {
      for (const i of edgeSlots) {
        if (slots[i] === `--color-${intent}`) {
          uses.push({ file, line, intent, slot: i + 1, token: slots[i], role: `${slots[i]}-border` });
        }
      }
    }
  }
  return uses;
}

/** `{ [file]: { border, outline } }` — what the baseline is compared against. */
export function counts(uses) {
  const out = {};
  for (const use of uses) {
    out[use.file] = out[use.file] ?? { border: 0, outline: 0 };
    out[use.file][use.kind] += 1;
  }
  return out;
}

/**
 * The WORDING of the ratchet's verdicts. A recorded remainder may shrink only
 * after the record shrinks with it: a count BELOW its baseline is a finding in
 * its own right, because a baseline that no longer describes the code is a
 * baseline nobody can read. That is the BOTH-directions ratchet this record's
 * row declares in `scripts/lib/ratchet-shapes.mjs`, and since #600 the module
 * decides it — per named count, `border` and `outline` separately — while what
 * a verdict says stays here.
 *
 * THE ORDER IS THE RUN'S. It used to be a walk over the union of the two sides
 * in filename order; the module reports in the order the run met each file, and
 * the stale entries and the reasonless ones after. Nothing about a single
 * finding's text changed.
 *
 * @param {object[]} uses  the measurement, for the lines a new file's finding
 *        names — the record holds counts, not places.
 * @param {{failures?: object[], stale?: object[], unreviewed?: string[]}} verdicts
 */
export function failures(uses, { failures: verdicts = [], stale = [], unreviewed = [] } = {}) {
  const found = [];

  for (const verdict of verdicts) {
    if (verdict.kind === 'new') {
      const lines = uses.filter((u) => u.file === verdict.key).map((u) => `${u.line} (${u.property})`);
      found.push(
        `${verdict.key} paints an edge from an intent base and is not in the baseline: ` +
          `line ${lines.join(', ')}. Use the \`-border\` role, or record the reason it cannot.`,
      );
      continue;
    }
    found.push(
      verdict.kind === 'rose'
        ? `${verdict.key} has ${verdict.count} ${verdict.field} use(s) of an intent base, up from ` +
          `${verdict.recorded}. The roles exist; use them.`
        : `${verdict.key} has ${verdict.count} ${verdict.field} use(s), down from ${verdict.recorded} — ` +
          'the ratchet moved and the record did not. Lower the baseline to match.',
    );
  }

  for (const { key } of stale) {
    found.push(`${key} is recorded in the baseline and no longer has any use. Delete its entry.`);
  }
  for (const key of unreviewed) {
    found.push(`${key} is baselined without a reason. Say why the base is still right there, or migrate it.`);
  }
  return found;
}
