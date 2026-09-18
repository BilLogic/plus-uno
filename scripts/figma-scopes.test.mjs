import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { classify, convention, failures, NEVER_TEXT, UNCLASSIFIED } from './figma-scopes.mjs';
import { run } from './check-figma-scopes.mjs';
import { messagesOf, policyTree } from './lib/policy-tree.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RECORDING = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'design-system/figma/colour-values.json'), 'utf8'),
);

test('every role in the accent naming is classified', () => {
  assert.deepEqual(classify('Warning/Warning'), { group: 'Warning', role: 'base' });
  assert.deepEqual(classify('Warning/Warning (Text)'), { group: 'Warning', role: 'text' });
  assert.deepEqual(classify('Warning/Warning Container'), { group: 'Warning', role: 'container' });
  assert.deepEqual(classify('Warning/On Warning'), { group: 'Warning', role: 'on' });
  assert.deepEqual(classify('Warning/On Warning Container'), { group: 'Warning', role: 'on-container' });
  assert.deepEqual(classify('Warning/Warning Icon'), { group: 'Warning', role: 'icon' });
  assert.deepEqual(classify('Warning/Warning Border'), { group: 'Warning', role: 'border' });
  assert.deepEqual(classify('Primary/Inverse Primary'), { group: 'Primary', role: 'inverse' });
});

test('a name recorded before the 2026-09-06 rename classifies the same', () => {
  // The accent groups shed their leading `_` that day. classify() still strips
  // it, so an older recording reads as the same seat rather than as a stray.
  assert.deepEqual(classify('_Warning/Warning (Text)'), { group: 'Warning', role: 'text' });
  assert.equal(classify('_Proposal/Warning Bold (candidate B)'), null);
});

test('`On X Container` is not read as a container', () => {
  // The order of the tests inside classify() is the whole of this: `On Warning
  // Container` ends in ` Container` and would be scoped as a ground, which is
  // the opposite of what it is.
  assert.equal(classify('Warning/On Warning Container').role, 'on-container');
  assert.notEqual(classify('Warning/On Warning Container').role, 'container');
});

test('candidates and strays are not classified', () => {
  assert.equal(classify('Proposal/Warning Bold (candidate B)'), null);
  // A neutral filed under Advocacy is not an Advocacy role, and treating it as
  // a base would put a stray into the majority vote.
  assert.equal(classify('Advocacy/on-surface'), null);
  assert.equal(classify('Neutral Colors/Surface container/surface-container'), null);
});

test('the unclassified list exempts a whole group, or exactly one variable', () => {
  // Proposal is a group key: nothing under it is asked for a convention.
  assert.equal(classify('Proposal/Info Container (candidate)'), null);

  // Focus Ring is a NAME key, and the narrowness is the point — a future
  // `Focus/*` intent base must still be held to what its peers do, which a
  // group-wide exemption would have silently stopped checking.
  assert.equal(classify('Focus/Focus Ring'), null);
  assert.deepEqual(classify('Focus/Focus'), { group: 'Focus', role: 'base' });
  assert.deepEqual(classify('Focus/Focus (Text)'), { group: 'Focus', role: 'text' });

  // Every exemption says why, because an unexplained one is indistinguishable
  // from a check somebody switched off.
  for (const [key, why] of Object.entries(UNCLASSIFIED)) {
    assert.ok(why.length > 20, `${key} has no reason worth printing`);
  }

  // A group named for something on Object.prototype is not an exemption.
  assert.deepEqual(classify('constructor/constructor'), {
    group: 'constructor',
    role: 'base',
  });
});

test('the exempted Focus Ring would otherwise fail against the base convention', () => {
  // What the exemption is worth: Focus Ring is STROKE_COLOR only, and every
  // group scopes its base EFFECT_COLOR,FRAME_FILL,SHAPE_FILL,STROKE_COLOR. The
  // real recording holds `Focus/Focus Ring`, and check:figma-scopes is green.
  const c = convention(RECORDING.scopes);
  assert.equal(RECORDING.scopes['colors / accent::Focus/Focus Ring'], 'STROKE_COLOR');
  assert.deepEqual(failures({ 'colors / accent::Focus/Focus Ring': 'STROKE_COLOR' }, c), []);
  assert.equal(failures({ 'colors / accent::Focus/Focus': 'STROKE_COLOR' }, c).length, 1);
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

/*
 * The policy half (#611). Measurement above classifies names; the gate is a
 * run against a fixture recording — a base offered as text, and an emptied
 * scopes map (the recording's analogue of an empty token directory).
 */

const SCOPE_ROLES = {
  base: 'EFFECT_COLOR,FRAME_FILL,SHAPE_FILL,STROKE_COLOR',
  text: 'TEXT_FILL',
  container: 'FRAME_FILL,SHAPE_FILL,STROKE_COLOR',
  on: 'ALL_SCOPES',
  'on-container': 'ALL_FILLS,STROKE_COLOR',
  icon: 'SHAPE_FILL',
  border: 'STROKE_COLOR',
};

const SCOPE_GROUPS = [
  'Primary',
  'Secondary',
  'Tertiary',
  'Danger',
  'Success',
  'Warning',
  'Info',
  'Focus',
  'Advocacy',
  'Relationship',
  'Social-Emotional',
];

/**
 * A recording whose majority matches the library convention, optionally with
 * one base offered as text.
 *
 * @param {{violateBase?: boolean}} [opts]
 * @returns {Record<string, string>}
 */
function scopedLibrary({ violateBase = false } = {}) {
  const scopes = {};
  for (const group of SCOPE_GROUPS) {
    scopes[`colors / accent::${group}/${group}`] =
      violateBase && group === 'Primary' ? 'ALL_SCOPES' : SCOPE_ROLES.base;
    scopes[`colors / accent::${group}/${group} (Text)`] = SCOPE_ROLES.text;
    scopes[`colors / accent::${group}/${group} Container`] = SCOPE_ROLES.container;
    scopes[`colors / accent::${group}/On ${group}`] = SCOPE_ROLES.on;
    scopes[`colors / accent::${group}/On ${group} Container`] = SCOPE_ROLES['on-container'];
    scopes[`colors / accent::${group}/${group} Icon`] = SCOPE_ROLES.icon;
    scopes[`colors / accent::${group}/${group} Border`] = SCOPE_ROLES.border;
  }
  return scopes;
}

test('a base offered as text in a fixture recording is a finding', () => {
  const { root, done } = policyTree({
    'design-system/figma/colour-values.json': JSON.stringify({ scopes: scopedLibrary({ violateBase: true }) }),
  });
  try {
    const found = messagesOf(run, root);
    assert.ok(
      found.some((message) => /Primary\/Primary/.test(message) && /TEXT_FILL/.test(message)),
      `expected a TEXT_FILL offer on the Primary base, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});

test('an emptied scopes recording fires the sentinel floor, not a clean sweep', () => {
  const { root, done } = policyTree({
    'design-system/figma/colour-values.json': JSON.stringify({ scopes: {} }),
  });
  try {
    const found = messagesOf(run, root);
    assert.ok(found.length > 0, 'an empty scopes recording must not report a clean sweep');
    assert.ok(
      found.some((message) => /only 0 variables have recorded scopes \(floor 75\)/.test(message)),
      `expected the scoped-variables floor, got:\n${found.join('\n')}`,
    );
  } finally {
    done();
  }
});
