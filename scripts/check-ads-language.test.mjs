// The ADS language ratchet, mutation-tested: each rule proven by a fixture that breaks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { BASELINE, measure, run } from './check-ads-language.mjs';

const src = (file, text) => ({ path: file, text });
/** A state-step custom property, assembled so this file does not itself carry the old name. */
const step = (role, n) => `--color-${role}-state-${n}`;
const countOf = (sources, key) => measure(sources).get(key)?.count;

/** A scratch repo root holding a baseline record of `counts`. */
function scratch(counts) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ads-language-'));
  fs.mkdirSync(path.join(root, path.dirname(BASELINE)), { recursive: true });
  fs.writeFileSync(path.join(root, BASELINE), JSON.stringify({ why: 'fixture', counts }, null, 2));
  return root;
}

test('a state step custom property is counted per line, in the token files too', () => {
  const css = `.a { color: var(${step('primary', '08')}); background: var(${step('danger', '12')}); }\n.b { x: var(${step('primary', '16')}) }\n`;
  assert.equal(countOf([src('design-system/src/components/A/A.scss', css)], 'state-step design-system/src/components/A/A.scss'), 2);
  assert.equal(countOf([src('design-system/src/tokens/_colors.scss', `${step('primary', '08')}: #000;`)], 'state-step design-system/src/tokens/_colors.scss'), 1);
  assert.equal(measure([src('a.scss', `var(${step('primary', '08')}2)`)]).size, 0, 'only the 08 / 12 / 16 steps');
});

test('legacy components count as tags and imports, and a longer name is not its prefix', () => {
  const jsx = "import { Alert, Button } from '@/components';\n<Alert>hi</Alert>\n<AlertTitle />\n<Badge />\n<BadgeVariants />\n";
  const found = measure([src('src/App.jsx', jsx)]);
  assert.equal(found.get('component:Alert src/App.jsx').count, 2, 'one import and one tag, not AlertTitle');
  assert.equal(found.get('component:Badge src/App.jsx').count, 1);
  assert.equal(found.get('component:BadgeVariants src/App.jsx').count, 1);
});

test("React-Bootstrap's Overlay is not the Overlay pattern", () => {
  const bootstrap = "import { Overlay } from 'react-bootstrap';\n<Overlay show />\n";
  assert.equal(measure([src('design-system/src/Tooltip.jsx', bootstrap)]).size, 0);
  const pattern = "import { Overlay } from '@/patterns';\n<Overlay />\n";
  assert.equal(countOf([src('design-system/src/P.jsx', pattern)], 'component:Overlay design-system/src/P.jsx'), 2);
});

test('retired props, classes and words are counted; inline CSS and SVG fill are not', () => {
  const jsx = '<Button style="primary" fill="filled" size="small" />\n<svg fill="none" /><p style="color: red">x</p>\n';
  const found = measure([src('a.jsx', jsx)]);
  assert.equal(found.get('prop:style a.jsx').count, 1);
  assert.equal(found.get('prop:fill a.jsx').count, 1);
  assert.equal(found.get('prop:size a.jsx').count, 1);
  const css = '.plus-btn--tonal {}\n/* the surface container */\n.x { z: var(--color-scrim); } /* Rovo */\n';
  const words = measure([src('a.scss', css)]);
  assert.equal(words.get('class:plus-btn a.scss').count, 1);
  assert.equal(words.get('word:surface-container a.scss').count, 1);
  assert.equal(words.get('word:scrim a.scss').count, 1);
  assert.equal(words.get('word:Rovo a.scss').count, 1);
});

