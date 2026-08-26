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
  readingChangedReport,
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
import { splitFrontmatter } from './lib/frontmatter.mjs';

const scopeBy = (key) => SCOPES.find((s) => s.key === key);

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
  // HOW MUCH of each file is read differs by scope (#238), so the shared
  // descriptor says only what is actually shared and hands the reader on. A
  // single global claim here is what let "frontmatter included" outlive being
  // true of the bundled half.
  assert.match(base.metric.measuredOn, /quoted speech and code spans/);
  assert.match(base.metric.measuredOn, /per scope/);
  assert.doesNotMatch(
    base.metric.measuredOn,
    /frontmatter included/,
    'the shared descriptor must not claim a reading only one scope uses',
  );
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

// ── The two scopes read their docs differently, on purpose (#238) ────────────
//
// The bundled scope counts the bundled BODY; the IDE scope counts WHOLE FILES.
// That is not an inconsistency waiting to be tidied — it is the two routes a
// doc takes to a model. A bundled doc arrives through `bundle-harness.mjs`,
// which strips frontmatter, so a ban there is text the model is never told; an
// IDE doc has no bundler, and a `SKILL.md`'s `description:` is the routing text
// the model reads when it decides whether to load the skill.
//
// What follows pins BOTH halves, because a future edit could unify them in
// either direction and both would look like a tidy-up: strip on the IDE side
// and 2 real tokens vanish from the count while staying in the agent's context;
// stop stripping on the bundled side and 2 phantom tokens come back.

test('the bundled scope reads the bundled body; the IDE scope reads the whole file', () => {
  // One fixture, both readers — the prohibition sits ONLY in the frontmatter,
  // which is the only place the two can disagree.
  const doc = '---\nsummary: never ship this unreviewed\nembodiment: all\n---\n\n# Doc\n\nShip it.\n';

  assert.equal(countProhibitions(scopeBy('bundled').read(doc)), 0, 'the bundler deletes this text');
  assert.equal(countProhibitions(scopeBy('ide').read(doc)), 1, 'nothing deletes it on the IDE side');
});

test('the readings agree wherever the prohibition is in the body', () => {
  // The asymmetry is confined to frontmatter. If it ever reached the body the
  // two scopes would have stopped measuring the same kind of thing entirely.
  const doc = '---\nembodiment: all\n---\n\n# Doc\n\nYou must not ship it unreviewed.\n';
  assert.equal(countProhibitions(scopeBy('bundled').read(doc)), 1);
  assert.equal(countProhibitions(scopeBy('ide').read(doc)), 1);
});

test('each scope declares the reading it uses, and no two scopes share one', () => {
  for (const scope of SCOPES) {
    assert.equal(typeof scope.read, 'function', `${scope.key} declares no reading`);
    assert.ok(scope.measuredOn, `${scope.key} does not say what it reads`);
  }
  assert.match(scopeBy('bundled').measuredOn, /frontmatter stripped/);
  assert.match(scopeBy('ide').measuredOn, /frontmatter included/);
  assert.notEqual(
    scopeBy('bundled').measuredOn,
    scopeBy('ide').measuredOn,
    'a shared descriptor is the first sign the two paths were unified',
  );
});

test('the baseline records each scope under the reading it was taken with', () => {
  // Without this, a change of reading is invisible in the file the numbers are
  // compared against, and 200 could mean either thing.
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  for (const scope of SCOPES) {
    assert.equal(
      base.scopes[scope.key].measuredOn,
      scope.measuredOn,
      `the ${scope.key} baseline was recorded under a different reading than the code now uses`,
    );
  }
});

