/**
 * Tests for `check:forms-internals`: the guard fails on every way of reaching the
 * forms folder's `_internal` from outside it and leaves the folder's own files,
 * the shared `lib/` modules and other folders' own `_internal` alone.
 *
 * Run: npm run test:scripts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { findInternalImports, reachesInternal, run, specifiers } from './check-forms-internals.mjs';

const F = 'design-system/src/components/forms-and-inputs';
const flagged = (file, text) => findInternalImports([{ path: file, text }]).map((f) => f.line);

test('flags a relative import from another group', () => {
  assert.deepEqual(flagged('design-system/src/components/navigation/Tabs/Tabs.jsx', "import Listbox from '../../forms-and-inputs/_internal/Listbox';\n"), [1]);
});

test('flags an @/ path, a bare side-effect import and a dynamic import', () => {
  const text = [
    "import x from '@/components/forms-and-inputs/_internal/dates';",
    "import '@/components/forms-and-inputs/_internal/Listbox.scss';",
    "const y = await import('../components/forms-and-inputs/_internal/dates');",
  ].join('\n');
  assert.deepEqual(flagged('design-system/src/patterns/Table.jsx', text), [1, 2, 3]);
});

test('flags SCSS @use, @import and url()', () => {
  const text = "@use '../../forms-and-inputs/_internal/choice-soft';\n@import '@/components/forms-and-inputs/_internal/Listbox';\n.a { background: url('../../forms-and-inputs/_internal/x.svg'); }\n";
  assert.deepEqual(flagged('design-system/src/components/data-display/Tag/Tag.scss', text), [1, 2, 3]);
});

test('flags stories and mdx files', () => {
  const imp = "import { expectRest } from '../../forms-and-inputs/_internal/fieldStatePlays';\n";
  assert.deepEqual(flagged('design-system/src/components/overlays/Modal/Modal.stories.jsx', imp), [1]);
  assert.deepEqual(flagged('design-system/src/components/overlays/Modal/Modal.mdx', imp), [1]);
});

test('flags a bare-package style path naming the folder', () => {
  assert.equal(reachesInternal('prototypes/a.jsx', 'plus/forms-and-inputs/_internal/Listbox'), true);
});

test('leaves the forms folder, shared lib modules and other `_internal` folders alone', () => {
  assert.deepEqual(flagged(`${F}/TagInput/TagInput.jsx`, "import Listbox from '../_internal/Listbox';\n"), []);
  assert.deepEqual(flagged(`${F}/Radio/Radio.scss`, "@use '../_internal/choice-soft';\n"), []);
  assert.deepEqual(flagged('design-system/src/components/navigation/Tabs/Tabs.jsx', "import { x } from '@/lib/field/fieldSlots';\n"), []);
  assert.deepEqual(flagged('design-system/src/components/data-display/Tag/Tag.jsx', "import x from './_internal/Thing';\n"), []);
  assert.deepEqual(flagged('design-system/src/components/data-display/Tag/Tag.jsx', "import { Button } from '@/components';\n"), []);
});

test('reads every specifier shape', () => {
  const text = "import a from 'a';\nexport { b } from 'b';\nimport 'c';\nrequire('d');\n@use 'e';\n";
  assert.deepEqual(specifiers(text).map((s) => s.spec).sort(), ['a', 'b', 'c', 'd', 'e']);
});

test('run() fails on a fixture tree with an outside import and passes without it', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'forms-internals-'));
  const put = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  put(`${F}/_internal/dates.js`, 'export const d = 1;\n');
  put(`${F}/TextField/TextField.jsx`, "import { d } from '../_internal/dates';\n");
  put('design-system/src/components/navigation/Tabs/Tabs.jsx', "import { d } from '../../forms-and-inputs/_internal/dates';\n");
  assert.equal(run({ repoRoot: root, minFiles: 0 }).length, 1);
  assert.equal(run({ repoRoot: root, minFiles: 0 })[0].file, 'design-system/src/components/navigation/Tabs/Tabs.jsx');
  fs.rmSync(path.join(root, 'design-system/src/components/navigation'), { recursive: true });
  // a fresh root: the reader caches per root
  const clean = fs.mkdtempSync(path.join(os.tmpdir(), 'forms-internals-'));
  fs.mkdirSync(path.join(clean, F, 'TextField'), { recursive: true });
  fs.writeFileSync(path.join(clean, F, 'TextField/TextField.jsx'), "import { d } from '../_internal/dates';\n");
  assert.deepEqual(run({ repoRoot: clean, minFiles: 0 }), []);
});

test('run() over this checkout passes', () => {
  assert.deepEqual(run(), []);
});
