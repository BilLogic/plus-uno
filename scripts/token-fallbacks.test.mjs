/**
 * #268 — the literal beside a token, and whether it agrees with it.
 *
 * The fixtures are the real shapes, measured across `design-system/src`,
 * `.storybook` and `prototypes`.
 *
 * COLOUR: 473 comparable literal fallbacks, 282 agreeing, 191 disagreeing
 * across 90 distinct token/literal pairs, and 27 `--color-*` names referenced
 * and never defined. The worst single case is `--color-on-surface-variant`,
 * which resolves to `#3f484a` and carries ten different fallbacks, none of them
 * the token.
 *
 * DIMENSION: 1075 comparable, 621 agreeing, 454 disagreeing across 68 distinct
 * pairs. The worst single case is `var(--size-section-gap-sm, 16px)`, written 61
 * times for a token that is `8px` — a fallback that doubles a gap rather than
 * shifting a shade.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  fallbackAudit,
  fallbackFailures,
  fallbackUsages,
  normaliseColour,
  normaliseDimension,
  resolveAliases,
  staleEntries,
  tokenDefinitions,
} from './token-fallbacks.mjs';

/* --------------------------------------------------------------- normalise */

test('the three spellings of one colour normalise together', () => {
  // Without this, `#fff` and `#ffffff` read as a disagreement and the check
  // reports a defect that is a formatting difference.
  assert.equal(normaliseColour('#FFF'), '#ffffff');
  assert.equal(normaliseColour('#ffffff'), '#ffffff');
  assert.equal(normaliseColour('rgb(255, 255, 255)'), '#ffffff');
  assert.equal(normaliseColour('rgba(255 255 255 / 1)'), '#ffffff');
});

test('anything that is not a literal colour is not comparable', () => {
  // A nested `var()` or a keyword has no value to compare here, and guessing
  // one would invent findings.
  for (const v of ['var(--color-x)', 'currentColor', 'transparent', '', null, undefined]) {
    assert.equal(normaliseColour(v), null, String(v));
  }
});

test('an out-of-range channel is rejected rather than wrapped', () => {
  assert.equal(normaliseColour('rgb(300, 0, 0)'), null);
});

/* ------------------------------------------------------------------ parsing */

test('token definitions are read, and the last one wins', () => {
  // Which is how the cascade reads them.
  const tokens = tokenDefinitions([
    { path: 'a.scss', text: '  --color-primary: #0472a8;\n  --color-surface: #f9f9fc;' },
    { path: 'b.scss', text: '  --color-primary: #111111;' },
  ]);
  assert.equal(tokens.get('--color-primary'), '#111111');
  assert.equal(tokens.size, 2);
});

test('a var() with no fallback is captured, with a null literal', () => {
  // It still names a token, and a token that does not exist is a finding
  // whether or not a literal sits beside it.
  const uses = fallbackUsages([{ path: 'a.scss', text: 'color: var(--color-primary);' }]);
  assert.deepEqual(uses, [{ path: 'a.scss', line: 1, token: '--color-primary', literal: null }]);
});

test('the line number is the line the usage is on', () => {
  const uses = fallbackUsages([{ path: 'a.scss', text: '\n\ncolor: var(--color-primary, #0472a8);' }]);
  assert.equal(uses[0].line, 3);
});

/* -------------------------------------------------------------------- audit */

test('a fallback that disagrees with its token is reported', () => {
  // The real worst case: the token is #3f484a and the literal is one of ten
  // greys that is not it.
  const audit = fallbackAudit({
    tokens: new Map([['--color-on-surface-variant', '#3f484a']]),
    usages: [{ path: 'a.scss', line: 4, token: '--color-on-surface-variant', literal: '#5c5c5c' }],
  });
  assert.equal(audit.disagreements.length, 1);
  assert.equal(audit.disagreements[0].expected, '#3f484a');
  assert.equal(audit.disagreements[0].found, '#5c5c5c');
  assert.equal(audit.disagreements[0].where, 'a.scss:4');
});

test('a fallback that agrees is counted and not reported', () => {
  // The check has to be able to pass: 282 of the 473 are already correct.
  const audit = fallbackAudit({
    tokens: new Map([['--color-primary', '#0472a8']]),
    usages: [{ path: 'a.scss', line: 1, token: '--color-primary', literal: 'rgb(4, 114, 168)' }],
  });
  assert.deepEqual(audit.disagreements, []);
  assert.equal(audit.agreeing, 1);
  assert.equal(audit.comparable, 1);
});

