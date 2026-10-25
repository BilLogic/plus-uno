import assert from 'node:assert/strict';
import test from 'node:test';

import { batches, diff, fingerprint, probeScript, readSpec, specRecord } from './push-figma-color.mjs';

const SPEC = readSpec();
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

/**
 * Just enough of the Plugin API for the generated scripts, with Figma's habits
 * that matter here: a new collection starts with one "Mode 1", a new variable
 * starts on ALL_SCOPES, colors come back as float32, and descriptions come back
 * HTML-escaped.
 */
function fakeFigma() {
  let next = 1;
  const id = (p) => `${p}:${next++}`;
  const collections = [];
  const variables = [];
  const styles = [];
  // Figma HTML-escapes descriptions on write; the probe must not call that drift.
  const escape = (d) => d.replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const f32 = (c) => ({ r: Math.fround(c.r), g: Math.fround(c.g), b: Math.fround(c.b), a: Math.fround(c.a ?? 1) });
  const figma = {
    variables: {
      getLocalVariableCollectionsAsync: async () => [...collections],
      getLocalVariablesAsync: async () => [...variables],
      createVariableCollection(name) {
        const c = {
          id: id('VariableCollectionId'), name, hiddenFromPublishing: false, modes: [{ modeId: id('m'), name: 'Mode 1' }],
          renameMode(modeId, n) { this.modes.find((m) => m.modeId === modeId).name = n; },
          addMode(n) { const modeId = id('m'); this.modes.push({ modeId, name: n }); return modeId; },
        };
        collections.push(c);
        return c;
      },
      createVariable(name, col, resolvedType) {
        const v = {
          id: id('VariableID'), name, variableCollectionId: col.id, resolvedType, scopes: ['ALL_SCOPES'],
          _d: '',
          get description() { return this._d; },
          set description(d) { this._d = escape(d); },
          hiddenFromPublishing: false, codeSyntax: {}, valuesByMode: {},
          setVariableCodeSyntax(platform, value) { this.codeSyntax[platform] = value; },
          setValueForMode(modeId, value) {
            this.valuesByMode[modeId] = typeof value === 'object' && value.type !== 'VARIABLE_ALIAS' ? f32(value) : value;
          },
        };
        variables.push(v);
        return v;
      },
      createVariableAlias: (v) => ({ type: 'VARIABLE_ALIAS', id: v.id }),
      setBoundVariableForEffect: (e, field, v) => ({ ...e, boundVariables: { ...e.boundVariables, [field]: { type: 'VARIABLE_ALIAS', id: v.id } } }),
    },
    getLocalEffectStylesAsync: async () => [...styles],
    createEffectStyle() {
      const s = { id: id('S'), name: '', _d: '', effects: [], get description() { return this._d; }, set description(d) { this._d = escape(d); } };
      styles.push(s);
      return s;
    },
  };
  return { figma, collections, variables, styles };
}

const run = (figma, script) => new AsyncFunction('figma', script)(figma);

async function pushAll(figma) {
  const results = [];
  for (const b of batches(SPEC)) results.push(await run(figma, b.script));
  return results;
}

