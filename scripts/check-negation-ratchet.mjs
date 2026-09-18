/**
 * Negation ratchet over the bundled harness.
 *
 * Steering by prohibition drags the forbidden behaviour into context and makes
 * it MORE available, not less — "don't think of an elephant". The fix is to
 * prompt the positive: state the target behaviour so the banned one is never
 * spoken. A prohibition earns its place only as a hard guardrail that cannot be
 * phrased positively, and even then it should carry its positive twin.
 *
 * This is a RATCHET, not a threshold. A threshold invites arguing about the
 * number and gets switched off the day it blocks someone; a ratchet only asks
 * that the count go down. Same pattern as the a11y baseline (#152): a corpus
 * too large to fix at once still gets a binding direction.
 *
 * ── WHAT IS COUNTED, AND WHAT IS NOT (#234, decided 2026-08-26) ──────────────
 *
 * This counts PROHIBITION TOKENS — five imperative bans — and it is named that
 * everywhere it reports, because it is not a count of negation as written and
 * the difference is a factor of three. `AGENT.md` scores 6 here; a regex broad
 * enough to catch negation as written finds 111 MORE constructions in the same
 * file ("no throat-clearing", "zero jokes, zero playful emoji", "aren't
 * confirmations", "stage nothing"). Across the bundled set the gap is 202 here
 * against 512 more — the number moves on roughly a third of the property its
 * old name implied. (Both halves of that comparison were measured at #234 over
 * whole files; the bundled figure is 200 on the bundled body — see § The scopes
 * read their docs differently. The ratio is what this paragraph is for.) Since
 * 6 is now this file's floor, saying so in the output is the difference between
 * a modest measurement and a misleading one.
 *
 * THE OPTION NOT TAKEN was to broaden the regex and re-baseline once at the
 * honest number. It was measured before it was rejected, and the measurement is
 * the reason:
 *
 *   - 187 of the 512 additions are a bare `not`, and 113 of those sit in the
 *     contrastive appositive — "cards live on the board, not in doc search",
 *     "state signals are protocol, not personality". That construction STATES A
 *     TARGET and names the near miss beside it. It is the idiom #229's rewrite
 *     produced when it turned 51 bans into targets. Broadening counts it, so
 *     the ratchet would penalise the writing it exists to encourage, and the
 *     cheapest way to clear it would be to delete the disambiguation.
 *   - 166 are `no <noun>`, mostly conditional antecedents and plain facts
 *     rather than bans: "no clear match → offer the closest candidates", "the
 *     blueprint holds no cards and no statuses", "no PLUS equivalent exists".
 *     Hand-classified across AGENT.md's 111 additions: ~20 genuine bans, ~37
 *     contrastive, ~54 descriptive or conditional. Under one in five is a
 *     prohibition.
 *   - the tail splits the same way — `without` 18, `rather than`/`instead of`
 *     25, `unless`/`except`/`nothing`/`nor` 56, `forbidden`/`skip` 13,
 *     `zero <noun>` 8, `avoid` 1.
 *
 * So broadening buys a larger number with a worse signal, and every bucket
 * above is an edge case someone gets to argue about at the moment the gate
 * blocks them — which is how a gate gets switched off. `check:skill-overlap`
 * refused a similarity threshold on the same grounds. Five unambiguous tokens
 * make a ratchet nobody has to litigate: every match is an imperative ban.
 *
 * WHAT THE NARROW METRIC DOES NOT SEE is real and stays visible — it is in the
 * paragraph above, and it is a matter for review rather than for regex. A rule
 * phrased "no throat-clearing" is still a prohibition; this guard just does not
 * pretend to have counted it.
 *
 * Scope is the bundled set only — those docs cost context on every single turn,
 * which is the load this is about.
 *
 * ── THE SECOND SCOPE: IDE-SIDE DOCS (#174, built 2026-08-26) ─────────────────
 *
 * The original reason to stop at the bundle was cost: an IDE doc is paid for
 * only when loaded, so a ratchet over it buys less. That reason died when
 * `check:harness` moved to `pull_request` — an authoring-time ratchet now costs
 * a contributor nothing. Two better objections replaced it, and both are about
 * what a ratchet CAN measure rather than what is worth measuring:
 *
 *   - `docs/adr/` is append-only. An ADR is what a hard-to-reverse call leaves
 *     behind (`AGENTS.md` § Knowledge), and a new one recording "X is not
 *     reversible" ADDS prohibitions by doing its job. A ratchet over an
 *     append-only corpus rises by construction, and one re-baselined on every
 *     append is a counter with extra steps. 25 ADRs carry 26 today.
 *   - The six `.claude/skills/<name>/SKILL.md` are generated from their sources
 *     (`scripts/generate-uno-skill-surfaces.mjs`), so their prohibitions are
 *     copies of ones already counted. Counting both double-counts, and the fix
 *     would land in a file whose header says not to edit it.
 *
 * BOTH EXCLUSIONS ARE STRUCTURAL, NOT A DENY-LIST. The IDE corpus is the docs
 * declaring `embodiment: ide` under the bundler's own section roots — the exact
 * complement of the bundled set within one walk, since a doc under those roots
 * declares `all`, `uno-bot` or `ide` and the bundler refuses to build if it
 * declares nothing. `docs/adr/` and `.claude/skills/` are not section roots, so
 * neither is reachable: they are out because of where they live, and nobody has
 * to maintain a list of names that quietly stops matching. Measured on `main`
 * at `7e881faf`: 67 declared docs under those roots, 21 bundled, 46 IDE-side
 * carrying 107 prohibition tokens. #216's estimate of "48 docs, 108" was taken
 * against a hand-drawn list of directories rather than this rule; the rule finds
 * 46 and 107, and the gap is the estimate's, not a change in the docs.
 *
 * ── THE SCOPES READ THEIR DOCS DIFFERENTLY, ON PURPOSE (#238) ────────────────
 *
 * THE BUNDLED SCOPE COUNTS THE BUNDLED BODY — frontmatter stripped, through the
 * bundler's own `frontmatter` reader. THE IDE SCOPE COUNTS WHOLE FILES. That
 * asymmetry is the finding, not an inconsistency to tidy away: the two corpora
 * reach a model by different routes, and each scope reads the text its route
 * actually delivers.
 *
 *   - A bundled doc reaches the model through `bundle-harness.mjs`, which
 *     strips frontmatter before assembly. That is the same premise the char
 *     budgets already stand on — they are measured on the bundled body, so that
 *     declaring `embodiment:` costs a doc nothing. A prohibition in frontmatter
 *     is therefore text the model is never told, and counting it measured a
 *     different thing from the one this guard claims to: tokens the model is
 *     told. `docs/connectors/supabase/overview.md` contributed the whole of the
 *     gap — its own frontmatter carries 2, which is the whole of 202 -> 200.
 *   - An IDE doc has no bundler. A `SKILL.md`'s `description:` is the routing
 *     text the model reads when it decides whether to load the skill, so a ban
 *     there steers exactly as a ban in the body does. 2 of the IDE scope's 107
 *     are that, and they are real. Stripping frontmatter here would delete
 *     them from the count while leaving them in the agent's context.
 *
 * ONE PARSER, NOT TWO. Where frontmatter ends is a fact the bundler decides —
 * it is the fact that decides the prompt — so the split lives in
 * `scripts/lib/corpus.mjs` and the bundler imports it from there. A second
 * parser here that ended the block a line later would credit the prompt with
 * prohibitions it never carries, which is one-rule-two-homes wearing the exact
 * costume this guard was written to notice. `check-negation-ratchet.test.mjs`
 * pins both halves — the asymmetry, and the single parser behind it — so a
 * later edit cannot quietly unify the paths in either direction.
 *
 * The IDE scope's 107 is unchanged by this; only the bundled figure moved, from
 * 202 (as #155 recorded it, whole files) to 200.
 *
 * ONE GUARD, TWO SCOPES (THREE SINCE #425), ONE BASELINE FILE. A second script would have restated
 * this header's reasoning, the token list and the failure message — which is
 * the defect `check:skill-overlap` exists to catch, one level down in the
 * tooling. The two scopes share the regex, the metric name and the report, and
 * differ only in which corpus they walk. They ratchet INDEPENDENTLY: a fall on
 * one side cannot pay for a rise on the other, which a single summed total
 * would have allowed.
 *
 * EACH SCOPE ASSERTS ITS OWN CORPUS, because a ratchet fails only when the
 * count RISES and therefore passes over a corpus that vanished (#234). The
 * bundled scope is witnessed by the bundler's `--check` file count; the IDE
 * scope by the census line the same run prints. On top of both, each scope's
 * baseline records how many docs it measured and this refuses to run against
 * fewer — the case neither witness sees, because a doc genuinely deleted or
 * re-declared shrinks the corpus without either walk being wrong.
 *
 * ── THE THIRD SCOPE: THE ACTIONS PROMPTS (#425, built 2026-09-05) ────────────
 *
 * uno has three embodiments, and the two scopes above cover two of them. The
 * third — headless GitHub Actions — runs on `scripts/prompts/**\/*.md`: five
 * adapter `SKILL.md`s, their `references/`, and the shared headless-intake
 * contract. They were outside every sweep for a structural reason, not an
 * oversight: both scopes above take their corpus from the bundler's walk, and
 * the Actions prompts are never bundled. They also carry no `embodiment:`
 * frontmatter, on purpose (#417 § Embodiment stays a document property): the
 * constitution already names the runtime, and the prompts reach a model by
 * their own loader. Faking the key onto them to ride the bundler's walk would
 * have been a second membership rule dressed as the first, so instead the
 * corpus is listed by where it lives — `scripts/lib/actions-prompts.mjs` walks
 * the loader's own root, and the harness name sweep reads the same list.
 *
 * IT READS WHOLE FILES, like the IDE scope, and for the same kind of reason:
 * three of the five adapters reach the model as a `prompt-file:` handed over
 * whole by the sweep workflows, frontmatter included, so a ban in a
 * `description:` there is text the model is told. The two implement adapters go
 * through `skill-loader.js`, which strips frontmatter and meta sections — a
 * narrower route. The scope reads the widest route, because a count that
 * missed a ban the model reads on three workflows to be exact about two is
 * the wrong trade. Measured at #425: 7 docs carrying 68 prohibition tokens —
 * 42 of them in the two implement adapters, which predate the operations rule
 * that adapters carry loop mechanics only and are due a rewrite when next
 * touched (`docs/engineering/operations.md`). The other two scopes were
 * unchanged by the addition: 152 across 21 and 105 across 46. (First recorded
 * as 69 across 8, then re-baselined the same day when #439's contract step
 * deleted the `uno-tier1-digest` stub — the corpus floor refused the run, which
 * is the shrink case doing its job.)
 *
 * The retired-SPELLING sweep (`check:retired-spelling`, #429) already reaches
 * these prompts by root; this scope and the harness name sweep are the two
 * that did not, and now do.
 *
 * ── THE RECORD IS THE RATCHET MODULE'S (#601) ───────────────────────────────
 *
 * `scripts/lib/ratchet.mjs` owns the read, the direction, the absent-record
 * error mode and the `--update` write; the six sets this record declares — a
 * `counts` map and a `docs` FLOOR per scope — are surveyed one row each in
 * `scripts/lib/ratchet-shapes.mjs`. Three consequences worth knowing before
 * reading `compare`:
 *
 *   A SCOPE'S TOTAL IS SUMMED, never stored. The record held a `total` beside
 *   each `counts` map and nothing compared the two, so a hand-edited total was
 *   a number the gate would trust over the counts underneath it — and it was
 *   the one thing a merge could not keep current, since `--update` replaces the
 *   container it owns and leaves every other key exactly as it found it.
 *
 *   `--update` NO LONGER RESTATES THE READING. It is a merge: the counts and
 *   the doc count are replaced, and each scope's `corpus` and `measuredOn` are
 *   seeded onto a record written from nothing and afterwards belong to whoever
 *   edits the file. That is the point — while `--update` rewrote `measuredOn`,
 *   the ruler comparison below could be silenced by re-recording (#238).
 *
 *   A SCOPE THE RECORD DOES NOT HOLD is an UNREADABLE record and throws, rather
 *   than being reported per scope here. One stated error mode for twelve
 *   records, because a record read on a shape it does not have reads as EMPTY
 *   and an empty baseline is a green ratchet.
 *
 * Usage:
 *   node scripts/check-negation-ratchet.mjs           report, fail if any scope's count rose
 *   node scripts/check-negation-ratchet.mjs --update  record the current counts as the new baseline
 */

