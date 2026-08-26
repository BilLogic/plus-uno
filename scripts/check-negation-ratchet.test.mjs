/**
 * Tests for what `check:negation` says when it CANNOT run.
 *
 * The check reads its file list from `bundle-harness.mjs --check`. When the
 * committed bundle is stale that child exits non-zero, and until #204 the
 * failure escaped as a raw `execFileSync` throw: a Node stack trace, the
 * bundler's own diagnostic discarded by `stdio: ignore`, and the composite gate
 * reporting `✗ check:negation` — a prohibition-count problem that does not
 * exist. Same shape `generate-agent.js` fixed in #191.
 *
 * What is asserted here is the message a contributor actually reads. #191's
 * lesson is that a guard nobody has watched fail is a guard nobody knows works;
 * the corollary for THIS fix is that a guard which fails unreadably has not
 * really reported anything.
 *
 * Run: npm run test:scripts
 */

import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  BASELINE,
  METRIC,
  PROHIBITION_TOKENS,
  SCOPES,
  bundlerFailureReport,
  corpusShrankReport,
  countProhibitions,
  roseReport,
} from './check-negation-ratchet.mjs';
import {
  REPO_ROOT,
  SECTION_ROOTS,
  censusMismatchReport,
  declaredCensus,
  embodimentOf,
  ideAuthoredFiles,
  unresolvedReport,
} from './lib/bundled-set.mjs';

/** The bundler's real `--check` failure, verbatim in shape (2026-08-26). */
const realStderr =
  '[bundle-harness] 2 generated artifact(s) STALE — a bundled harness doc changed but the generated file was not regenerated:\n' +
  '  /repo/agents/uno-bot/src/generated/harness.ts\n' +
  '    committed: 170,000 chars · regenerated: 170,037 chars\n' +
  '  -> npm run bundle:harness';

test('a stale bundle is reported as a stale bundle, not as a prohibition rise', () => {
  const msg = bundlerFailureReport({ status: 1, stderr: realStderr });

  assert.match(msg, /stale/i, 'must name staleness as the cause');
  // The whole defect: the reader was pointed at the ratchet, which is fine.
  assert.match(
    msg,
    /nothing is wrong with the prohibition-token count/i,
    'must say the count itself is not the problem',
  );
});

test('the message points at the command that fixes it', () => {
  const msg = bundlerFailureReport({ status: 1, stderr: realStderr });
  assert.match(msg, /bundle:harness/, 'must name the regeneration script');
});

test("the bundler's own diagnostic reaches the reader", () => {
  const msg = bundlerFailureReport({ status: 1, stderr: realStderr });
  // Relayed whole — the naming of WHICH artifact is behind, and by how much,
  // is the fact the stack trace used to bury.
  for (const line of realStderr.split('\n')) {
    assert.ok(msg.includes(line), `child stderr line missing from the report: ${line}`);
  }
});

test('no Node stack trace is quoted back at the reader', () => {
  const msg = bundlerFailureReport({ status: 1, stderr: realStderr });
  assert.doesNotMatch(msg, /node:internal/, 'the Node internals frame must not appear');
  assert.doesNotMatch(msg, /Command failed:/, "execFileSync's own wrapper message must not appear");
});

test('a child that says nothing still produces an actionable report', () => {
  // A guard that goes quiet when the child does is the same defect one level
  // down, so the silent case gets its own line rather than an empty gap.
  const msg = bundlerFailureReport({ status: 2, stderr: '' });
  assert.match(msg, /exited 2/, 'must state the exit code when there is nothing else to show');
  assert.match(msg, /bundle:harness/);
});

test('a signalled child reports the signal rather than a bare exit code', () => {
  const msg = bundlerFailureReport({ status: null, signal: 'SIGKILL', stderr: '' });
  assert.match(msg, /SIGKILL/);
});

// ── What the number is called, and what it covers (#234) ─────────────────────
//
// The ratchet counts five imperative-ban tokens. It was being read as a count
// of negative statements, which is roughly three times larger — so the metric's
// name, its token list and its narrowness are now assertions rather than
// conventions, and the baseline carries its own definition.

test('the metric names itself as tokens, not as negation in general', () => {
  assert.equal(METRIC, 'prohibition tokens');
  assert.deepEqual(PROHIBITION_TOKENS, ['never', "don't", 'do not', 'cannot', 'must not']);
});

