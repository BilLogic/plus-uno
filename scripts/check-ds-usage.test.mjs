import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { REPO_ROOT, contextOf, escapes, filesUnder, inScope, judge, scopeFiles, tally } from './check-ds-usage.mjs';
import fs from 'node:fs';
import os from 'node:os';
import { RULES, escapesIn } from './lib/ds-usage.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = 'scripts/lib/__fixtures__/ds-usage';
const cli = (...args) => spawnSync(process.execPath, ['scripts/check-ds-usage.mjs', ...args], { cwd: ROOT, encoding: 'utf8' });

test('reference stories, pattern code stories and MDX code blocks are held to zero', () => {
  for (const file of [
    'design-system/src/patterns/Page/ReferenceScreens.stories.jsx',
    'design-system/src/storybook-docs/patterns/CodeExamples.stories.jsx',
    'design-system/src/storybook-docs/patterns/Filtering/Filtering.mdx',
  ]) assert.ok(inScope(file), file);
  const text = `# Example\n\nA sentence mentioning 16px is prose.\n\n\`\`\`jsx\nimport { Select, PatternSection } from '@/patterns';\n\`\`\`\n`;
  const found = escapesIn({ path: 'design-system/src/Example.mdx', text }, contextOf(REPO_ROOT));
  assert.ok(found.some((f) => f.rule === 'ds/no-unknown-component' && f.line === 6));
  assert.equal(found.some((f) => f.rule === 'ds/no-raw-literal'), false);
  const placement = `# Filtering\n\n\`\`\`jsx\nimport { Select } from '@/components';\nimport { PatternSection } from '@/patterns';\n<PatternSection toolbar={<Select options={['All']} />} />;\n\`\`\``;
  assert.ok(escapesIn({ path: 'design-system/src/Example.mdx', text: placement }, contextOf(REPO_ROOT)).some((f) => f.rule === 'ds/placement' && f.line === 6));
  const outerImport = `import { PatternSection } from '@/patterns';\nimport { Select } from '@/components';\n\n\`\`\`jsx\n<PatternSection toolbar={<Select options={['All']} />} />;\n\`\`\``;
  assert.ok(escapesIn({ path: 'design-system/src/Example.mdx', text: outerImport }, contextOf(REPO_ROOT)).some((f) => f.rule === 'ds/placement' && f.line === 5));
});

test('a prototype with one escape per fail-level rule exits 1, naming file, line, column, rule and fix', () => {
  const out = cli(`${FIXTURES}/escaping`);
  assert.equal(out.status, 1);
  const failRules = Object.entries(RULES).filter(([id, r]) => r.level === 'fail' && id !== 'ds/no-raw-motion').map(([id]) => id);
  for (const rule of failRules) {
    assert.match(out.stderr, new RegExp(`escaping/src/App\\.jsx:\\d+:\\d+  ${rule}  `), rule);
  }
  assert.match(out.stderr, /-> did you mean `Button`\?/);
  assert.match(out.stderr, /see docs\/engineering\/ds-usage-rules\.md#dsno-unknown-component/);
});

test('a prototype that stays inside the design system exits 0', () => {
  const out = cli(`${FIXTURES}/clean`);
  assert.equal(out.status, 0, out.stderr);
});

test('--json prints the same findings as data', () => {
  const out = cli(`${FIXTURES}/escaping`, '--json');
  assert.equal(out.status, 1);
  const data = JSON.parse(out.stdout);
  assert.equal(data.files, 1);
  assert.ok(data.blocking.every((f) => f.file && f.line && f.col && f.rule && f.fix));
});

test('the whole scope passes against the recorded baseline, in under five seconds', () => {
  const started = Date.now();
  const out = cli('--all');
  assert.equal(out.status, 0, out.stderr);
  assert.ok(Date.now() - started < 5000, `took ${Date.now() - started}ms`);
});

test('scope: consumer code only, tests and stories skipped', () => {
  assert.ok(inScope('prototypes/x/src/main.jsx'));
  assert.ok(inScope('prototypes/x/src/App.scss'));
  assert.ok(!inScope('src/App.jsx'));
  assert.ok(!inScope('design-system/src/components/x/X.jsx'));
  assert.ok(!inScope('prototypes/x/src/App.test.jsx'));
  assert.ok(!inScope('prototypes/x/node_modules/y/index.js'));
});

test('DS styles are in scope and raw motion fails while semantic motion passes', () => {
  const ctx = contextOf(REPO_ROOT);
  for (const kind of ['components', 'patterns', 'templates']) {
    const file = `design-system/src/${kind}/Example/Example.scss`;
    assert.ok(inScope(file));
    for (const declaration of [
      'transition: all 0.2s ease',
      'animation: pulse 150ms ease-in-out infinite',
      'transition-timing-function: cubic-bezier(0, 0, 1, 1)',
      'animation-duration: .5s',
    ]) {
      const found = escapesIn({ path: file, text: `.example { ${declaration}; }` }, ctx);
      assert.equal(found.length, 1, declaration);
      assert.equal(found[0].rule, 'ds/no-raw-motion');
      assert.equal(found[0].level, 'fail');
    }
    const clean = `.example {
      transition: transform var(--ds-motion-spatial-fast-duration) var(--ds-motion-spatial-fast);
      animation: pulse var(--ds-motion-loop-duration) var(--ds-motion-loop) infinite alternate;
    }`;
    assert.deepEqual(escapesIn({ path: file, text: clean }, ctx), []);
    assert.deepEqual(escapesIn({ path: file, text: '.option { animation-delay: min(calc(var(--index) * 20ms), 500ms); }' }, ctx), []);
  }
});

test('an injected stylesheet fixture blocks the usage gate, then passes after migration', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-motion-'));
  const rel = 'design-system/src/components/Example/Example.scss';
  const file = path.join(root, rel);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '.example { transition: all 0.2s ease; }');
    const check = () => judge(REPO_ROOT, escapes(root, scopeFiles(root), REPO_ROOT), { held: true });
    assert.equal(check().blocking[0]?.rule, 'ds/no-raw-motion');
    fs.writeFileSync(file, '.example { transition: color var(--ds-motion-appearance-fast-duration) var(--ds-motion-appearance-fast); }');
    assert.deepEqual(check().blocking, []);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('tally: fail-level findings per rule and file; warnings are not held', () => {
  const f = (rule, level, file) => ({ rule, level, file });
  assert.deepEqual(
    tally([f('ds/no-raw-literal', 'fail', 'a'), f('ds/no-raw-literal', 'fail', 'a'), f('ds/no-retired-name', 'warn', 'a')]),
    { 'ds/no-raw-literal a': 2 },
  );
});

test('outside a git checkout, the files on disk stand in for the tracked list', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-usage-nogit-'));
  try {
    for (const rel of ['prototypes/a/src/App.jsx', 'prototypes/a/node_modules/x.js', 'prototypes/.hidden/b.jsx', 'src/c.scss']) {
      fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), '');
    }
    assert.deepEqual(filesUnder(root, ['prototypes', 'src']), ['prototypes/a/src/App.jsx', 'src/c.scss']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the real facts hold patterns: invented name, wrong prop and wrong value fail; valid use passes', () => {
  const ctx = contextOf(REPO_ROOT);
  const rules = (text) => escapesIn({ path: 'prototypes/x/src/App.jsx', text }, ctx).map((f) => f.rule);
  const head = "import { Frame, PatternCard, PatternSection } from '@/patterns';\n";
  assert.deepEqual(rules(head + '<Frame width="reading"><PatternSection><PatternCard title="x" padding="md" /></PatternSection></Frame>'), []);
  assert.deepEqual(rules("import { PatternCardd } from '@/patterns';"), ['ds/no-unknown-component']);
  assert.deepEqual(rules(head + '<PatternCard heading="x" />'), ['ds/no-unknown-prop']);
  assert.deepEqual(rules(head + '<PatternCard padding="xl" />'), ['ds/no-unknown-prop']);
  assert.deepEqual(rules(head + '<Frame width="wide" />'), ['ds/no-unknown-prop']);
});

