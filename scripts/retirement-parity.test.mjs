/**
 * The lists the checks used to keep for themselves now live in the retirement list. These pin that
 * the move changed no finding: each case holds the list as the check spelled it before, frozen
 * here, against what the check reads from the retirement list today, over the same fixture text.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { TOKEN_NAME_TAIL } from '../design-system/src/lib/tokens.mjs';
import { retiredFace } from './check-bot-skills.mjs';
import { oldPaths } from './check-doc-links.mjs';
import { oldTokenReads } from './check-docs-token-literals.mjs';
import { checkFile, retiredHeadings } from './check-docs-tabs.mjs';
import { retiredPaths } from './check-storybook-categories.mjs';
import { toPlusTerms } from './lib/token-intent.mjs';

/* ─── docs tabs: retired headings ─────────────────────────────────────────── */

const BEFORE_HEADINGS = new Map([
  ['Correct and incorrect', 'dissolve it: move each pair under the rule it illustrates (#254)'],
  ['When not to use', 'move each case to a `Related` bullet or a don\'t card (#254)'],
  ['ADS parity', 'drop the citation and keep the rule it carries; benchmark atlassian.design silently, never cite it'],
  ['ADS documentation', 'drop the citation and keep the rule it carries; benchmark atlassian.design silently, never cite it'],
]);

test('the retired headings and their remedies are the ones the check spelled', () => {
  assert.deepEqual([...retiredHeadings()], [...BEFORE_HEADINGS]);
});

test('a page that brings a retired heading back is told the same thing', () => {
  const page = (heading) =>
    `import { DocsTab } from 'x';\n\n<DocsTab tab="usage">\n<div className="sb-ds-doc-section">\n\n## ${heading}\n\ntext\n\n</div>\n</DocsTab>\n`;
  for (const [heading, remedy] of BEFORE_HEADINGS) {
    const found = checkFile('design-system/src/components/x/X.mdx', page(heading), true, retiredHeadings());
    assert.ok(found.includes(`design-system/src/components/x/X.mdx: ${JSON.stringify(heading)} was retired — ${remedy}.`), heading);
  }
});

/* ─── storybook categories: retired folders ───────────────────────────────── */

const BEFORE_FOLDERS = ['actions', 'status-and-loading', 'overlays'].map((folder) => ({
  folder,
  re: new RegExp(`(?:design-system/src/|@/)components/${folder}(?![\\w-])`),
}));

test('the retired component folders match the same text the check matched', () => {
  const after = retiredPaths();
  assert.deepEqual(after.map((p) => [p.folder, p.re.source]), BEFORE_FOLDERS.map((p) => [p.folder, p.re.source]));
  const fixture = [
    'design-system/src/components/actions/Button.jsx',
    "import x from '@/components/overlays'",
    '@/components/status-and-loading/Spinner',
    'design-system/src/components/actions-extra/Y.jsx',
    'design-system/src/components/forms-and-inputs/Z.jsx',
    '@/components/overlays-and-more',
  ];
  for (const line of fixture) {
    const hit = (list) => list.find(({ re }) => re.test(line))?.folder ?? null;
    assert.equal(hit(after), hit(BEFORE_FOLDERS), line);
  }
});

/* ─── bot skills: the retired faces ───────────────────────────────────────── */

test('the retired-face vocabulary reads exactly what it read', () => {
  const before = /(?<![\w-])bot\.md\b|\bWorker faces?\b/i;
  const after = retiredFace();
  assert.equal(after.source, before.source);
  assert.equal(after.flags, before.flags);
  for (const line of ['see bot.md', 'uno-bot.md is another file', 'the Worker face', 'two Worker faces', 'WORKER FACE', 'robot.md', 'a Worker farce']) {
    assert.equal(after.test(line), before.test(line), line);
  }
});

/* ─── doc links: retired path shapes ──────────────────────────────────────── */

const BEFORE_PATHS = [
  'docs/project/', 'docs/foundations/', 'docs/design-system/', 'docs/product-and-service/conventions/', '.agent/',
  'bot-skills/', '/uno:', 'docs/product-and-service/design-system', 'design-system/docs/', 'design-system/agent-views/pages/',
];

test('the retired path shapes are the same ten, found by the same substring', () => {
  const after = oldPaths();
  assert.deepEqual(after.map((p) => p.path), BEFORE_PATHS);
  const fixture = [
    'docs/a.md:see `docs/project/x.md`', 'docs/a.md:/uno:research', 'docs/a.md:the .agent/ folder', 'docs/a.md:design-system/docs/foo',
    'docs/a.md:docs/projects/x', 'docs/a.md:docs/design-system', 'docs/a.md:docs/product-and-service/design-systems', 'docs/a.md:nothing here',
    'design-system/docs/README.md:plain line',
  ];
  for (const line of fixture) {
    const found = (list) => list.filter((p) => (typeof p === 'string' ? line.includes(p) : p.pattern.test(line))).map((p) => p.path ?? p);
    assert.deepEqual(found(after), found(BEFORE_PATHS), line);
  }
});

