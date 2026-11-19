import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { exitCodeFor } from './lib/findings.mjs';
import {
  BLOCK_ON_NAMING_MISMATCH,
  missingSyntaxExceptions,
  SNAPSHOT_PATH,
  checkTokenNaming,
  expectedToken,
  run,
} from './check-token-naming.mjs';

function makeSnapshot(collections) {
  return {
    capturedAt: '2026-11-16',
    collections,
  };
}

function fixtureTree(collections, scssLines = []) {
  const root = mkdtempSync(join(tmpdir(), 'token-naming-'));
  mkdirSync(join(root, 'scripts'), { recursive: true });
  mkdirSync(join(root, 'design-system/src/tokens'), { recursive: true });
  writeFileSync(join(root, SNAPSHOT_PATH), JSON.stringify(makeSnapshot(collections)));
  writeFileSync(
    join(root, 'design-system/src/tokens/_test.scss'),
    `:root {
${scssLines.map((line) => `  ${line}
`).join('')}}
`,
  );
  return root;
}

test('archived collections and Deprecated/* rows are excluded from all three checks', () => {
  const scss = new Set(['--ds-text']);
  const findings = checkTokenNaming(
    makeSnapshot({
      'archived / colors / accent': {
        variables: ['Advocacy/Advocacy', 'Brand/Primary'],
        codeSyntax: { 'Advocacy/Advocacy': 'var(--does-not-exist)' },
      },
      'archived / spacing / layout': {
        variables: ['Sidebar/width-sidebar'],
        codeSyntax: {},
      },
      'color / semantics': {
        variables: ['Deprecated/color/ai/border', 'Deprecated/color/ai/icon', 'color/text/default'],
        codeSyntax: {
          'Deprecated/color/ai/border': 'var(--deleted-ai-border)',
          'color/text/default': 'var(--ds-text)',
        },
      },
      'spacing / primitives': {
        variables: ['Deprecated/Radius/radius-025'],
        codeSyntax: {},
      },
    }),
    scss,
  );
  assert.deepEqual(findings, []);
});

test('kind 1: fails when WEB code syntax names a token SCSS does not define, naming variable, collection and expected token', () => {
  const scss = new Set(['--ds-text']);
  const findings = checkTokenNaming(
    makeSnapshot({
      'color / semantics': {
        variables: ['color/text/default', 'elevation/shadow/sunken'],
        codeSyntax: {
          'color/text/default': 'var(--ds-text)',
          'elevation/shadow/sunken': 'var(--ds-shadow-sunken)',
        },
      },
    }),
    scss,
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'unknown-token');
  assert.equal(findings[0].severity ?? 'error', 'error');
  assert.match(findings[0].message, /color \/ semantics/);
  assert.match(findings[0].message, /elevation\/shadow\/sunken/);
  assert.match(findings[0].message, /--ds-shadow-sunken/);
  assert.equal(exitCodeFor(findings), 1);
});

test('kind 1: fails when WEB code syntax is malformed (not var(--token))', () => {
  const scss = new Set(['--ds-text']);
  const findings = checkTokenNaming(
    makeSnapshot({
      'color / semantics': {
        variables: ['color/text/brand'],
        codeSyntax: {
          'color/text/brand': '--ds-text',
        },
      },
    }),
    scss,
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'unknown-token');
  assert.match(findings[0].message, /color \/ semantics/);
  assert.match(findings[0].message, /color\/text\/brand/);
  assert.match(findings[0].message, /--ds-text-brand/);
  assert.equal(exitCodeFor(findings), 1);
});

test('kind 2: fails when a live variable has no WEB code syntax and is not on the allowlist', () => {
  const scss = new Set();
  const findings = checkTokenNaming(
    makeSnapshot({
      'spacing / templates': {
        variables: ['Card/pad'],
        codeSyntax: {},
      },
    }),
    scss,
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'missing-syntax');
  assert.equal(findings[0].severity ?? 'error', 'error');
  assert.match(findings[0].message, /spacing \/ templates/);
  assert.match(findings[0].message, /Card\/pad/);
  assert.match(findings[0].message, /--card-pad/);
  assert.equal(exitCodeFor(findings), 1);
});

