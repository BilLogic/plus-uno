// The cross-repo duplicate sweep, mutation-tested: every rule proven by a set
// of repos that breaks it, and the committed estate proven to pass.
//
// FIXTURES LIVE IN A TEMP DIRECTORY, NEVER IN THE LIVE TREE. `scripts/check-doc-identifiers.test.mjs`
// writes `design-system/guidelines/__regression-*.md` into the working copy for
// the length of a test, and on 2026-09-05 that raced another sweep reading the
// same tree and took a CI run red. Every fixture here is a throwaway repo, and
// `sweep()` takes its three roots as an argument so it can be pointed at them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  COPIES,
  MIN_WORDS,
  RECORDED,
  SHINGLE,
  blocksOf,
  coverageReport,
  runsIn,
  sweep,
  wordsOf,
} from './check-cross-repo-duplication.mjs';

/**
 * ~45 words of prose, long enough to clear MIN_WORDS and distinct per `seed`
 * ALL THE WAY THROUGH — a passage whose tail is common to every seed would make
 * two "different" fixtures share a run, which is the finding rather than the
 * control.
 */
const passage = (seed) =>
  `A recorded decision about ${seed} keeps ${seed} in one home, because a second home for ${seed} is ` +
  `a second answer about ${seed}, and the two of them drift the moment either ${seed} is edited by ` +
  `somebody who has not read the other ${seed} first, which is what ${seed} cost us last week.`;

/** A throwaway estate: three repo directories, each with the files the test names. */
function estate(files = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'cross-repo-'));
  const roots = {};
  for (const key of ['plus-uno', 'blueprint', 'sb']) {
    const dir = path.join(root, key);
    mkdirSync(dir, { recursive: true });
    // Every repo needs a router: it is what `locateOne` looks for, and what
    // makes a directory a checkout rather than an empty folder.
    writeFileSync(path.join(dir, 'AGENTS.md'), '# Router\n');
    roots[key] = dir;
  }
  for (const [where, body] of Object.entries(files)) {
    const [key, ...rest] = where.split(':');
    const abs = path.join(roots[key], rest.join(':'));
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, body);
  }
  return { roots, done: () => rmSync(root, { recursive: true, force: true }) };
}

test('three repos that say nothing twice pass', () => {
  const e = estate({
    'plus-uno:docs/a.md': `# A\n\n${passage('the prompt budget')}\n`,
    'blueprint:docs/a.md': `# A\n\n${passage('the status vocabulary')}\n`,
    'sb:references/a.md': `# A\n\n${passage('the lane roles')}\n`,
  });
  try {
    const r = sweep(e.roots);
    assert.deepEqual(r.findings, []);
    assert.equal(r.comparisons.length, 3);
  } finally {
    e.done();
  }
});

test('ONE PARAGRAPH PLANTED IN TWO REPOS FAILS, and the report names both sides', () => {
  const planted = passage('the rename map');
  const e = estate({
    'plus-uno:docs/a.md': `# A\n\n${planted}\n`,
    'blueprint:docs/elsewhere.md': `# Elsewhere\n\n${planted}\n`,
  });
  try {
    const { findings } = sweep(e.roots);
    assert.equal(findings.length, 1, JSON.stringify(findings, null, 1));
    assert.equal(findings[0].a, 'plus-uno:docs/a.md');
    assert.equal(findings[0].b, 'blueprint:docs/elsewhere.md');
    assert.ok(findings[0].words >= MIN_WORDS);
    assert.match(findings[0].text, /a second answer about the rename map/);
  } finally {
    e.done();
  }
});

test('the same paragraph planted twice in ONE repo is not this check\'s business', () => {
  const planted = passage('the rename map');
  const e = estate({
    'plus-uno:docs/a.md': `# A\n\n${planted}\n`,
    'plus-uno:docs/b.md': `# B\n\n${planted}\n`,
  });
  try {
    assert.deepEqual(sweep(e.roots).findings, []);
  } finally {
    e.done();
  }
});

test('a passage under the word bar is below the noise floor and does not fire', () => {
  const short = 'One home per meaning, and the pointer does the rest of the work for everyone.';
  assert.ok(wordsOf(short).length < MIN_WORDS);
  const e = estate({ 'plus-uno:docs/a.md': `# A\n\n${short}\n`, 'sb:docs/a.md': `# A\n\n${short}\n` });
  try {
    assert.deepEqual(sweep(e.roots).findings, []);
  } finally {
    e.done();
  }
});

