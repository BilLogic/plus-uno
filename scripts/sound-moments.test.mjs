import test from 'node:test';
import assert from 'node:assert/strict';
import { soundMoments, soundSpecJs, run } from './generate-sound-spec.mjs';

test('the generated moments own defaults and spring selection and omit silent events', () => {
  const registry = [{ name: 'X', tier: 'component', events: {
    enter: { spatial: 'spatial.fast', appearance: 'appearance.fast', sound: { token: 'notify' } },
    change: { appearance: 'appearance.fast', sound: { token: 'prompt', at: 'start' } }, exit: {},
  } }];
  const moments = soundMoments(registry);
  assert.deepEqual(moments[0], { row: 'X', tier: 'component', event: 'enter', transition: '', token: 'notify', at: 'land', when: '', spring: 'spatial.fast' });
  assert.equal(moments.length, 2);
  assert.equal(moments[1].spring, 'appearance.fast');
  assert.equal(moments[1].at, 'start');
  registry[0].events.enter.sound.token = 'error';
  assert.equal(soundMoments(registry)[0].token, 'error');
});

test('the existing sound-spec drift gate includes the registry-derived browser moments', () => {
  assert.match(soundSpecJs(), /export const SOUND_MOMENTS = /);
  assert.deepEqual(run(), []);
});