test('repeated toolbar mistakes and hand-styled pages fail with actionable fixes', () => {
  const code = `import { Select } from '@/components';
import { PatternSection } from '@/patterns';
export default function App() {
  return <div className="shell"><PatternSection toolbar={<Select options={[]} />} /></div>;
}`;
  const found = escapesIn({ path: 'prototypes/x/src/App.jsx', text: code }, contextOf(REPO_ROOT));
  for (const rule of ['ds/placement', 'ds/page-starts-from-pattern']) {
    const finding = found.find((f) => f.rule === rule);
    assert.equal(finding?.level, 'fail', rule);
    assert.match(finding.fix, rule === 'ds/placement' ? /FilterButton/ : /Frame/);
  }
});

test('MDX examples and reference-screen stories use the same placement checker', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-examples-'));
  const mdx = 'design-system/src/storybook-docs/Example.mdx';
  const story = 'design-system/src/storybook-docs/Reference.stories.jsx';
  try {
    fs.mkdirSync(path.dirname(path.join(root, mdx)), { recursive: true });
    fs.writeFileSync(path.join(root, mdx), '# Example\n\n```jsx\n<PatternSection.Toolbar filters={<Select options={[]} />} />\n```\n');
    fs.writeFileSync(path.join(root, story), `import { Select } from '@/components';
import { PatternSection } from '@/patterns';
export default { tags: ['reference-screen'] };
export const Queue = { render: () => <PatternSection.Toolbar filters={<Select options={[]} />} /> };`);
    const found = escapes(root, [mdx, story], ROOT).filter((f) => f.rule === 'ds/placement');
    assert.deepEqual(found.map((f) => [f.file, f.line, f.level]), [[mdx, 4, 'fail'], [story, 4, 'fail']]);
    assert.ok(inScope(mdx));
    assert.ok(inScope(story));
    assert.ok(found.every((f) => /FilterButton/.test(f.fix)));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('promoted placements have repeated misses in the ledger and stay within five rows', () => {
  const rows = contextOf(ROOT).placements.filter((r) => r.level !== 'warn');
  assert.ok(rows.length > 0 && rows.length <= 5);
  const ledger = fs.readFileSync(path.join(ROOT, 'docs/evals/ds-usage-ledger.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  for (const row of rows) {
    const misses = ledger.filter((r) => r.task === row.evidence.task && r.fit?.[row.evidence.item]?.verdict === 'ignored');
    assert.ok(misses.length >= 2, row.id);
  }
});

test('every reference-screen render starts from a template', () => {
  const code = `export default { tags: ['reference-screen'] };
export const Good = { render: () => <Page /> };
export const Bad = { render: () => <div className="shell" /> };`;
  const found = escapesIn({ path: 'Reference.stories.jsx', text: code, page: true }, contextOf(ROOT));
  assert.ok(found.some((f) => f.rule === 'ds/page-starts-from-pattern' && f.level === 'fail' && f.line === 3));
});
