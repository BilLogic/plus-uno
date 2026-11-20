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
  assert.deepEqual(flagged('design-system/src/components/navigation/Modal/Modal.stories.jsx', imp), [1]);
  assert.deepEqual(flagged('design-system/src/components/navigation/Modal/Modal.mdx', imp), [1]);
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

test('an import commented out is not an import', () => {
  const file = 'design-system/src/components/navigation/Tabs/Tabs.jsx';
  const imp = "from '../../forms-and-inputs/_internal/dates'";
  assert.deepEqual(flagged(file, `// import x ${imp};\n/* import y ${imp}; */\nconst a = 1;\n`), []);
  assert.deepEqual(flagged('design-system/src/a/a.scss', "// @use '../../forms-and-inputs/_internal/x';\n/* @import '../../forms-and-inputs/_internal/x'; */\n"), []);
  assert.deepEqual(flagged('design-system/src/a/a.mdx', "{/* import x from '../../forms-and-inputs/_internal/x'; */}\n<!-- import y from '../../forms-and-inputs/_internal/y' -->\n"), []);
});

test('a real import after a block comment is still flagged, on its own line', () => {
  const text = `/* one\n two */\nimport x ${"from '../../forms-and-inputs/_internal/dates'"};\n`;
  assert.deepEqual(flagged('design-system/src/components/navigation/Tabs/Tabs.jsx', text), [3]);
});

test('a bare specifier is anchored to the folder name', () => {
  assert.equal(reachesInternal('prototypes/a.jsx', 'my-forms-and-inputs/_internal/Listbox'), false);
  assert.equal(reachesInternal('prototypes/a.jsx', 'forms-and-inputs/_internal'), true);
  assert.equal(reachesInternal('prototypes/a.jsx', 'pkg/forms-and-inputs/_internal/x'), true);
  assert.equal(reachesInternal('prototypes/a.jsx', 'forms-and-inputs/_internals/x'), false);
});

test('flags import.meta.glob, module mocks and an import with a comment inside', () => {
  const text = [
    "const a = import.meta.glob('../../forms-and-inputs/_internal/*.js');",
    "const b = import.meta.glob(['./x/*.js', '!../../forms-and-inputs/_internal/dates.js']);",
    "vi.mock('../../forms-and-inputs/_internal/dates');",
    "jest.mock(\"../../forms-and-inputs/_internal/dates\", () => ({}));",
    "const c = await import(/* webpackChunkName: 'x' */ '../../forms-and-inputs/_internal/dates');",
  ].join('\n');
  assert.deepEqual(flagged('design-system/src/components/navigation/Tabs/Tabs.test.jsx', text), [1, 2, 3, 4, 5]);
  assert.deepEqual(flagged('design-system/src/components/navigation/Tabs/Tabs.test.jsx', "vi.mock('./thing');\nimport.meta.glob('./*.jsx');\n"), []);
});

/** A scratch tree, removed when `body` returns or throws. */
function withTree(files, body) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'forms-internals-'));
  try {
    for (const [rel, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), text);
    }
    return body(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const OWN = { [`${F}/TextField/TextField.jsx`]: "import { d } from '../_internal/dates';\n", [`${F}/_internal/dates.js`]: 'export const d = 1;\n' };

test('run() fails on a fixture tree with an outside import', () => {
  const files = { ...OWN, 'design-system/src/components/navigation/Tabs/Tabs.jsx': "import { d } from '../../forms-and-inputs/_internal/dates';\n" };
  withTree(files, (root) => {
    const found = run({ repoRoot: root, minFiles: {} });
    assert.equal(found.length, 1);
    assert.equal(found[0].file, 'design-system/src/components/navigation/Tabs/Tabs.jsx');
  });
});

test('run() passes on a fixture tree whose only users are inside the folder', () => {
  withTree(OWN, (root) => assert.deepEqual(run({ repoRoot: root, minFiles: {} }), []));
});

test('run() names a root that holds fewer files than its floor', () => {
  withTree(OWN, (root) => {
    const found = run({ repoRoot: root, minFiles: { '.storybook': 8 } });
    assert.match(found[0].message, /under \.storybook, fewer than the 8/);
  });
});

test('run() over this checkout passes', () => {
  assert.deepEqual(run(), []);
});
