import { test } from 'node:test';
import assert from 'node:assert/strict';

import { RULES, closest, contextFrom, escapesIn, isPageModule, pagesOf } from './ds-usage.mjs';

const ctx = contextFrom({
  components: {
    components: [
      {
        name: 'Button',
        props: [
          { name: 'appearance', values: ['primary', 'subtle'], deprecated: null },
          { name: 'spacing', values: ['default', 'compact'], deprecated: null },
          { name: 'size', values: null, deprecated: { replacement: 'spacing' } },
          { name: 'onClick', values: null, deprecated: null },
        ],
      },
      { name: 'Logo', props: null },
      { name: 'Modal', props: [] },
    ],
  },
  tokens: {
    tokens: [
      { name: '--ds-text', tier: 'semantic', group: 'Color Tokens (--ds-)', value: 'var(--palette-neutral-1000)' },
      { name: '--palette-neutral-1000', tier: 'primitive', group: 'Color Primitives (--palette-)', value: '#172b4d' },
      { name: '--space-200', tier: 'semantic', group: 'Spacing Semantics', value: '16px' },
      { name: '--radius-full', tier: 'primitive', group: 'Scale Primitives', value: '9999px' },
    ],
  },
  defined: new Set(['--local-gap', '--element-radius-full']),
  freeRegular: new Set(['bell', 'star']),
  retired: new Map([['--element-radius-full', '--radius-full'], ['--card-pad-md', '--card-pad-default']]),
  promoted: new Set(['--radius-full']),
  exported: new Set(['Button', 'Logo', 'Modal', 'TableRow', 'FLAG_APPEARANCES']),
});

const DS = "import { Button, Logo, Modal } from '@/components';\n";
const rulesOf = (path, text) => escapesIn({ path, text }, ctx).map((f) => f.rule);

test('every rule has a doc anchor and a level', () => {
  for (const [id, rule] of Object.entries(RULES)) {
    assert.match(id, /^ds\/[a-z-]+$/);
    assert.ok(['fail', 'warn'].includes(rule.level), id);
  }
});

test('ds/no-unknown-component: a barrel import of a name the manifest lacks', () => {
  assert.deepEqual(rulesOf('p/App.jsx', DS + '<Button appearance="primary" />'), []);
  const [f] = escapesIn({ path: 'p/App.jsx', text: "import { Buton } from '@/components';" }, ctx);
  assert.equal(f.rule, 'ds/no-unknown-component');
  assert.match(f.fix, /Button/);
  assert.deepEqual([f.line, f.col], [1, 10]);
});

test('ds/no-unknown-component: a part or constant the barrel exports is known, though it has no record', () => {
  assert.deepEqual(rulesOf('p/App.jsx', "import { TableRow, FLAG_APPEARANCES } from '@/components';\n<TableRow anything=\"x\" />"), []);
});

test('ds/no-unknown-component: a member of a namespace import', () => {
  const text = "import * as DS from '@/components';\n<DS.Buton />";
  assert.deepEqual(rulesOf('p/App.jsx', text), ['ds/no-unknown-component']);
});

test('ds/no-deep-import: a path past the barrel', () => {
  assert.deepEqual(rulesOf('p/App.jsx', "import { Button } from '@/components';\nimport '@/styles/main.scss';"), []);
  assert.deepEqual(rulesOf('p/App.jsx', "import Button from '@/components/forms-and-inputs/Button';"), ['ds/no-deep-import']);
  assert.deepEqual(rulesOf('p/App.jsx', "import X from '../../design-system/src/components/x';"), ['ds/no-deep-import']);
  assert.deepEqual(rulesOf('p/App.jsx', "import { P } from '@plus-ds/patterns/Card';"), ['ds/no-deep-import']);
});

// Patterns are held like components: each to its own barrel.
const patternCtx = contextFrom({
  components: {
    components: [
      { name: 'Button', kind: 'component', import: "import { Button } from '@/components';", props: [{ name: 'appearance', values: ['primary'], deprecated: null }] },
      {
        name: 'PatternCard',
        kind: 'pattern',
        import: "import { PatternCard } from '@/patterns';",
        props: [
          { name: 'title', values: null, deprecated: null },
          { name: 'padding', values: ['sm', 'md', 'lg'], deprecated: null },
        ],
      },
      {
        name: 'Frame',
        kind: 'pattern',
        import: "import { Frame } from '@/patterns';",
        props: [{ name: 'width', values: ['content', 'reading'], deprecated: null }],
      },
    ],
  },
  tokens: { tokens: [] },
  exported: new Set(['Button']),
  barrels: { '@/patterns': new Set(['PatternCard', 'useOpenTabs', 'Frame']) },
});
const patternRules = (text) => escapesIn({ path: 'p/App.jsx', text }, patternCtx).map((f) => f.rule);
const PATTERNS = "import { PatternCard, useOpenTabs } from '@/patterns';\nimport { Frame } from '@/patterns';\n";