test('every spec variable is in exactly one batch, and every batch fits a use_figma call', () => {
  const all = batches(SPEC);
  for (const b of all) assert.ok(b.script.length < 50000, `${b.label} is ${b.script.length} chars`);
  const names = all.flatMap((b) => [...b.script.matchAll(/\["([^"]+)",[01],\d+,[01],/g)].map((m) => m[1]));
  const expected = SPEC.collections.flatMap((c) => c.variables.map((v) => v.name));
  assert.equal(names.length, expected.length);
  assert.deepEqual(new Set(names), new Set(expected));
  assert.ok(all.at(-1).label.includes('effect styles'), 'effect styles run last, after the variables they bind');
  assert.ok(probeScript(SPEC).length < 50000);
});

test('a full push into an empty file matches the spec exactly', async () => {
  const { figma, collections, styles } = fakeFigma();
  const results = await pushAll(figma);
  assert.deepEqual(results.flatMap((r) => r.errors), []);
  assert.deepEqual(collections.map((c) => [c.name, c.modes.map((m) => m.name), c.hiddenFromPublishing]),
    SPEC.collections.map((c) => [c.name, c.modes, !!c.hiddenFromPublishing]));
  assert.equal(styles.length, 3);
  const probe = await run(figma, probeScript(SPEC));
  assert.deepEqual(probe.differs, []);
  for (const c of SPEC.collections) {
    assert.equal(probe.collections[c.name].variables, c.variables.length);
    assert.deepEqual(probe.collections[c.name].bucketsDiffering, []);
  }
  assert.ok(Object.values(probe.effectStyles).every((s) => s.found && s.match && s.description));
  assert.equal(probe.ok, true);
  assert.deepEqual(diff(SPEC, probe), { missing: [], extra: [], changed: [], undetailed: [] });
});

test('a re-run updates in place and creates nothing', async () => {
  const { figma, variables } = fakeFigma();
  await pushAll(figma);
  const before = variables.length;
  const again = await pushAll(figma);
  assert.equal(again.reduce((n, r) => n + r.created, 0), 0);
  assert.equal(again.at(-1).effectStyles.every((s) => !s.created), true);
  assert.equal(variables.length, before);
  assert.equal((await run(figma, probeScript(SPEC))).ok, true);
});

test('the probe names a variable whose alias moved, and a push puts it back', async () => {
  const { figma, variables, collections } = fakeFigma();
  await pushAll(figma);
  const foundations = collections.find((c) => c.name === 'color / foundations');
  const link = variables.find((v) => v.name === 'color/link/default');
  const wrong = variables.find((v) => v.name === 'neutral/100');
  link.valuesByMode[foundations.modes[1].modeId] = { type: 'VARIABLE_ALIAS', id: wrong.id };
  const probe = await run(figma, probeScript(SPEC));
  assert.equal(probe.ok, false);
  const d = diff(SPEC, probe);
  assert.deepEqual(d.changed.map((m) => m.name), ['color / foundations / color/link/default']);
  assert.equal(d.changed[0].spec.values[1].alias, 'color / primitives:lagoon/300');
  assert.equal(d.changed[0].live.values[1].alias, 'color / primitives:neutral/100');
  assert.deepEqual([d.missing, d.extra], [[], []]);
  await pushAll(figma);
  assert.equal((await run(figma, probeScript(SPEC))).ok, true);
});

test('the push never deletes: an extra variable and an unrelated collection survive, and the probe reports the extra', async () => {
  const { figma, variables, collections } = fakeFigma();
  const legacy = figma.variables.createVariableCollection('colors / accent');
  figma.variables.createVariable('Legacy/Blue', legacy, 'COLOR');
  await pushAll(figma);
  const foundations = collections.find((c) => c.name === 'color / foundations');
  figma.variables.createVariable('color/not-in-spec', foundations, 'COLOR');
  await pushAll(figma);
  assert.ok(variables.some((v) => v.name === 'Legacy/Blue'));
  assert.ok(variables.some((v) => v.name === 'color/not-in-spec'));
  assert.ok(collections.some((c) => c.name === 'colors / accent'));
  const probe = await run(figma, probeScript(SPEC));
  assert.deepEqual(diff(SPEC, probe).extra, ['color / foundations / color/not-in-spec']);
  assert.equal(probe.ok, false);
});

test('scopes are never ALL_SCOPES and every foundations color carries var(--ds-…) code syntax', async () => {
  const { figma } = fakeFigma();
  await pushAll(figma);
  const probe = await run(figma, probeScript(SPEC));
  for (const c of Object.values(probe.collections)) assert.equal(c.allScopesCount, 0);
  // The shadow layer variables have none: CSS reads a shadow as one composite --ds-shadow-* value.
  const colors = SPEC.collections[1].variables.filter((v) => !v.name.startsWith('elevation/shadow/'));
  assert.equal(probe.collections['color / foundations'].withWebSyntax, colors.length);
  assert.ok(colors.every((v) => /^var\(--ds-[a-z0-9-]+\)$/.test(v.codeSyntax.WEB)));
});

test('the probe names a variable missing from the file', async () => {
  const { figma, variables } = fakeFigma();
  await pushAll(figma);
  variables.splice(variables.findIndex((v) => v.name === 'color/text/subtlest'), 1);
  const probe = await run(figma, probeScript(SPEC));
  assert.equal(probe.ok, false);
  assert.deepEqual(diff(SPEC, probe).missing, ['color / foundations / color/text/subtlest']);
});

test('the fingerprint sees every field it claims to compare', () => {
  const c = SPEC.collections[1];
  const base = specRecord(c, c.variables.find((v) => v.name === 'color/text/subtlest'));
  const h = fingerprint(base);
  const variants = [
    { ...base, type: 'FLOAT' },
    { ...base, scopes: ['ALL_SCOPES'] },
    { ...base, hidden: !base.hidden },
    { ...base, description: base.description + '.' },
    { ...base, web: '' },
    { ...base, values: [{ alias: 'color / primitives:neutral/700' }, ...base.values.slice(1)] },
  ];
  for (const v of variants) assert.notEqual(fingerprint(v), h);
  assert.equal(fingerprint({ ...base, scopes: [...base.scopes].reverse() }), h, 'scope order is not a difference');
});
