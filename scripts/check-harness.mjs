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
 * THAT ASSERTION HAS A BLIND SPOT, AND IT COST SOMETHING. It matches on the
 * `check:` prefix, so a guard that does not carry the prefix is invisible to it.
 * `agents/uno-bot`'s `typecheck` and `test` are both guards by any reading —
 * 268 unit tests across 39 suites, and the Worker's whole type surface — and
 * neither ran in any workflow. `test` was not even in `npm run deploy`. They are
 * composed above BY NAME because the assertion cannot find them for us; the
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
    script: 'check:deps',
    pkg: 'root',
    guards:
      "the two dependency questions a version bumper cannot ask. Dependabot (.github/dependabot.yml) says what is out of date; this says what is DEAD — declared, upgraded forever, imported nowhere — and what is real but UNDECLARED, because a CDN <link> is invisible to every dependency tool there is. Both were live: two packages with zero references anywhere, and FontAwesome loaded from two CDNs at two different MAJOR versions in one codebase.",
  },
  {
    script: 'check:deprecated-apis',
    pkg: 'root',
    guards:
      'dependency ranges against the majors that remove an API this repo still uses. A deprecation is otherwise discovered twice — once when someone reads the warning, once when the upgrade breaks — and only the second one is loud.',
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
    script: 'check:figma-node-types',
    pkg: 'root',
    guards:
      "each registry mapping claiming what its Figma node actually IS, against a dated measurement in design-system/figma/node-types.json. The field is called componentSetNodeId and 15 of the 95 mapped nodes are not sets — 3 PAGEs and 12 plain COMPONENTs. `isComponentSet: false` is how an entry says so, and until this check nothing in the repo READ that field, so six entries carried it and seven that needed it did not. Also catches a mapping nobody has measured, a recording for a mapping that no longer exists, an id recorded against the wrong one of the two Figma files, and a link that opens on nothing.",
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
      'one rule, one home — no substantive line living in two faces of the same skill, and none living in two bundled docs. Reads the bundled set from the bundler, so a stale bundle stops it — and since #234 a SHORT set stops it too, rather than comparing the survivors and printing the narrowed number as the corpus.',
  },
  {
    script: 'check:knowledge-disposition',
    pkg: 'root',
    guards: 'every file under docs/knowledge/ declaring what it became (a `disposition:`).',
  },
  {
    script: 'check:negation',
    pkg: 'root',
    guards:
      "the negation ratchet — the density of five imperative-ban tokens (never / don't / do not / cannot / must not) not climbing, over TWO scopes ratcheted separately from one baseline file: the bundled harness docs and, since #174, the hand-authored IDE-side docs (the `embodiment: ide` complement of the bundled set within the bundler's own section roots, so docs/adr/ and the generated .claude/skills/ surfaces are out by structure). It counts PROHIBITION TOKENS, not negation as written: the two differ by roughly 3x and #234 chose the narrow, unarguable one on the evidence. Each scope also refuses to run against fewer docs than its baseline was recorded over — a ratchet only fails on a RISE, so a corpus that vanished otherwise passes with a smaller number. The script header carries the measurement.",
  },
  {
    script: 'check:button-contrast',
    pkg: 'root',
    guards:
      "every combination Button's `$btn-themes` map GENERATES — 8 styles x 5 fills — rather than the ones a story happens to render. `check:storybook`'s a11y ratchet measures the DOM, and nothing renders a filled `warning` button, so a 3.70:1 label sat in the map unseen for the life of it (#312). It also asserts no two styles resolve to the same filled ground: `--color-info` is `var(--color-tertiary)`, so two names render one appearance, and no accessibility tool compares token values for equality because none knows they were meant to differ. Both current findings are colour-token decisions (#268) rather than Button's, so they are ratcheted in `docs/evals/button-contrast-baseline.json` — which may shrink and never grow, and reports an entry that has stopped failing.",
  },
  {
    script: 'check:token-collision',
    pkg: 'root',
    guards:
      'no component stylesheet colouring text in the same token as the surface under it. `Navbar` shipped one for the life of the component at 1.00:1 (#219); axe cannot see this class, because the text sits in a transparent box over a painted ancestor.',
  },
  {
    script: 'check:colour-fallbacks',
    pkg: 'root',
    guards:
      'the literal beside a colour token agreeing with that token (#268). `var(--color-on-surface-variant, #5c5c5c)` reads as one decision and is two — that token is `#3f484a`, and it carries TEN different fallbacks across its uses, none of them the token. 191 of 473 comparable fallbacks disagree, so the recorded set is ratcheted and only a NEW one fails. It also holds 27 `--color-*` names that are referenced and defined nowhere, where the fallback IS the colour. Static and sub-second, which is why it composes here while the browser checks do not.',
  },
  {
    script: 'check:size-fallbacks',
    pkg: 'root',
    guards:
      "the same rule as check:colour-fallbacks, over the tokens that decide layout rather than colour — and it is the bigger half. 454 of 1075 comparable fallbacks disagree with their token: `var(--size-section-gap-sm, 16px)` is written 61 times for a token that is `8px`, and `var(--size-element-pad-y-lg, 12px)` 52 times for one that is `8px`. Colour's version of this defect paints a wrong shade when the token sheet is late; this one lays out a different page. Ratcheted at 68 distinct pairs. Two entry points rather than one because the families genuinely differ: dimensions have no shared name prefix and are selected by value, and an undefined dimension name is usually a component-local custom property rather than a defect.",
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
    script: 'check:docs-tabs',
    pkg: 'root',
    guards:
      'that the component docs pages keep the tab split ADR-025 gave them. Examples · Code · '
      + 'Usage · Changelog stopped being Storybook `types.TAB` addons and became part of the '
      + 'page, so tab membership now lives in 49 MDX files as `<DocsTab tab="…">` wrappers — '
      + 'this is what stops those 49 drifting. It asserts the population is still 49 (48 '
      + 'components plus one named exception), that every `sb-ds-doc-section` sits in a tab '
      + 'rather than outside all of them, that a section is in the tab its heading assigns it '
      + 'in BOTH directions, that no page outside the set sprouts a strip — the bug the old '
      + 'mechanism actually had, since Storybook never filtered the tab list and a Colors '
      + 'foundation page therefore offered a Usage tab — and that section divs and headings are '
      + 'still one-to-one. It cannot see whether a tab RENDERS: only a browser knows that, and '
      + '`check:storybook` runs story tests, not docs pages.',
  },
  {
    script: 'check:docs-token-literals',
    pkg: 'root',
    guards:
      'that the docs stylesheet stops hand-picking values the design system already '
      + 'tokenises. `.storybook/storybook-overrides.css` is the one stylesheet here that '
      + 'dresses the DOCUMENTATION rather than a component, and nothing watched it: it had '
      + 'accumulated `clamp(2.5rem, 5vw, 4rem)`, `1.5rem`, `0.625rem` and a `#e4e4e7`, each '
      + 'a few lines from a `var(--size-…)` doing the same job, and #251 had to sweep some of '
      + 'them by hand. Every declaration value is read against the live token table in '
      + 'design-system/src/tokens/, matched by VALUE and filtered by family so a font-size is '
      + 'never offered a spacing step. Zero, `100%`, `1px` hairlines, `var()` fallbacks and a '
      + 'comment against the declaration are allowed, and each allowance has a red twin in the '
      + 'tests. It cannot see a NEAR miss (13px is not 12px), and it cannot see a fallback that '
      + 'disagrees with the token it backs — both are written into the script header.',
  },
  {
    script: 'check:page-outline',
    pkg: 'root',
    guards:
      'the OTHER half of the page-outline guard — the half a DOM assertion cannot hold. ' +
      '`.storybook/page-outline.js` asserts in the browser that every page story renders an ' +
      '`<h1>` and that it comes first; it selects pages by story TITLE, cannot count its own ' +
      'population (each story file is its own module in browser mode), and goes silent if its ' +
      'registration in `.storybook/vitest.setup.ts` is deleted. This checks the title selector ' +
      'still picks out exactly the files under `specs/**/Pages/**` plus the three area ' +
      'overviews, that the population has not collapsed below its floor, and that the assertion ' +
      'is still wired in. #243 — the defect neither `heading-order` nor `page-has-heading-one` ' +
      'can see, because the first heading on a page has no predecessor to skip from and axe ' +
      'never evaluates page-level rules against a story root.',
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
    script: 'check:secrets',
    pkg: 'bot',
    guards:
      "the secret declaration against `interface Env` and against [vars]. The [vars] half is the one with teeth: that table is COMMITTED, so a secret assigned there is a secret published to GitHub. The rest keeps wrangler.toml's expected-names list honest — hand-maintained, it drifted in both directions at once (four names not set, two set names missing) and #288's account move works from exactly that list.",
  },
  {
    script: 'check:worker-host',
    pkg: 'bot',
    guards:
      'the single definition of the Worker\'s hostname. Its inputs are repo-root files — the eval workflows and docs/ — so a PR that never touches agents/uno-bot/ can still break it. A second hardcoded host is silent until a cutover (#288) misses one, and an eval pointed at the OLD deployment reports a clean pass, which is the shape of failure #249 already cost this repo.',
  },
  {
    script: 'check:typography-classes',
    pkg: 'root',
    guards:
      "every `*-txt` class a page asks for against a rule that actually sets type. `.h1-txt`\u2013`.h6-txt` have never existed \u2014 headings are `.h1`\u2013`.h6` \u2014 and eleven places asked for them anyway, including two prototype pages and a guidelines example teaching it onward. A missing utility class fails silently by definition: the element keeps its own type, one step off the scale, with nothing to notice it. 0.1s, measured 2026-08-29.",
  },
  {
    script: 'check:text-contrast',
    pkg: 'root',
    guards:
      "every `color:` declaration in the design system's stylesheets against the ground its own rule puts it on, compositing translucent state layers first. `--color-warning` is 3.52:1 on the page \u2014 below AA \u2014 and was the declared text colour in seven places including a `.color-warning` utility anyone could reach for, while `--color-warning-text` (8.24:1) sat in the token file unused. Nothing rendered any of the seven in a story, so `check:storybook`'s axe pass never measured one. Ratchet, because the remaining findings are open #268 token decisions and WCAG's inactive-component exemption, both recorded with a reason. 0.2s, measured 2026-08-29.",
  },
  {
    script: 'check:harness-bundle',
    pkg: 'bot',
    guards:
      'the Worker prompt bundle against the root docs it is assembled from, and the char budgets in AGENTS.md § The loading contract. This is the artifact #196 had to repair.',
  },
  {
    script: 'typecheck',
    pkg: 'bot',
    guards:
      "the Worker's TypeScript, which no pull request ran until now. `npm run deploy` chains it, so it was gated at the deploy boundary and nowhere earlier — a type error reached the one command whose failure is most expensive to discover. 1.2s, measured 2026-08-29.",
  },
  {
    script: 'test',
    pkg: 'bot',
    guards:
      "the Worker's 268 unit tests across 39 suites, which ran in NO workflow and are not in `npm run deploy` either — that chain chose `test:bundle` and stopped. So the largest test suite in this repository was gated by nothing at all, and had been since it was written. 1.2s, measured 2026-08-29. Found while verifying the TypeScript 7 bump (#298), which is exactly the change that needed them.",
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
    'one Storybook run, not a Storybook run after a harness run. Reconsidered in #282, ' +
    'which made it runnable from a worktree at last (it had aborted all 388 story files ' +
    'there). The answer did not change: measured 166s in a worktree, and being able to ' +
    'run it by hand is what that ticket was for.',
  'check:docs-chrome':
    'the same reason as check:storybook, and it runs in the same job: it needs `npm ci`, a ' +
    'Playwright chromium and a Storybook server before it can measure anything. It exists ' +
    'because `check:storybook` does NOT cover docs pages — that suite tests stories, and #263 ' +
    'found four chrome defects on docs pages that no check could ever have caught. It is a ' +
    'step in `.github/workflows/storybook-gate.yml`, which already pays for the browser.',
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
