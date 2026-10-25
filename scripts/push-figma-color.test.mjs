import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BS4_LIBRARY, SPECS_FILE, batches, bucketHashes, bucketOf, diff, fingerprint, probeScript, readSpec, specRecord,
} from './push-figma-color.mjs';

const SPEC = readSpec();
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

/**
 * Just enough of the Plugin API for the generated scripts, with Figma's habits
 * that matter here: a new collection starts with one "Mode 1", a new variable
 * starts on ALL_SCOPES, colors come back as float32, and descriptions come back
 * HTML-escaped.
 */
function fakeFigma(fileKey = 'scratchScratchScratch01') {
  let next = 1;
  const id = (p) => `${p}:${next++}`;
  const collections = [];
  const variables = [];
  const styles = [];
  // Figma HTML-escapes descriptions on write; the probe must not call that drift.
  const escape = (d) => d.replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const f32 = (c) => ({ r: Math.fround(c.r), g: Math.fround(c.g), b: Math.fround(c.b), a: Math.fround(c.a ?? 1) });
  const figma = {
    fileKey,
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

async function pushAll(figma, opts) {
  const results = [];
  for (const b of batches(SPEC, opts)) results.push(await run(figma, b.script));
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

test('every script refuses the Specs file, and a push refuses BS4 unless printed with --target bs4', async () => {
  for (const script of [...batches(SPEC).map((b) => b.script), probeScript(SPEC)]) {
    const { figma, collections } = fakeFigma(SPECS_FILE);
    await assert.rejects(run(figma, script), /refuses to run in the Specs file/);
    assert.equal(collections.length, 0);
  }
  const bs4 = fakeFigma(BS4_LIBRARY);
  for (const b of batches(SPEC)) await assert.rejects(run(bs4.figma, b.script), /without --target bs4/);
  assert.equal(bs4.collections.length, 0, 'nothing written before the guard threw');
  assert.equal((await run(bs4.figma, probeScript(SPEC))).ok, false, 'the read-only probe may run on BS4');
  await pushAll(bs4.figma, { target: 'bs4' });
  assert.equal((await run(bs4.figma, probeScript(SPEC))).ok, true);
  assert.throws(() => batches(SPEC, { target: 'specs' }), /--target takes only bs4/);
});

test('a script that cannot read figma.fileKey refuses to run', async () => {
  const { figma } = fakeFigma(undefined);
  delete figma.fileKey;
  await assert.rejects(run(figma, batches(SPEC)[0].script), /figma.fileKey is unavailable/);
  await assert.rejects(run(figma, probeScript(SPEC)), /figma.fileKey is unavailable/);
});

test('duplicate names stop a batch before it writes, and the probe reports them', async () => {
  const twoCollections = fakeFigma();
  twoCollections.figma.variables.createVariableCollection('color / primitives');
  twoCollections.figma.variables.createVariableCollection('color / primitives');
  await assert.rejects(run(twoCollections.figma, batches(SPEC)[0].script), /collection "color \/ primitives": VariableCollectionId:\d+, VariableCollectionId:\d+/);
  assert.equal(twoCollections.variables.length, 0);
  assert.equal((await run(twoCollections.figma, probeScript(SPEC))).collections['color / primitives'].duplicates.length, 2);

  const twoVariables = fakeFigma();
  await pushAll(twoVariables.figma);
  const prim = twoVariables.collections.find((c) => c.name === 'color / primitives');
  twoVariables.figma.variables.createVariable('teal/100', prim, 'COLOR');
  await assert.rejects(run(twoVariables.figma, batches(SPEC)[0].script), /variable "color \/ primitives \/ teal\/100"/);
  const probe = await run(twoVariables.figma, probeScript(SPEC));
  assert.deepEqual(probe.collections['color / primitives'].duplicateNames, ['teal/100']);
  assert.equal(probe.ok, false);

  const twoStyles = fakeFigma();
  await pushAll(twoStyles.figma);
  twoStyles.figma.createEffectStyle().name = 'elevation/shadow/raised';
  await assert.rejects(run(twoStyles.figma, batches(SPEC).at(-1).script), /effect style "elevation\/shadow\/raised"/);
  assert.equal((await run(twoStyles.figma, probeScript(SPEC))).effectStyles['elevation/shadow/raised'].duplicates.length, 2);
});

test('an existing same-named collection has its modes reconciled by position, never deleted', async () => {
  const { figma, collections } = fakeFigma();
  const old = figma.variables.createVariableCollection('color / foundations');
  old.renameMode(old.modes[0].modeId, 'Light');
  old.addMode('Mode 2');
  old.addMode('Night');
  old.addMode('Contrast');
  old.addMode('Legacy');
  const results = await pushAll(figma);
  assert.deepEqual(old.modes.map((m) => m.name), ['Light', 'Dark', 'Light IC', 'Dark IC', 'Legacy']);
  assert.ok(results.flatMap((r) => r.warnings).some((w) => /modes outside the spec left in place: Legacy/.test(w)));
  assert.equal(collections.filter((c) => c.name === 'color / foundations').length, 1);
  const probe = await run(figma, probeScript(SPEC));
  assert.deepEqual(probe.collections['color / foundations'].bucketsDiffering, []);
  assert.equal(probe.ok, false, 'the extra Legacy mode is drift');
});

test('an effect layer whose variable has no value is reported, not thrown', async () => {
  const { figma, variables } = fakeFigma();
  await pushAll(figma);
  const v = variables.find((x) => x.name === 'elevation/shadow/raised/layer-1/radius');
  v.valuesByMode = {};
  const r = await run(figma, batches(SPEC).at(-1).script);
  assert.ok(r.errors.some((e) => /elevation\/shadow\/raised: no value to start from for radius/.test(e)));
  assert.equal(r.effectStyles.find((s) => s.name === 'elevation/shadow/raised').layers, 2);
});

test('the bucket count is the same 64 in both embedded functions', () => {
  assert.equal(bucketHashes([]).length, 64);
  assert.match(bucketOf.toString(), /% 64\b/);
  assert.match(bucketHashes.toString(), /length: 64\b/);
  const names = SPEC.collections[1].variables.map((v) => v.name);
  assert.ok(names.every((n) => bucketOf(n) >= 0 && bucketOf(n) < 64));
});
