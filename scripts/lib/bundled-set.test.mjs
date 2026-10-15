/**
 * The adapter the root checks ask "what is in the bot's prompt" through.
 *
 * It returns the bundler's manifest from `assemble()` in this process, so the
 * tests drive it over a fixture tree the way `check:harness-bundle`'s tests do:
 * a repo the test builds, one member per delivery, and no spawned bundler.
 *
 * Run: npm run test:scripts
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { REPO_ROOT, harnessSets, tryHarnessManifest, workerFiles } from './bundled-set.mjs';

/** A minimal repo the bundler accepts: one doc per delivery, padded past the floor. */
function fixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bundled-set-'));
  const write = (rel, text) => {
    fs.mkdirSync(path.join(root, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  const doc = (meta, body) => `---\n${meta}\n---\n\n${body}`;
  write('AGENTS.md', doc('embodiment: all', '# Constitution\n\nOne rule.\n'));
  write('GLOSSARY.md', doc('embodiment: all', '# Glossary\n\nOne word.\n'));
  write('agents/uno-bot/AGENT.md', doc('embodiment: uno-bot', '# Persona\n\nOne voice.\n'));
  write('agents/uno-bot/wrangler.toml', 'GEMINI_REGION = "global"\n');
  write('docs/conventions/ide.md', doc('embodiment: ide', '# Conventions\n\nFor the IDE.\n'));
  write('agents/uno-bot/skills/do-x/SKILL.md', doc('embodiment: uno-bot\ndisclosure: reference', '# Do X\n\nRead on demand.\n'));
  write('docs/connectors/pad.md', doc('embodiment: all', `# Pad\n\n${'padding padding padding padding\n'.repeat(800)}`));
  return root;
}

function withFixture(fn) {
  const root = fixtureRoot();
  try {
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('the sets come from the tree the caller names, in load order', () => {
  withFixture((repoRoot) => {
    const sets = harnessSets({ tag: 'test', repoRoot });
    assert.deepEqual(sets.bundled, ['AGENTS.md', 'GLOSSARY.md', 'agents/uno-bot/AGENT.md', 'docs/connectors/pad.md']);
    assert.deepEqual(sets.disclosed, ['agents/uno-bot/skills/do-x/SKILL.md']);
    assert.deepEqual(sets.ide, ['docs/conventions/ide.md']);
    assert.deepEqual(workerFiles({ tag: 'test', repoRoot }), [...sets.bundled, ...sets.disclosed]);
  });
});

test('the manifest carries the bundler budgets and its section roots', () => {
  withFixture((repoRoot) => {
    const { manifest, error } = tryHarnessManifest({ tag: 'test', repoRoot });
    assert.equal(error, null);
    assert.equal(typeof manifest.budgets.persona, 'number');
    assert.deepEqual(
      manifest.sections.find((s) => s.name === 'constitution').roots,
      ['AGENTS.md', 'GLOSSARY.md'],
    );
  });
});

test('a tree the bundler refuses is a report naming the bundler finding, never an exit', () => {
  withFixture((repoRoot) => {
    fs.writeFileSync(path.join(repoRoot, 'docs/connectors/zz-undeclared.md'), '# probe\n\nno frontmatter\n');
    const asked = tryHarnessManifest({ tag: 'test', notThis: 'the probe count', repoRoot });
    assert.equal(asked.manifest, null);
    assert.match(asked.error, /^\[test\]/);
    assert.match(asked.error, /zz-undeclared\.md/, "the bundler's own finding reaches the reader");
    assert.match(asked.error, /Nothing is wrong with the probe count/);
  });
});

test('a stale committed bundle is not this adapter\'s finding: the sets describe the tree', () => {
  // `check:harness-bundle` owns staleness. The sets come from the docs as they
  // stand, so a stale artifact cannot narrow them.
  withFixture((repoRoot) => {
    const { error } = tryHarnessManifest({ tag: 'test', repoRoot });
    assert.equal(error, null, 'the fixture commits no artifacts, and the sets still read');
  });
});

test('the adapter asks the bundler in-process: it spawns nothing', () => {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'scripts/lib/bundled-set.mjs'), 'utf8');
  assert.doesNotMatch(src, /node:child_process|\bspawnSync\b|\bexecFileSync\b/);
  assert.match(src, /from '\.\.\/\.\.\/agents\/uno-bot\/scripts\/bundle-harness\.mjs'/);
});
