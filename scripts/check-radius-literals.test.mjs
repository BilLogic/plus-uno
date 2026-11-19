/**
 * Tests for `check:radius-literals`: a component's corners come from a radius
 * token, never from a number or a primitive step.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { RADIUS_RECORD, literalRadii, radiusExceptions, run } from './check-radius-literals.mjs';
import { openRatchet } from './lib/ratchet.mjs';

/** The held counts, as the ratchet reads them from a scratch record: `held({ 'file|--radius-md': 1 })`. */
function held(counts) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'radius-'));
  try {
    fs.mkdirSync(path.join(root, path.dirname(RADIUS_RECORD)), { recursive: true });
    const entries = Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, { count }]));
    fs.writeFileSync(path.join(root, RADIUS_RECORD), JSON.stringify({ why: 'x', sets: { main: { entries } } }));
    return openRatchet({ file: RADIUS_RECORD, repoRoot: root });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
const none = { exceptions: [], ratchet: held({}) };

const at = (text, file = 'design-system/src/components/x/X.scss') => literalRadii([{ path: file, text }]);

test('semantic, Control, template and component tokens are allowed', () => {
  assert.deepEqual(at('.a { border-radius: var(--radius-md); }'), []);
  assert.deepEqual(at('.a { border-radius: var(--radius-control-lg); }'), []);
  assert.deepEqual(at('.a { border-radius: var(--card-radius); }'), []);
  assert.deepEqual(at('.a { border-radius: var(--button-radius-default); }'), []);
  assert.deepEqual(at('.a { border-radius: var(--tab-radius) var(--tab-radius) 0 0; }'), []);
});

test('full, 0, inherit and a calc() that scales a token are allowed', () => {
  assert.deepEqual(at('.a { border-radius: var(--radius-full); }'), []);
  assert.deepEqual(at('.a { border-radius: 0; border-top-left-radius: 0 !important; }'), []);
  assert.deepEqual(at('.a { border-radius: inherit; }'), []);
  assert.deepEqual(at('.a { border-radius: min(calc(var(--s) / 4), var(--radius-xxl)); }'), []);
});

test('a px length is a literal', () => {
  const [f] = at('.a {\n  border-radius: 4px;\n}');
  assert.deepEqual([f.line, f.value], [2, '4px']);
  assert.equal(at('.a { border-start-end-radius: 0.5rem; }').length, 1);
});

test('a percentage is a literal', () => {
  assert.equal(at('.a { border-radius: 50%; }').length, 1);
});

test('a primitive radius step is a literal', () => {
  assert.equal(at('.a { border-radius: var(--space-0625); }').length, 1);
  assert.equal(at('.a { border-radius: var(--space-025); }').length, 1);
});

test('a literal fallback is a literal', () => {
  assert.equal(at('.a { border-radius: var(--radius-full, 9999px); }').length, 1);
});

test('a component radius property holds the same rule', () => {
  assert.equal(at('.a { --tile-radius: 6px; }').length, 1);
  assert.deepEqual(at('.a { --tile-radius: var(--radius-md); }'), []);
});

test('JSX style objects are read the same way, and an identifier is not judged', () => {
  const file = 'design-system/src/templates/x/X.jsx';
  assert.deepEqual(at(`<i style={{ borderRadius: 'var(--radius-full)' }} />`, file), []);
  assert.deepEqual(at(`<i style={{ borderRadius: r }} />`, file), []);
  assert.equal(at(`<i style={{ borderRadius: '4px' }} />`, file).length, 1);
  assert.equal(at(`<i style={{ borderRadius: '50%' }} />`, file).length, 1);
  assert.equal(at(`<i style={{ borderRadius: 'var(--space-050)' }} />`, file).length, 1);
});

test('comments are not declarations', () => {
  assert.deepEqual(at('/* border-radius: 4px; */\n.a { border-radius: 0; } // border-radius: 50%'), []);
});

test('the components and patterns hold no literal radius', () => {
  assert.deepEqual(run().map((f) => f.message), []);
});