test('a changed reading fails the run rather than quietly lowering the number', () => {
  // THE DIRECTION IS THE POINT. Unifying the paths moves the bundled count
  // 200 -> 200 and the IDE count 107 -> 105: both flat or falling, and a
  // ratchet fails only on a RISE. So the reading is compared explicitly.
  const msg = readingChangedReport({
    scope: scopeBy('ide'),
    was: 'the bundled body — frontmatter stripped',
  });
  assert.match(msg, /ide scope no longer reads what its baseline was recorded over/);
  assert.match(msg, /frontmatter stripped/, 'must quote the reading the baseline used');
  assert.match(msg, /frontmatter included/, 'and the one in force now');
  assert.match(msg, /DOWNWARD/, 'must say why a ratchet cannot catch this on its own');
  assert.match(msg, /--update/);
});

test('a baseline that records no reading at all is a failure, not a pass', () => {
  const msg = readingChangedReport({ scope: scopeBy('bundled'), was: undefined });
  assert.match(msg, /records no reading for this scope/);
});

test('the bundled numbers on record are body counts, and the IDE ones whole-file counts', () => {
  // Driven over the REAL corpus rather than a fixture: the readings could agree
  // on every string a test invents and still be wired to the wrong scope here.
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));

  for (const [rel, n] of Object.entries(base.scopes.bundled.counts)) {
    const text = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(
      n,
      countProhibitions(splitFrontmatter(text).body),
      `bundled count is not a body count: ${rel}`,
    );
  }
  for (const [rel, n] of Object.entries(base.scopes.ide.counts)) {
    const text = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(n, countProhibitions(text), `IDE count is not a whole-file count: ${rel}`);
  }
});

test('at least one harness doc still separates the two readings', () => {
  // If nothing in the harness carries a prohibition in frontmatter, the two
  // assertions above pass with the paths unified and nobody notices. This goes
  // red the day that is true — the day the fixtures are all that is left
  // witnessing the asymmetry against real docs.
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const files = [...Object.keys(base.scopes.bundled.counts), ...Object.keys(base.scopes.ide.counts)];
  const split = files.filter((rel) => {
    const text = fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
    return countProhibitions(text) !== countProhibitions(splitFrontmatter(text).body);
  });
  assert.ok(
    split.length > 0,
    'no harness doc carries a prohibition in frontmatter any more — the asymmetry is no ' +
      'longer witnessed by the real corpus. Either re-argue it, or accept that the fixtures ' +
      'are all that hold it.',
  );
});

// ── One parser, not two ──────────────────────────────────────────────────────

test("the frontmatter split is the bundler's own, imported rather than copied", () => {
  // Where frontmatter ends decides the char budgets AND the bundled count. Two
  // parsers that disagreed by one line would charge the prompt for chars it
  // does not carry, or credit it with bans the model is never told — one rule,
  // two homes, which is the defect this guard family exists to catch.
  const bundler = fs.readFileSync(
    path.join(REPO_ROOT, 'agents/uno-bot/scripts/bundle-harness.mjs'),
    'utf8',
  );
  assert.match(
    bundler,
    /import \{ splitFrontmatter \} from "\.\.\/\.\.\/\.\.\/scripts\/lib\/frontmatter\.mjs"/,
    'the bundler must import the shared split',
  );
  assert.doesNotMatch(
    bundler,
    /function splitFrontmatter/,
    'a local copy in the bundler is a second parser that can disagree with the guards',
  );
});

test('the shared split ends the block where the bundler always has', () => {
  assert.deepEqual(splitFrontmatter('# No frontmatter\n'), { meta: {}, body: '# No frontmatter\n' });
  // An unterminated block is content, not a guess at where it meant to close.
  assert.deepEqual(splitFrontmatter('---\nsummary: x\n'), { meta: {}, body: '---\nsummary: x\n' });

  const { meta, body } = splitFrontmatter('---\nsummary: x\nembodiment: ide\n---\n\n# Doc\n\nBody.\n');
  assert.deepEqual(meta, { summary: 'x', embodiment: 'ide' });
  assert.equal(body, '# Doc\n\nBody.\n', 'the blank lines after the fence belong to the fence');
});
