/**
 * The design system's tokens module: one grammar, one resolver, one set of
 * contrast maths, one ratchet (#506, parent #491 § "Tokens module (C)").
 *
 * WHY IT LIVES HERE AND NOT IN `scripts/`. The WCAG core this file now holds
 * was correct and well tested inside `scripts/button-contrast.mjs` — and
 * unreachable from a story, because that file imports `node:fs` on its first
 * line. So five story files carried their own copy of luminance and contrast,
 * and the numbers a designer read in Storybook were computed by different code
 * from the numbers the checks fail the build on — until #507 deleted all five
 * and pointed them here. This module is the one both can
 * import: it is PLAIN ESM with no Node-only import and no Node global anywhere
 * in it, so Vite bundles it for the browser and `node --test` loads it
 * unchanged.
 *
 * ANYTHING THAT NEEDS THE FILESYSTEM IS NEXT DOOR, IN `tokens-node.mjs`
 * (#620): where the tokens live, what the families are, and whether two values
 * are the same value — the corpus read through `scripts/lib/corpus.mjs` rather
 * than through an `fs` of its own. For two releases this sentence named a file
 * that did not exist and every check answered those three questions privately;
 * it now names the file that answers them. A story imports THIS half; a check
 * imports either.
 *
 * ─── THE TOKEN GRAMMAR ──────────────────────────────────────────────────────
 *
 * A token name is `--` followed by one or more of: LOWERCASE LETTERS `a-z`,
 * DIGITS `0-9`, and HYPHEN `-`. Nothing else. Uppercase letters, underscores,
 * dots and escapes are rejected, not folded: every token this design system
 * defines is lowercase kebab-case (`--color-primary-state-08`,
 * `--font-size-body-md`), so a grammar that accepted more would be describing
 * tokens that do not exist and would quietly match CSS that is not ours. `--`
 * alone is not a name; a name needs at least one character after the dashes.
 *
 * The two places the grammar is used are both derived from it here rather than
 * hand-written by a caller:
 *
 *   tokenDeclarationPattern(prefix)  `--name: value;`  — a DEFINITION
 *   varReferencePattern(prefix)      `var(--name…`     — a USE
 *
 * RECONCILED IN #507. Twenty-odd other regexes across `scripts/` used to spell
 * this grammar for themselves, and they did not all agree — some allowed
 * uppercase, some stopped at the first `)`, some missed a `var()` fallback.
 * They now compose these two patterns or `TOKEN_NAME` instead, and every check
 * was proved to produce byte-identical findings across the tree first. Two
 * differences were real and are recorded where they were handled: a name is no
 * longer read case-insensitively (no custom property in the tree has an
 * uppercase letter), and `scripts/doc-identifiers.mjs` still rejects a trailing
 * hyphen on top of this grammar, because `--color-` in a docs page means a
 * FAMILY rather than a token.
 */

/**
 * The grammar, as a pattern SOURCE (not a RegExp) so callers can compose it
 * with their own anchors and flags without inheriting `lastIndex` state.
 */
export const TOKEN_NAME_TAIL = '[a-z0-9-]+';

/** A whole token name, prefix included. */
export const TOKEN_NAME = `--${TOKEN_NAME_TAIL}`;

