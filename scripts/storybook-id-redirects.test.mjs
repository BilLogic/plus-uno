import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { PAGES } from './check-docs-landing.mjs';

const toml = fs.readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
const rules = [...toml.matchAll(/from = "\/storybook\/"\n\s+query = \{ path = "\/docs\/([a-z0-9-]+)--docs" \}\n\s+to = "\/storybook\/\?path=\/docs\/([a-z0-9-]+)--docs(#[a-z0-9-]+)?"/g)].map(
  (m) => ({ from: m[1], to: m[2], anchor: m[3] }),
);
const ids = new Set(PAGES.map((p) => p.id));
const FAMILIES = {
  'components-forms-and-inputs-file-upload': 'Components/Forms and inputs/File upload/File upload',
  'components-forms-and-inputs-checkbox': 'Components/Forms and inputs/Checkbox/Checkbox',
  'components-forms-and-inputs-radio': 'Components/Forms and inputs/Radio/Radio',
  'components-forms-and-inputs-select': 'Components/Forms and inputs/Select/Select',
  'components-forms-and-inputs-date-time-picker': 'Components/Forms and inputs/Date time picker/Date time picker',
  'components-labels-tag': 'Components/Labels/Tag/Tag',
  'components-text-and-data-display-code': 'Components/Text and data display/Code/Code',
  'components-navigation-navigation-system': 'Components/Navigation/Navigation system/Navigation system',
  'ai-ui-components-ai-message': 'AI UI/Components/AI message/AI message',
};

const FLATTENED = {
  'components-forms-and-inputs-date-time-picker-date-picker-date-picker':
    'Components/Forms and inputs/Date time picker/Date picker',
};

const RENAMED_COMPONENTS = {
  'components-labels-tag-smart-tag': 'Components/Labels/Tag/Competency tag',
  'components-messaging-modal': 'Templates/Modal',
  'ai-ai-chat': 'AI UI/Components/AI chat',
};

const storyRules = [
  ...toml.matchAll(
    /from = "\/storybook\/"\n\s+query = \{ path = "\/story\/([a-z0-9-]+--[a-z0-9-]+)" \}\n\s+to = "\/storybook\/\?path=\/story\/([a-z0-9-]+--[a-z0-9-]+)"/g,
  ),
].map((m) => ({ from: m[1], to: m[2] }));

test('the renamed and folded docs ids each redirect to a live page', () => {
  assert.equal(rules.length, 58);
  for (const r of rules) {
    assert.ok(!ids.has(r.from), `${r.from} is a live page and should not redirect`);
    if (r.from in FAMILIES || r.from in FLATTENED || r.from in RENAMED_COMPONENTS) continue;
    assert.ok(ids.has(r.to), `${r.from} redirects to ${r.to}, which is not a page`);
  }
});

test('every pre-regroup Foundations id lands on its page in the new groups', () => {
  const to = Object.fromEntries(rules.map((r) => [r.from, r.to]));
  const expected = {
    'foundations-basics-overview': 'foundations-overview',
    'foundations-basics-tokens': 'foundations-tokens-library',
    'foundations-tokens': 'foundations-tokens-library',
    'foundations-basics-accessibility': 'foundations-accessibility',
    'foundations-motion-principles': 'foundations-expression-motion-principles',
    'foundations-motion-library': 'foundations-expression-motion-library',
    'foundations-sound-overview': 'foundations-expression-sound-overview',
    'foundations-sound-settings-and-accessibility': 'foundations-expression-sound-settings-and-accessibility',
    'foundations-color': 'foundations-visual-color',
    'foundations-visual-elevation': 'foundations-visual-elevation-overview',
  };
  for (const [from, target] of Object.entries(expected)) {
    assert.equal(to[from], target, `${from} should redirect to ${target}`);
    assert.ok(ids.has(target), `${target} is not a page`);
  }
});

test('a folded page lands on its parent section, a renamed page on the page', () => {
  const folded = rules.filter((r) => r.anchor);
  assert.deepEqual(folded.map((r) => r.from).sort(), [
    'templates-modal-backdrop',
    'templates-page-heading-outline',
    'templates-templates-and-patterns',
  ]);
});

test('the id rules sit before the catch-all /storybook/* rule', () => {
  assert.ok(toml.lastIndexOf('query = { path') < toml.indexOf('from = "/storybook/*"'));
});

test('the retired Get started > Content design id lands on Voice and tone', () => {
  const rule = rules.find((r) => r.from === 'get-started-content-design');
  assert.equal(rule?.to, 'foundations-brand-content-voice-and-tone');
  assert.ok(ids.has('foundations-brand-content-voice-and-tone'));
});

