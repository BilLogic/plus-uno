import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { INTENT, ROWS, ourTokens, compare, ageInDays, failures } from './atlassian-benchmark.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BENCHMARK = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'docs/evals/atlassian-benchmark.json'), 'utf8'),
);
const NOW = new Date('2026-08-29T00:00:00Z');
const opts = { now: NOW, measuredAt: BENCHMARK.measuredAt, maxAgeDays: 365 };

test('the repository passes its own benchmark', () => {
  const rows = compare(ourTokens(REPO_ROOT), BENCHMARK);
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
  const rows = [{ key: 'type.sizeSteps', ours: 50, direction: 'down', why: 'x' }];
  const base = { ours: { 'type.sizeSteps': 44 } };
  const found = failures(rows, base, opts);
  assert.equal(found.length, 1);
  assert.match(found[0], /may only FALL/);

  assert.deepEqual(failures([{ ...rows[0], ours: 40 }], base, opts), []);
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

test('the seven intents all still carry the same shape the finding rests on', () => {
  // The finding is "every intent names two roles and uses three". It stops being
  // true the moment one intent grows a -border or -icon, which is the point: the
  // ratchet above notices. This asserts the SHAPE the claim was measured on.
  const tokens = ourTokens(REPO_ROOT);
  const intents = ['primary', 'secondary', 'tertiary', 'danger', 'success', 'warning', 'info'];
  for (const name of intents) {
    const own = tokens.filter((t) => t.startsWith(`--color-${name}-`) || t === `--color-${name}`);
    assert.equal(own.length, 9, `${name} has ${own.length} tokens, not the shared 9`);
    assert.ok(own.includes(`--color-${name}-text`), `${name} has no -text`);
    assert.ok(own.includes(`--color-${name}-container`), `${name} has no -container`);
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