import { actionsPromptFiles } from './lib/actions-prompts.mjs';
import { bundlerFailureReport, harnessSets, resolveBundled, unresolvedReport } from './lib/bundled-set.mjs';
import { REPO_ROOT, frontmatter } from './lib/corpus.mjs';
import { byRoot, main } from './lib/findings.mjs';
import { openRatchet } from './lib/ratchet.mjs';

/**
 * The record, named here because this is the check that reads it — and because
 * it is the key its shape is declared under in `scripts/lib/ratchet-shapes.mjs`
 * and the path `scripts/checks.registry.mjs` declares for this row. One
 * spelling, three readers.
 */
export const BASELINE = 'docs/evals/negation-baseline.json';

/**
 * The five tokens, in one place, so the regex and the label the report prints
 * cannot drift apart. Deliberately narrow — see the header.
 */
export const PROHIBITION_TOKENS = ['never', "don't", 'do not', 'cannot', 'must not'];

/** What the number is called wherever it is written down or printed. */
export const METRIC = 'prohibition tokens';

/**
 * A prohibition token is an imperative ban. Quoted speech is exempt: `Say "I
 * don't know"` is an instruction TO do something, and counting it would push
 * authors toward removing the honesty rule to satisfy the guard.
 */
const PROHIBITION = new RegExp(`\\b(${PROHIBITION_TOKENS.join('|')})\\b`, 'gi');
const stripQuoted = (text) => text.replace(/"[^"\n]*"/g, '""').replace(/`[^`\n]*`/g, '``');