test('an edited cell in the middle does not hide the rest — the shingle is why', () => {
  // The rename maps differed by a migration id per row and agreed everywhere
  // else. A paragraph-equality unit reports nothing here; a shingle run reports
  // the two halves.
  const table = (id) =>
    [
      '| Was | Is | Migration |',
      '|---|---|---|',
      `| \`layers\`, \`layer_role\`, \`cells.layer_id\` | \`lanes\`, \`lane_role\`, \`cells.lane_id\` | \`${id}\` |`,
      '| `cell_triggers` | `cell_dependencies` | `21000103000000` |',
      '| `service_lifecycles`, `*_service_lifecycle_id` | `services`, `service_id` | `21000106000000` |',
      '| `service_scenarios`, `*_service_scenario_id` | `scenarios`, `scenario_id` | `21000107000000` |',
      '| `row_position`, `column_position`, `slot_position`, `order_position` | `position` | `21000105000000` |',
      '| `description` | `summary` | `21000108000000` |',
      '| `propositions` | `business_model` | `21000111000000` |',
    ].join('\n');
  const e = estate({
    'blueprint:docs/vocabulary.md': `# G\n\n${table('20260820120000')}\n`,
    'sb:references/vocabulary.md': `# G\n\n${table('21000104000000')}\n`,
  });
  try {
    const { findings } = sweep(e.roots);
    assert.ok(findings.length >= 1, 'a rename map differing by one id per row is still one map');
    // The run RESUMES after the one word that differs, which is the property
    // paragraph-equality does not have and the whole reason for the shingle.
    assert.ok(findings.some((f) => /cell triggers cell dependencies/.test(f.text)));
  } finally {
    e.done();
  }
});

test('a vendored document is one document: the sync marker exempts it', () => {
  const planted = passage('the blueprint schema');
  const e = estate({
    'plus-uno:docs/connectors/x.md':
      `---\nembodiment: all\nvendored_from: BilLogic/plus-uno-blueprint docs/agents/x.md\n---\n\n${planted}\n`,
    'blueprint:docs/agents/x.md': `# X\n\n${planted}\n`,
  });
  try {
    assert.deepEqual(sweep(e.roots).findings, []);
  } finally {
    e.done();
  }
});

test('a hand-written copy of a vendored document is NOT exempt — the marker is the rule, not the path', () => {
  const planted = passage('the blueprint schema');
  const e = estate({
    'plus-uno:docs/connectors/x.md': `---\nembodiment: all\n---\n\n${planted}\n`,
    'blueprint:docs/agents/x.md': `# X\n\n${planted}\n`,
  });
  try {
    assert.equal(sweep(e.roots).findings.length, 1);
  } finally {
    e.done();
  }
});

test('a copy by construction is excluded, and a stale COPIES entry fails', () => {
  const [copyPath] = [...COPIES.keys()];
  const planted = passage('the triage roles');
  const both = estate({ [`plus-uno:${copyPath}`]: planted, [`sb:${copyPath}`]: planted });
  try {
    const r = sweep(both.roots);
    assert.deepEqual(r.findings, []);
    // Present in two of three: still a copy by construction, nothing stale.
    assert.deepEqual(r.stale.filter((s) => s.includes(copyPath)), []);
  } finally {
    both.done();
  }

  const one = estate({ [`plus-uno:${copyPath}`]: planted });
  try {
    const { stale } = sweep(one.roots);
    assert.equal(stale.filter((s) => s.includes(copyPath)).length, 1);
    assert.match(stale.join('\n'), /no longer a copy\s+by construction/);
  } finally {
    one.done();
  }
});

test('a recorded pair absorbs what it recorded, refuses a rise, and fails when it goes empty', () => {
  const rec = RECORDED.find((r) => r.a === 'blueprint:CONTEXT.md' && r.b === 'sb:CONTEXT.md');
  assert.ok(rec, 'the glossary pair is the recorded entry these assertions are about');
  const under = passage('the writing vocabulary');
  assert.ok(wordsOf(under).length <= rec.words, 'the fixture has to sit under the ceiling');

  const held = estate({ 'blueprint:CONTEXT.md': under, 'sb:CONTEXT.md': under });
  try {
    const r = sweep(held.roots);
    assert.deepEqual(r.findings, [], 'a recorded pair is not a finding');
    assert.deepEqual(r.rises, [], 'and it is under its ceiling');
  } finally {
    held.done();
  }

  const grown = [under, passage('a second thing'), passage('a third thing')].join('\n\n');
  const risen = estate({ 'blueprint:CONTEXT.md': grown, 'sb:CONTEXT.md': grown });
  try {
    const r = sweep(risen.roots);
    assert.equal(r.rises.length, 1, 'a recorded pair may fall and never rise');
    assert.ok(r.rises[0].now > rec.words);
  } finally {
    risen.done();
  }

  const emptied = estate({ 'blueprint:CONTEXT.md': '# G\n', 'sb:CONTEXT.md': '# G\n' });
  try {
    const { stale } = sweep(emptied.roots);
    assert.equal(stale.filter((s) => s.includes('CONTEXT.md')).length, 1, 'a baseline nobody prunes is a backlog');
  } finally {
    emptied.done();
  }
});

