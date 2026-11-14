import assert from 'node:assert/strict';
import { test } from 'node:test';

import { heroFitFailures, overflowing, overhang } from './docs-hero-fit.mjs';

const rect = (left, top, right, bottom) => ({ left, top, right, bottom });
const hero = (box, holder, part = 'svg') => ({ label: 'card:x', part, box, holder });

test('a drawn box inside its holder has no overhang', () => {
  const h = hero(rect(0, 10, 300, 90), rect(0, 0, 300, 100));
  assert.deepEqual(overhang(h), { left: 0, top: 0, right: 0, bottom: 0 });
  assert.equal(overflowing([h]).length, 0);
});

test('sub-pixel overhang is not a defect', () => {
  assert.equal(overflowing([hero(rect(-0.6, 0, 300.5, 100), rect(0, 0, 300, 100))]).length, 0);
});

test('a hero wider than its card is named with the sides it pokes past', () => {
  const wide = hero(rect(-226, -50, 527, 251), rect(0, 0, 300, 160));
  const lines = heroFitFailures([{ page: 'foundations-overview--docs', width: 1280, heroes: [wide] }]);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /foundations-overview--docs @1280: card:x svg extends past its holder/);
  assert.match(lines[0], /left 226px/);
});

test('every failing hero is reported, not the first', () => {
  const bad = hero(rect(0, 0, 400, 100), rect(0, 0, 300, 100), 'frame');
  const lines = heroFitFailures([
    { page: 'a', width: 768, heroes: [bad, bad] },
    { page: 'b', width: 1024, heroes: [bad] },
  ]);
  assert.equal(lines.length, 3);
});

test('an svg that slices is a failure even when its box fits', () => {
  const h = { ...hero(rect(0, 0, 300, 100), rect(0, 0, 300, 100)), slice: true };
  const lines = heroFitFailures([{ page: 'a', width: 1280, heroes: [h] }]);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /slice/);
});
