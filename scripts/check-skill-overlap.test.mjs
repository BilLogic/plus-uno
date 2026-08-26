/**
 * Tests for the skill-overlap guard.
 *
 * The point of these is #191's lesson: a guard nobody has watched fail is a
 * guard nobody knows works. Every case below is a line the check MUST reject
 * or MUST let through, asserted against the real classifier — not against a
 * re-implementation of it.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_SHARED_LINES,
  SUBSTANCE_MIN_WORDS,
  classify,
  findSharedLines,
  auditSkills,
  auditBundle,
  findSharedAcross,
} from './check-skill-overlap.mjs';

const doc = (label, text) => ({ label, text });

test('structural lines are discounted, not counted as drift', () => {
  for (const line of [
    '---',
    '***',
    '```',
    '```yaml',
    '## Quality bar',
    '# uno-publish — method',
    '|---|---|',
    '| --- | :---: | ---: |',
    '<!-- Worker face — bundled by uno-bot -->',
    '',
    '   ',
  ]) {
    assert.notEqual(classify(line).structural, null, `expected structural: ${JSON.stringify(line)}`);
  }
});

test('a rule-bearing sentence is not structural', () => {
  const line = '- **The rails never re-merge.** Work that got feedback and later needs handoff re-enters here.';
  assert.equal(classify(line).structural, null);
});

test('a line under the word floor is discounted', () => {
  const short = 'Never invent an address.';
  assert.ok(short.split(/\s+/).length < SUBSTANCE_MIN_WORDS);
  assert.equal(classify(short).structural, 'short');
});

test('today\'s real coincidences produce no finding', () => {
  // Verbatim from the 2026-08-26 measurement: every line the six skills
  // actually share today is one of these four shapes.
  const shared = ['---', '```', '|---|---|', '## Quality bar', '## Hand-offs'].join('\n');
  const found = findSharedLines(
    doc('method.md', `# heading\n${shared}\nA procedure step that lives only in the method.`),
    doc('bot.md', `# heading\n${shared}\nA Slack delta that lives only in the bot face.`),
  );
  assert.deepEqual(found, []);
});

test('a rule copied from method.md into bot.md is found, and both files are named', () => {
  const rule = 'The confirmation gate is non-negotiable even for fully-specified requests — the friction is the feature.';
  const found = findSharedLines(
    doc('skills/x/references/method.md', `# method\n\n- ${rule}\n`),
    doc('skills/x/bot.md', `# bot\n\nSlack delta only.\n\n${rule}\n`),
  );
  assert.equal(found.length, 1);
  assert.equal(found[0].a.label, 'skills/x/references/method.md');
  assert.equal(found[0].b.label, 'skills/x/bot.md');
  assert.equal(found[0].a.line, 3);
  assert.equal(found[0].b.line, 5);
});

test('re-bolding or re-bulleting a copied rule does not hide it', () => {
  const found = findSharedLines(
    doc('a', '1. Draft the concrete fix on every path before worth is judged, always.'),
    doc('b', '- **Draft the concrete fix on every path before worth is judged, always.**'),
  );
  assert.equal(found.length, 1);
});

test('a line repeated inside one file is not an overlap with the other', () => {
  const found = findSharedLines(
    doc('a', 'Ground every current-state product claim in the blueprint and cite it.\nGround every current-state product claim in the blueprint and cite it.'),
    doc('b', 'Something else entirely that shares no line with the first document.'),
  );
  assert.deepEqual(found, []);
});

test('all six shipped skills pass at the chosen threshold', () => {
  const { findings, skills, pairings } = auditSkills();
  assert.equal(skills.length, 6, 'expected six uno-* skills');
  assert.equal(pairings, 18, 'three pairings per skill');
  assert.ok(
    findings.length <= MAX_SHARED_LINES,
    `expected no substantive overlap, got:\n${findings.map((f) => `${f.a.label}:${f.a.line} == ${f.b.label}:${f.b.line}  ${f.text}`).join('\n')}`,
  );
});

// ── The bundled set (#174) ───────────────────────────────────────────────────
//
// The same invariant, one scope out: a rule that lives in the persona and again
// in the constitution is the same defect as one living in a method and again in
// a face, and until this landed nothing compared two bundled docs to each other.

test('a multi-line HTML comment is discounted whole, not just its opening line', () => {
  // The 2026-08-26 measurement's only cross-document hit: four method.md files
  // open with the same two-line authoring banner. Line 1 was discounted as a
  // comment and line 2 was not, which is a classifier artefact, not drift.
  const banner =
    '<!-- Runtime-neutral core — loaded by BOTH faces (SKILL.md in the IDE, bot.md in the Worker).\n' +
    '     No IDE tool names, no Slack formatting here; execution specifics live in the faces. -->';
  const found = findSharedLines(
    doc('skills/a/references/method.md', `---\nembodiment: all\n---\n\n${banner}\n\nA procedure step that only skill A performs.`),
    doc('skills/b/references/method.md', `---\nembodiment: all\n---\n\n${banner}\n\nA procedure step that only skill B performs.`),
  );
  assert.deepEqual(found, []);
});

test('discounting a comment does not discount the prose beside it', () => {
  const rule = 'Ground every current-state product claim in the blueprint and cite the cell.';
  const found = findSharedLines(
    doc('AGENTS.md', `<!-- an authoring note\n     spanning two lines -->\n${rule}`),
    doc('agents/uno-bot/AGENT.md', `<!-- an authoring note\n     spanning two lines -->\n${rule}`),
  );
  assert.equal(found.length, 1, 'the comment is discounted; the rule beside it is not');
  assert.equal(found[0].a.label, 'AGENTS.md');
  assert.equal(found[0].b.label, 'agents/uno-bot/AGENT.md');
  assert.equal(found[0].a.line, 3, 'blanking a comment must not shift the line numbers reported');
});

test('every document pairs with every other, and a copy is named on both sides', () => {
  const rule = 'A rule states itself once, and every other mention of it is a citation.';
  const { findings, pairings } = findSharedAcross([
    doc('AGENTS.md', `# constitution\n\n${rule}\n`),
    doc('CONTEXT.md', '# context\n\nNothing in common with either neighbouring document.\n'),
    doc('docs/connectors/slack.md', `# slack\n\nSome delta.\n\n${rule}\n`),
  ]);
  assert.equal(pairings, 3, 'three documents make three pairs');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].a.label, 'AGENTS.md');
  assert.equal(findings[0].b.label, 'docs/connectors/slack.md');
  assert.equal(findings[0].b.line, 5);
});

test('a citation is not a duplication', () => {
  // Bundled docs cite each other by design. A pointer is a different sentence
  // from the rule it points at, which is why verbatim matching can tell the two
  // apart without a similarity number to argue about.
  const found = findSharedLines(
    doc('AGENTS.md', 'Every deliverable carries the evidence it was judged against, in the same message.'),
    doc('skills/uno-review/bot.md', 'Evidence travels with the deliverable — `AGENTS.md` § The loading contract.'),
  );
  assert.deepEqual(found, []);
});

test('the bundled set today has no substantive cross-document overlap', () => {
  const { files, findings, pairings } = auditBundle();
  assert.ok(files.length >= 20, `expected the whole bundled set, got ${files.length} docs`);
  assert.equal(pairings, (files.length * (files.length - 1)) / 2, 'every pair is compared');
  assert.ok(
    findings.length <= MAX_SHARED_LINES,
    `expected no cross-document overlap, got:\n${findings
      .map((f) => `${f.a.label}:${f.a.line} == ${f.b.label}:${f.b.line}  ${f.text}`)
      .join('\n')}`,
  );
});
