/**
 * Every rule of `check:ds-writing`, watched failing on a fixture page, each
 * beside a green twin so a rule that always fired would not pass this file.
 * The fixtures are MDX read through the page model, the way the check reads
 * the tree; the last cases run the whole check over a fixture repo to hold the
 * strict list and its switch.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readDocsPage } from './lib/docs-page.mjs';
import {
  ENFORCE_STRICT,
  STRICT_PAGES,
  argTypesOf,
  gradeFindings,
  indexNames,
  run,
  writingFindings,
} from './check-ds-writing.mjs';

const NAMES = new Set(['Modal', 'Flag', 'SectionMessage', 'Select']);

/** A component page with the five spine sections, each overridable. */
function mdx({
  usage = 'Use `Modal` when the next step has to happen first.',
  alternatives = '- For a short notice, use `Flag`.',
  rules = '### Give the footer a button.\n\nA dialog with no button has no way forward.',
  a11y = 'Focus moves into the dialog and returns on close.',
  related = '- `SectionMessage`: use when the message stays in the page.',
  order = ['Usage', 'Alternatives', 'Best practices', 'Accessibility', 'Related'],
  extra = '',
} = {}) {
  const body = { Usage: usage, Alternatives: alternatives, 'Best practices': rules, Accessibility: a11y, Related: related };
  return [
    "import { Meta } from '@storybook/addon-docs/blocks';",
    '',
    ...order.filter((t) => body[t] !== null).map((t) => `## ${t}\n\n${body[t]}\n`),
    extra,
  ].join('\n');
}

const check = (source, more = {}) => writingFindings({ page: readDocsPage(source), names: NAMES, ...more });
const rulesOf = (found) => found.map((f) => f.rule);

test('a page in the spine shape is silent: the green twin', () => {
  assert.deepEqual(check(mdx()), []);
});

test('usage-spine: a missing spine section is named', () => {
  const found = check(mdx({ alternatives: null }));
  assert.deepEqual(rulesOf(found), ['usage-spine']);
  assert.match(found[0].message, /no "Alternatives" section/);
});

test('usage-spine: spine sections out of order are named', () => {
  const found = check(mdx({ order: ['Usage', 'Best practices', 'Alternatives', 'Accessibility', 'Related'] }));
  assert.deepEqual(rulesOf(found), ['usage-spine']);
  assert.match(found[0].message, /"Best practices" comes before "Alternatives"/);
});

test('usage-spine: an Alternatives line that is not a route is named', () => {
  const found = check(mdx({ alternatives: "- Don't use it for notices." }));
  assert.ok(found.some((f) => f.rule === 'usage-spine' && /not a route/.test(f.message)), JSON.stringify(found));
});

test('usage-spine: Best practices with no ### rule is named', () => {
  const found = check(mdx({ rules: 'Keep it short.' }));
  assert.ok(found.some((f) => f.rule === 'usage-spine' && /no `###` rule/.test(f.message)), JSON.stringify(found));
});

test('usage-spine: a rule heading that is not one sentence is named', () => {
  const twoSentences = check(mdx({ rules: '### Give the footer a button. Keep it short.\n\nBody.' }));
  assert.ok(twoSentences.some((f) => /one sentence/.test(f.message)), JSON.stringify(twoSentences));
  const noStop = check(mdx({ rules: '### Footer buttons\n\nBody.' }));
  assert.ok(noStop.some((f) => /one sentence/.test(f.message)), JSON.stringify(noStop));
});

test('usage-spine: two rules with one id are named', () => {
  const found = check(mdx({ rules: '### Give the footer a button.\n\nA.\n\n### Give the footer a button!\n\nB.' }));
  assert.ok(found.some((f) => /share the id "give-the-footer-a-button"/.test(f.message)), JSON.stringify(found));
});

test('usage-spine: a Related line with no "use when" is named', () => {
  const found = check(mdx({ related: '- `SectionMessage`' }));
  assert.ok(found.some((f) => f.rule === 'usage-spine' && /"use when"/.test(f.message)), JSON.stringify(found));
});

test('alternatives-route: a route to a component the index does not list is named', () => {
  const found = check(mdx({ alternatives: '- For a short notice, use `Toast`.\n- For a pick, use `Select`.' }));
  assert.deepEqual(rulesOf(found), ['alternatives-route']);
  assert.match(found[0].message, /`Toast`/);
});

