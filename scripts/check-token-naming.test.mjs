import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { exitCodeFor } from './lib/findings.mjs';
import {
  BLOCK_ON_NAMING_MISMATCH,
  MISSING_SYNTAX_ALLOWLIST,
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
        variables: ['Topbar/height-topbar'],
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
        variables: ['Card/pad-default'],
        codeSyntax: {},
      },
    }),
    scss,
  );
  assert.equal(findings.length, 1);
  assert.equal(findings[0].kind, 'missing-syntax');
  assert.equal(findings[0].severity ?? 'error', 'error');
  assert.match(findings[0].message, /spacing \/ templates/);
  assert.match(findings[0].message, /Card\/pad-default/);
  assert.match(findings[0].message, /--card-pad-default/);
  assert.equal(exitCodeFor(findings), 1);
});

test('kind 2 allowlist: permits color/ai/*, Prompt input/*, elevation shadow parts, and Frame/sidebar-docked without WEB code syntax', () => {
  assert.ok(MISSING_SYNTAX_ALLOWLIST.length >= 4);
  for (const entry of MISSING_SYNTAX_ALLOWLIST) {
    assert.ok(entry.reason && entry.reason.length > 10, `allowlist entry missing reason: ${JSON.stringify(entry)}`);
  }
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

test('naming rule: collection prefixes and path normalization hold across every collection', () => {
  assert.equal(expectedToken('color / primitives', 'blue/100'), '--palette-blue-100');
  assert.equal(expectedToken('color / semantics', 'color/text/brand'), '--ds-text-brand');
  assert.equal(expectedToken('color / opacity', 'opacity/disabled'), '--ds-opacity-disabled');
  assert.equal(expectedToken('typography', 'Family/brand-heading'), '--type-family-brand-heading');
  assert.equal(expectedToken('typography', 'Tracking/tight'), '--type-tracking-tight');
  assert.equal(expectedToken('motion', 'Spring/880/stiffness'), '--motion-spring-880');
  assert.equal(expectedToken('spacing / semantics', 'Pad/x-md'), '--pad-x-md');
  assert.equal(expectedToken('spacing / templates', 'Focused page/pad-x'), '--focused-page-pad-x');
  assert.equal(expectedToken('spacing / components', 'Dropdown menu/max-width'), '--dropdown-menu-max-width');
  assert.equal(expectedToken('layers', 'Layer/modal'), '--layer-modal');
});

test('naming rule exceptions: /default drop, motion spring triples, and elevation shadow parts pass without warnings', () => {
  const scss = new Set([
    '--ds-background-neutral',
    '--ds-surface-raised',
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
          'elevation/surface/raised/default',
          'elevation/shadow/raised/layer-1',
          'elevation/shadow/raised/layer-1/offsetX',
          'elevation/shadow/raised/layer-1/radius',
          'elevation/shadow/overflow/layer-1',
          'elevation/shadow/overflow/layer-2',
        ],
        codeSyntax: {
          'color/background/neutral/default': 'var(--ds-background-neutral)',
          'elevation/surface/raised/default': 'var(--ds-surface-raised)',
          'elevation/shadow/raised/layer-1': 'var(--ds-shadow-raised)',
          'elevation/shadow/raised/layer-1/offsetX': 'var(--ds-shadow-raised)',
          'elevation/shadow/raised/layer-1/radius': 'var(--ds-shadow-raised)',
          'elevation/shadow/overflow/layer-1': 'var(--ds-shadow-overflow-spread)',
          'elevation/shadow/overflow/layer-2': 'var(--ds-shadow-overflow-perimeter)',
        },
      },
      motion: {
        variables: [
          'Spring/880/damping',
          'Spring/880/mass',
          'Spring/880/stiffness',
          'Spring/800-r60/damping',
        ],
        codeSyntax: {
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

test('kind 3: warns when WEB code syntax disagrees with the naming rule, and blocks when BLOCK_ON_NAMING_MISMATCH is flipped', () => {
  assert.equal(BLOCK_ON_NAMING_MISMATCH, false);
  const scss = new Set(['--icon-sm', '--chart-brand', '--ds-text']);
  const snapshot = makeSnapshot({
    'spacing / semantics': {
      variables: ['Size/Icon/sm'],
      codeSyntax: { 'Size/Icon/sm': 'var(--icon-sm)' },
    },
    'color / semantics': {
      variables: ['color/chart/brand/default', 'elevation/shadow/raised/layer-1'],
      codeSyntax: {
        'color/chart/brand/default': 'var(--chart-brand)',
        'elevation/shadow/raised/layer-1': 'var(--ds-text)',
      },
    },
  });

  const warnings = checkTokenNaming(snapshot, scss);
  assert.equal(warnings.length, 3);
  for (const finding of warnings) {
    assert.equal(finding.kind, 'naming-mismatch');
    assert.equal(finding.severity, 'warning');
  }
  assert.match(warnings[0].message, /spacing \/ semantics/);
  assert.match(warnings[0].message, /Size\/Icon\/sm/);
  assert.match(warnings[0].message, /--size-icon-sm/);
  assert.match(warnings[1].message, /color \/ semantics/);
  assert.match(warnings[1].message, /color\/chart\/brand\/default/);
  assert.match(warnings[1].message, /--ds-chart-brand/);
  assert.match(warnings[2].message, /elevation\/shadow\/raised\/layer-1/);
  assert.match(warnings[2].message, /--ds-shadow-raised/);
  assert.equal(exitCodeFor(warnings), 0);

  const blocking = checkTokenNaming(snapshot, scss, { blockOnNamingMismatch: true });
  assert.equal(blocking.length, 3);
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
        variables: ['Card/pad-default'],
        codeSyntax: { 'Card/pad-default': 'var(--card-pad-default)' },
      },
    },
    ['--card-pad-default: 16px;'],
  );
  assert.deepEqual(run({ repoRoot: okRoot }), []);
});

test('live repository snapshot has zero unknown-token or un-allowlisted missing-syntax errors', () => {
  const findings = run();
  const errors = findings.filter((f) => (f.severity ?? 'error') === 'error');
  assert.deepEqual(errors, []);
  assert.equal(exitCodeFor(findings), 0);
});
