#!/usr/bin/env node
/**
 * `npm run check:inline-jsx-tokens` — #1698: a component reads its tokens
 * through SCSS, not through a `style={{ ... }}` literal.
 *
 * WHY. `style={{ color: '#3f484a' }}` or `style={{ gap: 8 }}` on a component
 * root bypasses the cascade layers, the dark-mode theme and every check that
 * reads `.scss` for a token — the value is baked into the JS bundle instead.
 * The seam is the component's own stylesheet: a `data-*` attribute or a class
 * selects the rule, and the rule reads the named token. A `style={{...}}` that
 * only ever forwards a `var(--token)` straight through, or spreads a caller's
 * own `style` prop, is not this defect — the literal is what is counted.
 *
 * WHAT COUNTS AS A LITERAL. Inside a JSX `style={{ ... }}` object, a property
 * whose value is a quoted string or a bare number is a literal UNLESS, once
 * `var(--name` is stripped out of it, nothing but punctuation and whitespace
 * is left (a value that is pure `var()` reads, or `undefined`/a ternary over
 * two such reads, is not a literal). A spread (`...style`) is not a property.
 * A value that is an identifier or any other expression is a variable decided
 * at runtime and is skipped rather than guessed, the same allowance
 * `check-font-size-literals.mjs` makes for `fontSize: size`.
 *
 * WHAT IT CANNOT SEE. A literal buried inside a function call or a template
 * literal's static text (`` `${n}px` ``) is not unwrapped; only the top-level
 * value of each property is read. A `style` object built outside the JSX
 * attribute (assigned to a variable, then passed as `style={cfg}`) is invisible
 * — the attribute must itself open an object literal.
 *
 * WHERE. `.jsx` files under `design-system/src/components`, stories and tests
 * excluded: a story's demo frame is not a component.
 *
 * THE RATCHET. The count of literals per file may fall and never rise, and a
 * file not yet in the baseline starts at zero — the same shape as
 * `check:legacy-colors`. The record is `scripts/baselines/inline-jsx-tokens.json`,
 * read and written through `scripts/lib/ratchet.mjs` (`counts` form).
 *
 * HOW A PR LOWERS THE BASELINE. Move the literal into the component's `.scss`,
 * bound to a named token, and select it with a class or `data-*` attribute
 * instead of the inline style, then run
 *
 *     npm run check:inline-jsx-tokens -- --update
 *
 * and commit the regenerated file in the same PR. Never edit the JSON by hand.
 */