test('kind 2 allowlist: permits color/ai/*, Prompt input/*, elevation shadow parts, and Frame/sidebar-docked without WEB code syntax', () => {
  assert.ok(missingSyntaxExceptions().length >= 4);
  const findings = checkTokenNaming(
    makeSnapshot({
      'color / semantics': {
        variables: [
          'color/ai/background/bold/default',
          'color/ai/border',
          'elevation/shadow/raised/layer-1',
          'elevation/shadow/raised/layer-1/offsetX',
          'elevation/shadow/overflow/layer-2/spread',
        ],
        codeSyntax: {},
      },
      'spacing / components': {
        variables: ['Prompt input/radius', 'Prompt input/pad-y'],
        codeSyntax: {},
      },
      'spacing / templates': {
        variables: ['Frame/sidebar-docked'],
        codeSyntax: {},
      },
    }),
    new Set(),
  );
  assert.deepEqual(findings, []);
});

test('naming rule: collection prefixes, no doubled prefixes, camelCase kebab-case, and folder drops hold across collections', () => {
  // Base collection prefixes
  assert.equal(expectedToken('color / primitives', 'blue/100'), '--palette-blue-100');
  assert.equal(expectedToken('color / semantics', 'color/text/brand'), '--ds-text-brand');
  assert.equal(expectedToken('color / opacity', 'opacity/disabled'), '--ds-opacity-disabled');
  assert.equal(expectedToken('typography', 'Family/brand-heading'), '--type-family-brand-heading');
  assert.equal(expectedToken('typography', 'Tracking/tight'), '--type-tracking-tight');
  assert.equal(expectedToken('spacing / semantics', 'Pad/x-md'), '--pad-x-md');
  assert.equal(expectedToken('spacing / components', 'Dropdown menu/max-width'), '--dropdown-menu-max-width');
  assert.equal(expectedToken('layers', 'Layer/modal'), '--layer-modal');

  // 1. Don't double a prefix the path already carries
  assert.equal(expectedToken('typography', 'Type size/100'), '--type-size-100');
  assert.equal(expectedToken('typography', 'Type line height/125'), '--type-line-height-125');
  assert.equal(expectedToken('color / primitives', 'palette/blue-100'), '--palette-blue-100');
  assert.equal(expectedToken('color / opacity', 'ds/opacity-disabled'), '--ds-opacity-disabled');

  // 2. Kebab-case camelCase segments
  assert.equal(expectedToken('color / primitives', 'blackAlpha/60'), '--palette-black-alpha-60');
  assert.equal(expectedToken('color / primitives', 'darkNeutral/250'), '--palette-dark-neutral-250');
  assert.equal(expectedToken('color / primitives', 'darkNeutralAlpha/100'), '--palette-dark-neutral-alpha-100');
  assert.equal(expectedToken('spacing / primitives', 'ProgressRing/stroke'), '--progress-ring-stroke');

  // 3. Drop redundant leading folder where code does (Size/* and repeated <Folder>/<folder>-* segment)
  assert.equal(expectedToken('spacing / semantics', 'Size/Control/md'), '--control-md');
  assert.equal(expectedToken('spacing / semantics', 'Size/Icon/sm'), '--icon-sm');
  assert.equal(expectedToken('spacing / primitives', 'Size/size-100'), '--size-100');
  assert.equal(expectedToken('spacing / primitives', 'Radius/radius-full'), '--radius-full');
  assert.equal(expectedToken('spacing / primitives', 'Space/space-100'), '--space-100');
  assert.equal(expectedToken('spacing / primitives', 'Stroke/stroke-1'), '--stroke-1');
  assert.equal(expectedToken('spacing / semantics', 'Radius/full'), '--radius-full');
  assert.equal(expectedToken('spacing / semantics', 'Radius/Control/sm'), '--radius-control-sm');

  // 4. /default drop in color / semantics, except color/{background,text}/code/default where SCSS keeps -default
  assert.equal(expectedToken('color / semantics', 'color/background/neutral/default'), '--ds-background-neutral');
  assert.equal(expectedToken('color / semantics', 'color/background/code/default'), '--ds-background-code-default');
  assert.equal(expectedToken('color / semantics', 'color/text/code/default'), '--ds-text-code-default');

  // 5. Chart and skeleton families carry no --ds- prefix; global color/skeleton/default is --ds-skeleton
  assert.equal(expectedToken('color / semantics', 'color/chart/brand/default'), '--chart-brand');
  assert.equal(expectedToken('color / semantics', 'color/chart/blue/bold/hovered'), '--chart-blue-bold-hovered');
  assert.equal(expectedToken('color / semantics', 'color/skeleton/subtle'), '--skeleton-subtle');
  assert.equal(expectedToken('color / semantics', 'color/skeleton/default'), '--ds-skeleton');
  assert.equal(expectedToken('spacing / components', 'Skeleton/height'), '--skeleton-height');

  // 6. Motion maps to --ds-motion-*; raw Spring/* primitives map to --motion-spring-*
  assert.equal(expectedToken('motion', 'spatial/fast/stiffness'), '--ds-motion-spatial-fast');
  assert.equal(expectedToken('motion', 'appearance/default/damping'), '--ds-motion-appearance-default');
  assert.equal(expectedToken('motion', 'loop/mass'), '--ds-motion-loop');
  assert.equal(expectedToken('motion', 'linear'), '--ds-motion-linear');
  assert.equal(expectedToken('motion', 'Spring/880/stiffness'), '--motion-spring-880');
});

