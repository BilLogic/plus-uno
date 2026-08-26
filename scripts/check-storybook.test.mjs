/**
 * Tests for the Storybook gate's judgment.
 *
 * #191's lesson: a guard nobody has watched fail is a guard nobody knows works.
 * The browser suite itself takes ~135s and needs Playwright, so it cannot ride
 * `check:harness` — but the part that DECIDES, given a report, whether the branch
 * is red is pure and cheap, and that is what is asserted here. Every case is a
 * report the gate MUST block or MUST let through.
 *
 * The fixtures below are trimmed from a real `--reporter=json` run
 * (2026-08-26): the a11y message shape is verbatim from
 * `@storybook/addon-a11y`'s matcher, because a test against a re-typed message
 * would still pass after the addon changed the real one.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  UNIDENTIFIED_RULE,
  baselineRecord,
  classify,
  ratchet,
  ruleCounts,
} from './check-storybook.mjs';

const ROOT = '/repo';

/** The addon-a11y matcher's real message, one violation, verbatim in shape. */
const a11yMessage = (rule) =>
  `Error: expect(received).toHaveNoViolations(expected)\n\n` +
  `Expected the HTML found at $('#root > div') to have no violations:\n\n` +
  `<div class="thing">…</div>\n\n` +
  `Received:\n\n` +
  `"Some elements must satisfy something (${rule})"\n\n` +
  `Fix any of the following:\n  Element has insufficient something\n\n` +
  `You can find more information on this issue here: \n` +
  `https://dequeuniversity.com/rules/axe/4.12/${rule}?application=axeAPI`;

/** A `play` failure, which carries no a11y marker anywhere. */
const playMessage =
  'AssertionError: expected element to be visible\n' +
  ' ❯ play design-system/src/specs/Thing/Thing.stories.jsx:42:5';

const report = (files) => ({
  numTotalTests: files.reduce((n, f) => n + (f.assertionResults?.length ?? 0), 0),
  numPassedTests: files.reduce(
    (n, f) => n + (f.assertionResults ?? []).filter((t) => t.status === 'passed').length,
    0,
  ),
  numFailedTests: files.reduce(
    (n, f) => n + (f.assertionResults ?? []).filter((t) => t.status === 'failed').length,
    0,
  ),
  testResults: files,
});

const story = (name, status, failureMessages = []) => ({
  fullName: name,
  title: name,
  status,
  failureMessages,
});

const file = (rel, assertionResults, extra = {}) => ({
  name: `${ROOT}/${rel}`,
  status: assertionResults.some((t) => t.status === 'failed') ? 'failed' : 'passed',
  assertionResults,
  ...extra,
});

test('a green report yields nothing to block on and nothing to baseline', () => {
  const { a11y, blocking, totals } = classify(
    report([file('a.stories.jsx', [story('Default', 'passed'), story('Loading', 'passed')])]),
    ROOT,
  );
  assert.deepEqual(a11y, {});
  assert.deepEqual(blocking, []);
  assert.equal(totals.tests, 2);
  assert.equal(totals.passed, 2);
});

test('an a11y violation is recorded by rule, not treated as a blocking failure', () => {
  const { a11y, blocking } = classify(
    report([
      file('a.stories.jsx', [story('Default', 'failed', [a11yMessage('color-contrast')])]),
    ]),
    ROOT,
  );
  assert.deepEqual(a11y, { 'a.stories.jsx::Default': ['color-contrast'] });
  assert.deepEqual(blocking, []);
});

test('several rules on one story are all recorded, sorted', () => {
  const { a11y } = classify(
    report([
      file('a.stories.jsx', [
        story('Default', 'failed', [
          `${a11yMessage('label')}\n────────\n${a11yMessage('button-name')}`,
        ]),
      ]),
    ]),
    ROOT,
  );
  assert.deepEqual(a11y['a.stories.jsx::Default'], ['button-name', 'label']);
});

test('a play failure blocks and is never recorded as an a11y violation', () => {
  const { a11y, blocking } = classify(
    report([file('a.stories.jsx', [story('Default', 'failed', [playMessage])])]),
    ROOT,
  );
  assert.deepEqual(a11y, {});
  assert.equal(blocking.length, 1);
  assert.equal(blocking[0].where, 'a.stories.jsx::Default');
});