test('the baseline carries the definition of the number it records', () => {
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  assert.equal(base.metric.counts, METRIC, 'the file says what it counted');
  assert.deepEqual(base.metric.tokens, PROHIBITION_TOKENS, 'and with which tokens');
  assert.match(base.metric.note, /NOT a count of negative statements/);
  // Frontmatter is inside the count — see the script header. Asserted so the
  // descriptor cannot drift back to claiming it measures bodies.
  assert.match(base.metric.measuredOn, /frontmatter included/);
});

test('the narrow regex is narrow on purpose — these forms are out of scope', () => {
  // #234 measured these and chose to leave them uncounted rather than broaden.
  // Asserting it here means a later broadening is a deliberate edit to a test
  // with the reasoning attached, not a quiet regex tweak.
  for (const line of [
    'No throat-clearing, no echoing the ask.',
    'Zero jokes, zero playful emoji.',
    'Amendments are not confirmations.',
    'Cards live on the board, rather than in doc search.',
    'A question is a question; stage nothing.',
  ]) {
    assert.equal(countProhibitions(line), 0, `expected 0 for: ${line}`);
  }
});

test('every token the metric claims is actually counted', () => {
  for (const token of PROHIBITION_TOKENS) {
    assert.equal(countProhibitions(`You ${token} ship it unreviewed.`), 1, `missed: ${token}`);
  }
});

test('quoted speech and code spans stay exempt', () => {
  assert.equal(countProhibitions('Say "I don\'t know" when the source is missing.'), 0);
  assert.equal(countProhibitions('The flag is `--do-not-publish`, set it once.'), 0);
});

test('a doc that vanished from disk stops the ratchet instead of shrinking it', () => {
  // A ratchet fails only when the count RISES, so a corpus that loses docs
  // clears it every time — which is why the shortfall is a failure, not a
  // smaller number. The filter this replaced dropped them in silence.
  const msg = unresolvedReport({
    missing: ['docs/connectors/slack.md', 'docs/connectors/notion.md'],
    declared: 21,
    tag: 'negation',
  });
  assert.match(msg, /2 of the 21 doc/);
  assert.match(msg, /would have measured 19/);
  assert.match(msg, /docs\/connectors\/slack\.md/);
});

// ── The second scope: IDE-side docs (#174) ───────────────────────────────────
//
// One guard, two corpora, one baseline file. What is asserted below is the pair
// of properties that make the new scope worth having: it ratchets independently
// of the bundled one, and — the property the whole guard turns on — a corpus
// that shrank FAILS rather than reporting a smaller, greener number.

test('both scopes are declared, and the baseline records each one', () => {
  assert.deepEqual(
    SCOPES.map((s) => s.key),
    ['bundled', 'ide'],
  );

  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  for (const scope of SCOPES) {
    const recorded = base.scopes[scope.key];
    assert.ok(recorded, `no baseline recorded for the ${scope.key} scope`);
    assert.equal(typeof recorded.total, 'number', `${scope.key} records no total`);
    // The doc count is what the corpus floor stands on — a scope recorded
    // without it cannot notice its corpus vanishing.
    assert.equal(typeof recorded.docs, 'number', `${scope.key} records no doc count`);
    assert.ok(recorded.docs > 0, `${scope.key} recorded an empty corpus`);
    assert.equal(typeof recorded.counts, 'object');
    assert.ok(recorded.corpus, `${scope.key} records no description of what it measured`);
  }
});

test('the two scopes ratchet separately, so a fall on one cannot pay for a rise on the other', () => {
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  // A single summed total would let 202 + 107 stay flat while the IDE side
  // climbed and the bundle fell. The file has no such number to compare.
  assert.equal(base.total, undefined, 'a summed total would make one scope pay for the other');
  assert.notEqual(base.scopes.bundled.total, undefined);
  assert.notEqual(base.scopes.ide.total, undefined);
});

test('a corpus that shrank is a failure, not a lower score', () => {
  const msg = corpusShrankReport({ scope: SCOPES[1], was: 46, now: 45 });
  assert.match(msg, /shrank/);
  assert.match(msg, /45 IDE-side docs measured, against the 46/);
  // The reasoning has to travel with the failure: a ratchet fails on a RISE, so
  // the shrink case is the one that would otherwise pass while looking better.
  assert.match(msg, /only fails when the count RISES/);
  assert.match(msg, /--update/, 'must say how a deliberate deletion is recorded');
});

