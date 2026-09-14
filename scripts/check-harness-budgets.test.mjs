/**
 * Tests for `check:harness-budgets` (#510).
 *
 * Over a FIXTURE ROOT and a fake manifest, per the #469 convention: the check
 * compares two numbers, one written in a doc and one asserted by the bundler,
 * and the cases worth covering are the disagreements — which cannot be arranged
 * in this repo without editing AGENTS.md, and a test that edits the
 * constitution to prove a point is a test that leaves the repo dirty when it
 * fails. `run` takes both `repoRoot` and `manifest`, so the mutations happen in
 * a temp directory and the real repo is asserted clean once, at the end.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { CLAIMS, compare, run, summary } from './check-harness-budgets.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

/** The budgets a manifest states, as the bundler states them. */
const manifest = (budgets = {}) => ({
  budgets: { assembled: 170_000, persona: 28_000, botFace: 7_000, constitution: 20_000, ...budgets },
});

/**
 * A throwaway repo carrying only the two sentences this check reads.
 *
 * @param {{tier1?: string|null, botFace?: string|null}} [prose] the sentence to
 *   write, or null to leave the file out entirely.
 */
function fixture({ tier1 = 'Budget ≤20k chars: a tier that bloats defeats the tier.', botFace = 'a 7,000-char budget the bundler asserts' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-budgets-'));
  if (tier1 !== null) {
    fs.writeFileSync(
      path.join(root, 'AGENTS.md'),
      `# Harness\n\n## The loading contract\n\n**Tier 1 — always loaded.** This file, and nothing else. ${tier1}\n`,
    );
  }
  if (botFace !== null) {
    fs.mkdirSync(path.join(root, 'skills'), { recursive: true });
    fs.writeFileSync(path.join(root, 'skills/README.md'), `# Skills\n\n\`bot.md\` is on ${botFace} — restatement\nblows it.\n`);
  }
  return root;
}

test('prose that agrees with the bundler is no finding', () => {
  assert.deepEqual(compare({ repoRoot: fixture(), manifest: manifest() }), []);
});

test('a prose number raised without the constant is a finding naming both values', () => {
  const findings = compare({
    repoRoot: fixture({ botFace: 'an 8,000-char budget the bundler asserts' }),
    manifest: manifest(),
  });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, 'skills/README.md');
  assert.equal(findings[0].line, 3, 'must name the line the sentence is on');
  assert.match(findings[0].message, /says the botFace budget is 8,000 chars/);
  assert.match(findings[0].message, /asserts 7,000/, 'must state what the bundler holds');
});

test('a prose number lowered without the constant is a finding too', () => {
  const findings = compare({ repoRoot: fixture({ tier1: 'Budget ≤16k chars.' }), manifest: manifest() });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, 'AGENTS.md');
  assert.match(findings[0].message, /16,000 chars/);
  assert.match(findings[0].message, /20,000/);
});

test('a constant moved without the prose fails from the same comparison', () => {
  // The direction a raise in the bundler takes: the constant moves, the
  // sentence does not, and the build is green until this check runs.
  const findings = compare({ repoRoot: fixture(), manifest: manifest({ botFace: 8_000 }) });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /says the botFace budget is 7,000 chars; .*asserts 8,000/);
});

test('a sentence rewritten out of reach is a finding, not a silent pass', () => {
  // The #234 shape: a check whose pattern matches nothing reports nothing and
  // exits 0, so the comparison stops happening and nobody is told.
  const findings = compare({
    repoRoot: fixture({ botFace: 'a budget of seven thousand chars, asserted by the bundler' }),
    manifest: manifest(),
  });
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /no longer states the botFace budget where this check looks/);
  assert.match(findings[0].message, /It used to read/, 'must quote the sentence it lost');
});

test('a claimed file that does not exist is a finding', () => {
  const findings = compare({ repoRoot: fixture({ tier1: null }), manifest: manifest() });
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, 'AGENTS.md');
  assert.match(findings[0].message, /does not exist/);
});

test('a claim naming a budget the manifest does not state is a finding', () => {
  const findings = compare({
    repoRoot: fixture(),
    manifest: { budgets: { assembled: 170_000 } },
  });
  assert.equal(findings.length, 2, 'both claims lose the constant they copy');
  assert.match(findings[0].message, /declares no `constitution` budget/);
  assert.match(findings[1].message, /declares no `botFace` budget/);
});

test('every claim names a budget key and captures a number', () => {
  // The claims are the whole interface: a claim with no capture group, or one
  // naming a key the bundler does not have, is a comparison that cannot run.
  for (const claim of CLAIMS) {
    assert.ok(claim.file.endsWith('.md'), `${claim.file} must be a doc`);
    assert.ok(claim.budget, 'a claim must name the BUDGETS key it copies');
    assert.equal(typeof claim.scale, 'number');
    assert.match(claim.quote, claim.pattern, 'the recorded quote must match the pattern that looks for it');
  }
});

test('the repository as it stands has no findings, and says what it compared', () => {
  assert.deepEqual(run({ repoRoot: REPO_ROOT }), []);
  const line = summary({ repoRoot: REPO_ROOT });
  assert.match(line, /AGENTS\.md constitution 20,000/);
  assert.match(line, /skills\/README\.md botFace 7,000/);
});
