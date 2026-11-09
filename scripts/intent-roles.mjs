/**
 * The pure half of `check:intent-roles` (#368).
 *
 * WHAT THIS MEASURES. Every `border*` and `outline*` declaration in the design
 * system's stylesheets that paints its edge from an intent's bold FILL
 * (`--ds-background-danger-bold`) rather than from its edge role
 * (`--ds-border-danger`). The two can resolve to the same bytes and still not
 * say the same thing: the first is the fill color landing on an edge, the
 * second declares that an edge was intended and 3:1 (WCAG 1.4.11) was the bar it
 * was chosen against. The edge role can then move for edges alone.
 *
 * ─── WHAT IT DELIBERATELY CANNOT SEE ────────────────────────────────────────
 *
 *  1. INLINE STYLES. `style={{ borderColor: 'var(--ds-background-brand-bold)' }}`
 *     in JSX is invisible here; the corpus is stylesheets.
 *  2. WHETHER THE EDGE SHOULD BE AN EDGE. A `border-bottom` used as a two-pixel
 *     underline on a selected tab is a border to this scanner and arguably a
 *     graphic to a designer. Both are held to 3:1, so the distinction changes
 *     nothing about the bar.
 *  3. THE GROUND. Unlike `check:text-contrast`, this measures no ratio. It asks
 *     which role a declaration names.
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
 * spans newlines on purpose: `border:\n  1px solid var(--ds-border-brand);` is
 * one declaration written across two lines and a line-anchored scanner misses
 * it. `[^;{}]` stops the match at the end of the declaration rather than
 * running into the next rule.
 */
export const EDGE = new RegExp(
  '(^|[\\s;{])(border(?:-(?:top|right|bottom|left))?(?:-color)?|outline(?:-color)?)\\s*:\\s*([^;{}]*);',
  'g',
);

/**
 * A role's fill and its edge are named separately — `--ds-background-danger-bold`
 * and `--ds-border-danger` — so the fill on an edge is the base standing in for
 * the role. Only the bold fill counts: a subtle
 * fill on an edge is a different (pale) color, not a role skipped, and its
 * `-hovered` / `-pressed` steps are states of the fill. `neutral` has no
 * `--ds-border-neutral` role to name, so it is not one of these.
 *
 * The PLUS intent a theme-map row is keyed by maps to its role (ADR-035):
 * primary is `brand` (Lagoon), info is `information`
 * (it moved to blue so it stops reading as brand), and danger, success and
 * warning keep their names. Secondary and tertiary have no role there.
 * `DS_ROLES` is derived from that map plus the two roles no PLUS intent
 * became, so the two lists cannot drift apart.
 */
const DS_ROLE_OF = { primary: 'brand', danger: 'danger', success: 'success', warning: 'warning', info: 'information' };
const DS_ROLES = [...Object.values(DS_ROLE_OF), 'discovery', 'selected'];

const BASE = new RegExp(
  `var\\(\\s*(--ds-background-(?:${DS_ROLES.join('|')})-bold)\\s*[,)]`,
  'g',
);

/** The edge role a bold fill stands in for: `--ds-border-danger`. */
function roleOf(token) {
  return `--ds-border-${/^--ds-background-([a-z]+)-bold$/.exec(token)[1]}`;
}

export function stylesheets(root = REPO_ROOT, dir = CORPUS) {
  // `tokens/` DEFINES the roles; `--ds-border-danger: var(--palette-…)` is the
  // definition of the role, not a call site that skipped it.
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
          role: roleOf(token[1]),
        });
      }
    }
  }
  return uses;
}

/**
 * A STATE COLOR MIXED BY HAND (`Colors.mdx` § States: hover and press have
 * their own tokens, never a hand-mixed color).
 *
 * `color-mix(in srgb, var(--ds-background-brand-bold), black 8%)` and
 * `filter: brightness(0.92)` are both a hover color computed at the call site.
 * The system already names that darkening: the role's own `.hovered` and
 * `.pressed` tokens, and `--ds-interaction-hovered` / `-pressed` where the
 * base fill cannot change. A
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

/** `{ [file]: count }` — what the `mixedStates` set is compared against. */
export function mixCounts(uses) {
  const out = {};
  for (const use of uses) out[use.file] = (out[use.file] ?? 0) + 1;
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
          'Use the role\'s named hovered and pressed tokens (or `--ds-interaction-hovered` / `-pressed`) instead.',
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
 * quoted Sass maps — `'danger': ('--ds-background-danger-bold', …, '--ds-border-danger')`
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
    // The edge slot is the one where a row names its `--ds-border-*` role.
    const edgeSlots = new Set();
    for (const { intent, slots } of rows) {
      const role = DS_ROLE_OF[intent];
      slots.forEach((slot, i) => {
        if (role && slot === `--ds-border-${role}`) edgeSlots.add(i);
      });
    }
    for (const { intent, slots, line } of rows) {
      const role = DS_ROLE_OF[intent];
      const bases = role ? [`--ds-background-${role}-bold`] : [];
      for (const i of edgeSlots) {
        if (bases.includes(slots[i])) {
          uses.push({ file, line, intent, slot: i + 1, token: slots[i], role: roleOf(slots[i]) });
        }
      }
    }
  }
  return uses;
}

/** `{ [file]: { border, outline } }` — one count per set of the baseline, read by `acrossSets`. */
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
 * sets declare, and since #600 the module decides it — `border` and `outline`
 * as two sets — while what a verdict says stays here.
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