test('THE TWO RENAME MAPS WOULD HAVE FAILED IT: the ceiling sits where they crossed', () => {
  // The glossaries as they stood before plus-uno-blueprint#365 and
  // agentic-service-blueprinting#137 shared 771 words. Rebuilt here at scale
  // rather than vendored, because a fixture that quotes another repo's deleted
  // prose is one more copy of it.
  const rec = RECORDED.find((r) => r.a === 'blueprint:CONTEXT.md' && r.b === 'sb:CONTEXT.md');
  const map = Array.from({ length: 20 }, (_, i) => passage(`row ${i}`)).join('\n\n');
  const e = estate({
    'blueprint:CONTEXT.md': `# Glossary\n\n## The rename map\n\n${map}\n`,
    'sb:CONTEXT.md': `# Glossary\n\n## The rename map\n\n${map}\n`,
  });
  try {
    const { rises } = sweep(e.roots);
    assert.equal(rises.length, 1);
    assert.ok(rises[0].now > rec.words * 5, `${rises[0].now} words against a ceiling of ${rec.words}`);
  } finally {
    e.done();
  }
});

test('an absent sibling is a LOUD skip, not a silent pass', () => {
  const planted = passage('the rename map');
  const e = estate({ 'plus-uno:docs/a.md': planted, 'blueprint:docs/a.md': planted });
  try {
    const r = sweep({ ...e.roots, blueprint: null });
    assert.deepEqual(r.findings, [], 'a repo that is not there cannot be compared');
    assert.equal(r.comparisons.length, 1);
    const report = coverageReport(r);
    assert.match(report, /blueprint\s+NOT REACHED/);
    assert.match(report, /NOT COMPARED: plus-uno↔blueprint, blueprint↔sb/);
    assert.match(report, /compared 1 of 3 pairings/);
  } finally {
    e.done();
  }
});

test('an absent sibling suspends the exemption assertions rather than reporting them all stale', () => {
  const e = estate({});
  try {
    const r = sweep({ ...e.roots, blueprint: null, sb: null });
    assert.deepEqual(r.stale, [], 'an absent checkout makes every exemption look stale');
    assert.equal(r.comparisons.length, 0);
  } finally {
    e.done();
  }
});

test('an exemption whose OWN repos were both read is still asserted', () => {
  // The regression: suspension was gated on ALL THREE repos being reachable, so
  // one missing sibling silenced every entry — including a pair whose own two
  // repos had both been read and whose shared-word count had just been
  // computed. harness-integrity-sweep.yml clones with continue-on-error, which
  // makes a single absent repo a normal month rather than an exceptional one,
  // so a deduplicated pair could survive as a stale entry indefinitely.
  //
  // Both RECORDED entries are blueprint↔sb, so dropping plus-uno leaves them
  // fully reachable while the run as a whole is not.
  const e = estate({});
  try {
    const r = sweep({ ...e.roots, 'plus-uno': null });
    assert.deepEqual(r.reached, ['blueprint', 'sb']);
    assert.equal(r.stale.length, 2, `both entries are asserted:\n${r.stale.join('\n')}`);
    for (const s of r.stale) assert.match(s, /shares nothing any more/);
  } finally {
    e.done();
  }
});

test('a COPIES entry stays suspended until every repo was read', () => {
  // COPIES names a path rather than its repos, so "in fewer than two repos"
  // cannot be told apart from "in fewer than two repos I could look at". It
  // keeps the whole-run gate the RECORDED entries no longer need.
  const e = estate({});
  try {
    const r = sweep({ ...e.roots, 'plus-uno': null });
    for (const s of r.stale) assert.doesNotMatch(s, /^COPIES/);
  } finally {
    e.done();
  }
});

test('blocks stop at a blank line, so a passage never spans a paragraph break', () => {
  assert.deepEqual(blocksOf('a\n\nb\n'), ['a', 'b']);
  assert.deepEqual(blocksOf('---\nembodiment: all\n---\n\nbody\n'), ['body']);
  assert.deepEqual(blocksOf('one\n<!-- a comment -->\ntwo\n'), ['one', 'two']);
});

test('words drop link targets and markdown, so a re-wrap or a re-link is not a new meaning', () => {
  assert.deepEqual(wordsOf('**Bold** and [text](https://example.com/x) and `code`'), [
    'bold', 'and', 'text', 'and', 'code',
  ]);
  assert.deepEqual(wordsOf('| a | b |'), ['a', 'b']);
});

test('consecutive shared shingles merge into one run with its true length', () => {
  const words = Array.from({ length: 80 }, (_, i) => `w${i}`);
  const consecutive = Array.from({ length: 25 }, (_, i) => i);
  const runs = runsIn(words, [...consecutive, 60]);
  assert.equal(runs.length, 1, 'the lone shingle at 60 covers 12 words, under the bar');
  assert.equal(runs[0].words, 24 + SHINGLE, 'one run of its true length, not one per window');
});

test('the committed estate passes', () => {
  const r = sweep();
  assert.deepEqual(r.findings, [], JSON.stringify(r.findings, null, 1));
  assert.deepEqual(r.rises, [], JSON.stringify(r.rises, null, 1));
  assert.deepEqual(r.stale, [], r.stale.join('\n'));
});
