import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { INTENT, ROWS, ourTokens, textScale, compare, ageInDays, failures } from './atlassian-benchmark.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BENCHMARK = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'docs/evals/atlassian-benchmark.json'), 'utf8'),
);
const NOW = new Date('2026-08-29T00:00:00Z');
const opts = { now: NOW, measuredAt: BENCHMARK.measuredAt, maxAgeDays: 365 };

test('the repository passes its own benchmark', () => {
  const rows = compare(ourTokens(REPO_ROOT), BENCHMARK, REPO_ROOT);
  assert.deepEqual(failures(rows, BENCHMARK, opts), []);
});

test('every enforced row carries the argument for its direction', () => {
  // A gate whose reason is not written down is a gate somebody deletes.
  for (const row of ROWS) {
    if (!row.direction) continue;
    assert.ok(row.why && row.why.length > 40, `${row.key} has no argued reason`);
  }
});

test('the token count is a real read of the token files', () => {
  const tokens = ourTokens(REPO_ROOT);
  assert.ok(tokens.length > 400, `only ${tokens.length} tokens found`);
  assert.ok(tokens.includes('--color-primary'));
  assert.ok(tokens.every((t) => t.startsWith('--')));
  assert.deepEqual(tokens, [...new Set(tokens)].sort(), 'duplicated or unsorted');
});

test('an `up` row that FALLS is a finding, and one that rises is not', () => {
  const rows = [{ key: 'intent.iconTokens', ours: 0, direction: 'up', why: 'x' }];
  const base = { ours: { 'intent.iconTokens': 3 } };
  const found = failures(rows, base, opts);
  assert.equal(found.length, 1);
  assert.match(found[0], /may only RISE/);

  const risen = failures([{ ...rows[0], ours: 9 }], base, opts);
  assert.deepEqual(risen, []);
});

test('a `down` row that GROWS is a finding, and one that shrinks is not', () => {
  const rows = [{ key: 'type.scaleSpread', ours: 1.4, direction: 'down', why: 'x' }];
  const base = { ours: { 'type.scaleSpread': 1.26 } };
  const found = failures(rows, base, opts);
  assert.equal(found.length, 1);
  assert.match(found[0], /may only FALL/);

  assert.deepEqual(failures([{ ...rows[0], ours: 1.05 }], base, opts), []);
});

test('a row with no direction is never a finding, however far apart', () => {
  // Differing from Atlassian is often correct — they ship 100 chart colours for
  // a surface we do not have. Only the argued rows are gated.
  const rows = [{ key: 'colour.total', ours: 1, theirs: 441, direction: null }];
  assert.deepEqual(failures(rows, { ours: {} }, opts), []);
});

test('an enforced row with no recorded floor is itself a finding', () => {
  const rows = [{ key: 'type.lineHeights', ours: 46, direction: 'down', why: 'x' }];
  const found = failures(rows, { ours: {} }, opts);
  assert.equal(found.length, 1);
  assert.match(found[0], /no recorded starting point/);
});

test('a stale, undated or future recording fails', () => {
  const clean = { ours: {} };
  assert.match(
    failures([], clean, { ...opts, measuredAt: '2024-01-01' })[0],
    /days old \(ceiling 365\)/,
  );
  assert.match(failures([], clean, { ...opts, measuredAt: 'never' })[0], /no readable/);
  assert.match(failures([], clean, { ...opts, measuredAt: '2027-01-01' })[0], /in the future/);
});

test('ageInDays counts whole days and rejects nonsense', () => {
  assert.equal(ageInDays('2026-08-29', NOW), 0);
  assert.equal(ageInDays('2026-08-19', NOW), 10);
  assert.equal(ageInDays('not a date', NOW), null);
});

test('the seven intents all still carry the same shape', () => {
  // The finding this benchmark was written on was "every intent names two roles
  // and uses three": nine tokens each — base, container, -text, six state
  // overlays — and no -border or -icon. The role layer added those two, so the
  // shape is eleven now and the ratchet rows sit at 7. What the assertion is
  // for is unchanged: all seven must move TOGETHER. An intent that grows a role
  // the others lack is a vocabulary that only some of the system can use.
  const tokens = ourTokens(REPO_ROOT);
  const intents = ['primary', 'secondary', 'tertiary', 'danger', 'success', 'warning', 'info'];
  for (const name of intents) {
    const own = tokens.filter((t) => t.startsWith(`--color-${name}-`) || t === `--color-${name}`);
    assert.equal(own.length, 11, `${name} has ${own.length} tokens, not the shared 11`);
    for (const role of ['text', 'container', 'icon', 'border']) {
      assert.ok(own.includes(`--color-${name}-${role}`), `${name} has no -${role}`);
    }
  }
  assert.ok(INTENT.test('--color-warning-text'));
  assert.ok(!INTENT.test('--color-advocacy-text'), 'a subject colour is not an intent');
});

test('the roles we DO have are counted under our own names, not Atlassian spelling', () => {
  // The first draft of this file recorded "0 background tokens" by grepping for
  // the literal string. --color-surface* IS the background role; measuring our
  // vocabulary instead of our system produced a finding that was not true.
  const tokens = ourTokens(REPO_ROOT);
  assert.ok(tokens.filter((t) => t.startsWith('--color-surface')).length > 20);
  assert.ok(tokens.filter((t) => t.startsWith('--color-outline')).length > 5);
});

test('the type scale is measured from rendered sizes, not from token names', () => {
  // Counting --font-size-* declarations measures the wrong thing: 27 of the 44
  // are FontAwesome icon sizes and five more are aliases. What is left is the
  // scale, and its defect is the SPACING rather than the count.
  const { sizes, ratios, distinctRatios, spread } = textScale(REPO_ROOT);
  assert.deepEqual(sizes, [12, 14, 16, 20, 24, 28, 32, 40, 56, 64, 72, 80]);
  assert.equal(ratios.length, sizes.length - 1);
  assert.ok(sizes.every((s, i) => i === 0 || s > sizes[i - 1]), 'sizes must ascend and be distinct');
  // 20px is only reachable by following --font-size-h5 -> --font-size-125,
  // so its presence proves the alias chain is resolved rather than skipped.
  assert.ok(sizes.includes(20), 'the alias chain to --font-size-125 was not followed');
  assert.deepEqual(distinctRatios, [1.111, 1.125, 1.143, 1.167, 1.2, 1.25, 1.4]);
  // Spread, not the count of ratios: whole-pixel rounding gives a perfect
  // geometric run a different ratio at every step, so counting them would score
  // a real scale worse than this list.
  assert.equal(spread, 1.26);
  assert.equal(textScale(REPO_ROOT).spread, Number((1.4 / 1.111).toFixed(3)));
  // Twelve distinct text sizes against Atlassian's fourteen steps: parity. The
  // raw token count of 44 is what made this look like bloat.
  assert.equal(sizes.length, 12);
});

test('the recorded Atlassian side is the measurement, not a guess', () => {
  // These are the numbers read from atlassian.design on 2026-08-29. If someone
  // edits them to make a row pass, this notices.
  assert.equal(BENCHMARK.totals.color, 441);
  assert.equal(BENCHMARK.colourByRole['color.background'], 208);
  assert.equal(BENCHMARK.typeSteps.count, 14);
  assert.equal(BENCHMARK.typeSteps.names.length, 14);
  assert.ok(BENCHMARK.source.startsWith('https://atlassian.design/'));
  assert.ok(BENCHMARK.method.length > 80, 'the method must be reproducible from the file alone');
});
