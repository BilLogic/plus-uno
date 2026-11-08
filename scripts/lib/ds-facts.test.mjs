/**
 * Tests for the DS facts module, through its interface only: a real or
 * fixture tree in, facts out.
 *
 * The barrel cases carry over from the reader this module replaced. The
 * defect they were written against is real and shipped: the components index
 * listed `PageLayout` for nine months while its barrel line sat behind `//`,
 * because the export regex read the file as text. The index is the existence
 * law, so an entry nothing can import is the worst failure it has.
 *
 * Run: node --test scripts/lib/ds-facts.test.mjs
 */

import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONSUMER_ROOTS, loadFacts, readBarrel } from './ds-facts.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const roots = [];

/** Write a throwaway tree and return its root. */
function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-facts-'));
  roots.push(root);
  for (const [rel, content] of Object.entries(files)) {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content));
  }
  return root;
}

after(() => {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
});

/** A barrel tree under `design-system/src/components/`. */
const barrel = (files) =>
  fixture(Object.fromEntries(Object.entries(files).map(([rel, text]) => [`design-system/src/components/${rel}`, text])));

const components = (root) => readBarrel(root).components;

// ── The real repo ────────────────────────────────────────────────────────────

test('real repo: Button exists, from @/components, with its props and values', () => {
  const button = loadFacts(REPO_ROOT).lookup('Button');
  assert.equal(button.status, 'exists');
  assert.equal(button.kind, 'component');
  assert.equal(button.import, "import { Button } from '@/components';");
  const appearance = button.props.find((p) => p.name === 'appearance');
  assert.ok(appearance.values.includes('primary'));
});

test('real repo: Alert is not here; use SectionMessage', () => {
  const alert = loadFacts(REPO_ROOT).lookup('Alert');
  assert.equal(alert.status, 'not-here');
  assert.equal(alert.kind, null);
  assert.ok(alert.replacement.includes('SectionMessage'));
});

test('real repo: a pattern answers with its kind and barrel', () => {
  const card = loadFacts(REPO_ROOT).lookup('PatternCard');
  assert.equal(card.status, 'exists');
  assert.equal(card.kind, 'pattern');
  assert.equal(card.import, "import { PatternCard } from '@/patterns';");
  assert.equal(card.group, 'Card');
  const padding = card.props.find((p) => p.name === 'padding');
  assert.deepEqual(padding.values, ['sm', 'md', 'lg']);
  assert.equal(loadFacts(REPO_ROOT).lookup('PatternCard.padding=xl').status, 'unknown');
});

test('real repo: PageLayout and PatternSidebar answer with their props, from source', () => {
  const facts = loadFacts(REPO_ROOT);
  const layout = facts.lookup('PageLayout');
  assert.equal(layout.kind, 'pattern');
  assert.equal(layout.import, "import { PageLayout } from '@/specs/Universal/Pages';");
  assert.deepEqual(layout.props.find((p) => p.name === 'frame').values, ['default', 'focused']);
  const sidebar = facts.lookup('PatternSidebar');
  assert.equal(sidebar.kind, 'pattern');
  assert.equal(sidebar.source, 'design-system/src/patterns/Sidebar/Sidebar.jsx');
  assert.ok(sidebar.props.length > 0);
  assert.equal(facts.lookup('Button').kind, 'component');
  assert.ok(facts.barrels['@/patterns'].has('useOpenTabs'));
});

test('real repo: a prop lookup answers values, and an invented prop names its replacement', () => {
  const facts = loadFacts(REPO_ROOT);
  assert.equal(facts.lookup('Button.appearance').status, 'exists');
  assert.equal(facts.lookup('Button.appearance=primary').status, 'exists');
  const variant = facts.lookup('Button.variant');
  assert.equal(variant.status, 'not-here');
  assert.deepEqual(variant.replacement, ['Button.appearance']);
  const secondary = facts.lookup('Button.appearance=secondary');
  assert.equal(secondary.status, 'not-here');
  assert.deepEqual(secondary.replacement, ['Button.appearance=default']);
});