test('naming rule exceptions: /default drop (with code/default retained), chart/skeleton families, motion spring triples, and elevation shadow parts pass without warnings', () => {
  const scss = new Set([
    '--ds-background-neutral',
    '--ds-background-code-default',
    '--ds-text-code-default',
    '--ds-surface-raised',
    '--chart-brand',
    '--chart-blue-bold-hovered',
    '--skeleton-subtle',
    '--ds-skeleton',
    '--ds-motion-spatial-fast',
    '--ds-motion-appearance-default',
    '--ds-motion-loop',
    '--motion-spring-880',
    '--motion-spring-800-r60',
    '--ds-shadow-raised',
    '--ds-shadow-overflow-spread',
    '--ds-shadow-overflow-perimeter',
  ]);
  const findings = checkTokenNaming(
    makeSnapshot({
      'color / semantics': {
        variables: [
          'color/background/neutral/default',
          'color/background/code/default',
          'color/text/code/default',
          'elevation/surface/raised/default',
          'color/chart/brand/default',
          'color/chart/blue/bold/hovered',
          'color/skeleton/subtle',
          'color/skeleton/default',
          'elevation/shadow/raised/layer-1',
          'elevation/shadow/raised/layer-1/offsetX',
          'elevation/shadow/raised/layer-1/radius',
          'elevation/shadow/overflow/layer-1',
          'elevation/shadow/overflow/layer-2',
        ],
        codeSyntax: {
          'color/background/neutral/default': 'var(--ds-background-neutral)',
          'color/background/code/default': 'var(--ds-background-code-default)',
          'color/text/code/default': 'var(--ds-text-code-default)',
          'elevation/surface/raised/default': 'var(--ds-surface-raised)',
          'color/chart/brand/default': 'var(--chart-brand)',
          'color/chart/blue/bold/hovered': 'var(--chart-blue-bold-hovered)',
          'color/skeleton/subtle': 'var(--skeleton-subtle)',
          'color/skeleton/default': 'var(--ds-skeleton)',
          'elevation/shadow/raised/layer-1': 'var(--ds-shadow-raised)',
          'elevation/shadow/raised/layer-1/offsetX': 'var(--ds-shadow-raised)',
          'elevation/shadow/raised/layer-1/radius': 'var(--ds-shadow-raised)',
          'elevation/shadow/overflow/layer-1': 'var(--ds-shadow-overflow-spread)',
          'elevation/shadow/overflow/layer-2': 'var(--ds-shadow-overflow-perimeter)',
        },
      },
      motion: {
        variables: [
          'spatial/fast/damping',
          'spatial/fast/mass',
          'spatial/fast/stiffness',
          'appearance/default/damping',
          'loop/stiffness',
          'Spring/880/damping',
          'Spring/880/mass',
          'Spring/880/stiffness',
          'Spring/800-r60/damping',
        ],
        codeSyntax: {
          'spatial/fast/damping': 'var(--ds-motion-spatial-fast)',
          'spatial/fast/mass': 'var(--ds-motion-spatial-fast)',
          'spatial/fast/stiffness': 'var(--ds-motion-spatial-fast)',
          'appearance/default/damping': 'var(--ds-motion-appearance-default)',
          'loop/stiffness': 'var(--ds-motion-loop)',
          'Spring/880/damping': 'var(--motion-spring-880)',
          'Spring/880/mass': 'var(--motion-spring-880)',
          'Spring/880/stiffness': 'var(--motion-spring-880)',
          'Spring/800-r60/damping': 'var(--motion-spring-800-r60)',
        },
      },
    }),
    scss,
  );
  assert.deepEqual(findings, []);
});

