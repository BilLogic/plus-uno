// The retired-spelling sweep, mutation-tested: each shape proven by a line that carries it,
// and the loading-tier uses proven to pass.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findingsIn, sweep, RETIRED, SKIP, REPO_ROOT } from './check-retired-spelling.mjs';

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

// ── the provider sense of "lane" (#497) ─────────────────────────────────────

test('the blueprint sense of "lane" passes — it is the only surviving meaning', () => {
  const text = [
    '| Lane | Step | Owner |',
    'a **cell** is one activity at lane × step',
    '`filter_lane_role` keeps only cells in lanes with one semantic role',
    'un-guided blueprint reads fail on navigation and lane attribution',
    'The operative sentences are in agents/uno-bot/AGENT.md § My lane',
    '## My lane',
    'Lenses run in parallel and stay in-lane — no lens comments outside its own scope',
    "- **Fails if:** lenses bleed into each other's lane",
    'Urgency = existing `Priority: Critical` — no separate lane.',
    'each lens stays in its lane',
  ].join('\n');
  assert.deepEqual(findingsIn(text, 'docs/connectors/supabase/blueprint.md'), []);
});

test('every provider-sense phrase is caught, with its why', () => {
  const lines = [
    'MODEL_PROVIDER selects the loop — the Gemini lane runs every turn',
    'the Claude lane needs the models enabled in Model Garden',
    'the Vertex-Claude lane has web search',
    'ONLY the Anthropic lane honours cache_control',
    'a surface rule that must hold on every model lane belongs in the renderer',
    'capabilities differ by provider lane (see the table above)',
    'both agent lanes log `mcp=off`',
    'on the production lane the harness rides uncached',
    'Judge on the active lane, defaulting to Gemini',
    'the gemini-2.5-pro fallback lane',
    'Both lanes run the same agent loop',
    'Two provider lanes run the SAME local tool roster',
    'On either lane a turn runs at one of three tiers',
  ];
  // Every line must be caught; a line may match more than one shape (a "both
  // agent lanes" is two), so this asserts coverage per line rather than a count.
  const found = findingsIn(lines.join('\n'), 'agents/uno-bot/README.md');
  const caught = new Set(found.map((f) => f.line));
  assert.deepEqual(
    lines.map((_, i) => i + 1).filter((n) => !caught.has(n)),
    [],
    JSON.stringify(found, null, 1),
  );
  for (const f of found) assert.match(f.why, /provider|adapter|ModelProvider/);
});

test('a reintroduced provider-sense "lane" fails the live sweep', () => {
  // The contract this check leaves behind: the phrase can fall out of the docs
  // but cannot come back. Proven against a real swept file's real text, so the
  // roots, the extensions and the skip list are all in the loop — not just the
  // regex.
  const real = fs.readFileSync(path.join(REPO_ROOT, 'agents/uno-bot/README.md'), 'utf8');
  assert.deepEqual(findingsIn(real, 'agents/uno-bot/README.md'), [], 'the live file is clean');
  const reintroduced = real.replace(
    '## Model providers — two adapters, one switch',
    '## Model providers — two lanes, one switch',
  );
  assert.notEqual(reintroduced, real, 'the heading this test rewrites must still be there');
  const found = findingsIn(reintroduced, 'agents/uno-bot/README.md');
  assert.equal(found.length, 1, JSON.stringify(found, null, 1));
  assert.equal(found[0].text, 'two lanes');
});

test('the ModelProvider glossary row may name the retired provider spellings', () => {
  const row = '| **ModelProvider** | uno-bot\'s seam … | "the provider loop", "provider lane", "Gemini lane", "both lanes" (there is one loop) |';
  assert.deepEqual(findingsIn(row, 'CONTEXT.md'), []);
  assert.ok(findingsIn(row, 'docs/other.md').length > 0, 'the exemption is the glossary row, not the words');
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
  assert.deepEqual(findingsIn('A lane is the blueprint\'s actor row.', 'docs/x.md'), []);
  assert.ok(RETIRED.length >= 9);
});

test('the live repo carries no retired spelling', () => {
  const { files, findings } = sweep();
  assert.ok(files > 100, `swept ${files} files`);
  assert.deepEqual(findings.map((f) => `${f.file}:${f.line} ${f.text}`), []);
});

// ── the walk sees the whole tree, or says so ────────────────────────────────

test('an unstattable entry costs only itself, not the rest of the root', () => {
  // The regression: statSync ran per entry INSIDE the recursion, and sweep's
  // catch took every error, so one broken symlink or one file deleted by a
  // parallel test unwound the walk mid-root and the check reported success over
  // whatever it had collected so far. Measured at the time: 324 files swept
  // where the same tree without the bad entry swept 325.
  //
  // Fixtures go in a temp root, never the live tree — planting them in
  // design-system/ is the very race this guards against.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'retired-walk-'));
  const dir = path.join(root, 'docs');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'a-first.md'), '# a\n');
  fs.symlinkSync(path.join(root, 'nothing-here'), path.join(dir, 'b-broken.md'));
  fs.writeFileSync(path.join(dir, 'c-last.md'), '# c\n');

  try {
    const withBroken = sweep(root).files;
    fs.rmSync(path.join(dir, 'b-broken.md'));
    const without = sweep(root).files;
    assert.equal(
      withBroken,
      without,
      `a broken entry cost ${without - withBroken} other file(s) — the walk stopped early`,
    );
    assert.equal(without, 2, 'both real files are swept');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('an error that is NOT a missing file still stops the sweep', () => {
  // The other half. Swallowing everything is what made the truncation silent;
  // a root the sweep cannot read is a sweep that cannot vouch for the repo, and
  // it must fail rather than report a smaller number.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'retired-eacces-'));
  const dir = path.join(root, 'docs');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'a.md'), '# a\n');
  fs.chmodSync(dir, 0o000);
  try {
    // Running as root defeats the permission bit; skip rather than assert a
    // guarantee the environment is not providing.
    let readable = true;
    try { fs.readdirSync(dir); } catch { readable = false; }
    if (readable) return;
    assert.throws(() => sweep(root), (err) => err.code === 'EACCES');
  } finally {
    fs.chmodSync(dir, 0o755);
    fs.rmSync(root, { recursive: true, force: true });
  }
});