test('a size prop type that lists small / medium / large is counted; pixel sizes are not', () => {
  const old = "Calendar.propTypes = {\n  size: PropTypes.oneOf(['small', 'medium', 'large']),\n  other: PropTypes.oneOf(['small']),\n};\n";
  assert.equal(countOf([src('a.jsx', old)], 'proptype:size a.jsx'), 1);
  const px = 'Calendar.propTypes = {\n  size: PropTypes.oneOf([28, 36, 44]),\n};\n';
  assert.equal(countOf([src('a.jsx', px)], 'proptype:size a.jsx'), undefined);
  const named = "const SIZES = ['sm', 'md', 'lg'];\nT.propTypes = {\n  size: PropTypes.oneOf(SIZES),\n};\n";
  assert.equal(countOf([src('a.jsx', named)], 'proptype:size a.jsx'), 1, 'a named constant does not hide it');
});

test('the allowlist: archive, ADR text and _Avoid_ lines say the old words on purpose', () => {
  assert.equal(measure([src('docs/knowledge/archive/x.mdx', 'Rovo scrim')]).size, 0);
  assert.equal(measure([src('docs/adr/001.mdx', 'Rovo')]).size, 0);
  assert.equal(measure([src('design-system/src/G.mdx', '_Avoid_: "scrim", "Rovo"\n')]).size, 0);
});

test('a state step fails with zero allowed, and a recorded baseline does not excuse it', () => {
  const root = scratch({ 'state-step design-system/src/A.scss': 1 });
  const findings = run({ repoRoot: root, sources: [src('design-system/src/A.scss', `.a { c: var(${step('info', '08')}) }`)] });
  assert.ok(findings.some((f) => /state-step/.test(f.message) && /zero allowed/.test(f.message) && f.line === 1));
});

test('a fixture with a new state step fails against the baseline', () => {
  const root = scratch({});
  const findings = run({ repoRoot: root, sources: [src('design-system/src/A.scss', `.a { c: var(${step('info', '08')}) }`)] });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /state-step/);
  assert.equal(findings[0].file, 'design-system/src/A.scss');
  assert.equal(findings[0].line, 1);
});

test('a count that rises fails, and one that falls passes', () => {
  const key = 'word:scrim design-system/src/A.scss';
  const two = '.a { /* scrim */ }\n.b { /* scrim */ }\n';
  const one = '.a { /* scrim */ }\n';
  const three = `${two}.c { /* scrim */ }\n`;
  const root = scratch({ [key]: 2 });
  assert.deepEqual(run({ repoRoot: root, sources: [src('design-system/src/A.scss', two)] }), []);
  assert.deepEqual(run({ repoRoot: root, sources: [src('design-system/src/A.scss', one)] }), [], 'lowering a count passes');
  const rose = run({ repoRoot: root, sources: [src('design-system/src/A.scss', three)] });
  assert.equal(rose.length, 1);
  assert.match(rose[0].message, /rose: 3 x word:scrim against a baseline of 2/);
});

test('a pair that reaches zero is stale until the baseline is regenerated', () => {
  const root = scratch({ 'word:Rovo design-system/src/A.mdx': 1 });
  const findings = run({ repoRoot: root, sources: [src('design-system/src/A.mdx', 'PLUS AI')] });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /--update/);
});

test('a missing baseline fails loudly rather than passing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ads-language-'));
  const findings = run({ repoRoot: root, sources: [] });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /no baseline is recorded/);
});

test('a renamed-with-no-alias component surviving in doc prose fails with zero allowed, even with no baseline entry', () => {
  const root = scratch({});
  const mdx = '- For something the user only needs to know, use `Toast`.\n';
  const findings = run({ repoRoot: root, sources: [src('design-system/src/components/loading/Spinner/Spinner.mdx', mdx)] });
  assert.ok(findings.some((f) => /stale-name:Toast/.test(f.message) && /renamed with no alias/.test(f.message) && f.line === 1));
});

test('a renamed-with-no-alias name outside component docs is not flagged', () => {
  assert.equal(measure([src('design-system/src/specs/Training/Lessons/Elements/Toast/Toast.jsx', '<Toast />')]).get('stale-name:Toast design-system/src/specs/Training/Lessons/Elements/Toast/Toast.jsx'), undefined);
});

test('the live tree holds its own baseline', () => {
  assert.deepEqual(run(), []);
});