test('kind 3: blocks when WEB code syntax disagrees with the naming rule, and only warns when blocking is off', () => {
  assert.equal(BLOCK_ON_NAMING_MISMATCH, true);
  const scss = new Set(['--radius-control-sm', '--ds-text']);
  const snapshot = makeSnapshot({
    'spacing / components': {
      variables: ['Flag/radius'],
      codeSyntax: { 'Flag/radius': 'var(--radius-control-sm)' },
    },
    'color / semantics': {
      variables: ['elevation/shadow/raised/layer-1'],
      codeSyntax: {
        'elevation/shadow/raised/layer-1': 'var(--ds-text)',
      },
    },
  });

  const warnings = checkTokenNaming(snapshot, scss, { blockOnNamingMismatch: false });
  assert.equal(warnings.length, 2);
  for (const finding of warnings) {
    assert.equal(finding.kind, 'naming-mismatch');
    assert.equal(finding.severity, 'warning');
  }
  const messages = warnings.map((w) => w.message).join('\n');
  assert.match(messages, /spacing \/ components · Flag\/radius.*--flag-radius/);
  assert.match(messages, /elevation\/shadow\/raised\/layer-1.*--ds-shadow-raised/);
  assert.equal(exitCodeFor(warnings), 0);

  const blocking = checkTokenNaming(snapshot, scss);
  assert.equal(blocking.length, 2);
  assert.ok(blocking.every((f) => f.severity === 'error'));
  assert.equal(exitCodeFor(blocking), 1);
});

test('run(ctx) reads SCSS tokens and snapshot from repoRoot and fails if snapshot is missing', () => {
  const missingRoot = mkdtempSync(join(tmpdir(), 'token-naming-missing-'));
  const missingFindings = run({ repoRoot: missingRoot });
  assert.equal(missingFindings.length, 1);
  assert.equal(exitCodeFor(missingFindings), 1);

  const okRoot = fixtureTree(
    {
      'spacing / templates': {
        variables: ['Card/pad'],
        codeSyntax: { 'Card/pad': 'var(--card-pad)' },
      },
    },
    ['--card-pad: 16px;'],
  );
  assert.deepEqual(run({ repoRoot: okRoot }), []);
});

test('live repository snapshot has zero unknown-token or un-allowlisted missing-syntax errors', () => {
  const findings = run();
  const errors = findings.filter((f) => (f.severity ?? 'error') === 'error');
  assert.deepEqual(errors, []);
  assert.equal(exitCodeFor(findings), 0);
});

test('a primitive alpha step is its own segment, as code names it', () => {
  assert.equal(expectedToken('color / primitives', 'red/600a8'), '--palette-red-600-a8');
  assert.equal(expectedToken('color / primitives', 'blackAlpha/60'), '--palette-black-alpha-60');
});

test('Tooltip/radius is a documented exception: it shares --radius-control-sm', () => {
  const snapshot = makeSnapshot({
    'spacing / components': {
      variables: ['Tooltip/radius'],
      codeSyntax: { 'Tooltip/radius': 'var(--radius-control-sm)' },
    },
  });
  assert.deepEqual(checkTokenNaming(snapshot, new Set(['--radius-control-sm'])), []);
});

test('competency semantic color tokens map to --ds-*-competency-* and no --ds-*-smart-* remain', () => {
  assert.equal(expectedToken('color / semantics', 'color/background/competency/advocacy/default'), '--ds-background-competency-advocacy');
  assert.equal(expectedToken('color / semantics', 'color/background/competency/mastering-content/bold/hovered'), '--ds-background-competency-mastering-content-bold-hovered');
  assert.equal(expectedToken('color / semantics', 'color/text/competency/social-emotional'), '--ds-text-competency-social-emotional');
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const snapshot = JSON.parse(readFileSync(join(repoRoot, SNAPSHOT_PATH), 'utf8'));
  const sem = snapshot.collections['color / semantics'];
  assert.ok(sem.variables.includes('color/background/competency/advocacy/default'));
  assert.equal(
    sem.variables.some((v) => v.includes('/smart/') && !v.startsWith('color/chart/smart/')),
    false,
    'snapshot has no non-chart color/*/smart/* variables',
  );
  assert.equal(
    Object.values(sem.codeSyntax).some((v) => v.includes('--ds-') && v.includes('-smart-')),
    false,
    'snapshot has no --ds-*-smart-* codeSyntax',
  );
});
