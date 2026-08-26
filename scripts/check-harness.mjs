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
 * WHAT IT COMPOSES, AND WHY NOT EVERYTHING. Composition is stated once, in
 * `COMPOSED` below, with the reason each member earns its seconds. Four rules
 * decided the set:
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
 * at their own boundary by `npm run deploy`; they stay out. See `EXCLUDED`.
 *
 * IT GUARDS ITS OWN COMPLETENESS. Every `check:*` script in either package.json
 * must be either composed or listed in `EXCLUDED` with a reason. A new check
 * added without a decision fails this one — which is the failure mode the whole
 * epic exists to kill: a guard that exists and runs nowhere.
 *
 * IT DOES NOT STOP AT THE FIRST FAILURE. One CI run should report everything
 * that is wrong, not the first thing; a gate that costs a fix-push-wait cycle
 * per fact is a gate people route around.
 *
 * Usage:
 *   npm run check:harness            run every sub-check; exit 1 naming the failures
 *   npm run check:harness -- --list  print the composition and the reasons; run nothing
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BOT_DIR = path.join(REPO_ROOT, 'agents', 'uno-bot');

/**
 * The composition. `script` is the npm script name; `pkg` says which
 * package.json owns it. `guards` is what goes red when it fails — written for
 * whoever reads the CI log, who did not write the check.
 */
const COMPOSED = [
  {
    script: 'check:agent',
    pkg: 'root',
    guards:
      'seven generated artifacts against the design-system SSOT (cheat sheet, component + forms index, component docs, INDEX.md, Figma component registry, token registry, knowledge audit). Names its own failing step.',
  },
  {
    script: 'check:docs',
    pkg: 'root',
    guards:
      'every relative markdown link in skills/ agents/ docs/ design-system/guidelines/ + root, and the repo paths inside the JSON indexes.',
  },
  {
    script: 'check:doc-identifiers',
    pkg: 'root',
    guards:
      'every prop, variant, size and design token named in a docs page resolving to something in source. This is the #78 / #79 / #98 defect class — three fabricated-name fixes by hand in one day, 2026-08-25.',
  },
  {
    script: 'check:figma-links',
    pkg: 'root',
    guards: 'the generated Figma-links spreadsheet against the component MDX it is built from.',
  },
  {
    script: 'check:skill-surfaces',
    pkg: 'root',
    guards:
      'the generated skill surfaces — .claude/skills/ stubs, the Worker command map, the Slack app-manifest block — against each SKILL.md.',
  },
  {
    script: 'check:skill-overlap',
    pkg: 'root',
    guards:
      'one rule, one home — no substantive line living in two faces of the same skill, and none living in two bundled docs. Reads the bundled set from the bundler, so a stale bundle stops it.',
  },
  {
    script: 'check:knowledge-disposition',
    pkg: 'root',
    guards: 'every file under docs/knowledge/ declaring what it became (a `disposition:`).',
  },
  {
    script: 'check:negation',
    pkg: 'root',
    guards: 'the negation ratchet — prohibition density across the harness docs not climbing.',
  },
  {
    script: 'check:token-collision',
    pkg: 'root',
    guards:
      'no component stylesheet colouring text in the same token as the surface under it. `Navbar` shipped one for the life of the component at 1.00:1 (#219); axe cannot see this class, because the text sits in a transparent box over a painted ancestor.',
  },
  {
    script: 'check:unspread-rest',
    pkg: 'root',
    guards:
      'no component in the published library collecting a `...rest` and never using it. ' +
      '`DateAndTimePicker` dropped every prop beyond its signature for the life of the ' +
      'component (#230) — React allows an unused rest element and propTypes never sees ' +
      'unknown props, so the props lost are the unwatched ones: aria-describedby, ' +
      'data-testid. Same shape as check:token-collision — a silent defect no browser run ' +
      'can observe, decidable from the file.',
  },
  {
    script: 'check:intake-fsm',
    pkg: 'root',
    guards: 'the intake FSM that gates every uno-prototype run.',
  },
  {
    script: 'test:scripts',
    pkg: 'root',
    guards:
      'the unit tests of the guards themselves. A guard nobody has watched fail is a guard nobody knows works (#191).',
  },
  {
    script: 'check:harness-bundle',
    pkg: 'bot',
    guards:
      'the Worker prompt bundle against the root docs it is assembled from, and the char budgets in AGENTS.md § The loading contract. This is the artifact #196 had to repair.',
  },
];

/**
 * Every `check:*` script NOT composed needs a reason here. The completeness
 * assertion below reads this; an unlisted, uncomposed check fails the gate.
 */
