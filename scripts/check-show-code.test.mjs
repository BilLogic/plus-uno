/**
 * Every rule in `check:show-code`, watched failing, each with a green twin.
 * The last case runs the real tree.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { checkFile, run, summary } from './check-show-code.mjs';

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

test('an examples module that reaches outside its folder fails; a barrel import does not', () => {
  assert.ok(messages('design-system/src/templates/X/XExamples.jsx', "import Blanket from '../Modal/Blanket';").some((m) => /outside its own template folder/.test(m)));
  assert.deepEqual(messages('design-system/src/templates/X/XExamples.jsx', "import { useMotionReduced } from '@/lib/motionPreference';"), []);
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