test('an undefined token is reported with a count, not as a disagreement', () => {
  // `--color-neutral-text` is read 40 times and defined nowhere, so its
  // fallback IS the colour. That is a different defect from a wrong shade.
  const audit = fallbackAudit({
    tokens: new Map([['--color-primary', '#0472a8']]),
    usages: [
      { path: 'a.scss', line: 1, token: '--color-neutral-text', literal: '#5c5c5c' },
      { path: 'b.scss', line: 2, token: '--color-neutral-text', literal: '#666666' },
    ],
  });
  assert.deepEqual(audit.undefinedTokens, [{ token: '--color-neutral-text', count: 2 }]);
  assert.deepEqual(audit.disagreements, []);
});

test('an incomparable pair is counted rather than silently dropped', () => {
  // Otherwise the check cannot say what share of the corpus it actually read.
  const audit = fallbackAudit({
    tokens: new Map([['--color-primary', '#0472a8']]),
    usages: [{ path: 'a.scss', line: 1, token: '--color-primary', literal: 'var(--color-x)' }],
  });
  assert.equal(audit.incomparable, 1);
  assert.equal(audit.comparable, 0);
});

/* ------------------------------------------------------------------ ratchet */

const baseline = { disagreements: ['--color-primary #ff0000'], undefinedTokens: ['--color-border'] };
const auditWith = (usages, tokens = new Map([['--color-primary', '#0472a8']])) =>
  fallbackAudit({ tokens, usages });

test('the recorded set holds', () => {
  const audit = auditWith([{ path: 'a.scss', line: 1, token: '--color-primary', literal: '#ff0000' }]);
  assert.deepEqual(fallbackFailures(audit, baseline), []);
});