const EXCLUDED = {
  'check:harness': 'this script.',
  'check:component-docs': 'step 3 of check:agent.',
  'check:index': 'step 4 of check:agent.',
  'check:component-registry': 'step 5 of check:agent.',
  'check:token-registry': 'step 6 of check:agent.',
  'check:knowledge-audit': 'step 7 of check:agent.',
  'check:storybook':
    'the only sub-check that is not dependency-free: it needs `npm ci` and a Playwright ' +
    'chromium download, and the browser suite itself is ~130s against this gate\'s ~14s ' +
    'total (measured 2026-08-26, #169). Composing it would be a 10x rise in the number ' +
    'people wait on, and the header above says why that is fatal. It runs on the same ' +
    '`pull_request` trigger as its own job — `.github/workflows/storybook-gate.yml` — so ' +
    'it is a peer of this gate, not an orphan, and the two run concurrently: a PR waits ' +
    'one Storybook run, not a Storybook run after a harness run.',
  'check:fetch':
    'reads only agents/uno-bot/src/. A root-only PR cannot break it, and `npm run deploy` gates it at its own boundary.',
  'check:contract':
    'compares against a sibling checkout of BilLogic/plus-uno-blueprint that no runner has. It exits 1 on a missing source by design, so composing it would make this gate permanently red.',
};

const npmScripts = (dir) =>
  Object.keys(JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts ?? {});

/**
 * The completeness assertion. Runs before anything else: a check added to a
 * package.json without being composed or excluded is exactly the orphan this
 * gate exists to prevent, and learning that after seventeen seconds of green
 * sub-checks reads like an afterthought.
 */
function assertComplete() {
  const declared = new Set([...COMPOSED.map((c) => c.script), ...Object.keys(EXCLUDED)]);
  const orphans = [];
  for (const [dir, label] of [
    [REPO_ROOT, 'package.json'],
    [BOT_DIR, 'agents/uno-bot/package.json'],
  ]) {
    for (const s of npmScripts(dir)) {
      if (s.startsWith('check:') && !declared.has(s)) orphans.push(`${s}  (${label})`);
    }
  }
  if (orphans.length) {
    console.error(
      `[check:harness] ${orphans.length} check script(s) run nowhere:\n` +
        orphans.map((o) => `  ${o}`).join('\n') +
        '\n\n  -> Every check:* script is either composed into this gate or excluded with a' +
        '\n     reason. Add it to COMPOSED or to EXCLUDED in scripts/check-harness.mjs.' +
        '\n     A check that runs nowhere protects nothing.',
    );
    process.exit(1);
  }
}

function run({ script, pkg }) {
  const args =
    pkg === 'bot'
      ? ['--prefix', 'agents/uno-bot', 'run', '--silent', script]
      : ['run', '--silent', script];
  const started = Date.now();
  const r = spawnSync('npm', args, { cwd: REPO_ROOT, encoding: 'utf8', env: process.env });
  return {
    ok: r.status === 0,
    seconds: (Date.now() - started) / 1000,
    output: `${r.stdout ?? ''}${r.stderr ?? ''}`.trimEnd(),
    invocation: `npm ${args.join(' ')}`,
  };
}

if (process.argv.includes('--list')) {
  console.log(`check:harness composes ${COMPOSED.length} sub-checks:\n`);
  for (const c of COMPOSED) {
    console.log(`  ${c.script.padEnd(28)} ${c.pkg === 'bot' ? '[agents/uno-bot] ' : ''}${c.guards}`);
  }
  console.log('\nDeliberately not composed:\n');
  for (const [s, why] of Object.entries(EXCLUDED)) console.log(`  ${s.padEnd(28)} ${why}`);
  process.exit(0);
}

assertComplete();

console.log(`check:harness — ${COMPOSED.length} sub-checks, one exit code\n`);

const startedAll = Date.now();
const failures = [];
for (const check of COMPOSED) {
  const result = run(check);
  console.log(
    `  ${result.ok ? '✓' : '✗'} ${check.script.padEnd(28)} ${result.seconds.toFixed(1).padStart(5)}s` +
      (check.pkg === 'bot' ? '   [agents/uno-bot]' : ''),
  );
  if (!result.ok) failures.push({ ...check, ...result });
}
const elapsed = ((Date.now() - startedAll) / 1000).toFixed(1);

if (!failures.length) {
  console.log(
    `\n✓ check:harness — ${COMPOSED.length}/${COMPOSED.length} sub-checks passed in ${elapsed}s`,
  );
  process.exit(0);
}

for (const f of failures) {
  console.error(`\n${'─'.repeat(72)}\n✗ ${f.script}   (${f.invocation})`);
  console.error(`  guards: ${f.guards}\n`);
  console.error(f.output || '  (the sub-check exited non-zero without output)');
}

console.error(
  `\n${'─'.repeat(72)}\n` +
    `✗ check:harness — ${failures.length} of ${COMPOSED.length} sub-checks FAILED in ${elapsed}s: ` +
    failures.map((f) => f.script).join(', ') +
    '\n\n  -> Fix each one above, then re-run `npm run check:harness`. When a generated' +
    '\n     artifact is stale, the fix is to regenerate and commit it:' +
    '\n       npm run generate:agent' +
    '\n       npm run generate:index' +
    '\n       npm --prefix agents/uno-bot run bundle:harness',
);
process.exit(1);
