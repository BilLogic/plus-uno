import { test } from 'node:test';
import assert from 'node:assert/strict';

import { REPO_ROOT, iconsInstalled, isName, loadRatchet, loadSet, rankOf, runBench } from './bench-ds-find.mjs';
import { createLookup, render, speaksTokens } from './lib/ds-lookup.mjs';

const ratchet = loadRatchet();
const withIcons = iconsInstalled();

for (const arm of Object.keys(ratchet)) {
  test(`${arm}: no hit@1 or hit@3 count falls below the ratchet`, () => {
    const { scores } = runBench({ aliases: arm === 'with-aliases' });
    for (const [set, kinds] of Object.entries(ratchet[arm])) {
      for (const [kind, floor] of Object.entries(kinds)) {
        if (kind.endsWith('icon') && !withIcons) continue; // Font Awesome metadata absent: icon rows are not scored
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