/**
 * One doc's score. Exported so the tests assert the REAL counter rather than a
 * re-implementation of it — including what it deliberately does not see (#234).
 *
 * @param {string} text
 * @returns {number}
 */
export const countProhibitions = (text) => (stripQuoted(text).match(PROHIBITION) || []).length;

/**
 * Who is in each set, and what to say when neither can be read, both live in
 * `scripts/lib/bundled-set.mjs` — `check:skill-overlap` asks the bundled half
 * of the same question (#216) and one copy of the answer is the whole point of
 * that guard.
 *
 * Re-exported so this module stays the import site its own tests already use.
 */
export { bundlerFailureReport };

/**
 * The two corpora, in one place, so a scope cannot exist in the code without a
 * name, a description and a stated reading the baseline file will carry.
 *
 * `key` is how the scope is written down; `noun` is how the report says it.
 * Order is report order — bundled first, because those docs cost context on
 * every turn and an IDE doc costs it only when loaded.
 *
 * `read` IS THE ASYMMETRY, and it is a field rather than a branch so that the
 * difference has to be declared beside the corpus it applies to and travels
 * into the baseline as `measuredOn` (#238). Each scope reads the text its route
 * to the model actually delivers — see § The scopes read their docs
 * differently. A future edit that gives both scopes the same reader is a
 * one-line edit HERE, in front of that reasoning, and it fails the tests.
 */
