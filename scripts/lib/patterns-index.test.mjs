import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkPatterns, renderPatterns } from './patterns-index.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** What the facts answer for each name: a template, a component, or nothing. */
const ANSWERS = {
  Frame: { status: 'exists', kind: 'template', import: "import { Frame } from '@/templates';", source: 'p/Frame.jsx' },
  Card: { status: 'exists', kind: 'template', import: "import { Card } from '@/templates';", source: 'p/Card.jsx' },
  Popup: { status: 'exists', kind: 'component', import: "import { Popup } from '@/components';", source: 'c/Popup.jsx' },
};
const lookup = (name) => ANSWERS[name] ?? { status: 'unknown', kind: null, import: null, source: null };
const exists = (doc) => doc !== 'p/Missing.mdx';
const row = (name, group = 'Card') => ({ group, name, use: 'x' });
const env = (required = ['Frame', 'Card']) => ({ lookup, exists, required });

test('a list that names only real templates and components passes', () => {
  assert.deepEqual(checkPatterns([row('Frame'), row('Card'), row('Popup')], env()), []);
});

test('A NAME THE FACTS DO NOT HOLD FAILS', () => {
  assert.deepEqual(checkPatterns([row('Widget')], env([])), ['Widget is not a template or component the design system exports']);
});

test('a row that keeps an import or a doc fails: those come from source', () => {
  const problems = checkPatterns([{ ...row('Frame'), import: '@/templates', doc: 'x.mdx' }], env([]));
  assert.deepEqual(problems, ['Frame: `import`, `doc` come from source; a row keeps only group, name and use']);
});

test('a template whose Storybook page is not beside its source fails', () => {
  const answers = { ...ANSWERS, Frame: { ...ANSWERS.Frame, source: 'p/Missing.jsx' } };
  const problems = checkPatterns([row('Frame')], { ...env([]), lookup: (n) => answers[n] });
  assert.deepEqual(problems, ['Frame: p/Missing.mdx is not a file']);
});

test('a template the facts hold and the list leaves out fails', () => {
  assert.deepEqual(checkPatterns([row('Frame')], env()), ['Card is a template and missing from the list']);
});

test('rendering takes the import line and the doc from the facts', () => {
  const out = renderPatterns([row('Frame', 'Templates'), row('Card')], { from: 'design-system/agent-views/components', lookup });
  assert.match(out, /^## Templates: start a page, section, card, table or overlay here/m);
  assert.match(out, /\| Templates \| \[`Frame`\]\(\.\.\/\.\.\/\.\.\/p\/Frame\.mdx\) \| `import \{ Frame \} from '@\/templates';` \| x \|/);
  assert.match(out, /\| Card \| \[`Card`\]/);
});

test('THE COMMITTED LIST passes against the real facts', async () => {
  const { checkCommitted } = await import('./patterns-index.mjs');
  assert.deepEqual(checkCommitted(REPO_ROOT), []);
});