test('patterns: a valid Frame and pattern use passes', () => {
  assert.deepEqual(patternRules(PATTERNS + '<Frame width="reading"><PatternCard title="x" padding="md" /></Frame>'), []);
  assert.deepEqual(patternRules("import { PatternCard } from '@plus-ds/patterns';\n<PatternCard padding=\"lg\" />"), []);
});

test('patterns: an invented pattern name fails, with the nearest real one', () => {
  const [f, ...rest] = escapesIn({ path: 'p/App.jsx', text: "import { PatternCrad } from '@/patterns';" }, patternCtx);
  assert.equal(rest.length, 0);
  assert.equal(f.rule, 'ds/no-unknown-component');
  assert.match(f.fix, /PatternCard/);
  assert.deepEqual(patternRules("import { PageShell } from '@/patterns';"), ['ds/no-unknown-component']);
});

test('patterns: a pattern imported from a barrel that does not export it fails, naming its barrel', () => {
  const [f] = escapesIn({ path: 'p/App.jsx', text: "import { PatternCard } from '@/components';" }, patternCtx);
  assert.equal(f.rule, 'ds/no-unknown-component');
  assert.match(f.fix, /@\/patterns/);
});

test('patterns: a wrong prop or a wrong value on PatternCard or Frame fails', () => {
  assert.deepEqual(patternRules(PATTERNS + '<PatternCard heading="x" />'), ['ds/no-unknown-prop']);
  assert.deepEqual(patternRules(PATTERNS + '<PatternCard padding="xl" />'), ['ds/no-unknown-prop']);
  assert.deepEqual(patternRules(PATTERNS + '<Frame width="wide" />'), ['ds/no-unknown-prop']);
  assert.deepEqual(patternRules(PATTERNS + '<Frame layout="focused" />'), ['ds/no-unknown-prop']);
});

test('patterns: a namespace import of @/patterns holds its members too', () => {
  assert.deepEqual(patternRules("import * as P from '@/patterns';\n<P.PatternCard padding=\"sm\" /><P.PatternCrad />"), ['ds/no-unknown-component']);
});

test('patterns: a deep pattern import keeps its rule, and its fix names the pattern barrel', () => {
  const [f] = escapesIn({ path: 'p/App.jsx', text: "import PatternCard from '@/patterns/PatternCard';" }, patternCtx);
  assert.equal(f.rule, 'ds/no-deep-import');
  assert.match(f.fix, /from '@\/patterns'/);
});

test('ds/no-unknown-prop: an unknown prop and an enum value outside the list', () => {
  assert.deepEqual(rulesOf('p/App.jsx', DS + '<Button appearance="subtle" spacing={\'compact\'} onClick={go} aria-label="x" data-x key={1} className="c" />'), []);
  const found = escapesIn({ path: 'p/App.jsx', text: DS + '<Button variant="primary" appearance="primay" />' }, ctx);
  assert.deepEqual(found.map((f) => f.rule), ['ds/no-unknown-prop', 'ds/no-unknown-prop']);
  assert.match(found[1].fix, /primary/);
});

test('ds/no-unknown-prop: a spread or an unparsed component is not judged; an expression value is not judged', () => {
  assert.deepEqual(rulesOf('p/App.jsx', DS + '<Logo anything="x" /><Button appearance={tone} />'), []);
});

test('ds/no-raw-literal: JSX style values, SCSS and CSS declarations', () => {
  assert.deepEqual(rulesOf('p/App.jsx', "<div style={{ padding: 'var(--space-200)', margin: 0, lineHeight: 1.4, color: tone }} />"), []);
  assert.deepEqual(
    rulesOf('p/App.jsx', "<div style={{ padding: '12px', color: '#fff', gap: 8, fontWeight: 600, fontFamily: 'Inter' }} />"),
    Array(5).fill('ds/no-raw-literal'),
  );
  assert.deepEqual(rulesOf('p/a.scss', '.a {\n  padding: var(--space-200);\n  margin: 0;\n  z-index: 2;\n}\n@media (max-width: 768px) { .b { color: var(--ds-text); } }'), []);
  assert.deepEqual(rulesOf('p/a.scss', '.a {\n  padding: 12px 1rem;\n  color: rgba(0, 0, 0, 0.5);\n  border-color: #ddd;\n}'), Array(3).fill('ds/no-raw-literal'));
  const [f] = escapesIn({ path: 'p/a.css', text: '.a { padding: 16px; }' }, ctx);
  assert.match(f.fix, /--space-200/);
});