export const SCOPES = [
  {
    key: 'bundled',
    noun: 'bundled docs',
    corpus:
      'docs the bundler assembles for the Worker (embodiment: all | uno-bot) — the prompt, plus the ' +
      'disclosed references behind read_reference (disclosure: reference), told on the turns that fetch them',
    // Both deliveries: a ban that left the prompt for the reference map is
    // still a ban the bot reads, so it stays in this count rather than
    // vanishing from it on the day its doc is disclosed (#423).
    files: (sets) => [...sets.bundled, ...sets.disclosed],
    // The bundler's own splitter, not a copy of it: this has to end the
    // frontmatter block exactly where `bundle-harness.mjs` ends it, or the
    // count and the prompt disagree about what the model was told.
    read: (text) => frontmatter(text).body,
    measuredOn:
      'the bundled body — frontmatter stripped, as bundle-harness.mjs strips it before ' +
      'assembly, so the count is tokens the model is actually told',
  },
  {
    key: 'ide',
    noun: 'IDE-side docs',
    corpus:
      'hand-authored docs under the bundler section roots declaring embodiment: ide — ' +
      'docs/adr/ and the generated .claude/skills/ surfaces are not section roots and so are out',
    files: (sets) => sets.ide,
    read: (text) => text,
    measuredOn:
      "whole files, frontmatter included — there is no bundler here, and a SKILL.md's " +
      'description: is agent-facing routing text that steers exactly as the body does',
  },
  {
    key: 'actions',
    noun: 'Actions prompts',
    corpus:
      'the headless GitHub Actions prompts under scripts/prompts/ — every .md the skill-loader ' +
      'root holds: the adapter SKILL.mds, their references/, and the shared headless-intake contract. ' +
      'Listed by where they live, since they carry no embodiment: and are never bundled (#425)',
    // Not from the bundler's sets at all — the third embodiment has its own
    // loader, and this is its own walk (scripts/lib/actions-prompts.mjs).
    files: () => actionsPromptFiles(),
    read: (text) => text,
    measuredOn:
      'whole files, frontmatter included — the sweep workflows hand a SKILL.md to the model as a ' +
      'prompt-file: with nothing stripped, and the loader route the implement adapters take is narrower',
  },
];

