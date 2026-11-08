import { test } from 'node:test';
import assert from 'node:assert/strict';

import { iconsInstalled, isName, loadRatchet, loadSet, rankOf, runBench } from './bench-ds-find.mjs';

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