/* ─── docs chrome: retired tokens read through var() ──────────────────────── */

test('the retired-token read finds what it found', () => {
  const before = new RegExp(
    `var\\(\\s*(--(?:color|size|element|layout)-${TOKEN_NAME_TAIL}|--font-line-height-${TOKEN_NAME_TAIL}|--font-(?:size|family|weight)-(?:body\\d|h\\d|headline|header|code|title|normal|bold|medium|semibold-\\d))`,
    'g',
  );
  const after = oldTokenReads();
  assert.equal(after.source, before.source);
  assert.equal(after.flags, before.flags);
  const css = 'a { color: var(--color-text); gap: var( --size-100 ); font: var(--font-size-body1) var(--font-family-code); b: var(--ds-text) c: var(--font-size-custom); d: var(--layout-page-pad-x); e: var(--element-pad); f: var(--font-weight-semibold-2) }';
  const names = (re) => [...css.matchAll(new RegExp(re.source, re.flags))].map((m) => m[1]);
  assert.deepEqual(names(after), names(before));
});

/* ─── token intent: reference phrases ─────────────────────────────────────── */

const BEFORE_PHRASES = [
  [/\(e\.g\. semantic badges, status pills, callout chips\)/g, '(e.g. a StatusTag or CountTag)'],
  [/\(e\.g\. status pills, callout chips\)/g, '(e.g. a StatusTag)'],
  [/lozenges and badges/g, 'status tags and count tags'],
  [/lozenges/g, 'status tags'],
  [/such as Jira cards in columns/g, 'such as cards in board columns'],
  [/such as Jira cards on a Kanban board/g, 'such as cards on a board'],
  [/selected Editor blocks/g, 'selected blocks in a RichTextEditor'],
  [/deletion of Editor block elements/g, 'deleting a block in a RichTextEditor'],
  [/close buttons on toasts, chips on bold fills/g, 'close buttons on flags, tags on bold fills'],
  [/Subject tag and chip fill/g, 'Subject tag fill'],
  [/subject chip/g, 'subject tag'],
  [/a filled badge/g, 'a filled tag'],
  [/modals, dialogs, dropdown menus/g, 'modals, menus'],
  [/the opened state of a dropdown trigger/g, 'the opened state of a Select trigger'],
  [/side panel dividers/g, 'Panel dividers'],
  [/modal dialogs/g, 'a Modal'],
  [/menus, popovers, tooltips/g, 'menus, popups, tooltips'],
  [/The Surface pattern's 1px edge/g, "A container's 1px edge"],
  [/visualisation/g, 'visualization'],
  [/'to-do' statues/g, "'to-do' statuses"],
  [/sit on top of they UI/g, 'sit on top of the UI'],
  [/used in error handing/g, 'used in error handling'],
  [/success section messaged/g, 'success section messages'],
  [/such in error/g, 'such as in error'],
  [/^For backgrounds/, 'Backgrounds'],
  [/^Vibrant for backgrounds/, 'Vibrant backgrounds'],
];

test('every reference phrase is rewritten as it was, in the same order', () => {
  const before = (text) => BEFORE_PHRASES.reduce((out, [from, to]) => out.replace(from, to), text);
  const fixture = [
    'Backgrounds of danger lozenges and badges to ensure accessibility',
    'For data visualisation only',
    'For backgrounds of text',
    'Vibrant for backgrounds',
    '(e.g. semantic badges, status pills, callout chips) and lozenges',
    'such as Jira cards in columns, and a filled badge, subject chip',
    'close buttons on toasts, chips on bold fills; modals, dialogs, dropdown menus; modal dialogs',
    "The Surface pattern's 1px edge; 'to-do' statues; sit on top of they UI; used in error handing; success section messaged; such in error",
    'menus, popovers, tooltips and side panel dividers; Subject tag and chip fill; selected Editor blocks; deletion of Editor block elements',
    'the opened state of a dropdown trigger',
    'text with no reference wording at all',
  ];
  for (const text of fixture) assert.equal(toPlusTerms(text), before(text), text);
  for (const [from, to] of BEFORE_PHRASES) {
    const sample = from.source.replace(/\\(.)/g, '$1').replace(/^\^/, '');
    assert.equal(toPlusTerms(sample), before(sample), sample);
    assert.ok(toPlusTerms(sample).includes(to), `${sample} becomes ${to}`);
  }
});