/**
 * What the reader is owed when a scope's count rose.
 *
 * Pure, so the message can be asserted without authoring a prohibition into a
 * real doc — the same reason `bundlerFailureReport` is pure.
 *
 * @param {{scope: {key: string, noun: string}, was: number, now: number, counts: Record<string, number>, baseCounts: Record<string, number>}} rise
 * @returns {string}
 */
export function roseReport({ scope, was, now, counts, baseCounts }) {
  const risen = Object.entries(counts)
    .filter(([f, n]) => n > (baseCounts[f] ?? 0))
    .map(([f, n]) => `  ${f}: ${baseCounts[f] ?? 0} -> ${n}`);
  return (
    `[negation] ${METRIC} across the ${scope.noun} rose ${was} -> ${now}.\n` +
    risen.join('\n') +
    '\n  -> state the target behaviour instead of banning its opposite. A ban that is a real\n' +
    '     guardrail keeps its place, but pair it with the positive so attention lands on\n' +
    '     what to do. If the rise is deliberate, re-baseline with `--update` and say why.'
  );
}

/**
 * What the reader is owed when a scope measured fewer docs than it did before.
 *
 * THIS IS THE PROPERTY THE WHOLE GUARD TURNS ON. A ratchet fails only when the
 * count RISES, so a corpus that lost half its docs clears it every time and
 * reports a smaller, greener number while doing so — the exact bug #234 found
 * in this file's own bundled walk. The bundler's file count and its census line
 * witness the two walks; this witnesses the corpus itself, which neither of
 * them can, because a doc genuinely deleted or re-declared makes both walks
 * agree on a smaller truth.
 *
 * Pure, for the same reason as `roseReport`.
 *
 * @param {{scope: {key: string, noun: string}, was: number, now: number}} shrink
 * @returns {string}
 */
export function corpusShrankReport({ scope, was, now }) {
  return (
    `[negation] the ${scope.key} corpus shrank: ${now} ${scope.noun} measured, against the ` +
    `${was} this baseline was recorded over.\n` +
    '  -> A ratchet only fails when the count RISES, so a corpus that lost docs passes it every\n' +
    '     time — and passes with a SMALLER number, which reads like progress (#234). That is why\n' +
    '     a shortfall is a failure here and not a lower score. If docs were deliberately deleted\n' +
    '     or re-declared, re-baseline with `--update` and say which, and why.'
  );
}

/**
 * What the reader is owed when a scope's READING changed under its baseline.
 *
 * The other two failures are about the corpus; this one is about the ruler. A
 * scope reads either the bundled body or the whole file (#238), and switching
 * one to the other moves its number without a single doc changing — downward,
 * in the direction a ratchet never fails on. Unifying the two paths would land
 * as bundled 200 -> 200 and IDE 107 -> 105, both green, and the guard would go
 * on reporting a number whose definition it had stopped honouring. So the
 * baseline records the reading it was taken under and this compares them.
 *
 * Pure, for the same reason as `roseReport`.
 *
 * @param {{scope: {key: string, noun: string, measuredOn: string}, was: string|undefined}} change
 * @returns {string}
 */
export function readingChangedReport({ scope, was }) {
  return (
    `[negation] the ${scope.key} scope no longer reads what its baseline was recorded over.\n` +
    `  baseline: ${was ?? '(the baseline records no reading for this scope)'}\n` +
    `  now:      ${scope.measuredOn}\n` +
    '  -> The two scopes read DIFFERENTLY on purpose: the bundled one counts the body the\n' +
    '     bundler assembles, the IDE one counts whole files because a SKILL.md description\n' +
    '     is routing text the model reads. Changing a reading moves the number with no doc\n' +
    '     edited, and usually DOWNWARD — the direction a ratchet never fails on. If the new\n' +
    '     reading is right, re-baseline with `--update` and say why in the PR.'
  );
}