test('real repo: tokens by name, by role, and retired', () => {
  const facts = loadFacts(REPO_ROOT);
  const [stack] = facts.tokens('--stack-md');
  assert.equal(stack.status, 'exists');
  assert.equal(stack.tier, 'semantic');
  assert.match(stack.intent, /gap/);
  const role = facts.tokens('stack').map((t) => t.name);
  assert.ok(role.includes('--stack-sm') && role.includes('--stack-lg'));
  assert.ok(role.every((name) => name.startsWith('--stack-')));
  assert.deepEqual(facts.tokens('--card-pad-sm'), [
    { name: '--card-pad-sm', status: 'retired', tier: null, group: null, value: null, intent: null, replacement: ['--card-pad-compact'], why: null },
  ]);
  assert.equal(facts.tokens('--stack-xl')[0].status, 'not-here');
  assert.deepEqual(facts.tokens('--nothing-like-this'), []);
});

test('real repo: not-here lists inventions and retired tokens, each with a replacement', () => {
  const rows = loadFacts(REPO_ROOT).notHere();
  assert.ok(rows.some((r) => r.not === 'Toast' && r.kind === 'component' && r.use.includes('Flag')));
  assert.ok(rows.some((r) => r.not === '--card-pad-sm' && r.kind === 'token' && r.use[0] === '--card-pad-compact'));
  assert.ok(rows.every((r) => r.use.length > 0));
});

test('real repo: scope is the consumer-code roots, and the barrel reaches across sections for importable names', () => {
  const facts = loadFacts(REPO_ROOT);
  assert.deepEqual(facts.scope, CONSUMER_ROOTS);
  assert.deepEqual(CONSUMER_ROOTS, ['prototypes', 'src']);
  assert.ok(facts.importable.has('Button'));
  const { components: listed, names } = readBarrel(REPO_ROOT);
  assert.ok(listed.length > 40);
  assert.ok(names.length > listed.length, 'importable names include parts, constants and @/dataviz');
});

test('every check that scopes consumer code composes its roots from the facts module', async () => {
  const facts = await import('./ds-facts.mjs');
  const { CONSUMER_ROOTS: consumer, SOURCE_ROOTS, LIBRARY_ROOT, STORYBOOK_ROOT, PROTOTYPE_ROOTS, APP_SHELL_ROOT } = facts;
  assert.deepEqual(SOURCE_ROOTS, [LIBRARY_ROOT, ...consumer]);
  assert.deepEqual(PROTOTYPE_ROOTS, consumer.filter((root) => root !== APP_SHELL_ROOT));
  const roots = async (file, name) => (await import(`../${file}`))[name];
  assert.equal(await roots('check-ds-usage.mjs', 'SCOPE'), consumer);
  for (const file of ['check-ads-language.mjs', 'check-old-system.mjs', 'check-react-bootstrap-imports.mjs']) {
    assert.equal(await roots(file, 'SEARCH_ROOTS'), SOURCE_ROOTS, file);
  }
  for (const file of ['check-font-families.mjs', 'check-undefined-tokens.mjs']) {
    assert.deepEqual(await roots(file, 'ROOTS'), [LIBRARY_ROOT, STORYBOOK_ROOT, ...PROTOTYPE_ROOTS], file);
  }
  assert.deepEqual((await import('./fallback-check.mjs')).SEARCH_ROOTS, [LIBRARY_ROOT, STORYBOOK_ROOT, ...PROTOTYPE_ROOTS]);
});

test('an unknown name is answered, not thrown', () => {
  assert.deepEqual(loadFacts(REPO_ROOT).lookup('Frobnicator'), {
    name: 'Frobnicator',
    status: 'unknown',
    kind: null,
    import: null,
    group: null,
    source: null,
    summary: null,
    props: null,
    aliasOf: null,
    replacement: [],
    why: null,
  });
});

// ── A fixture tree: the edge cases ───────────────────────────────────────────

