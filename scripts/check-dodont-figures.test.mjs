/**
 * Every rule in `check:dodont-figures`, watched failing, each with a green twin.
 * The last case runs the real tree.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { captionText, checkSource, isRunOn, run } from './check-dodont-figures.mjs';

const pair = (extra = '', doEx = '<Button label="Save" />', dontEx = '<Button label="OK" />') =>
  `<DoDontPair\n  doExample={${doEx}}\n  doCaption="Name the action."\n  dontExample={${dontEx}}\n  dontCaption="Say nothing about it."\n  ${extra}\n/>`;
const messages = (src) => checkSource(src).map((p) => p.message);

test('a clean pair is silent: the green twin', () => {
  assert.deepEqual(messages(pair()), []);
});

test('an inline style on a figure fails', () => {
  assert.ok(messages(pair('', '<div style={{ display: "flex" }}><Button /></div>')).some((m) => /inline style/.test(m)));
});

test('an <svg> literal fails', () => {
  assert.ok(messages(pair('', undefined, '<svg viewBox="0 0 1 1"><rect /></svg>')).some((m) => /<svg>/.test(m)));
});

test('an <img> fails', () => {
  assert.ok(messages(pair('', '<img src="a.png" alt="" />')).some((m) => /<img>/.test(m)));
});

test('a hex color fails', () => {
  assert.ok(messages(pair('', '<Tag label="x" color="#ff0000" />')).some((m) => /hex color/.test(m)));
});

test('a missing caption fails, on a pair and on a Do', () => {
  assert.ok(messages('<DoDontPair doExample={<Button />} dontExample={<Button />} />').some((m) => /no caption/.test(m)));
  assert.ok(messages('<Do><Button /></Do>').some((m) => /no caption/.test(m)));
  assert.deepEqual(messages('<Do caption="Keep it short."><Button /></Do>'), []);
});

test('a two-sentence caption fails; a fragment caption with code reads as text', () => {
  assert.ok(messages('<Dont caption="Too long. Then more."><Button /></Dont>').some((m) => /one sentence/.test(m)));
  assert.deepEqual(messages('<Do caption={<>A ring on <C>--ds-border-focused</C>, outside the button.</>}><Button /></Do>'), []);
  assert.equal(isRunOn('Use e.g. one action.'), false);
  assert.equal(captionText('{<>One <C>x</C> here.</>}'), 'One x here.');
});

test('stacked needs a reason', () => {
  assert.ok(messages(pair('stacked')).some((m) => /stacked with no reason/.test(m)));
  assert.deepEqual(messages(pair('stacked="The table needs the full width."')), []);
});

test('the real tree is clean', () => {
  const found = run();
  assert.deepEqual(found.map((f) => `${f.file}:${f.line} ${f.message}`), []);
});
