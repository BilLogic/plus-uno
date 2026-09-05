// The retired-spelling sweep, mutation-tested: each shape proven by a line that carries it,
// and the loading-tier uses proven to pass.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findingsIn, sweep, RETIRED, SKIP } from './check-retired-spelling.mjs';

test('the loading tiers pass untouched', () => {
  const text = [
    '**Tier 1 — always loaded.** This file, and nothing else.',
    '**Tier 2 — loaded on demand.** Two or three documents per task.',
    '**Tier 3 — retrieved live, never cached.**',
    '## Tier-2 loads',
    "uno-bot's Tier 2 is `read_reference`.",
    '<!-- Tier: 1 — the only always-loaded doc. -->',
  ].join('\n');
  assert.deepEqual(findingsIn(text, 'AGENTS.md'), []);
});

test('every retired shape is caught, with its line and why', () => {
  const lines = [
    'intake · Tier 1/2 fixes · cross-estate sync',
    'a Tier-1 fix applied straight to main',
    'Tier 2 changes ship as a PR + PRD pair',
    'the weekly Tier-1 digest',
    'The Tier-1 whitelist is absolute',
    'the Tier-2 pipeline (§5)',
    'each intake names evidence + suggested tier',
    'On yes, tier it (§4)',
    'prompt-file: scripts/prompts/uno-tier1-digest/SKILL.md',
    'run weekly-tier1-digest.yml',
    'emit NO_TIER1_THIS_WEEK',
  ];
  const found = findingsIn(lines.join('\n'), 'skills/x/bot.md');
  assert.equal(found.length, lines.length, JSON.stringify(found, null, 1));
  assert.equal(found[0].line, 1);
  assert.equal(found[6].text, 'suggested tier');
  for (const f of found) assert.ok(f.why.length > 0);
});

test('the glossary row that names the old spelling in its Do NOT use cell is exempt', () => {
  const row = '| **direct fix / gated change** | the two maintenance severities | "Tier 1 fix", "Tier 2 change" |';
  assert.deepEqual(findingsIn(row, 'CONTEXT.md'), []);
  assert.equal(findingsIn(row, 'docs/other.md').length, 1, 'the exemption is the glossary row, not the words');
});

test('history and generated artifacts are skipped by prefix', () => {
  for (const p of ['docs/plans/', 'docs/adr/', 'todos/', 'agents/uno-bot/harness-bundle.md']) {
    assert.ok(SKIP.includes(p), `${p} must be skipped`);
  }
});

test('every shape is anchored on a maintenance noun, so a bare "Tier 1" passes', () => {
  assert.deepEqual(findingsIn('Tier 1 is one file. Tier 2 is on demand.', 'docs/x.md'), []);
  assert.ok(RETIRED.length >= 6);
});

test('the live repo carries no retired spelling', () => {
  const { files, findings } = sweep();
  assert.ok(files > 100, `swept ${files} files`);
  assert.deepEqual(findings.map((f) => `${f.file}:${f.line} ${f.text}`), []);
});