test('a file that failed without producing assertions blocks — the #157 flake shape', () => {
  const { blocking } = classify(
    report([
      {
        name: `${ROOT}/a.stories.jsx`,
        status: 'failed',
        assertionResults: [],
        message: "Failed to load url .storybook/vitest.setup.ts",
      },
    ]),
    ROOT,
  );
  assert.equal(blocking.length, 1);
  assert.match(blocking[0].message, /vitest\.setup\.ts/);
});

test('a violation with no helpUrl is still counted, under a named placeholder', () => {
  const { a11y } = classify(
    report([
      file('a.stories.jsx', [
        story('Default', 'failed', ['Expected the HTML found at $(\'#root\') to have no violations:']),
      ]),
    ]),
    ROOT,
  );
  assert.deepEqual(a11y['a.stories.jsx::Default'], [UNIDENTIFIED_RULE]);
});

test('the ratchet passes when the report matches the baseline exactly', () => {
  const base = { 'a.stories.jsx::Default': ['color-contrast'] };
  const { regressions, cleared } = ratchet({ 'a.stories.jsx::Default': ['color-contrast'] }, base);
  assert.deepEqual(regressions, []);
  assert.deepEqual(cleared, []);
});

test('a NEW rule on an already-violating story is a regression', () => {
  const base = { 'a.stories.jsx::Default': ['color-contrast'] };
  const { regressions } = ratchet({ 'a.stories.jsx::Default': ['color-contrast', 'label'] }, base);
  assert.equal(regressions.length, 1);
  assert.deepEqual(regressions[0].added, ['label']);
});

test('a violation on a story that had none is a regression', () => {
  const { regressions } = ratchet({ 'b.stories.jsx::New': ['label'] }, {});
  assert.equal(regressions.length, 1);
  assert.equal(regressions[0].story, 'b.stories.jsx::New');
});

test('the ratchet does not net out — one fixed and one broken still fails', () => {
  // The reason the baseline is keyed per story rather than kept as a total.
  const base = { 'a.stories.jsx::A': ['label'], 'b.stories.jsx::B': [] };
  const { regressions, cleared } = ratchet({ 'b.stories.jsx::B': ['label'] }, base);
  assert.equal(regressions.length, 1, 'the newly broken story must be reported');
  assert.deepEqual(cleared, ['a.stories.jsx::A'], 'the fixed one is a gain, not a pass');
});

test('fewer violations than the baseline passes, and reports the gain', () => {
  const base = { 'a.stories.jsx::A': ['label'], 'b.stories.jsx::B': ['label'] };
  const { regressions, cleared } = ratchet({ 'a.stories.jsx::A': ['label'] }, base);
  assert.deepEqual(regressions, []);
  assert.deepEqual(cleared, ['b.stories.jsx::B']);
});

test('dropping a rule from a story is a pass, not a regression', () => {
  const base = { 'a.stories.jsx::A': ['label', 'button-name'] };
  const { regressions } = ratchet({ 'a.stories.jsx::A': ['label'] }, base);
  assert.deepEqual(regressions, []);
});

test('the recorded baseline round-trips through the ratchet it feeds', () => {
  const parsed = classify(
    report([
      file('a.stories.jsx', [story('Default', 'failed', [a11yMessage('label')])]),
      file('b.stories.jsx', [story('Default', 'failed', [a11yMessage('color-contrast')])]),
    ]),
    ROOT,
  );
  const record = JSON.parse(JSON.stringify(baselineRecord(parsed)));

  assert.equal(record.violatingStories, 2);
  assert.deepEqual(record.rules, { 'color-contrast': 1, label: 1 });
  assert.deepEqual(ratchet(parsed.a11y, record.stories), { regressions: [], cleared: [] });
});

test('rule counts are ordered heaviest first', () => {
  const counts = ruleCounts({ a: ['label'], b: ['label'], c: ['button-name'] });
  assert.deepEqual(Object.keys(counts), ['label', 'button-name']);
});