const MANIFEST = {
  components: [
    {
      name: 'Button',
      import: "import { Button } from '@/components';",
      group: 'forms',
      source: 'x',
      summary: 'Button: does a thing.',
      props: [
        { name: 'appearance', type: 'enum', required: false, default: null, values: ['default', 'primary'], description: null, deprecated: null },
        { name: 'kind', type: 'string', required: false, default: null, values: null, description: null, deprecated: { replacement: 'appearance' } },
      ],
    },
    { name: 'Logo', import: "import { Logo } from '@/components';", group: null, source: null, summary: null, props: null },
    { name: 'RadioGroup', import: "import { RadioGroup } from '@/components';", group: 'forms', source: 'y', summary: null, props: [{ name: 'value', type: 'string', required: false, default: null, values: null, description: null, deprecated: null }] },
    { name: 'Scale', import: "import { Scale } from '@/components';", group: null, source: null, summary: null, props: null },
  ],
};
const DATA = {
  'agent-views/components.json': MANIFEST,
  'agent-views/tokens.json': { tokens: [{ name: '--stack-md', tier: 'semantic', group: 'Spacing', value: '8px', intent: null }] },
  'agent-views/_inventions.json': { components: [{ not: 'Toast', use: ['Flag'], why: 'renamed' }], props: [], tokens: [] },
  'agent-views/_patterns.json': { patterns: [] },
  'src/components/index.js': [
    "export { default as Button, BUTTON_APPEARANCES } from './Button';",
    "export { default as Logo } from '../brand/Logo';",
    "export { default as RadioGroup } from './RadioGroup';",
    "export { default as Scale } from './RadioGroup';",
  ].join('\n'),
};
const repoTree = () => fixture(Object.fromEntries(Object.entries(DATA).map(([rel, v]) => [`design-system/${rel}`, v])));

test('fixture: an alias names its target and reads the target\'s props', () => {
  const scale = loadFacts(repoTree()).lookup('Scale');
  assert.equal(scale.status, 'exists');
  assert.equal(scale.aliasOf, 'RadioGroup');
  assert.deepEqual(scale.props.map((p) => p.name), ['value']);
  assert.deepEqual(readBarrel(repoTree()).aliases, { Scale: 'RadioGroup' });
});

test('fixture: an export with no props exists, with props null', () => {
  const logo = loadFacts(repoTree()).lookup('Logo');
  assert.equal(logo.status, 'exists');
  assert.equal(logo.props, null);
  const constant = loadFacts(repoTree()).lookup('BUTTON_APPEARANCES');
  assert.equal(constant.status, 'exists');
  assert.equal(constant.kind, 'export');
});

test('fixture: a retired name and a deprecated prop name their replacement', () => {
  const facts = loadFacts(repoTree());
  assert.deepEqual(facts.lookup('Toast').replacement, ['Flag']);
  assert.equal(facts.lookup('Toast').why, 'renamed');
  const kind = facts.lookup('Button.kind');
  assert.equal(kind.status, 'exists');
  assert.deepEqual(kind.deprecated, { replacement: 'appearance' });
  assert.deepEqual(kind.replacement, ['Button.appearance']);
  assert.equal(facts.lookup('Button.appearance=loud').status, 'unknown');
  assert.equal(facts.lookup('Button.size').status, 'unknown');
});

test('fixture: a missing barrel leaves nothing importable, and facts still load', () => {
  const root = repoTree();
  fs.rmSync(path.join(root, 'design-system/src/components/index.js'));
  const facts = loadFacts(root);
  assert.equal(facts.importable.size, 0);
  assert.deepEqual(readBarrel(root), { components: [], names: [], aliases: {} });
  assert.equal(facts.lookup('Button').status, 'exists');
});

test('fixture: the design-system folder loads as a package root, the same as the repo', () => {
  const pkg = fixture(DATA);
  const facts = loadFacts(pkg);
  assert.equal(facts.lookup('Scale').aliasOf, 'RadioGroup');
  assert.ok(facts.importable.has('Button'));
});

test('a root with no facts fails, naming what it looked for', () => {
  assert.throws(() => loadFacts(fixture({ 'x.txt': '' })), /agent-views\/components\.json/);
});