/**
 * One scope's score: resolve its files, count each, total them.
 *
 * `resolveBundled` RETURNS what did not resolve instead of filtering it out —
 * the `if (!fs.existsSync(abs)) continue;` it replaced dropped docs from the
 * corpus in silence (#234). It is named for the bundled set but is just a
 * reader of repo-relative paths, so all three scopes use it.
 *
 * The scope's own `read` decides how much of each file is counted — the bundled
 * body, or the whole file (#238). It is applied HERE, once, so neither scope
 * can acquire a reading that its baseline descriptor does not state.
 *
 * A doc the corpus lists and disk does not comes back as an `unresolved` report
 * rather than being printed and exited on. The caller is `run`, which owes the
 * reader every scope's answer in one go — and a shortfall that stopped the
 * process at the first scope hid whatever the other two had to say (#509).
 *
 * @param {{key: string, noun: string, corpus: string, read: (text: string) => string}} scope
 * @param {string[]} files
 */
function measure(scope, files) {
  const { declared, docs, missing } = resolveBundled(files);
  return {
    ...measureDocs(scope, docs, declared),
    unresolved: missing.length ? unresolvedReport({ missing, declared, tag: 'negation' }) : null,
  };
}

/**
 * The counting half of `measure`, over docs already read.
 *
 * Split out so a test can hand a scope a FIXTURE — a planted ban, an emptied
 * corpus — and watch the real counter and the real reading score it, rather
 * than a re-implementation of either (#425). `measure` above is the disk half.
 *
 * @param {{key: string, noun: string, read: (text: string) => string}} scope
 * @param {{label: string, text: string}[]} docs
 * @param {number} [declared] how many the corpus listed; defaults to what was read.
 */
export function measureDocs(scope, docs, declared = docs.length) {
  const counts = {};
  let total = 0;
  for (const { label, text } of docs) {
    const n = countProhibitions(scope.read(text));
    if (n) counts[label] = n;
    total += n;
  }
  return { scope, declared, docs: docs.length, counts, total };
}

/**
 * Every measured scope against the baseline: the failures, in report order.
 *
 * Pure — the comparison the gate turns on, separated from the disk and the
 * bundler so it can be asserted over a fixture baseline (#425). Order inside a
 * scope is load-bearing and stated at each step: the RULER first, then the
 * corpus floor, then the count.
 *
 * THREE SCOPES, SIX SETS, ONE RECORD, all read through `scripts/lib/ratchet.mjs`
 * (#601): each scope's per-doc `counts` and, beside it, the `docs` FLOOR — a
 * `grow-only` scalar, so the module reports a corpus that shrank as FELL, which
 * is the direction this guard turns on. Two things this check words for itself
 * and says why:
 *
 *   THE RULER, which is not a count at all. The recorded `measuredOn` is
 *   envelope prose and lives beside the set; a scope reading whole files where
 *   its record was taken on the bundled body is not comparable to that record
 *   at all, so it is asked first and the count is not reported at all.
 *
 *   THE RATCHETED QUANTITY IS THE SCOPE TOTAL, not each doc's count. The
 *   per-doc numbers are the record's EVIDENCE — what to fix first — over a
 *   corpus that gains and loses docs every week; the thing this guard asks is
 *   that the scope's total go down. So the module's per-key NEW, ROSE and STALE
 *   are not reported here: a doc losing its last prohibition would otherwise
 *   fail the build for improving, and a ratchet whose failure mode is "you made
 *   it better" is one people switch off. What the total cannot hide is a corpus
 *   that shrank, and that is exactly what the floor beside it is for.
 *
 * @param {ReturnType<typeof measureDocs>[]} measured
 * @param {Record<string, {counts: import('./lib/ratchet.mjs').Ratchet,
 *                         corpus: import('./lib/ratchet.mjs').Ratchet}>} records
 * @returns {string[]} one report per failing scope; empty when every scope holds.
 */