/** Escape a literal prefix so `--color-` cannot act as a pattern. */
function literal(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Every `--name: value;` declaration, optionally narrowed to a prefix.
 *
 * Group 1 is the token name, group 2 its raw value with surrounding whitespace
 * left on. A fresh RegExp each call, because a `/g` pattern carries `lastIndex`
 * and a shared one is a bug that only shows up on the second caller.
 *
 * @param {string} [prefix] e.g. `--color-`; defaults to every token
 */
export function tokenDeclarationPattern(prefix = '--') {
  return new RegExp(`(${literal(prefix)}${TOKEN_NAME_TAIL})\\s*:\\s*([^;]+);`, 'g');
}

/**
 * Every `var(--name` reference, optionally narrowed to a prefix. Group 1 is the
 * token name. It deliberately does not try to match the closing paren: a
 * fallback can itself contain `var()`, and the name is all this needs.
 *
 * @param {string} [prefix]
 */
export function varReferencePattern(prefix = '--') {
  return new RegExp(`var\\(\\s*(${literal(prefix)}${TOKEN_NAME_TAIL})`, 'g');
}

/** A whole-value alias: the value is nothing but one `var()`, fallback or not. */
const ALIAS = new RegExp(`^var\\(\\s*(${TOKEN_NAME})\\s*(?:,[^)]*)?\\)$`, 'i');

/**
 * Every token declaration in a stylesheet's text, as a Map from name to raw
 * value. The FIRST definition wins and the rest are ignored.
 *
 * That is not arbitrary: only the `:root` light values are read, and `:root`
 * comes first in `_colors.scss`. A dark-mode sweep is a second job and a bigger
 * one — it needs the dark page as well as the dark tokens — and saying so here
 * is better than a half-measure that looks like both.
 *
 * @param {string} source stylesheet text
 * @param {{prefix?: string}} [options]
 * @returns {Map<string, string>}
 */
export function readTokens(source, { prefix = '--' } = {}) {
  const values = new Map();
  if (typeof source !== 'string') return values;
  const pattern = tokenDeclarationPattern(prefix);
  let match = pattern.exec(source);
  while (match) {
    if (!values.has(match[1])) values.set(match[1], match[2].trim());
    match = pattern.exec(source);
  }
  return values;
}

/**
 * Follow `--a: var(--b)` until a literal value or a dead end.
 *
 * This is not a nicety. `--color-info` IS `var(--color-tertiary)` in the token
 * file — the duplicate #312 measured in a browser is an alias written in one
 * line, and a resolver that stopped at the first `var()` would report it as an
 * unreadable token instead of as the alias it is.
 *
 * The `seen` set is the cycle guard: `--a: var(--b); --b: var(--a);` is a
 * stylesheet that compiles and a resolver that does not return.
 *
 * A `var()` FALLBACK is followed through to the token, not to the fallback: the
 * fallback is what a browser paints when the token is missing, and a token that
 * resolves is the case this answers. What the fallback says instead is
 * `check:colour-fallbacks`' question, and it stays its own check.
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
  const alias = ALIAS.exec(value.trim());
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
 * Lay `top` over `bottom`. `bottom` is assumed opaque, which it is in every
 * caller here: the page is a solid colour and only state layers carry alpha.
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

/** `#rrggbb` for a resolved colour, so two grounds can be compared by name. */
export function toHex({ r, g, b }) {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/* ─── THE RATCHET ──────────────────────────────────────────────────────────── */

/**
 * Normalise either side of a ratchet into `Map<key, count>` plus the original
 * entries, so one function serves every baseline shape the repo has written.
 *
 * Accepted: an array of keys (each counted once, which is the shape
 * `button-contrast-baseline.json` uses), a plain object of key → count, a
 * plain object of key → `{count, …}` (the shape `text-contrast-baseline.json`
 * uses, where the rest of the record is the human's reason), or a Map of
 * either. Insertion order is preserved, because callers render in it.
 */
function tally(side) {
  const counts = new Map();
  const entries = new Map();
  if (!side) return { counts, entries };

  const pairs = Array.isArray(side)
    ? side.map((key) => [key, 1])
    : side instanceof Map ? [...side.entries()] : Object.entries(side);

  for (const [key, value] of pairs) {
    const count = typeof value === 'number' ? value : Number(value?.count ?? 1);
    counts.set(key, Number.isFinite(count) ? count : 1);
    entries.set(key, typeof value === 'object' && value !== null ? value : undefined);
  }
  return { counts, entries };
}

/**
 * A ratchet, not a threshold: classify a run's failures against a recorded
 * baseline.
 *
 * Nine baseline files across `scripts/` each spelled this rule for themselves
 * and none of them spelled all of it. The rule, entire:
 *
 *   NEW    a failure the baseline does not record. The build fails: fix it, or
 *          record it with a reason.
 *   KNOWN  a failure the baseline records. Silent — unless `rose` is set,
 *          because a recorded count may SHRINK and must never GROW.
 *   FIXED  a recorded entry that no longer occurs. Also a failure, and the
 *          direction most baselines forget: a fix that leaves its exemption
 *          behind turns the baseline into a list of things nobody has looked
 *          at. A ratchet that cannot shrink is a list.
 *
 * It classifies and nothing else. How a caller WORDS a finding, and whether
 * `rose` or `fixed` is fatal for that particular check, stays with the check —
 * which is what keeps the existing reports byte-identical.
 *
 * @param {string[]|Record<string, number|{count?: number}>|Map<string, unknown>} failures
 * @param {string[]|Record<string, number|{count?: number}>|Map<string, unknown>} [baseline]
 * @returns {{
 *   new: {key: string, count: number}[],
 *   known: {key: string, count: number, recorded: number, rose: boolean, entry: object|undefined}[],
 *   fixed: {key: string, recorded: number, entry: object|undefined}[],
 * }}
 */
export function ratchet(failures, baseline) {
  const found = tally(failures);
  const recorded = tally(baseline);

  const fresh = [];
  const known = [];
  for (const [key, count] of found.counts) {
    if (!recorded.counts.has(key)) {
      fresh.push({ key, count });
      continue;
    }
    const was = recorded.counts.get(key);
    known.push({ key, count, recorded: was, rose: count > was, entry: recorded.entries.get(key) });
  }

  const fixed = [];
  for (const [key, was] of recorded.counts) {
    if (found.counts.has(key)) continue;
    fixed.push({ key, recorded: was, entry: recorded.entries.get(key) });
  }

  return { new: fresh, known, fixed };
}
