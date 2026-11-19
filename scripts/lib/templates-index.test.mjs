import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkTemplates, renderTemplates } from './templates-index.mjs';

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
const env = (required = ['Frame', 'Card']) => ({ lookup, exists, required, pageOf: () => null });

test('a list that names only real templates and components passes', () => {
  assert.deepEqual(checkTemplates([row('Frame'), row('Card'), row('Popup')], env()), []);
});

test('A NAME THE FACTS DO NOT HOLD FAILS', () => {
  assert.deepEqual(checkTemplates([row('Widget')], env([])), ['Widget is not a template or component the design system exports']);
});

test('a row that keeps an import or a doc fails: those come from source', () => {
  const problems = checkTemplates([{ ...row('Frame'), import: '@/templates', doc: 'x.mdx' }], env([]));
  assert.deepEqual(problems, ['Frame: `import`, `doc` come from source; a row keeps only group, name and use']);
});

test('a template whose Storybook page is not beside its source fails', () => {
  const answers = { ...ANSWERS, Frame: { ...ANSWERS.Frame, source: 'p/Missing.jsx' } };
  const problems = checkTemplates([row('Frame')], { ...env([]), lookup: (n) => answers[n] });
  assert.deepEqual(problems, ['Frame: p/Missing.mdx is not a file']);
});

test('a template the facts hold and the list leaves out fails', () => {
  assert.deepEqual(checkTemplates([row('Frame')], env()), ['Card is a template and missing from the list']);
});

test('rendering takes the import line and the doc from the facts', () => {
  const out = renderTemplates([row('Frame', 'Templates'), row('Card')], { from: 'design-system/agent-views/components', lookup, pageOf: () => null });
  assert.match(out, /^## Templates: start a page, section, card, table or overlay here/m);
  assert.match(out, /\| Templates \| \[`Frame`\]\(\.\.\/\.\.\/\.\.\/p\/Frame\.mdx\) \| `import \{ Frame \} from '@\/templates';` \| x \|/);
  assert.match(out, /\| Card \| \[`Card`\]/);
});

test('rows of one group print the group once, and a template whose facts say component links its template page', () => {
  const answers = { ...ANSWERS, Popup: { ...ANSWERS.Popup, source: 'c/Popup.jsx' } };
  const out = renderTemplates([row('Frame', 'Shell'), row('Card', 'Blocks'), row('Popup', 'Blocks')], {
    from: 'design-system/agent-views/components',
    lookup: (n) => answers[n],
    pageOf: (name) => (name === 'Popup' ? 'design-system/src/templates/Popup/Popup.mdx' : null),
  });
  assert.match(out, /\| Shell \| \[`Frame`\]/);
  assert.match(out, /\| Blocks \| \[`Card`\]/);
  assert.match(out, /\|\s+\| \[`Popup`\]\(\.\.\/\.\.\/src\/templates\/Popup\/Popup\.mdx\)/);
});

test('each committed row reads as its template page first line, and the groups are the three layers', async () => {
  const { readTemplates } = await import('./templates-index.mjs');
  const fs = await import('node:fs');
  const rows = readTemplates(REPO_ROOT);
  assert.deepEqual(rows.map((r) => r.name), ['Frame', 'Page', 'Section', 'Card', 'Table', 'Modal', 'Panel', 'Popup']);
  assert.deepEqual([...new Set(rows.map((r) => r.group))], ['Shell', 'Blocks', 'Overlays']);
  for (const r of rows) {
    const mdx = fs.readFileSync(path.join(REPO_ROOT, `design-system/src/templates/${r.name}/${r.name}.mdx`), 'utf8');
    const purpose = mdx.match(/purpose="([^"]+)"/)?.[1];
    assert.equal(r.use, purpose, `${r.name} row is its page's purpose`);
  }
});

test('THE COMMITTED LIST passes against the real facts', async () => {
  const { checkCommitted } = await import('./templates-index.mjs');
  assert.deepEqual(checkCommitted(REPO_ROOT), []);
});
