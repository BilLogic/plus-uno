import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { classify, convention, failures, NEVER_TEXT } from './figma-scopes.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RECORDING = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'design-system/figma/colour-values.json'), 'utf8'),
);

test('every role in the accent naming is classified', () => {
  assert.deepEqual(classify('_Warning/Warning'), { group: 'Warning', role: 'base' });
  assert.deepEqual(classify('_Warning/Warning (Text)'), { group: 'Warning', role: 'text' });
  assert.deepEqual(classify('_Warning/Warning Container'), { group: 'Warning', role: 'container' });
  assert.deepEqual(classify('_Warning/On Warning'), { group: 'Warning', role: 'on' });
  assert.deepEqual(classify('_Warning/On Warning Container'), { group: 'Warning', role: 'on-container' });
  assert.deepEqual(classify('_Warning/Warning Icon'), { group: 'Warning', role: 'icon' });
  assert.deepEqual(classify('_Warning/Warning Border'), { group: 'Warning', role: 'border' });
  assert.deepEqual(classify('_Primary/Inverse Primary'), { group: 'Primary', role: 'inverse' });
});

test('`On X Container` is not read as a container', () => {
  // The order of the tests inside classify() is the whole of this: `On Warning
  // Container` ends in ` Container` and would be scoped as a ground, which is
  // the opposite of what it is.
  assert.equal(classify('_Warning/On Warning Container').role, 'on-container');
  assert.notEqual(classify('_Warning/On Warning Container').role, 'container');
});

test('candidates and strays are not classified', () => {
  assert.equal(classify('_Proposal/Warning Bold (candidate B)'), null);
  // A neutral filed under _Advocacy is not an Advocacy role, and treating it as
  // a base would put a stray into the majority vote.
  assert.equal(classify('_Advocacy/on-surface'), null);
  assert.equal(classify('Neutral Colors/Surface container/surface-container'), null);
});

test('the convention is derived from the library and covers every role', () => {
  const c = convention(RECORDING.scopes);
  for (const role of ['base', 'text', 'container', 'on', 'on-container', 'icon', 'border']) {
    assert.ok(c.has(role), `no convention for ${role}`);
  }
  assert.equal(c.get('text').scopes, 'TEXT_FILL');
  assert.equal(c.get('base').scopes, 'EFFECT_COLOR,FRAME_FILL,SHAPE_FILL,STROKE_COLOR');
  assert.equal(c.get('icon').scopes, 'SHAPE_FILL');
  assert.equal(c.get('border').scopes, 'STROKE_COLOR');
  // Unanimity is what makes it a convention rather than a preference.
  assert.equal(c.get('base').agreeing, c.get('base').of);
});

test('the library currently agrees with itself', () => {
  assert.deepEqual(failures(RECORDING.scopes, convention(RECORDING.scopes)), []);
});

test('a base offered as text fails, however it is spelled', () => {
  const c = convention(RECORDING.scopes);
  for (const spelling of ['ALL_SCOPES', 'ALL_FILLS,STROKE_COLOR', 'FRAME_FILL,TEXT_FILL']) {
    const found = failures({ 'colors / accent::_Primary/Primary': spelling }, c);
    assert.equal(found.length, 1, spelling);
    assert.match(found[0], /offers it as a TEXT_FILL/);
  }
});

test('a role that disagrees with its peers fails even without a text offer', () => {
  const c = convention(RECORDING.scopes);
  const found = failures({ 'colors / accent::_Danger/Danger Border': 'EFFECT_COLOR' }, c);
  assert.equal(found.length, 1);
  assert.match(found[0], /where 7 of 7 groups scope their border as STROKE_COLOR/);
});

test('a role held by too few groups has no convention to enforce', () => {
  // Otherwise the first two variables of a new role would legislate for it.
  const c = convention({ 'a::_X/X Icon': 'SHAPE_FILL', 'a::_Y/Y Icon': 'FRAME_FILL' });
  assert.equal(c.has('icon'), false);
});

test('a role whose groups genuinely disagree has no majority', () => {
  const scopes = {};
  for (const g of ['A', 'B', 'C', 'D']) scopes[`x::_${g}/${g} Border`] = `SCOPE_${g}`;
  assert.equal(convention(scopes).has('border'), false);
});

test('every never-text role names its reason', () => {
  for (const [role, why] of Object.entries(NEVER_TEXT)) {
    assert.ok(why.length > 30, `${role} has no reason worth printing`);
  }
});
