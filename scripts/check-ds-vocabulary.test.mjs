/**
 * `check:ds-vocabulary`, watched failing on fixtures: an avoid-word in a page's
 * prose, beside a green twin with the word only in code; a strict page; and a
 * glossary whose avoid-word collides with a component name.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ENFORCE_STRICT, STRICT_PAGES, avoidWords, run, vocabularyFindings } from './check-ds-vocabulary.mjs';
import { parseGlossary } from './lib/ds-vocabulary.mjs';

const GLOSSARY = `## Language

### Product

**Escalation**:
A tutor flagging a session.
_Avoid_: "report", "alert"

### Design system: components

**Flag**:
A short message at the corner.
_Avoid_: "toast", "snackbar"

**Modal**:
Content that takes over the screen.
_Avoid_: "Modal dialog", "popup" for a blocking dialog
`;

const NAMES = ['Flag', 'Modal'];

test('avoidWords: the plain avoid-words of design-system terms that name a component, each with its term, and no product word', () => {
  const withProp = `${GLOSSARY}\n**size**:\nThe prop that scales a component.\n_Avoid_: "small", "large" as sizes\n`;
  assert.deepEqual(avoidWords(parseGlossary(withProp), NAMES), [
    { word: 'toast', term: 'Flag' },
    { word: 'snackbar', term: 'Flag' },
    { word: 'Modal dialog', term: 'Modal' },
  ]);
});

test('vocabularyFindings: an avoid-word in prose is named with its term; in code, or inside a longer word, it is silent', () => {
  const words = avoidWords(parseGlossary(GLOSSARY), NAMES);
  const found = vocabularyFindings('## Usage\n\nShow a Toast when the save lands.\nA modal  dialog blocks the page.\n', words);
  assert.deepEqual(found.map((f) => f.message), [
    '"Toast" is a glossary avoid-word; say Flag: "Show a Toast when the save lands."',
    '"modal  dialog" is a glossary avoid-word; say Modal: "A modal  dialog blocks the page."',
  ]);
  assert.deepEqual(vocabularyFindings('## Usage\n\nUse `toast` in code only.\n\n```jsx\n<Toast />\n```\n\nToaster and snackbars-ish.\n', words), []);
  assert.deepEqual(vocabularyFindings('An alert or a report.', words), [], 'product avoid-words are not DS vocabulary');
});

function fixtureRepo({ glossary = GLOSSARY, pages }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-vocabulary-'));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  write('GLOSSARY.md', glossary);
  const records = [{ name: 'Flag', kind: 'component', source: 'design-system/src/components/messaging/Flag/Flag.jsx' }];
  for (const [name, page] of Object.entries(pages)) {
    const dir = `design-system/src/components/messaging/${name}`;
    write(`${dir}/${name}.jsx`, `export default function ${name}() { return null; }\n`);
    write(`${dir}/${name}.stories.jsx`, `import ${name} from './${name}';\nexport default { component: ${name} };\n`);
    write(`${dir}/${name}.mdx`, `import * as S from './${name}.stories.jsx';\n\n<Meta of={S} />\n\n${page}`);
    if (name !== 'Flag') records.push({ name, kind: 'component', source: `${dir}/${name}.jsx` });
  }
  write('design-system/agent-views/components.json', JSON.stringify({ components: records }));
  return root;
}

test('run: a strict page lists its finding, the others roll up, and nothing fails while the words are warnings', () => {
  assert.deepEqual(STRICT_PAGES, ['Modal']);
  const root = fixtureRepo({ pages: { Modal: '## Usage\n\nNot a toast.\n', Popup: '## Usage\n\nLike a toast or a snackbar.\n' } });
  const found = run({ repoRoot: root, enforceStrict: false });
  assert.ok(found.every((f) => f.severity === 'warning'), JSON.stringify(found));
  const modal = found.filter((f) => f.file?.endsWith('Modal.mdx'));
  assert.equal(modal.length, 1);
  assert.match(modal[0].message, /^\(strict\) \[avoid-word\] "toast"/);
  assert.equal(modal[0].line, 7);
  assert.deepEqual(found.filter((f) => !f.file).map((f) => f.message), ['[avoid-word] 2 finding(s) on 1 page(s); `npm run check:ds-vocabulary -- --all` lists them.']);
  const enforced = run({ repoRoot: root, enforceStrict: true });
  assert.deepEqual(enforced.map((f) => f.severity), ['error', 'warning']);
});

test('run: an avoid-word equal to another component\'s name fails, on any page set', () => {
  const clash = `${GLOSSARY}\n**Section message**:\nA message in the page flow.\n_Avoid_: "flag"\n`;
  const root = fixtureRepo({ glossary: clash, pages: { SectionMessage: '## Usage\n\nIn the flow.\n' } });
  const found = run({ repoRoot: root, enforceStrict: false });
  const errors = found.filter((f) => f.severity === 'error');
  assert.equal(errors.length, 1, JSON.stringify(found));
  assert.equal(errors[0].file, 'GLOSSARY.md');
  assert.match(errors[0].message, /\[collision\] "flag".*Section message.*Flag/);
});

test('run: the real tree has no collision and the strict page is clean', () => {
  assert.equal(ENFORCE_STRICT, true);
  const found = run();
  assert.deepEqual(found.filter((f) => f.severity === 'error'), []);
});