// ── The barrel reader ────────────────────────────────────────────────────────

test('a commented-out export is not an export', () => {
  const root = barrel({
    'index.js': [
      "export { default as Sidebar } from './Sidebar/Sidebar';",
      "// export { default as PageLayout } from './PageLayout/PageLayout';",
    ].join('\n'),
  });
  assert.deepEqual(components(root), ['Sidebar']);
});

test('a block-commented export is not an export either', () => {
  const root = barrel({
    'index.js': ['/* export { default as Retired } from "./Retired"; */', "export { default as Button } from './Button';"].join('\n'),
  });
  assert.deepEqual(components(root), ['Button']);
});

test('prose above a live export does not suppress it', () => {
  const root = barrel({
    'index.js': ['// A separate export through the deprecation period: 84 call sites', "export { default as BadgeVariants } from './BadgeVariants';"].join('\n'),
  });
  assert.deepEqual(components(root), ['BadgeVariants']);
});

test('`export *` is followed into a sibling barrel', () => {
  const root = barrel({
    'index.js': "export * from './forms';",
    'forms/index.js': ["export { default as Input } from './Input';", "// export { default as Retired } from './Retired';"].join('\n'),
  });
  assert.deepEqual(components(root), ['Input']);
});

test('`export *` outside the barrel\'s folder adds importable names, not components', () => {
  const root = fixture({
    'design-system/src/components/index.js': ["export { default as Card } from './Card';", "export * from '@/dataviz';"].join('\n'),
    'design-system/src/dataviz/index.js': "export { default as BarChart } from './BarChart';",
  });
  const read = readBarrel(root);
  assert.deepEqual(read.components, ['Card']);
  assert.deepEqual(read.names, ['BarChart', 'Card']);
});

test('an unresolvable `export *` is reported', () => {
  const root = barrel({ 'index.js': "export * from './gone';" });
  const missing = [];
  readBarrel(root, '@/components', { onUnresolved: (spec) => missing.push(spec) });
  assert.deepEqual(missing, ['./gone']);
});

test('a `//` inside a specifier is not a comment', () => {
  const root = barrel({
    'index.js': ["export { default as Remote } from 'https://esm.sh/remote';", "export { default as Local } from './Local';"].join('\n'),
  });
  assert.deepEqual(components(root), ['Local', 'Remote']);
});

test('a multi-line export is still an export', () => {
  const root = barrel({ 'index.js': ['export {', '  default as Wrapped,', "} from './Wrapped';"].join('\n') });
  assert.deepEqual(components(root), ['Wrapped']);
});

test('a plain re-export does not swallow the statement after it', () => {
  const root = barrel({ 'index.js': ['export { helper };', "export { default as Card } from './Card';"].join('\n') });
  assert.deepEqual(components(root), ['Card']);
});

test('a component exported beside its constants is still an export', () => {
  const root = barrel({
    'index.js': [
      "export { default as AiIcon, AI_ICON_NAMES, AI_ICON_SIZES } from './AiIcon';",
      "export { default as Suggestion, SUGGESTION_TYPES } from './Suggestion';",
      'export {',
      '  default as Panel,',
      '  PanelBody,',
      "} from './Panel';",
    ].join('\n'),
  });
  assert.deepEqual(components(root), ['AiIcon', 'Panel', 'Suggestion']);
});

test('importable names: parts and constants included, across export *', () => {
  const root = barrel({
    'index.js': [
      "export { default as Table, TableRow, HeadCell } from './table';",
      "export { default as Flag, FLAG_APPEARANCES } from './flag';",
      "// export { default as Gone } from './gone';",
      "export * from './charts';",
    ].join('\n'),
    'charts.js': "export { default as BarChart } from './bar';\nexport const CHART_THEME = {};",
  });
  assert.deepEqual(readBarrel(root).names, ['BarChart', 'CHART_THEME', 'FLAG_APPEARANCES', 'Flag', 'HeadCell', 'Table', 'TableRow']);
});
