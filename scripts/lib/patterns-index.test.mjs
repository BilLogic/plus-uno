import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkPatterns, renderPatterns } from './patterns-index.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** What the facts answer for each name: a pattern, a component, or nothing. */
const ANSWERS = {
  PageLayout: { status: 'exists', kind: 'pattern', import: "import { PageLayout } from '@/specs/Universal/Pages';", source: 'p/PageLayout.jsx' },
  Frame: { status: 'exists', kind: 'pattern', import: "import { Frame } from '@/patterns';", source: 'p/Frame.jsx' },
  PatternCard: { status: 'exists', kind: 'pattern', import: "import { PatternCard } from '@/patterns';", source: 'p/PatternCard.jsx' },
  Popup: { status: 'exists', kind: 'component', import: "import { Popup } from '@/components';", source: 'c/Popup.jsx' },
};
const lookup = (name) => ANSWERS[name] ?? { status: 'unknown', kind: null, import: null, source: null };
const exists = (doc) => doc !== 'p/Missing.mdx';
const row = (name, group = 'Card') => ({ group, name, use: 'x' });
const env = (required = ['Frame', 'PatternCard']) => ({ lookup, exists, required });

test('a list that names only real patterns and components passes', () => {
  assert.deepEqual(checkPatterns([row('PageLayout'), row('Frame'), row('PatternCard'), row('Popup')], env()), []);
});

test('A NAME THE FACTS DO NOT HOLD FAILS', () => {
  assert.deepEqual(checkPatterns([row('Card')], env([])), ['Card is not a pattern or component the design system exports']);
});

test('a row that keeps an import or a doc fails: those come from source', () => {
  const problems = checkPatterns([{ ...row('Frame'), import: '@/patterns', doc: 'x.mdx' }], env([]));
  assert.deepEqual(problems, ['Frame: `import`, `doc` come from source; a row keeps only group, name and use']);
});

test('a pattern whose Storybook page is not beside its source fails', () => {
  const answers = { ...ANSWERS, Frame: { ...ANSWERS.Frame, source: 'p/Missing.jsx' } };
  const problems = checkPatterns([row('Frame')], { ...env([]), lookup: (n) => answers[n] });
  assert.deepEqual(problems, ['Frame: p/Missing.mdx is not a file']);
});

test('a pattern the facts hold and the list leaves out fails', () => {
  assert.deepEqual(checkPatterns([row('Frame')], env()), ['PatternCard is a pattern and missing from the list']);
});

test('rendering takes the import line and the doc from the facts', () => {
  const out = renderPatterns([row('PageLayout', 'Templates'), row('PatternCard')], { from: 'design-system/agent-views/components', lookup });
  assert.match(out, /^## Patterns: start a page, section, card, table or overlay here/m);
  assert.match(out, /\| Templates \| \[`PageLayout`\]\(\.\.\/\.\.\/\.\.\/p\/PageLayout\.mdx\) \| `import \{ PageLayout \} from '@\/specs\/Universal\/Pages';` \| x \|/);
  assert.match(out, /\| Card \| \[`PatternCard`\]/);
});

test('THE COMMITTED LIST passes against the real facts', async () => {
  const { checkCommitted } = await import('./patterns-index.mjs');
  assert.deepEqual(checkCommitted(REPO_ROOT), []);
});
