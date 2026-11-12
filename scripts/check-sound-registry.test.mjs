// check:sound-registry, mutation-tested on fixtures.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { run } from './check-sound-registry.mjs';

const tokens = new Set(['notify', 'prompt']);
const silent = [
  { row: 'Banner', why: 'Banners are always silent' },
  { row: 'FieldBox', event: 'error', why: 'field errors are silent' },
];
const row = (name, events, tier = 'component') => ({ name, tier, events });
const ev = (sound) => ({ enter: { spatial: 'spatial.fast', sound } });
const go = (registry, sources = []) => run({ registry, silent, tokens, sources });

test('a row whose sound names a real token passes', () => {
  assert.deepEqual(go([row('Flag', ev({ token: 'notify', at: 'land' }))]), []);
});

test('a sound cell naming a missing token fails', () => {
  const f = go([row('Flag', ev({ token: 'chime' }))]);
  assert.equal(f.length, 1);
  assert.match(f[0].message, /chime/);
  assert.match(f[0].message, /not a sound token/);
});

test('a bad `at` fails', () => {
  assert.match(go([row('Flag', ev({ token: 'notify', at: 'later' }))])[0].message, /at "later"/);
});

test('a sound cell on a wholly silent row fails', () => {
  const f = go([row('Banner', ev({ token: 'notify' }))]);
  assert.match(f[0].message, /Banner/);
  assert.match(f[0].message, /always-silent/);
});

test('a sound cell on a silent event fails, other events pass', () => {
  const events = { error: { spatial: 'spatial.fast', sound: { token: 'prompt' } }, enter: { spatial: 'spatial.fast', sound: { token: 'prompt' } } };
  const f = go([row('FieldBox', events)]);
  assert.equal(f.length, 1);
  assert.match(f[0].message, /FieldBox.*error/);
});

test('a silent row with no sound cell passes', () => {
  assert.deepEqual(go([row('Banner', { enter: { spatial: 'spatial.fast' } })]), []);
});

test('a silent entry must have a reason', () => {
  const f = run({ registry: [], silent: [{ row: 'X' }], tokens, sources: [] });
  assert.match(f[0].message, /why/);
});

test('AudioContext outside the sound runtime fails', () => {
  const f = go([], [{ path: 'design-system/src/components/Foo/Foo.jsx', text: 'const c = new AudioContext();' }]);
  assert.match(f[0].message, /AudioContext/);
  assert.equal(f[0].file, 'design-system/src/components/Foo/Foo.jsx');
});

test('new Audio( outside the sound runtime fails', () => {
  const f = go([], [{ path: 'design-system/src/x.js', text: 'a\nnew Audio("x.mp3")' }]);
  assert.match(f[0].message, /new Audio\(/);
  assert.equal(f[0].line, 2);
});

test('the sound runtime and tests may use them', () => {
  const text = 'new AudioContext(); new Audio(1)';
  assert.deepEqual(go([], [
    { path: 'design-system/src/sound/play.js', text },
    { path: 'design-system/src/components/Flag/Flag.test.jsx', text },
  ]), []);
});