import { REPO_ROOT } from './lib/corpus.mjs';
import { main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';
import { trackedSources } from './lib/tracked-sources.mjs';

export { REPO_ROOT };
/** Repo-relative: what the registry row declares. */
export const BASELINE = 'scripts/baselines/inline-jsx-tokens.json';

export const SEARCH_ROOTS = ['design-system/src/components'];
export const SEARCHED = /\.jsx$/;
const EXCLUDED = /\.(stories|test)\.jsx$/;

/** True once every `var(--name` read is stripped out and nothing but punctuation/space is left. */
function isPureVarExpression(raw) {
  const stripped = raw.replace(/var\(\s*--[\w-]+\s*\)/g, '');
  return !/[a-zA-Z0-9_]/.test(stripped);
}

/** True when a property's raw value text is a literal: a quoted string or a bare number. */
export function isLiteralValue(raw) {
  const value = raw.trim();
  if (!value || value.startsWith('...')) return false;
  if (/^[a-zA-Z_$][\w$]*$/.test(value)) return false; // a bare identifier: decided at runtime
  const isQuoted = /^(['"`])[\s\S]*\1$/.test(value);
  const isNumber = /^-?\d+(\.\d+)?$/.test(value);
  if (!isQuoted && !isNumber) return false;
  const inner = isQuoted ? value.slice(1, -1) : value;
  if (isPureVarExpression(inner)) return false;
  return true;
}

/** The `{ ... }` body of a `style={{ ... }}` attribute, balanced on braces, starting after the attribute's opening `{{`. */
function* styleObjectBodies(text) {
  const re = /style=\{\{/g;
  let m;
  while ((m = re.exec(text))) {
    const start = re.lastIndex;
    let depth = 1;
    let i = start;
    while (i < text.length && depth > 0) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') depth--;
      i++;
    }
    yield { body: text.slice(start, i - 1), start };
  }
}

/** Split an object body into top-level `key: value` members, respecting nested braces/brackets/quotes. */
function topLevelMembers(body) {
  const members = [];
  let depth = 0;
  let current = '';
  let quote = null;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quote) {
      current += ch;
      if (ch === quote && body[i - 1] !== '\\') quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    if (ch === '{' || ch === '(' || ch === '[') depth++;
    if (ch === '}' || ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      members.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) members.push(current);
  return members;
}

/**
 * Every literal `style={{...}}` property in one file, as `{ line, key, value }`.
 *
 * @param {string} text
 */
export function literalStyleProps(text) {
  const found = [];
  for (const { body, start } of styleObjectBodies(text)) {
    for (const member of topLevelMembers(body)) {
      const colon = member.indexOf(':');
      if (colon === -1) continue; // a spread, e.g. `...style`
      const key = member.slice(0, colon).trim();
      const value = member.slice(colon + 1).trim();
      if (!isLiteralValue(value)) continue;
      const offset = start + body.indexOf(member);
      const line = text.slice(0, offset).split('\n').length;
      found.push({ line, key, value });
    }
  }
  return found;
}

/**
 * Measure sources: `{ path, text }[]` in, `Map<key, {count, line}>` out.
 *
 * @param {{path: string, text: string}[]} sources
 * @returns {Map<string, {count: number, line: number}>}
 */
export function measure(sources) {
  const found = new Map();
  for (const { path: file, text } of sources) {
    if (EXCLUDED.test(file)) continue;
    const props = literalStyleProps(text);
    if (props.length) {
      found.set(`inline-style-literal ${file}`, { count: props.length, line: props[0].line });
    }
  }
  return found;
}

/** Every tracked, searched file under the roots, read. */
export function sourcesOf(repoRoot) {
  return trackedSources(repoRoot, SEARCH_ROOTS, SEARCHED);
}

/** The ratchet's side of a measurement: a plain `key -> count` object in key order. */
const asRecord = (found) =>
  Object.fromEntries(
    [...found.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => [k, v.count]),
  );

/** Opened fresh on every call: `--update` writes the record and the gate then reads it back. */
const ratchetFor = (repoRoot) => openRatchet({ file: BASELINE, repoRoot });

export const REMEDY =
  '  -> bind the value to a named token in the component\'s own .scss and select it with a\n' +
  '     class or data-* attribute instead of the inline style. A migration PR lowers the\n' +
  '     baseline with `npm run check:inline-jsx-tokens -- --update`; never edit it by hand.';

/** @returns {import('./lib/findings.mjs').Finding[]} */
export function run({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  const ratchet = ratchetFor(repoRoot);
  const findings = ratchet.failures(asRecord(found)).map((failure) => {
    if (failure.kind === 'absent') return { message: failure.message };
    const [, ...rest] = failure.key.split(' ');
    return {
      file: rest.join(' '),
      line: found.get(failure.key)?.line,
      message:
        failure.kind === 'new'
          ? `inline JSX token: ${failure.count} x style={{...}} literal in a file the baseline does not hold (new code starts at zero)`
          : `inline JSX token: ${failure.count} x style={{...}} literal rose against a baseline of ${failure.recorded}`,
    };
  });
  if (!ratchet.absent) {
    for (const entry of ratchet.stale(asRecord(found))) {
      const [, ...rest] = entry.key.split(' ');
      findings.push({
        file: rest.join(' '),
        message: `inline-style-literal is gone (baseline held ${entry.recorded}); regenerate with \`npm run check:inline-jsx-tokens -- --update\``,
      });
    }
  }
  return findings;
}

/** The total against the record, and a nudge when the code is under it. */
export function summary({ repoRoot = REPO_ROOT, sources } = {}) {
  const found = measure(sources ?? sourcesOf(repoRoot));
  const now = [...found.values()].reduce((sum, { count }) => sum + count, 0);
  const recorded = [...ratchetFor(repoRoot).entries.values()].reduce((sum, { count }) => sum + count, 0);
  const fell = now < recorded ? ` — under the baseline of ${recorded}; record it with --update` : '';
  return `${now} inline JSX token literals in ${found.size} file(s)${fell}`;
}

/**
 * `--update` re-records the ratchet downward. It refuses a rise, so the only
 * movement it can write is down. It falls through to the gate, so a refused
 * update still fails loudly.
 */
function record() {
  const found = asRecord(measure(sourcesOf(REPO_ROOT)));
  const ratchet = ratchetFor(REPO_ROOT);
  const rising = ratchet.absent ? [] : ratchet.failures(found).filter((f) => f.kind === 'new' || f.kind === 'rose');
  if (rising.length) {
    console.error(`[check-inline-jsx-tokens] not recorded: ${rising.length} pair(s) rose or are new. Move the literal into .scss instead.`);
    return;
  }
  ratchet.update(found, {
    seed: {
      why:
        'A literal (not a var() read) sitting inside a component\'s JSX `style={{...}}`, per file (#1698). ' +
        'A count may fall and never rise; a file that reaches zero leaves the record. Regenerate with ' +
        '`npm run check:inline-jsx-tokens -- --update`; never edit by hand.',
    },
  });
  console.log(`[check-inline-jsx-tokens] baseline recorded: ${Object.keys(found).length} file(s)`);
}

main(import.meta.url, 'check:inline-jsx-tokens', { run, summary, remedy: REMEDY, fallThrough: { '--update': record } });
