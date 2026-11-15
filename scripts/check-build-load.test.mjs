/**
 * Tests for `check:build-load` (#2554).
 *
 * Covers the sum over a fixture build path (constitution, staged-build
 * overview, coded-build reference and its mandates), the downward-only byte
 * ratchet, the replacement rule for new mandatory reads, and the live repo.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  BASELINE,
  ENTRY_DOCS,
  measureBuildLoad,
  record,
  REPO_ROOT,
  run,
  summary,
} from './check-build-load.mjs';

const NL = String.fromCharCode(10);

function makeFixture(files, baseline) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-build-load-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
  if (baseline) {
    const full = path.join(root, BASELINE);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, `${JSON.stringify(baseline, null, 2)}${NL}`, 'utf8');
  }
  return root;
}

const baseFiles = () => ({
  'AGENTS.md': [
    '# plus-uno — Agent Constitution',
    '| Trigger | Load |',
    '| Building or changing any screen | `design-system/guidelines/overview.md` (the staged build) |',
    '| Figma link, implement-design | `design-system/figma/component-registry.json` (MANDATORY — load first) |',
  ].join(NL),
  'design-system/guidelines/overview.md': [
    '# Building a PLUS screen',
    'A screen starts from a template (`@/patterns`).',
  ].join(NL),
  'skills/uno-prototype/references/deliverables/coded-build.md': [
    '# Deliverable — coded build',
    '- **Yes** → Figma: load `design-system/guidelines/figma/registry-load-gate.md` (MANDATORY).',
    '1. **Re-read for fit**: apply the closing *Before you finish* re-read of',
    '   `design-system/agent-views/components/index.md` to verify template and pattern fit.',
  ].join(NL),
  'design-system/agent-views/components/index.md': ['# PLUS DS — Components', '- Button', ''].join(NL),
  'design-system/figma/component-registry.json': '{"ignored":"figma-conditional"}',
  'design-system/guidelines/figma/registry-load-gate.md': `# Ignored Figma gate${NL}`,
});

test('measureBuildLoad sums constitution, overview, coded-build reference and its unconditional mandates over a fixture build path', () => {
  const files = baseFiles();
  const root = makeFixture(files);
  try {
    const measured = measureBuildLoad({ repoRoot: root });
    const expectedFiles = [
      ...ENTRY_DOCS,
      'design-system/agent-views/components/index.md',
    ];
    assert.deepEqual(
      measured.docs.map((d) => d.file),
      expectedFiles,
    );
    const expectedTotal = expectedFiles.reduce(
      (sum, f) => sum + Buffer.byteLength(files[f], 'utf8'),
      0,
    );
    assert.equal(measured.total, expectedTotal);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('run passes at the ceiling, fails on byte growth or an unreplaced mandatory read, and passes when a mandatory read replaces an old one within the ceiling', () => {
  const files = baseFiles();
  const root = makeFixture(files);
  try {
    const initial = measureBuildLoad({ repoRoot: root });
    record({ repoRoot: root });
    assert.deepEqual(run({ repoRoot: root }), []);

    // Growing a doc past the ceiling fails.
    fs.appendFileSync(path.join(root, 'AGENTS.md'), `${NL}Extra prose that bloats the constitution.${NL}`);
    const bloated = run({ repoRoot: root });
    assert.equal(bloated.length, 1);
    assert.match(bloated[0].message, /build-load bytes rose/);

    // --update refuses to raise the ceiling.
    assert.equal(record({ repoRoot: root }), false);

    // Restore AGENTS.md and add a new MANDATORY read without replacing the old one -> fails.
    fs.writeFileSync(path.join(root, 'AGENTS.md'), files['AGENTS.md'], 'utf8');
    fs.writeFileSync(path.join(root, 'design-system/guidelines/extra.md'), `# Extra${NL}`, 'utf8');
    fs.writeFileSync(
      path.join(root, 'design-system/guidelines/overview.md'),
      ['# Building', 'Load `design-system/guidelines/extra.md` (MANDATORY).', ''].join(NL),
      'utf8',
    );
    const addedFindings = run({ repoRoot: root });
    assert.ok(addedFindings.length >= 1);
    assert.ok(addedFindings.some((f) => /mandatory read/i.test(f.message)));

    // Replacing the old mandatory read (`components/index.md`) with `extra.md` within the ceiling passes.
    fs.writeFileSync(
      path.join(root, 'skills/uno-prototype/references/deliverables/coded-build.md'),
      `# Deliverable — coded build${NL}`,
      'utf8',
    );
    const replaced = measureBuildLoad({ repoRoot: root });
    assert.ok(replaced.total < initial.total);
    assert.deepEqual(run({ repoRoot: root }), []);

    // --update ratchets the ceiling down to the smaller total.
    assert.equal(record({ repoRoot: root }), true);
    const updated = JSON.parse(fs.readFileSync(path.join(root, BASELINE), 'utf8'));
    assert.equal(updated.sets.main.entries.bytes.count, replaced.total);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the repository as it stands passes check:build-load at the recorded ceiling', () => {
  assert.deepEqual(run({ repoRoot: REPO_ROOT }), []);
  assert.match(summary({ repoRoot: REPO_ROOT }), /\d+ B across \d+ build-path doc\(s\)/);
});
