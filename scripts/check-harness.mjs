/**
 * `npm run check:harness` — the one gate that runs on `pull_request`.
 *
 * WHY IT EXISTS. Until this landed, no workflow in this repo carried a
 * `pull_request` trigger; the deterministic guards ran monthly
 * (`harness-integrity-sweep.yml`), on push (`uno-bot-deploy.yml`), or nowhere at
 * all. Monthly and on-push share one defect: they observe a branch only after
 * it is `main`. Two branches that are each green alone and red together are
 * therefore undetectable until the damage is merged — observed 2026-08-26, when
 * #172 (nine files removed from `docs/knowledge/`) and #193 (`harness-bundle.md`
 * added) merged in sequence and left `main` with a stale `INDEX.md` and
 * `harness-bundle.md`, four checks red, repaired only afterwards by #196.
 * Neither branch could see the other's effect on a generated artifact. A gate
 * that runs on the merge candidate can.
 *
 * WHAT IT COMPOSES, AND WHY NOT EVERYTHING. Composition is stated once, as
 * `CHECKS` in `scripts/checks.registry.mjs`, with the reason each member earns
 * its seconds. Four rules decided the set:
 *
 *   1. No member that another member already runs. `check:agent` is itself a
 *      composite of seven generators (`scripts/generate-agent.js`), so
 *      `check:component-docs`, `check:index`, `check:component-registry`,
 *      `check:token-registry` and `check:knowledge-audit` are its steps, not
 *      peers. Listing them twice would double the runtime and split the report.
 *   2. No member that cannot fail. A guard that reports green on any input is
 *      worse than no guard, because it is believed (#191 fixed the two known
 *      ones). Every member here has been failed deliberately and watched to
 *      exit non-zero — the evidence is in the PR that added it.
 *   3. No member that cannot run on a clean checkout. `check:contract` compares
 *      the vendored blueprint contract against a sibling repo that no runner
 *      has; composing it would make the gate permanently red, which is how a
 *      gate gets switched off.
 *   4. No member that costs minutes. `check:storybook` (#169) drives a real
 *      browser over 382 story files in ~130s, and needs an `npm ci` and a
 *      Playwright download on top. It belongs on `pull_request` — it just does
 *      not belong inside this exit code, where it would multiply the wait
 *      tenfold and make the fast gate the slow one. It has its own workflow on
 *      the same trigger, running concurrently. Exclusion here means "not in this
 *      process", never "not on PRs".
 *
 * WHY IT REACHES INTO `agents/uno-bot`. For exactly one check, on one rule: a
 * sub-package check is composed here when its INPUTS live at the repo root.
 * `check:harness-bundle` reads `AGENTS.md`, `CONTEXT.md`, `skills/`,
 * `docs/connectors`, `docs/engineering` and `docs/conventions` — so a PR that
 * touches nothing under `agents/` can still invalidate it, and did (#196).
 * `check:fetch` and `check:contract` read only `agents/uno-bot/`, and are gated
 * at their own boundary by `npm run deploy`; they stay out. See `EXCLUDED` in
 * the registry.
 *
 * THE LIST IS A DATUM, NOT A CONSTANT IN HERE (#508). Three other places state
 * the same set — the `check:*` block of the root package.json, the monthly
 * `harness-integrity-sweep.yml` and `storybook-gate.yml` — and while this file
 * owned the list, nothing compared the four. All four now read
 * `scripts/checks.registry.mjs`: this runner runs it, and
 * `scripts/generate-check-scripts.mjs` writes the other three's generated
 * blocks, with `npm run check:check-registry` failing on drift. The runner
 * itself is `scripts/harness-runner.mjs`, tested in
 * `scripts/check-harness.test.mjs` — the single gate was the last untested
 * script here.
 *
 * A CHECK RETURNS FINDINGS INSTEAD OF EXITING (#509). A registry row carrying a
 * `module` exports `run(ctx) => Finding[]`; this runner calls it in-process and
 * renders one banner (`scripts/lib/findings.mjs`). The rows that cannot answer
 * that interface — a browser suite, `tsc`, a test runner, the seven-generator
 * composite `check:agent` — declare `kind: 'spawn'` and the reason, and are run
 * as `npm run <name>` and read by exit code. Those are the only two kinds:
 * "legacy" was a row that declared nothing and got spawned on a guess, and it
 * no longer exists.
 *
 * IT GUARDS ITS OWN COMPLETENESS. Every `check:*` script in either package.json
 * must be either registered or listed in `EXCLUDED` with a reason. A new check
 * added without a decision fails this one — which is the failure mode the whole
 * epic exists to kill: a guard that exists and runs nowhere.
 *
 * THAT ASSERTION HAS A BLIND SPOT, AND IT COST SOMETHING. It matches on the
 * `check:` prefix, so a guard that does not carry the prefix is invisible to it.
 * `agents/uno-bot`'s `typecheck` and `test` are both guards by any reading —
 * the largest unit suite in the repository, and the Worker's whole type surface — and
 * neither ran in any workflow. `test` was not even in `npm run deploy`, and
 * joined that chain only in #580. `test:workerd` — the Durable Object
 * conformance suite — was the same blind spot one layer down, gated as a
 * hand-written workflow step while the registry described it nowhere, until
 * #587 made it an `EXCLUDED` row with its reason and put it in the deploy
 * chain. All three are
 * registered BY NAME because the assertion cannot find them for us; the
 * prefix is not widened to catch them, because the rest of that package's
 * scripts (`dev`, `tail`, `deploy`, `secrets:set`) are commands rather than
 * guards, and a rule that demanded a decision on each of those would be noise.
 *
 * IT DOES NOT STOP AT THE FIRST FAILURE. One CI run should report everything
 * that is wrong, not the first thing; a gate that costs a fix-push-wait cycle
 * per fact is a gate people route around.
 *
 * Usage:
 *   npm run check:harness            run every sub-check; exit 1 naming the failures
 *   npm run check:harness -- --list  print the composition and the reasons; run nothing
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CHECKS, EXCLUDED, triggersOf } from './checks.registry.mjs';
import { ORPHAN_REMEDY, orphansInRepo, runAll } from './harness-runner.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.argv.includes('--list')) {
  console.log(`check:harness composes ${CHECKS.length} sub-checks:\n`);
  for (const row of CHECKS) {
    console.log(
      `  ${row.name.padEnd(28)} ${row.pkg === 'bot' ? '[agents/uno-bot] ' : ''}${row.guards}`,
    );
  }
  console.log('\nDeliberately not composed:\n');
  for (const row of EXCLUDED) {
    console.log(`  ${row.name.padEnd(28)} [${triggersOf(row).join(' ')}] ${row.reason}`);
  }
  process.exit(0);
}

// The completeness assertion runs before anything else: a check added to a
// package.json without being registered or excluded is exactly the orphan this
// gate exists to prevent, and learning that after seventeen seconds of green
// sub-checks reads like an afterthought. It asks from both ends (#612) — a
// `check:*` name no row declares, and a `check-*.mjs` on disk no row names.
const found = orphansInRepo(REPO_ROOT);
if (found.length) {
  console.error(
    `[check:harness] ${found.length} check script(s) run nowhere:\n` +
      found.map((o) => `  ${o}`).join('\n') +
      `\n\n${ORPHAN_REMEDY}`,
  );
  process.exit(1);
}

console.log(`check:harness — ${CHECKS.length} sub-checks, one exit code\n`);

const { failures, seconds, total } = await runAll({
  repoRoot: REPO_ROOT,
  onResult: (row, result) =>
    console.log(
      `  ${result.ok ? '✓' : '✗'} ${row.name.padEnd(28)} ${result.seconds.toFixed(1).padStart(5)}s` +
        (row.pkg === 'bot' ? '   [agents/uno-bot]' : ''),
    ),
});
const elapsed = seconds.toFixed(1);

if (!failures.length) {
  console.log(`\n✓ check:harness — ${total}/${total} sub-checks passed in ${elapsed}s`);
  process.exit(0);
}

for (const failure of failures) {
  console.error(`\n${'─'.repeat(72)}\n✗ ${failure.name}   (${failure.invocation})`);
  console.error(`  guards: ${failure.guards}\n`);
  console.error(failure.output || '  (the sub-check exited non-zero without output)');
}

console.error(
  `\n${'─'.repeat(72)}\n` +
    `✗ check:harness — ${failures.length} of ${total} sub-checks FAILED in ${elapsed}s: ` +
    failures.map((f) => f.name).join(', ') +
    '\n\n  -> Fix each one above, then re-run `npm run check:harness`. When a generated' +
    '\n     artifact is stale, the fix is to regenerate and commit it:' +
    '\n       npm run generate:agent' +
    '\n       npm run generate:index' +
    '\n       npm run generate:check-registry' +
    '\n       npm --prefix agents/uno-bot run bundle:harness',
);
process.exit(1);