test('bare-number: a number in a rule with no constant warns; a code span or a named constant is silent', () => {
  const bare = check(mdx({ rules: '### Stack at most 2 dialogs.\n\nA third stays closed.' }));
  assert.deepEqual(rulesOf(bare), ['bare-number']);
  assert.match(bare[0].message, /"2"/);
  assert.deepEqual(check(mdx({ rules: '### Stack at most `MAX_STACK` dialogs.\n\nThat is 2 today, from `MAX_STACK`.' })), []);
  assert.deepEqual(check(mdx({ rules: '### Size the dialog to its content.\n\nPass `width="8-col"` for a form.' })), []);
  // A value name that carries a digit is a word, not a threshold.
  assert.deepEqual(check(mdx({ rules: '### Use the 6-col width for a confirmation.\n\nIt is the narrowest.' })), []);
});

test('bare-number: a number shown through an MDX expression is the constant itself, and silent', () => {
  assert.deepEqual(check(mdx({ rules: '### Stack at most {MAX_STACK} dialogs.\n\nA third stays closed.' })), []);
});

test('stale-marker: "known stale", "outdated" and TODO on a page are named', () => {
  for (const marker of ['Known stale below this line.', 'This table is outdated.', 'TODO: rewrite.']) {
    const found = check(mdx({ extra: `## Notes\n\n${marker}\n` }));
    assert.deepEqual(rulesOf(found), ['stale-marker'], marker);
  }
  // A marker inside code is code, not a claim about the page.
  assert.deepEqual(check(mdx({ a11y: 'Focus moves in. `// TODO` in a sample is fine.' })), []);
});

test('props-parity: an argType that names no prop, and options that disagree with the prop, are named', () => {
  const stories = `export default {
    component: Modal,
    argTypes: {
      title: { control: 'text', description: 'has a } brace' },
      onClick: { table: { disable: true } },
      height: { control: 'select', options: ['hug', 'fill', 'auto'] },
    },
  };`;
  const props = [{ name: 'title' }, { name: 'height', values: ['hug', 'fill'] }];
  const found = check(mdx(), { props, storiesSource: stories });
  assert.deepEqual(rulesOf(found), ['props-parity', 'props-parity']);
  assert.match(found[0].message, /argType `onClick` names no prop/);
  assert.match(found[1].message, /`height` options .*auto/);
  const green = `export default { argTypes: { title: { control: 'text' }, height: { options: ['fill', 'hug'] } } };`;
  assert.deepEqual(check(mdx(), { props, storiesSource: green }), []);
});

test('argTypesOf reads the meta argTypes, skipping strings and nested objects', () => {
  const src = `const x = { argTypes: 'no' };\nexport default {\n  argTypes: {\n    a: { table: { category: 'C' } },\n    'b-c': { options: ["x", 'y'] },\n    d: { description: "{" },\n  },\n};`;
  assert.deepEqual(argTypesOf(src), [
    { name: 'a', options: null },
    { name: 'b-c', options: ['x', 'y'] },
    { name: 'd', options: null },
  ]);
  assert.deepEqual(argTypesOf('export default { title: "X" };'), []);
});

test('indexNames reads the components and patterns the generated index lists, not its "Not here" names', () => {
  const md = [
    '## Not here → use instead',
    '| `Toast` | `Flag` (renamed) |',
    '## Patterns: start here',
    '| Frame | [`Frame`](../../src/patterns/Frame/Frame.mdx) | x |',
    '## UI components (2)',
    '- [Button](../../src/components/Button/index.md)',
    '- [Flag](../../src/components/Flag/index.md)',
  ].join('\n');
  assert.deepEqual([...indexNames(md)].sort(), ['Button', 'Flag', 'Frame']);
});

test('gradeFindings: warnings everywhere, a stale marker always an error, a strict page an error only when enforced', () => {
  const raw = [{ rule: 'usage-spine', message: 'm' }, { rule: 'stale-marker', message: 's' }];
  assert.deepEqual(gradeFindings(raw, { strict: false, enforce: true }).map((f) => f.severity), ['warning', 'error']);
  assert.deepEqual(gradeFindings(raw, { strict: true, enforce: false }).map((f) => f.severity), ['warning', 'error']);
  assert.deepEqual(gradeFindings(raw, { strict: true, enforce: true }).map((f) => f.severity), ['error', 'error']);
});

test('the strict list holds Modal and the Section template, enforced in the gate', () => {
  assert.deepEqual(STRICT_PAGES, ['Modal', 'PatternSection', 'Frame', 'Page']);
  assert.equal(ENFORCE_STRICT, true);
});

test('run: the committed Modal page passes every rule, strict', () => {
  const modal = run({ enforceStrict: true }).filter((f) => /\/Modal\/Modal\.(mdx|stories\.jsx)$/.test(f.file ?? ''));
  assert.deepEqual(modal, []);
});