test('ds/no-raw-literal: a var() fallback is not a raw literal', () => {
  assert.deepEqual(rulesOf('p/a.scss', '.a { padding: var(--space-200, 16px); }'), []);
});

test('ds/no-unknown-token: a var() naming no token; known, local and external names pass', () => {
  assert.deepEqual(rulesOf('p/a.scss', '.a { color: var(--ds-text); gap: var(--local-gap); }'), []);
  const [f] = escapesIn({ path: 'p/a.scss', text: '.a { color: var(--ds-txt); }' }, ctx);
  assert.equal(f.rule, 'ds/no-unknown-token');
  assert.match(f.fix, /--ds-text/);
});

test('ds/no-primitive-read: consumer code reads a primitive', () => {
  const [f] = escapesIn({ path: 'p/a.scss', text: '.a { color: var(--palette-neutral-1000); }' }, ctx);
  assert.equal(f.rule, 'ds/no-primitive-read');
  assert.match(f.fix, /--ds-text/);
  assert.deepEqual(rulesOf('p/App.jsx', "<div style={{ color: 'var(--palette-neutral-1000)' }} />"), ['ds/no-primitive-read']);
});

test('ds/fa-free-only: a Pro family, or a regular icon Free does not ship', () => {
  assert.deepEqual(rulesOf('p/App.jsx', '<i className="fa-solid fa-house" /><i className="fa-regular fa-bell" />'), []);
  assert.deepEqual(rulesOf('p/App.jsx', '<i className="fa-light fa-house" />'), ['ds/fa-free-only']);
  assert.deepEqual(rulesOf('p/App.jsx', '<i className="fa-regular fa-grid-2" />'), ['ds/fa-free-only']);
});

test('ds/fa-free-only: with Font Awesome metadata, solid and brands names are held to Free too', () => {
  const withMeta = { ...ctx, freeIcons: { solid: new Set(['house']), brands: new Set(['figma']) } };
  const rules = (text) => escapesIn({ path: 'p/App.jsx', text }, withMeta).map((f) => f.rule);
  assert.deepEqual(rules('<i className="fa-solid fa-house" /><i className="fa-brands fa-figma" />'), []);
  assert.deepEqual(rules('<i className="fa-solid fa-grid-2" />'), ['ds/fa-free-only']);
});

test('ds/no-raw-literal: a value match prefers tokens named for the property role', () => {
  const roles = contextFrom({
    components: { components: [] },
    tokens: {
      tokens: [
        { name: '--icon-size-sm', tier: 'semantic', group: 'Scale Tokens', value: '12px' },
        { name: '--pad-x-sm', tier: 'semantic', group: 'Spacing Semantics', value: '12px' },
      ],
    },
  });
  const [f] = escapesIn({ path: 'p/a.scss', text: '.a { padding: 12px; }' }, roles);
  assert.equal(f.fix, 'use var(--pad-x-sm)');
});

test('ds/no-retired-name: a deprecated prop (warn)', () => {
  const found = escapesIn({ path: 'p/App.jsx', text: DS + '<Button size="small" />' }, ctx);
  assert.deepEqual(found.map((f) => [f.rule, f.level]), [['ds/no-retired-name', 'warn']]);
  assert.match(found[0].fix, /spacing/);
});

test('ds/no-unknown-token: a name from a deleted token set is not a token (fail)', () => {
  const gone = ['--', 'color', '-advocacy'].join('');
  assert.deepEqual(rulesOf('p/a.scss', `.a { color: var(${gone}); }`), ['ds/no-unknown-token']);
});

test('ds/no-primitive-read: a primitive the token plan names as a semantic step is readable', () => {
  assert.deepEqual(rulesOf('p/a.scss', '.a { border-radius: var(--radius-full); }'), []);
});

test('a retired token name: a warning while it is still declared, an unknown token once it is not', () => {
  const live = escapesIn({ path: 'p/a.scss', text: '.a { border-radius: var(--element-radius-full); }' }, ctx);
  assert.deepEqual(live.map((f) => [f.rule, f.level, f.fix]), [['ds/no-retired-name', 'warn', 'use var(--radius-full)']]);
  const gone = escapesIn({ path: 'p/a.scss', text: '.a { padding: var(--card-pad-md); }' }, ctx);
  assert.deepEqual(gone.map((f) => [f.rule, f.fix]), [['ds/no-unknown-token', 'use var(--card-pad-default)']]);
});

test('closest: the nearest name within a small edit distance, else null', () => {
  assert.equal(closest('Buton', ['Button', 'Modal']), 'Button');
  assert.equal(closest('Zebra', ['Button', 'Modal']), null);
});

// A page starts from a template (Frame) or a pattern, not from a hand-made shell.
const pageRules = (path, text, page) => escapesIn({ path, text, page }, patternCtx).map((f) => [f.rule, f.level]);
const SHELL = "export default function App() {\n  return (\n    <div style={{ display: 'grid', gap: 0 }}>\n      <h1>Sessions</h1>\n    </div>\n  );\n}\n";