test('component SCSS reads radius roles, with counted central exceptions', async () => {
  const { roleRadii } = await import('./check-radius-literals.mjs');
  const file = 'design-system/src/components/x/X.scss';
  const files = [{ path: file, text: '.x { border-radius: var(--radius-md); --corner: var(--radius-sm); }' }];
  assert.equal(roleRadii(files, none).length, 2);
  assert.deepEqual(roleRadii([{ path: file, text: '.x { border-radius: var(--radius-control-md); --corner: var(--card-radius); }' }], none), []);
  const exceptions = [{ at: file, token: '--radius-md', reason: 'Preserve the existing 4px mark pending design review.' }, { at: file, token: '--radius-sm', reason: 'Preserve the existing 2px mark pending design review.' }];
  const ratchet = held({ [`${file}|--radius-md`]: 1, [`${file}|--radius-sm`]: 1 });
  assert.deepEqual(roleRadii(files, { exceptions, ratchet }), []);
  assert.match(roleRadii([{ path: file, text: '' }], { exceptions, ratchet })[0].message, /stale radius exception: .* expected 1, found 0/);
  const grown = [{ path: file, text: '.x { a: var(--radius-md); b: var(--radius-md); c: var(--radius-sm); }' }];
  const rose = roleRadii(grown, { exceptions, ratchet }).map((f) => f.message);
  assert.ok(rose.some((m) => /expected 1, found 2/.test(m)), 'a held count may not rise');
  assert.equal(rose.filter((m) => /reads raw radius scale --radius-md/.test(m)).length, 2, 'and its reads are findings again');
  assert.deepEqual(roleRadii(files, { exceptions, ratchet: held({ [`${file}|--radius-md`]: 2, [`${file}|--radius-sm`]: 1 }) }), [], 'a count that fell below the record passes');
});

test('role enforcement covers every raw scale read and ignores comments, docs and circles', async () => {
  const { roleRadii } = await import('./check-radius-literals.mjs');
  const file = 'design-system/src/components/x/X.scss';
  assert.equal(roleRadii([{ path: file, text: '.x { --corner: var(--radius-xl); }' }], none).length, 1);
  assert.deepEqual(roleRadii([{ path: file, text: '/* var(--radius-md) */ .x { border-radius: var(--radius-full); }' },
    { path: file.replace('.scss', '.jsx'), text: 'var(--radius-md)' }], none), []);
});

test('radius semantics in arbitrary component properties also require a component role', async () => {
  const { roleRadii } = await import('./check-radius-literals.mjs');
  assert.equal(roleRadii([{ path: 'design-system/src/components/x/X.scss', text: '.x { --corner: var(--radius-md); }' }], none).length, 1);
});

test('role substitutions resolve to the same primitive in the single-mode radius ladder', async () => {
  const { TOKEN_LADDER } = await import('./lib/tokens/plan.mjs');
  const resolve = (name) => {
    const row = TOKEN_LADDER.find((r) => r.new === name);
    if (!row) return name;
    assert.match(row.ref, /^var\(--[\w-]+\)$/);
    return resolve(row.ref.slice(4, -1));
  };
  for (const [scale, role] of [
    ['--radius-lg', '--radius-control-md'],
    ['--radius-xl', '--popup-radius'], ['--radius-xl', '--table-radius'], ['--radius-xxl', '--card-radius'],
  ]) assert.equal(resolve(role), resolve(scale), `${scale} → ${role}`);
});

test('run checks a fixture repo through its public interface and never writes', async (t) => {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const path = await import('node:path');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'radius-role-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, 'design-system/src/components/x');
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < 150; i++) fs.writeFileSync(path.join(dir, `Role${i}.scss`), '.x { border-radius: var(--card-radius); }');
  const raw = path.join(dir, 'Raw.scss');
  const text = '.x { border-radius: var(--radius-md); }';
  fs.writeFileSync(raw, text);
  const findings = run({ repoRoot: root, ...none });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /raw radius scale --radius-md/);
  assert.equal(fs.readFileSync(raw, 'utf8'), text);
});

test('the live exceptions each name a held count, and every held count names an exception', () => {
  const keys = new Set(radiusExceptions().map((e) => `${e.at}|${e.token}`));
  const ratchet = openRatchet({ file: RADIUS_RECORD });
  assert.deepEqual([...ratchet.entries.keys()].filter((k) => !keys.has(k)), []);
  assert.deepEqual([...keys].filter((k) => !ratchet.entries.has(k)), []);
});