export function compare(measured, records) {
  const failures = [];
  for (const m of measured) {
    const { counts, corpus } = records[m.scope.key];

    // No record: the one stated error mode, worded by the module. A scope's
    // record that is there but has no `scopes.<key>` at all is UNREADABLE and
    // throws when it is opened — also the module's, and also stated once.
    const absent = counts.failures(m.counts).find((failure) => failure.kind === 'absent');
    if (absent) {
      failures.push(absent.message);
      continue;
    }

    // The RULER before the corpus: a count taken through a different reading is
    // not comparable to this baseline at all, whatever the corpus did.
    const reading = counts.envelope(`scopes.${m.scope.key}.measuredOn`);
    if (reading !== m.scope.measuredOn) {
      failures.push(readingChangedReport({ scope: m.scope, was: reading }));
      continue;
    }

    // Corpus floor next. A shrunken corpus makes the count below meaningless,
    // and reporting a fall as good news is the failure this ordering prevents.
    const fell = corpus.failures({ docs: m.docs }).find((failure) => failure.kind === 'fell');
    if (fell) {
      failures.push(corpusShrankReport({ scope: m.scope, was: fell.recorded, now: fell.count }));
      continue;
    }

    const baseCounts = recordedCounts(counts);
    const was = totalOf(baseCounts);
    if (m.total > was) {
      failures.push(roseReport({ scope: m.scope, was, now: m.total, counts: m.counts, baseCounts }));
    }
  }
  return failures;
}

/** One scope's recorded per-doc counts, as the record writes them. */
const recordedCounts = (ratchet) =>
  Object.fromEntries([...ratchet.entries].map(([key, entry]) => [key, entry.counts.get('count')]));

/**
 * A scope's recorded total: the SUM of its per-doc counts, never a number
 * stored beside them. The record held one until #601 and nothing compared the
 * two, so a hand-edited total was a baseline the gate would trust over the
 * counts underneath it. It is also the half of the old envelope that `--update`
 * could not own, and an `--update` that leaves a number stale is worse than one
 * that never wrote it.
 */
const totalOf = (counts) => Object.values(counts).reduce((sum, n) => sum + n, 0);

/**
 * Every scope, measured once per repo root.
 *
 * ONE bundler run answers both of the scopes that read it. Two runs would be
 * two chances for the harness to change underneath a check that is comparing
 * the halves — and `run`, `summary` and `--update` all want the same numbers.
 */
const readings = byRoot(() => {
  const sets = harnessSets({ tag: 'negation', notThis: 'the prohibition-token count' });
  return SCOPES.map((scope) => measure(scope, scope.files(sets)));
});

/**
 * The ratchet, as findings.
 *
 * Every scope is reported, never just the first: one PR can raise all three, and
 * a gate that costs a fix-push-wait cycle per fact is a gate people route
 * around (`check-harness.mjs` § It does not stop at the first failure). Each
 * report carries its own remedy, which is why this check declares no shared
 * one — a rise, a shrunken corpus and a changed ruler want different sentences.
 *
 * @returns {import('./lib/findings.mjs').Finding[]}
 */
export function run({ repoRoot = REPO_ROOT } = {}) {
  const measured = readings(repoRoot);

  // A corpus that did not resolve is reported before anything is compared: a
  // count taken over docs that went missing is not a count of this corpus.
  const unresolved = measured.filter((m) => m.unresolved);
  if (unresolved.length) return unresolved.map((m) => ({ message: m.unresolved }));

  const opened = records(repoRoot);

  // ONE record, so the absent mode is reported ONCE rather than per scope: six
  // copies of the same sentence tells a reader six times that there is one file
  // to write. `compare` states it per scope too, for a caller that asks about
  // one scope alone.
  const absent = SCOPES.map((scope) => opened[scope.key].counts).find((ratchet) => ratchet.absent);
  if (absent) return absent.failures({}).map(({ message }) => ({ message }));

  return compare(measured, opened).map((message) => ({ message }));
}

/**
 * Both sets of every scope, opened over the record.
 *
 * Opened per call rather than memoised: `--update` writes the record and the
 * next question reads it back, and a cached ratchet would answer with the
 * record from before the write.
 *
 * @returns {Record<string, {counts: import('./lib/ratchet.mjs').Ratchet,
 *                           corpus: import('./lib/ratchet.mjs').Ratchet}>}
 */
function records(repoRoot) {
  return Object.fromEntries(
    SCOPES.map((scope) => [
      scope.key,
      {
        counts: openRatchet({ file: BASELINE, set: scope.key, repoRoot }),
        corpus: openRatchet({ file: BASELINE, set: `${scope.key}-corpus`, repoRoot }),
      },
    ]),
  );
}

