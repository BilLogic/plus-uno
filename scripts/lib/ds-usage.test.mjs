import { test } from 'node:test';
import assert from 'node:assert/strict';

import { RULES, closest, contextFrom, escapesIn } from './ds-usage.mjs';

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
      { name: '--color-advocacy', tier: 'semantic', group: 'Legacy Color Tokens', value: '#167745' },
      { name: '--radius-full', tier: 'primitive', group: 'Scale Primitives', value: '9999px' },
    ],
  },
  defined: new Set(['--local-gap', '--element-radius-full']),
  freeRegular: new Set(['bell', 'star']),
  retired: new Map([['--element-radius-full', '--radius-full'], ['--card-pad-md', '--card-pad-default']]),
  promoted: new Set(['--radius-full']),
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

test('ds/prefer-plus-component: a react-bootstrap name the barrel also exports (warn)', () => {
  const found = escapesIn({ path: 'p/App.jsx', text: "import { Button, Row } from 'react-bootstrap';\nimport Modal from 'react-bootstrap/Modal';" }, ctx);
  assert.deepEqual(found.map((f) => [f.rule, f.level]), [
    ['ds/prefer-plus-component', 'warn'],
    ['ds/prefer-plus-component', 'warn'],
  ]);
});

test('ds/no-retired-name: a deprecated prop or a legacy token (warn)', () => {
  const found = escapesIn({ path: 'p/App.jsx', text: DS + '<Button size="small" />' }, ctx);
  assert.deepEqual(found.map((f) => [f.rule, f.level]), [['ds/no-retired-name', 'warn']]);
  assert.match(found[0].fix, /spacing/);
  assert.deepEqual(rulesOf('p/a.scss', '.a { color: var(--color-advocacy); }'), ['ds/no-retired-name']);
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
