/**
 * Every rule in `check:show-code`, watched failing, each with a green twin.
 * The last case runs the real tree.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './lib/corpus.mjs';
import { DEFERRED_PAGES, checkFile, run, summary } from './check-show-code.mjs';

const messages = (file, text) => checkFile(file, text).map((p) => p.message);

test('a page that passes CODE references is clean: the green twin', () => {
  assert.deepEqual(messages('design-system/src/templates/X/X.mdx', '<DoDontPair doCode={CODE.A} dontCode={CODE.B} />'), []);
});

test('a hand-typed string, template literal or inline expression in a code prop fails', () => {
  for (const prop of ['doCode="<Button />"', 'dontCode={`<Button />`}', 'doCode={SNIPPETS.A}']) {
    assert.ok(messages('design-system/src/templates/X/X.mdx', `<DoDontPair ${prop} />`).some((m) => /typed here/.test(m)), prop);
  }
});

test('only the doc-figure props are read: a code prop on another element is not a snippet', () => {
  assert.deepEqual(messages('design-system/src/templates/X/X.mdx', '<Other code="x" />'), []);
});

test('a CODE built with showCode is clean; one that is typed fails', () => {
  const good = "export const CODE = showCode(source, ['A']);\n\nexport const A = () => null;";
  assert.deepEqual(messages('design-system/src/templates/X/XCases.jsx', good), []);
  assert.ok(messages('design-system/src/templates/X/XCases.jsx', 'export const CODE = {\n  A: `<Button />`,\n};').some((m) => /showCode/.test(m)));
});

test('an examples module that imports a docs-only wrapper fails; PLUS parts pass', () => {
  assert.deepEqual(messages('design-system/src/templates/X/XExamples.jsx', "import { Button } from '@/components';\nimport { Frame } from '@/templates';"), []);
  assert.ok(messages('design-system/src/templates/X/XExamples.jsx', "import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';").some((m) => /staging/.test(m)));
});

test('an examples module imports only react and the public barrels', () => {
  const file = 'design-system/src/templates/X/XExamples.jsx';
  assert.ok(messages(file, "import Blanket from '../Modal/Blanket';").some((m) => /relative path/.test(m)));
  assert.deepEqual(messages(file, "import React from 'react';\nimport { Button } from '@/components';\nimport { Page } from '@/templates';"), []);
});

test('a @/lib path is an internal helper and never printed: there is no @/lib barrel', () => {
  for (const from of ['@/lib/ClippedTooltip', '@/lib/loadRevealMotion', '@/lib/motionPreference']) {
    assert.ok(messages('design-system/src/templates/X/XExamples.jsx', `import { X } from '${from}';`).some((m) => /no @\/lib barrel/.test(m)), from);
  }
  assert.ok(messages('design-system/src/templates/X/XExamples.jsx', "import x from 'lodash';").some((m) => /only react/.test(m)));
});

test('a color or percent literal in a printed example fails; tokens and the full width pass', () => {
  const file = 'design-system/src/storybook-docs/patterns/X/XExamples.jsx';
  assert.deepEqual(messages(file, "const a = { inlineSize: '100%', color: 'var(--ds-text)', gap: 'var(--stack-md)' };"), []);
  for (const literal of ["width: '70%'", "color: '#fff'", "color: 'rgb(0, 0, 0)'", "maskImage: 'linear-gradient(black 35%, transparent)'"]) {
    assert.ok(messages(file, `const a = { ${literal} };`).some((m) => /writes the literal/.test(m)), literal);
  }
});

test('a pattern DoDontPair needs both doCode and dontCode; a template page is not read', () => {
  const page = 'design-system/src/storybook-docs/patterns/X/X.mdx';
  const both = '<DoDontPair\n    doExample={<A />}\n    doCode={CODE.A}\n    dontExample={<B />}\n    dontCode={CODE.B}\n/>';
  assert.deepEqual(messages(page, both), []);
  assert.ok(messages(page, '<DoDontPair\n    doExample={<A />}\n    doCode={CODE.A}\n    dontExample={<B />}\n/>').some((m) => /no dontCode/.test(m)));
  assert.ok(messages(page, '<DoDontPair\n    doExample={<A />}\n    dontExample={<B />}\n/>').some((m) => /no doCode or dontCode/.test(m)));
  assert.deepEqual(messages('design-system/src/templates/X/X.mdx', '<DoDontPair\n    doExample={<A />}\n    dontExample={<B />}\n/>'), []);
});

test('a staged-only example may leave its code off, and no other may', () => {
  const page = 'design-system/src/storybook-docs/patterns/X/X.mdx';
  assert.deepEqual(messages(page, '<DoDontPair\n    doExample={<A />}\n    doCode={CODE.A}\n    dontExample={<FadedListCase />}\n/>'), []);
  assert.ok(messages(page, '<DoDontPair\n    doExample={<FadedListCase />}\n    dontExample={<B />}\n/>').some((m) => /no dontCode/.test(m)));
});

test('no page is deferred, and any deferred page carries a reason and is a real pattern page', () => {
  assert.deepEqual(DEFERRED_PAGES, {});
  for (const [file, reason] of Object.entries(DEFERRED_PAGES)) {
    assert.ok(reason.length > 20, file);
    assert.ok(fs.existsSync(path.join(REPO_ROOT, file)), `${file} exists`);
  }
});

test('a pattern page is held to the same rules as a template page', () => {
  const page = 'design-system/src/storybook-docs/patterns/X/X.mdx';
  assert.deepEqual(messages(page, '<DoDontPair doCode={CODE.A} dontCode={CODE.B} />'), []);
  assert.ok(messages(page, '<DoDontPair doCode={`<Button />`} />').some((m) => /typed here/.test(m)));
  assert.ok(messages('design-system/src/storybook-docs/patterns/X/XExamples.jsx', "import { Demo } from '@/storybook-docs/x';").some((m) => /staging/.test(m)));
});

test('the real tree has no hand-typed Show code', () => {
  assert.deepEqual(run(), []);
  assert.ok(summary().includes('page(s)'));
  assert.match(summary(), /print Show code from source/);
});