test('run: the committed Section template page passes every rule, strict', () => {
  const section = run({ enforceStrict: true }).filter((f) => /\/PatternSection\/PatternSection\.(mdx|stories\.jsx)$/.test(f.file ?? ''));
  assert.deepEqual(section, []);
});

// ── the whole check, over a fixture repo ───────────────────────────────────

function fixtureRepo(pages) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-writing-'));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  const records = [];
  for (const [name, page] of Object.entries(pages)) {
    const dir = `design-system/src/components/messaging/${name}`;
    write(`${dir}/${name}.jsx`, `export default function ${name}() { return null; }\n`);
    write(`${dir}/${name}.stories.jsx`, `import ${name} from './${name}';\nexport default { component: ${name}, argTypes: { title: {} } };\n`);
    write(`${dir}/${name}.mdx`, `import * as S from './${name}.stories.jsx';\n\n<Meta of={S} />\n\n${page}`);
    records.push({ name, kind: 'component', source: `${dir}/${name}.jsx`, props: [{ name: 'title' }] });
  }
  write('design-system/agent-views/components.json', JSON.stringify({ components: records }));
  write('design-system/agent-views/components/index.md', `## UI components\n\n${Object.keys(pages).map((n) => `- [${n}](x)`).join('\n')}\n- [Flag](x)\n- [SectionMessage](x)\n`);
  return root;
}

test('run: a strict page reports its findings as warnings until the switch is on, then fails', () => {
  const root = fixtureRepo({ Modal: mdx({ alternatives: null }), Popup: mdx({ alternatives: null }) });
  const relaxed = run({ repoRoot: root, enforceStrict: false });
  assert.ok(relaxed.every((f) => f.severity === 'warning'), JSON.stringify(relaxed));
  const modal = relaxed.filter((f) => f.file?.endsWith('Modal.mdx'));
  assert.equal(modal.length, 1);
  assert.match(modal[0].message, /^\(strict\) \[usage-spine\] no "Alternatives"/);
  assert.equal(typeof modal[0].line, 'number');
  // The other page's warning is rolled up, one line per rule.
  assert.deepEqual(
    relaxed.filter((f) => !f.file).map((f) => f.message),
    ['[usage-spine] 1 finding(s) on 1 page(s); `npm run check:ds-writing -- --all` lists them.'],
  );
  const enforced = run({ repoRoot: root, enforceStrict: true });
  assert.deepEqual(enforced.map((f) => [f.file ? path.basename(f.file) : null, f.severity]), [['Modal.mdx', 'error'], [null, 'warning']]);
  const all = run({ repoRoot: root, enforceStrict: false, all: true });
  assert.deepEqual(all.map((f) => path.basename(f.file)).sort(), ['Modal.mdx', 'Popup.mdx']);
});

test('run: a stale marker fails on any page', () => {
  const root = fixtureRepo({ Popup: mdx({ extra: '## Notes\n\nTODO: rewrite.\n' }) });
  const found = run({ repoRoot: root, enforceStrict: false });
  assert.deepEqual(found.map((f) => [f.severity, /stale-marker/.test(f.message)]), [['error', true]]);
});

test('bare-number: on a strict page, a Usage table row with a number and no constant warns; a row naming its constant is silent', () => {
  const table = '| Width | Pixels |\n| --- | --- |\n| 6-col | 384 at 768. |\n| 8-col | `MODAL_WIDTH_PX` |';
  const strict = check(mdx({ usage: `Use \`Modal\` when the next step has to happen first.\n\n${table}` }), { strict: true });
  assert.deepEqual(rulesOf(strict), ['bare-number']);
  assert.match(strict[0].message, /"384", "768"/);
  assert.deepEqual(rulesOf(check(mdx({ usage: `Use \`Modal\` first.\n\n${table}` }))), []);
});

test('run: a stale marker in a guideline markdown file fails', () => {
  const root = fixtureRepo({ Popup: mdx() });
  fs.mkdirSync(path.join(root, 'design-system/guidelines/components'), { recursive: true });
  fs.writeFileSync(path.join(root, 'design-system/guidelines/components/overview.md'), '# Components\n\n## Known stale below this line\n\nNo `TODO` in code is a finding.\n');
  const found = run({ repoRoot: root, enforceStrict: false });
  assert.deepEqual(found.map((f) => [f.file, f.line, f.severity, /stale-marker/.test(f.message)]), [['design-system/guidelines/components/overview.md', 3, 'error', true]]);
});