test('ds/page-starts-from-pattern: a page whose outer element is a hand-styled container warns', () => {
  const [f, ...rest] = escapesIn({ path: 'p/src/App.jsx', text: SHELL }, patternCtx);
  assert.equal(rest.length, 0);
  assert.deepEqual([f.rule, f.level, f.line, f.col], ['ds/page-starts-from-pattern', 'warn', 3, 5]);
  assert.match(f.fix, /Frame/);
  assert.deepEqual(pageRules('p/pages/Home.jsx', 'const Home = () => (\n  <main className="home-grid"><p>x</p></main>\n);\nexport default Home;\n'), [
    ['ds/page-starts-from-pattern', 'warn'],
  ]);
  assert.deepEqual(pageRules('p/src/SessionsPage.jsx', 'export default function SessionsPage({ rows }) {\n  if (!rows) return null;\n  return <section style={styles.page}>{rows.map((r) => {\n    return <div className="row">{r}</div>;\n  })}</section>;\n}\n'), [
    ['ds/page-starts-from-pattern', 'warn'],
  ]);
});

test('ds/page-starts-from-pattern: a Frame or pattern root passes, through a fragment or a provider', () => {
  const layout = PATTERNS + 'export default function App() {\n  return (\n    <Frame width="reading">\n      <div style={{ display: \'flex\' }} />\n    </Frame>\n  );\n}\n';
  assert.deepEqual(pageRules('p/src/App.jsx', layout), []);
  const card = PATTERNS + 'export default function Home() {\n  return (\n    <>\n      <PatternCard title="x" />\n    </>\n  );\n}\n';
  assert.deepEqual(pageRules('p/pages/Home/Home.jsx', card), []);
  const provided = 'export default function App() {\n  return (\n    <ThemeProvider value={t}>\n      <div className="shell" />\n    </ThemeProvider>\n  );\n}\n';
  assert.deepEqual(pageRules('p/src/App.jsx', provided), [['ds/page-starts-from-pattern', 'warn']]);
  assert.deepEqual(pageRules('p/src/App.jsx', 'export default function App() {\n  return <div><PatternCard title="x" /></div>;\n}\n'), [], 'a bare wrapper carries no layout of its own');
  assert.deepEqual(pageRules('p/src/App.jsx', 'export default function App() {\n  return null;\n}\n'), []);
  assert.deepEqual(pageRules('p/src/App.jsx', 'export default function App() {\n  return (\n    <>\n      {open && <div className="fab" />}\n    </>\n  );\n}\n'), [], 'a conditional child is not the outer element');
});

test('ds/page-starts-from-pattern: a module that is not a page is not checked', () => {
  assert.equal(isPageModule('prototypes/x/src/components/Panel.jsx'), false);
  assert.deepEqual(pageRules('prototypes/x/src/components/Panel.jsx', SHELL), []);
  assert.deepEqual(pageRules('p/src/App.jsx', SHELL, false), [], 'the caller may say a module is not a page');
  assert.deepEqual(pageRules('p/src/Panel.jsx', SHELL, true), [['ds/page-starts-from-pattern', 'warn']], 'or that it is one');
  for (const page of ['prototypes/x/src/App.jsx', 'src/App.tsx', 'prototypes/x/src/pages/Home.jsx', 'src/pages/Market/Market.jsx', 'eval-x/src/HistoryPage.jsx']) {
    assert.equal(isPageModule(page), true, page);
  }
  for (const other of ['src/pages/Market/MarketCard.jsx', 'src/main.jsx', 'src/pages/Home.stories.jsx', 'src/pages/Home.css']) {
    assert.equal(isPageModule(other), false, other);
  }
});

test('pagesOf: the module an app entry renders as its root is a page too', () => {
  const files = [
    { path: 'eval-x/src/App.jsx', text: "import Reviews from './Reviews';\nexport default function App() {\n  return <Reviews />;\n}\n" },
    { path: 'eval-x/src/Reviews.jsx', text: SHELL },
    { path: 'eval-x/src/Row.jsx', text: SHELL },
  ];
  assert.deepEqual([...pagesOf(files)].sort(), ['eval-x/src/App.jsx', 'eval-x/src/Reviews.jsx']);
  const provided = [
    { path: 'p/src/App.jsx', text: "import { Shell } from './shell/index';\nexport default function App() {\n  return (\n    <AppProvider>\n      <Shell />\n    </AppProvider>\n  );\n}\n" },
    { path: 'p/src/shell/index.jsx', text: SHELL },
  ];
  assert.ok(pagesOf(provided).has('p/src/shell/index.jsx'));
});