/**
 * The green line.
 *
 * Both numbers, always: `N ... across M of M docs` is the only shape in which
 * a narrowed corpus is visible to whoever reads the pass line (#234). And the
 * tokens are named because a bare "prohibitions" was read as a claim about
 * negation in general, which this has never measured.
 */
export function summary({ repoRoot = REPO_ROOT } = {}) {
  const measured = readings(repoRoot);
  const opened = records(repoRoot);
  const lines = measured.map((m) => {
    const recorded = totalOf(recordedCounts(opened[m.scope.key].counts));
    const worst = Object.entries(m.counts)
      .sort((a, c) => c[1] - a[1])
      .slice(0, 3);
    return (
      `  ${m.scope.key.padEnd(8)} ${String(m.total).padStart(3)} across ${m.docs} of ${m.declared} ` +
      `${m.scope.noun} (baseline ${recorded})` +
      (m.total < recorded ? ` — down ${recorded - m.total}, re-baseline with --update` : '') +
      `\n           heaviest: ${worst.map(([f, n]) => `${f} (${n})`).join(' · ')}`
    );
  });
  return (
    `${METRIC} (${PROHIBITION_TOKENS.join(' / ')}), ${SCOPES.length} scopes, one baseline:\n` +
    lines.join('\n') +
    '\n  (imperative bans only — negation in other forms is not counted here;' +
    " see this script's header.)"
  );
}

/**
 * `--update`: record what was just measured as the new baseline.
 *
 * This WRITES, which is why it lives here and not in `run`. A check that
 * re-recorded its own baseline while answering "did the count rise?" would
 * answer it with the number it had just written down.
 */
function recordBaseline(measured, repoRoot = REPO_ROOT) {
  /*
   * SIX WRITES, ONE PER SET, each a MERGE through the ratchet. All six handles
   * are opened BEFORE the first write, because opening a set whose container no
   * write has created yet is an UNREADABLE record — which is the state a record
   * written from nothing is in between the six. The merge itself re-reads the
   * file, so no write undoes the one before it. The floor goes first so a
   * brand-new record carries its keys in the order the reader reads them in:
   * the corpus sentence, the reading, the doc count, then the counts.
   *
   * WHAT IS SEEDED IS THE ENVELOPE, and only onto a record that does not
   * already hold it: the metric descriptor, so the number is never read without
   * its definition beside it (#234), and per scope the corpus and the READING
   * it was taken under. The reading in particular is the reader's afterwards —
   * before #601 this rewrote it on every run, which meant an `--update` could
   * silence the ruler comparison by making the record agree with whatever the
   * code now did (#238). Now it stands until a person moves it, and the gate
   * says so.
   */
  const seed = {
    metric: {
      counts: METRIC,
      tokens: PROHIBITION_TOKENS,
      // What is common to all three scopes. HOW MUCH OF EACH FILE IS READ IS
      // NOT common to them (#238), so it is seeded per scope rather than
      // asserted once here — a single line would have to be wrong about one of
      // them, which is how the old "frontmatter included" outlived being true
      // of the bundled half.
      measuredOn: 'outside quoted speech and code spans; how much of each file, per scope below',
      note: 'NOT a count of negative statements — see scripts/check-negation-ratchet.mjs § What is counted.',
    },
  };
  for (const m of measured) {
    seed[`scopes.${m.scope.key}.corpus`] = m.scope.corpus;
    seed[`scopes.${m.scope.key}.measuredOn`] = m.scope.measuredOn;
  }

  const opened = records(repoRoot);
  for (const m of measured) {
    opened[m.scope.key].corpus.update({ docs: m.docs }, { seed });
    opened[m.scope.key].counts.update(m.counts, { seed });
  }
  console.log(
    `[negation] baseline recorded: ${measured
      .map((m) => `${m.total} ${m.scope.key} across ${m.docs} ${m.scope.noun}`)
      .join(', ')} (${METRIC})`,
  );
}

// Importing this module for its exports must not run the check, and must not
// write a baseline either — which is `main()`'s entry comparison, so `--update`
// belongs to the process that typed it and to no importer. It is TERMINAL: it
// writes the record and the gate does not also run.
main(import.meta.url, 'check:negation', {
  run,
  summary,
  flags: { '--update': () => recordBaseline(readings(REPO_ROOT)) },
});