test('a rise names the scope it happened in, and the docs that caused it', () => {
  const msg = roseReport({
    scope: SCOPES[1],
    was: 107,
    now: 109,
    counts: { 'skills/uno-review/SKILL.md': 8, 'docs/engineering/coding.md': 3 },
    baseCounts: { 'skills/uno-review/SKILL.md': 6, 'docs/engineering/coding.md': 3 },
  });
  assert.match(msg, /IDE-side docs rose 107 -> 109/, 'must say WHICH corpus rose');
  assert.match(msg, /skills\/uno-review\/SKILL\.md: 6 -> 8/);
  // Only the risers are listed — a doc that held steady is noise in a failure.
  assert.doesNotMatch(msg, /coding\.md/);
  assert.match(msg, /state the target behaviour/);
});

// ── The IDE walk, and the witness that makes it falsifiable ──────────────────

test("the census line is read back off the bundler's own output", () => {
  const line =
    '[bundle-harness] embodiment census: 67 declared doc(s) under the section roots — 21 bundled, 46 ide-only';
  assert.deepEqual(declaredCensus(line), { underRoots: 67, bundled: 21, ide: 46 });
});

test('a census line that is absent or reshaped reads as null rather than as zero', () => {
  // Zero would be indistinguishable from "the walk found nothing", which is the
  // exact narrowing this witness exists to catch.
  assert.equal(declaredCensus(''), null);
  assert.equal(declaredCensus('[bundle-harness] --check OK (164398 chars from 21 files)'), null);
  assert.equal(declaredCensus('embodiment census: 67 docs — 21 bundled'), null);
});

test('the census parse survives thousands separators', () => {
  const line =
    'embodiment census: 1,067 declared doc(s) under the section roots — 1,021 bundled, 46 ide-only';
  assert.deepEqual(declaredCensus(line), { underRoots: 1067, bundled: 1021, ide: 46 });
});

test('a walk that disagrees with the bundler points at the roots, not at the corpus', () => {
  const msg = censusMismatchReport({
    walkedIde: 45,
    bundled: 21,
    census: { underRoots: 67, bundled: 21, ide: 46 },
    tag: 'negation',
  });
  assert.match(msg, /walked 45 ide-only doc\(s\) and 21 bundled \(66 in all\)/);
  assert.match(msg, /it says 46 ide-only out of 67/);
  assert.match(msg, /SECTION_ROOTS/, 'must name the list that fell behind');
  assert.match(msg, /bundle-harness\.mjs/, 'and the list it must match');
});

test('a missing census line is reported as a changed bundler, not as a count of zero', () => {
  const msg = censusMismatchReport({ walkedIde: 46, bundled: 21, census: null });
  assert.match(msg, /absent or has changed shape/);
});

test('embodiment is read off frontmatter, and its absence is null', () => {
  assert.equal(embodimentOf('---\nsummary: x\nembodiment: ide\n---\n\n# Doc\n'), 'ide');
  assert.equal(embodimentOf('---\nembodiment: all\n---\n'), 'all');
  assert.equal(embodimentOf('# No frontmatter at all\n'), null);
  assert.equal(embodimentOf('---\nsummary: x\n---\n\nbody\n'), null);
  // A mention in the BODY is not a declaration — the frontmatter block ends at
  // the first closing fence.
  assert.equal(embodimentOf('---\nsummary: x\n---\n\nembodiment: uno-bot\n'), null);
});

test('the IDE corpus excludes ADRs and generated surfaces by where they live', () => {
  const ide = ideAuthoredFiles();
  assert.ok(ide.length > 0, 'an empty IDE corpus is a broken walk, not a clean repo');

  // Both exclusions are structural: neither directory is a section root, so
  // neither is reachable from this walk. Asserted rather than trusted, because
  // the whole argument for the corpus rests on it — an ADR ratchet rises by
  // construction, and the generated SKILL.md faces are copies of docs the
  // bundled scope already counts.
  for (const rel of ide) {
    assert.doesNotMatch(rel, /^docs\/adr\//, `an append-only ADR reached the corpus: ${rel}`);
    assert.doesNotMatch(rel, /^\.claude\//, `a generated surface reached the corpus: ${rel}`);
  }
  assert.ok(
    SECTION_ROOTS.every((r) => !r.startsWith('docs/adr') && !r.startsWith('.claude')),
    'neither excluded directory may become a section root without this decision being revisited',
  );
});

test('every doc in the IDE corpus declares itself IDE-side', () => {
  // The scopes must partition, never overlap: a doc counted in both would be
  // double-counted, and one counted in neither would be unguarded.
  for (const rel of ideAuthoredFiles()) {
    const text = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');
    assert.equal(embodimentOf(text), 'ide', `not an ide doc: ${rel}`);
  }
});
