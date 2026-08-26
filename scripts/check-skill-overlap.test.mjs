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
