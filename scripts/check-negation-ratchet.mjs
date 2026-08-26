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
 * old name implied. Since 6 is now this file's floor, saying so in the output
 * is the difference between a modest measurement and a misleading one.
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
 * FRONTMATTER IS COUNTED, which is worth knowing and was not decided here — the
 * counter has read whole files since #155 and the bundled baseline of 202 was
 * recorded that way. It cuts both ways. For a `SKILL.md` it is right: the
 * `description:` is the routing text an agent reads to decide whether to load
 * the skill, so a ban there steers exactly as a ban in the body does, and 2 of
 * the IDE scope's tokens are that. For a bundled doc it is a slight over-count:
 * the bundler strips frontmatter before assembly, so the 2 tokens
 * `docs/connectors/supabase/overview.md` contributes from its own never reach
 * the model. Left alone deliberately — correcting it would move 202, and #174
 * adds a scope rather than re-baselining the one already holding.
 *
 * ONE GUARD, TWO SCOPES, ONE BASELINE FILE. A second script would have restated
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
 * Usage:
 *   node scripts/check-negation-ratchet.mjs           report, fail if either count rose
 *   node scripts/check-negation-ratchet.mjs --update  record the current counts as the new baseline
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { bundlerFailureReport, harnessSets, resolveBundled, unresolvedReport } from './lib/bundled-set.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
export const BASELINE = path.join(REPO_ROOT, 'docs/evals/negation-baseline.json');
const UPDATE = process.argv.includes('--update');

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
 * name and a description the baseline file will carry.
 *
 * `key` is how the scope is written down; `noun` is how the report says it.
 * Order is report order — bundled first, because those docs cost context on
 * every turn and an IDE doc costs it only when loaded.
 */
export const SCOPES = [
  {
    key: 'bundled',
    noun: 'bundled docs',
    corpus: 'docs the bundler assembles into the Worker prompt (embodiment: all | uno-bot)',
  },
  {
    key: 'ide',
    noun: 'IDE-side docs',
    corpus:
      'hand-authored docs under the bundler section roots declaring embodiment: ide — ' +
      'docs/adr/ and the generated .claude/skills/ surfaces are not section roots and so are out',
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
 * One scope's score: resolve its files, count each, total them.
 *
 * `resolveBundled` RETURNS what did not resolve instead of filtering it out —
 * the `if (!fs.existsSync(abs)) continue;` it replaced dropped docs from the
 * corpus in silence (#234). It is named for the bundled set but is just a
 * reader of repo-relative paths, so both scopes use it.
 *
 * @param {{key: string, noun: string, corpus: string}} scope
 * @param {string[]} files
 */
function measure(scope, files) {
  const { declared, docs, missing } = resolveBundled(files);
  if (missing.length) {
    console.error(unresolvedReport({ missing, declared, tag: 'negation' }));
    process.exit(1);
  }
  const counts = {};
  let total = 0;
  for (const { label, text } of docs) {
    const n = countProhibitions(text);
    if (n) counts[label] = n;
    total += n;
  }
  return { scope, declared, docs: docs.length, counts, total };
}

/**
 * The check itself.
 *
 * Wrapped so the module can be imported for `bundlerFailureReport` without
 * running a ratchet — and, more to the point, without a stale bundle taking the
 * test run down with a `process.exit` at import time. Same guard as
 * `check-storybook.mjs`.
 */
function main() {
  // ONE bundler run answers both scopes. Two runs would be two chances for the
  // harness to change underneath a check that is comparing the halves.
  const sets = harnessSets({ tag: 'negation', notThis: 'the prohibition-token count' });
  const measured = SCOPES.map((scope) => measure(scope, sets[scope.key]));

  if (UPDATE) {
    // The metric descriptor rides in the file so the number is never read
    // without its definition beside it (#234), and each scope carries the doc
    // count it was recorded over so the floor below has something to stand on.
    const metric = {
      counts: METRIC,
      tokens: PROHIBITION_TOKENS,
      measuredOn: 'whole files, frontmatter included, outside quoted speech and code spans',
      note: 'NOT a count of negative statements — see scripts/check-negation-ratchet.mjs § What is counted.',
    };
    const scopes = {};
    for (const m of measured) {
      scopes[m.scope.key] = { corpus: m.scope.corpus, docs: m.docs, total: m.total, counts: m.counts };
    }
    fs.writeFileSync(BASELINE, `${JSON.stringify({ metric, scopes }, null, 2)}\n`);
    console.log(
      `[negation] baseline recorded: ${measured
        .map((m) => `${m.total} ${m.scope.key} across ${m.docs} ${m.scope.noun}`)
        .join(', ')} (${METRIC})`,
    );
    process.exit(0);
  }

  if (!fs.existsSync(BASELINE)) {
    console.error('[negation] no baseline — run `npm run check:negation -- --update` once to record it.');
    process.exit(1);
  }

  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const failures = [];

  for (const m of measured) {
    const b = base.scopes?.[m.scope.key];
    if (!b) {
      failures.push(
        `[negation] the baseline records no \`${m.scope.key}\` scope, so this run has nothing to ratchet\n` +
          `  against for ${m.scope.corpus}.\n` +
          '  -> A scope added to SCOPES without a recorded baseline is a scope that cannot fail.\n' +
          '     Record it from a real run: `npm run check:negation -- --update`.',
      );
      continue;
    }
    // Corpus floor FIRST. A shrunken corpus makes the count below meaningless,
    // and reporting a fall as good news is the failure this ordering prevents.
    if (m.docs < b.docs) {
      failures.push(corpusShrankReport({ scope: m.scope, was: b.docs, now: m.docs }));
      continue;
    }
    if (m.total > b.total) {
      failures.push(
        roseReport({ scope: m.scope, was: b.total, now: m.total, counts: m.counts, baseCounts: b.counts }),
      );
    }
  }

  if (failures.length) {
    // Both scopes are reported, never just the first: one PR can raise both, and
    // a gate that costs a fix-push-wait cycle per fact is a gate people route
    // around (`check-harness.mjs` § It does not stop at the first failure).
    console.error(failures.join('\n\n'));
    process.exit(1);
  }

  // Both numbers, always: `N ... across M of M docs` is the only shape in which
  // a narrowed corpus is visible to whoever reads the pass line (#234). And the
  // tokens are named because a bare "prohibitions" was read as a claim about
  // negation in general, which this has never measured.
  const lines = measured.map((m) => {
    const b = base.scopes[m.scope.key];
    const worst = Object.entries(m.counts)
      .sort((a, c) => c[1] - a[1])
      .slice(0, 3);
    return (
      `  ${m.scope.key.padEnd(8)} ${String(m.total).padStart(3)} across ${m.docs} of ${m.declared} ` +
      `${m.scope.noun} (baseline ${b.total})` +
      (m.total < b.total ? ` — down ${b.total - m.total}, re-baseline with --update` : '') +
      `\n           heaviest: ${worst.map(([f, n]) => `${f} (${n})`).join(' · ')}`
    );
  });
  console.log(
    `[negation] ${METRIC} (${PROHIBITION_TOKENS.join(' / ')}), two scopes, one baseline:\n` +
      lines.join('\n') +
      '\n  (imperative bans only — negation in other forms is not counted here;' +
      " see this script's header.)",
  );
}

// Importing this module for its exports must not run the check.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
