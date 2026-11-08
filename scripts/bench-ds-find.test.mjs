import { test } from 'node:test';
import assert from 'node:assert/strict';

import { REPO_ROOT, isName, loadRatchet, loadSet, rankOf, runBench } from './bench-ds-find.mjs';
import { createLookup, render, speaksTokens } from './lib/ds-lookup.mjs';

const ratchet = loadRatchet();

for (const arm of Object.keys(ratchet)) {
  test(`${arm}: no hit@1 or hit@3 count falls below the ratchet`, () => {
    const { scores } = runBench({ aliases: arm === 'with-aliases' });
    for (const [set, kinds] of Object.entries(ratchet[arm])) {
      for (const [kind, floor] of Object.entries(kinds)) {
        const got = scores[set]?.[kind];
        assert.ok(got, `${set}/${kind} was not scored`);
        assert.ok(got.hit1 >= floor.hit1, `${arm} ${set}/${kind} hit@1 ${got.hit1} fell below the ratchet ${floor.hit1}`);
        assert.ok(got.hit3 >= floor.hit3, `${arm} ${set}/${kind} hit@3 ${got.hit3} fell below the ratchet ${floor.hit3}`);
      }
    }
  });
}

test('every name row is found at rank 1', () => {
  const { misses } = runBench();
  const names = misses.filter((m) => isName(m.kind));
  assert.ok(names.length > 0);
  for (const m of names) assert.equal(m.rank, 1, `name query "${m.q}" ranked ${m.rank || 'nowhere'}: ${m.top.join(', ')}`);
});

test('no intent query returns a constant', () => {
  const { misses } = runBench();
  for (const m of misses.filter((x) => x.kind.endsWith('intent'))) {
    const constants = m.results.filter((r) => /^[A-Z0-9_]+$/.test(r.name)).map((r) => r.name);
    assert.deepEqual(constants, [], `intent query "${m.q}" returned constants`);
  }
});

test('no query without token vocabulary returns a token', () => {
  const { misses } = runBench();
  const plain = misses.filter((m) => !speaksTokens(m.q));
  assert.ok(plain.length > 0);
  for (const m of plain) {
    const tokens = m.results.filter((r) => r.kind === 'token' || r.name.startsWith('--')).map((r) => r.name);
    assert.deepEqual(tokens, [], `"${m.q}" has no token vocabulary but returned tokens`);
  }
  assert.ok(speaksTokens('purple color token') && speaksTokens('--ds-text') && !speaksTokens('confirm before deleting'));
});

test('the everyday-word guard queries get neither a token row nor a guide row', () => {
  const guards = ['fill out a form', 'brand logo', 'copy to clipboard', 'grid of cards', 'an icon for calendar'];
  const labeled = new Set(loadSet('authored').map((r) => r.q));
  const { misses } = runBench();
  for (const q of guards) {
    assert.ok(labeled.has(q), `"${q}" is not a row of the authored set`);
    for (const m of misses.filter((x) => x.q === q)) {
      const stray = m.results.filter((r) => r.kind === 'token' || r.kind === 'guide').map((r) => `${r.kind}:${r.name}`);
      assert.deepEqual(stray, [], `"${q}" returned ${stray.join(', ')}`);
    }
  }
});

test('rankOf counts a not-here row whose redirect names a wanted component', () => {
  const results = [{ name: 'Switch', use: [{ name: 'Toggle' }] }, { name: 'Other' }];
  assert.equal(rankOf(results, ['Toggle']), 1);
  assert.equal(rankOf(results, ['Other']), 2);
  assert.equal(rankOf(results, ['Missing']), 0);
});

test('the sets are well formed', () => {
  for (const set of ['authored', 'heldout']) {
    for (const row of loadSet(set)) {
      assert.ok(row.q && row.kind && Array.isArray(row.want) && row.want.length, `${set}: malformed row ${JSON.stringify(row)}`);
    }
  }
});

test('every text line of ds_find stays within 160 characters for every bench query', () => {
  const lookup = createLookup(REPO_ROOT);
  for (const set of ['authored', 'heldout']) {
    for (const row of loadSet(set)) {
      for (const line of render('find', lookup.find(row.q)).split('\n')) {
        assert.ok(line.length <= 160, `"${row.q}" printed a ${line.length}-character line: ${line}`);
      }
    }
  }
});

test('a row summary is cut at a word boundary within 90 characters', () => {
  const lookup = createLookup(REPO_ROOT);
  let seen = 0;
  for (const row of [...loadSet('authored'), ...loadSet('heldout')]) {
    for (const r of lookup.find(row.q).results.filter((x) => x.summary)) {
      seen++;
      assert.ok(r.summary.length <= 90, `${r.name} summary is ${r.summary.length} characters`);
      assert.doesNotMatch(r.summary, /\s…$/);
    }
  }
  assert.ok(seen > 0);
});

test('a miss names the guideline topics the query carried', () => {
  const lookup = createLookup(REPO_ROOT);
  assert.match(lookup.find('zzzqq typography').next, /ds_guide\("typography"\)/);
  assert.doesNotMatch(lookup.find('zzzqq').next, /ds_guide\("/);
});

test('the hosted lookup (readPaths off) ranks the same names as the local one for every bench query', () => {
  const local = createLookup(REPO_ROOT);
  const hosted = createLookup(REPO_ROOT, { readPaths: false });
  const names = (lookup, q) => lookup.find(q).results.map((r) => `${r.kind}:${r.name}`);
  const queries = ['authored', 'heldout'].flatMap((set) => loadSet(set).map((row) => row.q));
  assert.ok(queries.length > 70);
  for (const q of queries) assert.deepEqual(names(hosted, q), names(local, q), `"${q}" ranks differently when hosted`);
});

test('the first find on a fresh lookup, index build included, takes under 300 ms', () => {
  const lookup = createLookup(REPO_ROOT, { readPaths: false });
  const start = performance.now();
  const { results } = lookup.find('confirm before deleting');
  const ms = performance.now() - start;
  assert.equal(results[0].name, 'Modal');
  assert.ok(ms < 300, `the first find took ${ms.toFixed(0)} ms`);
});