test('a NEW disagreement fails, and names the token, both values and the place', () => {
  const audit = auditWith([{ path: 'a.scss', line: 9, token: '--color-primary', literal: '#ff00ff' }]);
  const failures = fallbackFailures(audit, baseline);
  assert.equal(failures.length, 1);
  assert.match(failures[0], /#0472a8/);
  assert.match(failures[0], /#ff00ff/);
  assert.match(failures[0], /a\.scss:9/);
});

test('the same recorded pair in a NEW file does not fail', () => {
  // Keyed on token+literal, not on file and line: a line number churns when
  // someone adds an import above it, and a baseline that churns gets
  // regenerated blindly.
  const audit = auditWith([{ path: 'moved.scss', line: 400, token: '--color-primary', literal: '#ff0000' }]);
  assert.deepEqual(fallbackFailures(audit, baseline), []);
});

test('a NEW undefined token fails; a recorded one does not', () => {
  const audit = auditWith([
    { path: 'a.scss', line: 1, token: '--color-border', literal: '#e5e7eb' },
    { path: 'a.scss', line: 2, token: '--color-invented', literal: '#000000' },
  ]);
  const failures = fallbackFailures(audit, baseline);
  assert.equal(failures.length, 1);
  assert.match(failures[0], /--color-invented/);
  assert.doesNotMatch(failures[0], /--color-border/);
});

test('fewer disagreements than recorded is not a failure', () => {
  // The point of a ratchet: fixing one must not fail the build.
  assert.deepEqual(fallbackFailures(auditWith([]), baseline), []);
});

test('no baseline fails rather than passing vacuously', () => {
  const failures = fallbackFailures(auditWith([]), null);
  assert.equal(failures.length, 1);
  assert.match(failures[0], /--update/);
});

test('a recorded entry that no longer holds is reported stale', () => {
  // A baseline that never shrinks is a backlog wearing a ratchet's clothes.
  const stale = staleEntries(auditWith([]), baseline);
  assert.ok(stale.includes('--color-primary #ff0000'));
  assert.ok(stale.some((s) => s.startsWith('--color-border')));
});

test('nothing is stale while every entry is still true', () => {
  const audit = fallbackAudit({
    tokens: new Map([['--color-primary', '#0472a8']]),
    usages: [
      { path: 'a.scss', line: 1, token: '--color-primary', literal: '#ff0000' },
      { path: 'a.scss', line: 2, token: '--color-border', literal: '#e5e7eb' },
    ],
  });
  assert.deepEqual(staleEntries(audit, baseline), []);
});

/* ------------------------------------------------- the dimension family */

test('the spellings of one length normalise together', () => {
  assert.equal(normaliseDimension('16px'), '16px');
  assert.equal(normaliseDimension('1rem'), '16px');
  assert.equal(normaliseDimension(' 0.5REM '), '8px');
});

test('a percentage stays a percentage', () => {
  // `--size-element-radius-full` is 999px and falls back to 50% eleven times.
  // On a non-square box those are different shapes, so they must not compare
  // equal — converting the percentage to px would report agreement.
  assert.equal(normaliseDimension('50%'), '50%');
  assert.notEqual(normaliseDimension('50%'), normaliseDimension('999px'));
});

test('a bare number is a length only when it is zero', () => {
  // `line-height: 1.5` is a ratio. Reading it as `1.5px` would invent a
  // disagreement with every line-height token in the system.
  assert.equal(normaliseDimension('0'), '0px');
  assert.equal(normaliseDimension('0rem'), '0px');
  assert.equal(normaliseDimension('1.5'), null);
});

test('em is not comparable, because this cannot know the element font size', () => {
  assert.equal(normaliseDimension('1.5em'), null);
});

test('anything that is not a length is not comparable', () => {
  for (const v of ['var(--size-x)', 'auto', 'calc(100% - 8px)', '#fff', '', null, undefined]) {
    assert.equal(normaliseDimension(v), null, String(v));
  }
});

test('aliases resolve to the value at the end of the chain', () => {
  // 124 of 207 dimension tokens are `var()` aliases. Without this the check
  // sees a fraction of its corpus and reports green on the rest.
  const resolved = resolveAliases(
    new Map([
      ['--size-card-gap-md', 'var(--size-spacing-medium-space-300)'],
      ['--size-spacing-medium-space-300', 'var(--size-primitive-16)'],
      ['--size-primitive-16', '16px'],
    ]),
  );
  assert.equal(resolved.get('--size-card-gap-md'), '16px');
});

test('a cyclic alias keeps its raw value rather than hanging', () => {
  // A cycle has no value, so incomparable is the honest answer.
  const resolved = resolveAliases(
    new Map([
      ['--a', 'var(--b)'],
      ['--b', 'var(--a)'],
    ]),
  );
  assert.equal(resolved.get('--a'), 'var(--b)');
  assert.equal(normaliseDimension(resolved.get('--a')), null);
});

test('the name pattern selects which family is read', () => {
  // The dimension check passes any custom-property name and then filters by
  // VALUE, because lengths are spread across --size-*, --spacing-*,
  // --font-size-* and --font-line-height-* with no shared prefix.
  const text = '  --size-element-gap-md: 10px;\n  --color-primary: #0472a8;';
  assert.equal(tokenDefinitions([{ path: 'a.scss', text }]).size, 1);
  assert.equal(tokenDefinitions([{ path: 'a.scss', text }], { names: /--[a-z0-9-]+/ }).size, 2);

  const use = 'gap: var(--size-element-gap-md, 16px);';
  assert.deepEqual(fallbackUsages([{ path: 'a.scss', text: use }]), []);
  assert.equal(fallbackUsages([{ path: 'a.scss', text: use }], { names: /--[a-z0-9-]+/ }).length, 1);
});

test('a disagreeing length is reported the same way a disagreeing colour is', () => {
  const audit = fallbackAudit({
    tokens: new Map([['--size-section-gap-sm', '8px']]),
    usages: [{ path: 'a.scss', line: 2, token: '--size-section-gap-sm', literal: '1rem' }],
    normalise: normaliseDimension,
    reportUndefined: false,
  });
  assert.equal(audit.disagreements.length, 1);
  assert.equal(audit.disagreements[0].expected, '8px');
  assert.equal(audit.disagreements[0].found, '16px');
});

test('an undefined name is ignored for dimensions and reported for colours', () => {
  // `var(--table-cell-x, 10px)` is a component-local custom property with a
  // documented default — correct code, and 324 of them would bury the colour
  // finding that is a real defect.
  const usages = [{ path: 'a.scss', line: 1, token: '--table-cell-x', literal: '10px' }];
  const quiet = fallbackAudit({ tokens: new Map(), usages, normalise: normaliseDimension, reportUndefined: false });
  assert.deepEqual(quiet.undefinedTokens, []);

  const loud = fallbackAudit({ tokens: new Map(), usages, normalise: normaliseDimension });
  assert.equal(loud.undefinedTokens.length, 1);
});

test('the failure text names the family it is talking about', () => {
  const audit = fallbackAudit({
    tokens: new Map(),
    usages: [{ path: 'a.scss', line: 1, token: '--size-invented', literal: '4px' }],
    normalise: normaliseDimension,
  });
  const failures = fallbackFailures(audit, { disagreements: [], undefinedTokens: [] }, { noun: 'dimension' });
  assert.match(failures[0], /dimension token/);
});
