/**
 * Tests for `check:harness-budgets`.
 *
 * Over a FIXTURE ROOT and a made-up manifest, per the #469 convention: the
 * cases worth covering are a doc that writes a budget down and a doc that cites
 * a constant the bundler does not have, and neither can be arranged in this
 * repo without editing a harness doc. `run` takes both `repoRoot` and
 * `manifest`, so the mutations happen in a temp directory and the real repo is
 * asserted clean once, at the end.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { run, summary } from './check-harness-budgets.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

/** A throwaway repo holding `docs`, and the manifest that declares them. */
function fixture(docs) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-budgets-'));
  for (const [rel, text] of Object.entries(docs)) {
    fs.mkdirSync(path.join(repoRoot, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, rel), text);
  }
  const manifest = {
    budgets: { assembled: 175_500, persona: 28_000, botSkill: 5_000, constitution: 20_000 },
    members: Object.keys(docs).map((p) => ({ path: p })),
  };
  return { repoRoot, manifest };
}

test('a doc that cites the constant by key is no finding', () => {
  const ctx = fixture({
    'AGENTS.md': '# Harness\n\nTier 1 has a soft char budget (`BUDGETS.constitution`): an overrun warns.\n',
  });
  assert.deepEqual(run(ctx), []);
});

test('a doc that writes a budget number down is a finding naming the constant it copies', () => {
  const ctx = fixture({
    'skills/README.md': '# Skills\n\nA bot skill is short.\n`SKILL.md` is on a 5,000-char budget the bundler asserts.\n',
  });
  const findings = run(ctx);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, 'skills/README.md');
  assert.equal(findings[0].line, 4, 'must name the line the number is on');
  assert.match(findings[0].message, /5,000/);
  assert.match(findings[0].message, /BUDGETS\.botSkill/, 'must cite the constant to use instead');
});

test('a number in k is read as chars', () => {
  const ctx = fixture({ 'AGENTS.md': '# Harness\n\nSoft budget ≤20k chars: an overrun warns.\n' });
  const findings = run(ctx);
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /BUDGETS\.constitution/);
});

test('a stale budget number is a finding even when no constant holds it', () => {
  const ctx = fixture({ 'agents/uno-bot/AGENT.md': '<!-- Budget ≤26k chars, asserted by the bundler. -->\n' });
  const findings = run(ctx);
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /26,000/);
  assert.match(findings[0].message, /bundle-harness\.mjs/);
});

test('a char count on a line about something other than a budget is no finding', () => {
  const ctx = fixture({ 'docs/connectors/slack.md': 'A draft over 1,000 characters is shortened.\n' });
  assert.deepEqual(run(ctx), []);
});

test('a doc that cites a constant the bundler does not have is a finding', () => {
  const ctx = fixture({ 'skills/README.md': '`SKILL.md` is held to `BUDGETS.botSkil`.\n' });
  const findings = run(ctx);
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /BUDGETS\.botSkil/);
  assert.match(findings[0].message, /botSkill/, 'must list the keys that do exist');
});

test('only docs the manifest declares are read', () => {
  const ctx = fixture({ 'AGENTS.md': '# fine\n' });
  fs.mkdirSync(path.join(ctx.repoRoot, 'docs/adr'), { recursive: true });
  fs.writeFileSync(path.join(ctx.repoRoot, 'docs/adr/001.md'), 'We set a 7,000-char budget.\n');
  assert.deepEqual(run(ctx), [], 'an ADR records history and is not a section-root doc');
});

test('the repository as it stands has no findings, and says what it read', () => {
  assert.deepEqual(run({ repoRoot: REPO_ROOT }), []);
  assert.match(summary({ repoRoot: REPO_ROOT }), /doc\(s\) under the section roots cite/);
});
