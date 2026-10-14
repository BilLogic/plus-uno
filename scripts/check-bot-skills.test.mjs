/**
 * Tests for `check:bot-skills`.
 *
 * Over a FIXTURE ROOT and a made-up manifest, like `check:harness-budgets`: a
 * bot skill that breaks each rule cannot be arranged in this repo without
 * writing one, so `run` takes `repoRoot` and `manifest` and the mutations
 * happen in a temp directory. The real repo is asserted once, at the end.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { run, retiredFaceHits, summary } from './check-bot-skills.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

const TOOLS = [{ name: 'notion_create' }, { name: 'read_reference' }, { name: 'dm_relay' }];

const GOOD_BODY =
  '# Relay a message\n\nDraft the DM, then call `dm_relay` with the draft.\n\n' +
  '## Exit\n\n- **file** — the ✅ card sends the DM.\n- **hand off** — anything longer goes to the IDE.\n';

const skill = (description, body = GOOD_BODY) =>
  `---\nembodiment: uno-bot\ndisclosure: reference\ndescription: ${description}\n---\n\n${body}`;

/** A throwaway repo holding `files`, the tool table, and a manifest naming `skills` as bot skills. */
function fixture(skills, files = {}) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bot-skills-'));
  const write = (rel, text) => {
    fs.mkdirSync(path.join(repoRoot, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, rel), text);
  };
  write('agents/uno-bot/tool-definitions.json', JSON.stringify(TOOLS));
  for (const [rel, text] of Object.entries({ ...skills, ...files })) write(rel, text);
  const manifest = {
    budgets: { botSkill: 5_000, botSkillDescription: 400 },
    members: Object.keys(skills).map((p) => ({ path: p, section: 'bot-skills', delivery: 'disclosed' })),
  };
  return { repoRoot, manifest };
}

const AT = 'agents/uno-bot/skills/relay-a-message/SKILL.md';

test('a bot skill that keeps every rule is no finding', () => {
  assert.deepEqual(run(fixture({ [AT]: skill('Relay, send this to, tell Coco — drafts an attributed DM.') })), []);
});

test('an empty set of bot skills passes', () => {
  const ctx = fixture({});
  assert.deepEqual(run(ctx), []);
  assert.match(summary(ctx), /0 bot skill/);
});

test('a named tool that does not exist is a finding naming it', () => {
  const body = GOOD_BODY.replace('`dm_relay`', '`slack_dm_send`');
  const findings = run(fixture({ [AT]: skill('Relay a message.', body) }));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, AT);
  assert.match(findings[0].message, /slack_dm_send/);
});

test('a body with no Exit section is a finding', () => {
  const findings = run(fixture({ [AT]: skill('Relay a message.', '# Relay\n\nCall `dm_relay`.\n') }));
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /Exit/);
});

test('an Exit item that is not answer, file or hand off is a finding naming it', () => {
  const body = GOOD_BODY.replace('- **hand off**', '- **open a PR**');
  const findings = run(fixture({ [AT]: skill('Relay a message.', body) }));
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /open a PR/);
  assert.match(findings[0].message, /answer.*file.*hand off/);
});

test('an Exit section with no item is a finding', () => {
  const body = '# Relay\n\nCall `dm_relay`.\n\n## Exit\n\nIt ends.\n';
  const findings = run(fixture({ [AT]: skill('Relay a message.', body) }));
  assert.ok(findings.some((f) => /Exit/.test(f.message)));
});

test('a description over its budget is a finding naming the limit', () => {
  const findings = run(fixture({ [AT]: skill(`Relay ${'word '.repeat(90)}`) }));
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /400/);
});

test('a bot skill with no description is a finding', () => {
  const text = `---\nembodiment: uno-bot\ndisclosure: reference\n---\n\n${GOOD_BODY}`;
  const findings = run(fixture({ [AT]: text }));
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /description/);
});

test('the retired-face guard finds the old vocabulary in live files and skips plans and the archive', () => {
  const ctx = fixture(
    {},
    {
      'agents/uno-bot/AGENT.md': '# Persona\n\nRead the Worker face in skills/uno-review/bot.md.\n',
      'docs/plans/old-plan.md': 'The bot.md faces were the plan.\n',
      'docs/knowledge/archive/old.md': 'Each Worker face was 7k.\n',
      'docs/connectors/slack.md': '# Slack\n\nNothing retired here.\n',
    },
  );
  const hits = retiredFaceHits(ctx);
  assert.deepEqual(
    [...new Set(hits.map((h) => h.file))],
    ['agents/uno-bot/AGENT.md'],
    'only the live file is a hit',
  );
  assert.equal(hits[0].line, 3);
});

test('the retired-face guard is ready but not yet part of the findings', () => {
  const ctx = fixture({}, { 'agents/uno-bot/AGENT.md': 'Read the Worker face in bot.md.\n' });
  assert.deepEqual(run(ctx), []);
});

test('this repo passes', () => {
  assert.deepEqual(run({ repoRoot: REPO_ROOT }), []);
});