test('a component family parent redirects to its Name/Name page, whose story is titled that way', async () => {
  const { storybookId } = await import('./lib/storybook-id.mjs');
  const root = new URL('../design-system/src/', import.meta.url).pathname;
  const sources = fs
    .readdirSync(root, { recursive: true })
    .filter((f) => f.endsWith('.stories.jsx'))
    .map((f) => fs.readFileSync(root + f, 'utf8'))
    .join('\n');
  for (const [from, title] of Object.entries({ ...FAMILIES, ...FLATTENED, ...RENAMED_COMPONENTS })) {
    const rule = rules.find((r) => r.from === from);
    assert.equal(rule?.to + '--docs', storybookId(title, 'Docs'), `${from} target`);
    assert.ok(sources.includes(`title: '${title}',`), `no story is titled ${title}`);
  }
});

test('every retired tag story id redirects to the matching CompetencyTag story id', async () => {
  const { storybookId } = await import('./lib/storybook-id.mjs');
  const storyFile = new URL('../design-system/src/components/labels/CompetencyTag/CompetencyTag.stories.jsx', import.meta.url);
  const src = fs.readFileSync(storyFile, 'utf8');
  const storyExports = [...src.matchAll(/^export const ([A-Z][A-Za-z0-9]*)\s*=/gm)].map((m) =>
    m[1].replace(/([a-z0-9])([A-Z])/g, '$1 $2'),
  );
  assert.ok(storyExports.length > 0, 'expected CompetencyTag story exports');
  const targets = new Set(storyExports.map((name) => storybookId('Components/Labels/Tag/Competency tag', name)));
  const smartTagRules = storyRules.filter((r) => r.from.startsWith('components-labels-tag-smart-tag--'));
  assert.ok(smartTagRules.length > 0, 'expected retired tag story redirects');
  for (const rule of smartTagRules) {
    assert.ok(targets.has(rule.to), `redirect target ${rule.to} is not a live CompetencyTag story`);
    assert.equal(rule.from, rule.to.replace('competency-tag--', 'smart-tag--'), `unexpected redirect source ${rule.from}`);
  }
});

test('every retired Modal component story id redirects to a live Dialog or Modal story id', async () => {
  const { storybookId } = await import('./lib/storybook-id.mjs');
  const exportIds = (relPath, title) => {
    const src = fs.readFileSync(new URL(relPath, import.meta.url), 'utf8');
    const names = [...src.matchAll(/^export const ([A-Z][A-Za-z0-9]*)\b[^\n]*\n(?:[A-Za-z0-9_]+\.storyName = '([^']+)';)?/gm)]
      .map((m) => m[2] || m[1].replace(/([a-z0-9])([A-Z])/g, '$1 $2'));
    return names.map((name) => storybookId(title, name));
  };
  const targets = new Set([
    ...exportIds('../design-system/src/components/messaging/Dialog/Dialog.stories.jsx', 'Components/Messaging/Dialog'),
    ...exportIds('../design-system/src/templates/Modal/Modal.stories.jsx', 'Templates/Modal'),
  ]);
  const modalRules = storyRules.filter((r) => r.from.startsWith('components-messaging-modal--'));
  assert.equal(modalRules.length, 26);
  for (const rule of modalRules) {
    assert.ok(targets.has(rule.to), `redirect target ${rule.to} is not a live Dialog or Modal story`);
  }
});


test('every retired table-pattern story id redirects to a live Table template or Table shell story id', async () => {
  const { storybookId } = await import('./lib/storybook-id.mjs');
  const exportIds = (relPath, title) => {
    const src = fs.readFileSync(new URL(relPath, import.meta.url), 'utf8');
    return [...src.matchAll(/^export const ([A-Z][A-Za-z0-9]*)\b/gm)]
      .map((m) => storybookId(title, m[1].replace(/([a-z0-9])([A-Z])/g, '$1 $2')));
  };
  const targets = new Set([
    ...exportIds('../design-system/src/templates/Table/Table.stories.jsx', 'Templates/Table'),
    ...exportIds('../design-system/src/components/text-and-data-display/Table/TableShell.stories.jsx', 'Components/Text and data display/Table shell'),
  ]);
  const tableRules = storyRules.filter((r) => r.from.startsWith('templates-table--'));
  assert.equal(tableRules.length, 13);
  for (const rule of tableRules) {
    assert.ok(targets.has(rule.to), `redirect target ${rule.to} is not a live story id`);
  }
});

test('historical Modal Backdrop bookmarks land on the Blanket section', () => {
  assert.deepEqual(rules.find((r) => r.from === 'templates-modal-backdrop'), {
    from: 'templates-modal-backdrop', to: 'templates-modal', anchor: '#blanket',
  });
});

test('the retired Form template id lands on the Forms pattern', () => {
  assert.deepEqual(rules.find((r) => r.from === 'templates-form'), {
    from: 'templates-form', to: 'patterns-forms', anchor: undefined,
  });
  assert.ok(ids.has('patterns-forms'));
  assert.ok(!ids.has('templates-form'));
});
