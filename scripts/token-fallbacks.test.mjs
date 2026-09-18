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

import { dimensionKey } from '../design-system/src/lib/tokens-node.mjs';
import {
  fallbackAudit,
  fallbackFailures,
  fallbackSides,
  fallbackUsages,
} from './token-fallbacks.mjs';

/*
 * WHAT IS NOT TESTED HERE ANY MORE. The value keys and the walk of the token
 * sources were this file's until #621 and are `tokens-node.mjs`'s now, pinned
 * in `design-system/tests/tokens-node.test.js` — including the two facts this
 * file used to assert for itself: that the three spellings of one colour key
 * together, and that the token sources are read with the LAST definition
 * winning, which is what the cascade does. What is left below is what is about
 * FALLBACKS.
 */

/* ------------------------------------------------------------------ parsing */

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

/* --------------------------------------------------- the two sides, and the
                                                        wording of a failure */

/*
 * WHAT MOVED OUT OF HERE IN #600. The classification these tests used to drive
 * — what is new, what has gone stale, what an absent record does — is
 * `scripts/lib/ratchet.mjs`'s, and it is asserted once, against all twelve live
 * records, in `scripts/lib/ratchet-conformance.mjs`. Asserting it a thirteenth
 * time over a hand-built baseline object would be asserting the shape this
 * module would have chosen rather than the one on disk, which is the mistake the
 * first attempt at #599 made. What is still this module's, and tested here, is
 * the SHAPE it hands the ratchet and what a finding SAYS.
 */

const auditWith = (usages, tokens = new Map([['--color-primary', '#0472a8']])) =>
  fallbackAudit({ tokens, usages });

test('the measured side is keyed on token+literal, so the same pair in a new file is one key', () => {
  // A line number churns when someone adds an import above it, and a baseline
  // that churns gets regenerated blindly. The pair is the decision.
  const audit = auditWith([
    { path: 'a.scss', line: 9, token: '--color-primary', literal: '#ff0000' },
    { path: 'moved.scss', line: 400, token: '--color-primary', literal: '#ff0000' },
  ]);
  assert.deepEqual(fallbackSides(audit).disagreements, ['--color-primary #ff0000']);
});

test('the measured side carries the detail a finding needs and the record does not', () => {
  const audit = auditWith([{ path: 'a.scss', line: 9, token: '--color-primary', literal: '#ff00ff' }]);
  const sides = fallbackSides(audit);
  assert.equal(sides.detail.get('--color-primary #ff00ff').where, 'a.scss:9');
  assert.deepEqual(sides.undefinedTokens, []);
});

test('an undefined name comes back with its use count, which is not in the record either', () => {
  const audit = auditWith([
    { path: 'a.scss', line: 1, token: '--color-invented', literal: '#000000' },
    { path: 'b.scss', line: 2, token: '--color-invented', literal: '#000000' },
  ]);
  const sides = fallbackSides(audit);
  assert.deepEqual(sides.undefinedTokens, ['--color-invented']);
  assert.equal(sides.uses.get('--color-invented'), 2);
});

test('a NEW disagreement names the token, both values and the place', () => {
  const audit = auditWith([{ path: 'a.scss', line: 9, token: '--color-primary', literal: '#ff00ff' }]);
  const failures = fallbackFailures(audit, { disagreements: ['--color-primary #ff00ff'] });
  assert.equal(failures.length, 1);
  assert.match(failures[0], /#0472a8/);
  assert.match(failures[0], /#ff00ff/);
  assert.match(failures[0], /a\.scss:9/);
});

test('a NEW undefined token names itself and how many uses it has', () => {
  const audit = auditWith([
    { path: 'a.scss', line: 1, token: '--color-border', literal: '#e5e7eb' },
    { path: 'a.scss', line: 2, token: '--color-invented', literal: '#000000' },
  ]);
  const failures = fallbackFailures(audit, { undefinedTokens: ['--color-invented'] });
  assert.equal(failures.length, 1);
  assert.match(failures[0], /--color-invented {2}\(1 use\(s\)\)/);
  assert.doesNotMatch(failures[0], /--color-border/);
});

test('nothing new is nothing said, whatever the audit found', () => {
  // The point of a ratchet: fixing one, or holding 87 of them, must not fail
  // the build. Which keys are new is the ratchet's call, not this function's.
  const audit = auditWith([{ path: 'a.scss', line: 1, token: '--color-primary', literal: '#ff0000' }]);
  assert.deepEqual(fallbackFailures(audit, {}), []);
});

/* ------------------------------------------------- the dimension family */

test('an incomparable value is counted rather than called equal', () => {
  // A cycle has no value, so `tokenCorpus` hands back the raw `var()` — and
  // incomparable is the honest answer for it, not agreement.
  const audit = fallbackAudit({
    tokens: new Map([['--a', 'var(--b)']]),
    usages: [{ path: 'a.scss', line: 1, token: '--a', literal: '16px' }],
    normalise: dimensionKey,
    reportUndefined: false,
  });
  assert.equal(audit.incomparable, 1);
  assert.equal(audit.comparable, 0);
});

test('the name pattern selects which family is read', () => {
  // The dimension check passes any custom-property name and then filters by
  // VALUE, because lengths are spread across --size-*, --spacing-*,
  // --font-size-* and --font-line-height-* with no shared prefix.
  const use = 'gap: var(--size-element-gap-md, 16px);';
  assert.deepEqual(fallbackUsages([{ path: 'a.scss', text: use }]), []);
  assert.equal(fallbackUsages([{ path: 'a.scss', text: use }], { prefix: '--' }).length, 1);
});

test('a disagreeing length is reported the same way a disagreeing colour is', () => {
  const audit = fallbackAudit({
    tokens: new Map([['--size-section-gap-sm', '8px']]),
    usages: [{ path: 'a.scss', line: 2, token: '--size-section-gap-sm', literal: '1rem' }],
    normalise: dimensionKey,
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
  const quiet = fallbackAudit({ tokens: new Map(), usages, normalise: dimensionKey, reportUndefined: false });
  assert.deepEqual(quiet.undefinedTokens, []);

  const loud = fallbackAudit({ tokens: new Map(), usages, normalise: dimensionKey });
  assert.equal(loud.undefinedTokens.length, 1);
});

test('the failure text names the family it is talking about', () => {
  const audit = fallbackAudit({
    tokens: new Map(),
    usages: [{ path: 'a.scss', line: 1, token: '--size-invented', literal: '4px' }],
    normalise: dimensionKey,
  });
  const failures = fallbackFailures(audit, { undefinedTokens: ['--size-invented'] }, { noun: 'dimension' });
  assert.match(failures[0], /dimension token/);
});
