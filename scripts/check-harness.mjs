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
    script: 'check:figma-snapshots',
    pkg: 'root',
    guards:
      "the two Figma snapshots in scripts/ still describing the library: their capture dates against a 180-day ceiling, their declared totals against their own contents, their file key, and a floor under each so a snapshot that shrank silently is loud. #339's finding was that NOTHING watched these — the variables snapshot was five weeks behind a library that had gained seven variables it had never seen, and check:token-registry was green over every one of them, because it validates the snapshot against the SCSS and nothing validated the snapshot against Figma. The age is printed on every run, green or not.",
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
    script: 'check:undefined-tokens',
    pkg: 'root',
    guards:
      "design tokens that are USED and defined nowhere. A bare `var(--x)` on a token that does not exist DROPS the whole declaration: `var(--font-weight-light)` was in six shipped components against a system that defines `--font-weight-normal: 300`, so text designed at 300 rendered at its inherited weight, and Tooltip's small variant reached for `--font-size-body4`, which does not exist, so its text had no size of its own. Nothing saw either — check:colour-fallbacks and check:size-fallbacks only read tokens written WITH a fallback and only in two namespaces, and check:doc-identifiers resolves names in docs pages, not in stylesheets. A ratchet: 145 names over 508 uses when it was written, and the count may fall and never rise, with the BARE count held down separately so converting a fallback into a bare use cannot pass by keeping the total flat.",
  },
  {
    script: 'check:font-families',
    pkg: 'root',
    guards:
      "every font stack ending in a CSS generic, and every inline fallback naming the face its token names. A fallback only paints when the token fails to load, so a wrong one is wrong everywhere at once and invisible until then — the reasoning check:colour-fallbacks applies to colour, which nothing applied to type. Seven findings when it was written and all seven fixed: --font-family-display4 named one face and no generic; three files fell back from --font-family-body to Lato, which is the HEADER face, so body text would have rendered in the heading font; two fell back to a bare `Lato`. It also keeps #267's monospace rule, where --font-family-code fell back to sans-serif and the stack measured 171.13px against monospace's 480.08px.",
  },
  {
    script: 'check:figma-scopes',
    pkg: 'root',
    guards:
      "no Figma colour variable offering itself for a role its contrast cannot carry. A variable's SCOPES are what the picker offers it FOR, and nothing recorded them — not the name snapshot, not the token registry. The sweep of 2026-08-29 found five variables outside the convention their peers follow, and every one of the five was offerable as a TEXT_FILL: `_Primary/Primary` on ALL_SCOPES, which measures 4.31:1 and 4.08:1 on the two darkest surface steps; `_Relationship/Relationship` likewise; `_Warning/Warning Container` and `_Advocacy/Advocacy Container` on ALL_FILLS, which includes text, where #ffe17a is 1.5:1 on white; and `_Warning/Warning (Text)` on ALL_SCOPES — the inverse error, the one warning value that PASSES as text also offered as a ground. That is #368's finding reached from the designer's end: picking `_Primary/Primary` for a label in Figma is what the 108 CSS declarations do, and the file was inviting it. The convention is DERIVED from the majority across the twelve accent groups rather than declared, so a finding reads 'this one disagrees with its peers' and not 'this one disagrees with me', and a new group that follows the pattern needs no edit. It also asserts that a convention was FOUND for each of the seven roles, since a naming change under classify() would otherwise let the check pass by having nothing to say. Mutation-tested by restoring each of the two worst violations and by emptying the recording.",
  },
  {
    script: 'check:intent-roles',
    pkg: 'root',
    guards:
      "the vocabulary of every intent-coloured EDGE in the design system. `_color_roles.scss` minted `--color-X-icon` and `--color-X-border` on 2026-08-29 and closed with the sentence that these tokens had no users yet \u2014 111 of the 137 border declarations now name the role, and this is the ratchet that keeps them there. The rename changes no pixel for six of the seven intents, which is the point: `border-color: var(--color-danger)` is a use of the bold FILL colour that happens to land on an edge, and `var(--color-danger-border)` is a declaration that an edge was intended and 3:1 was the bar. Only the second can move on its own, and warning must \u2014 #9f8205 is 2.87:1 on the darkest surface step, under even WCAG 1.4.11's non-text bar. It ratchets in BOTH directions: a count below its record is a finding too, because a baseline that describes code that no longer exists has stopped being readable. It also asserts the seven role tokens still EXIST, since a regeneration that removed `_color_roles.scss` would leave 111 call sites resolving to nothing while this check, which counts BASE uses, reported green. Mutation-tested four ways: a reverted call site, a deleted role, a baselined file with its reason removed, and a recorded remainder fixed without lowering the record. 0.1s, measured 2026-08-29.",
  },
  {
    script: 'check:focus-ring',
    pkg: 'root',
    guards:
      "the one thing that tells a keyboard user where they are. Of the 84 focus rules in the design system, 29 had NO affordance reaching WCAG 1.4.11's 3:1 \u2014 `.plus-input:focus` announced itself with a #84cfff border at 1.62:1, the AM/PM toggle and the file drop zone with an 8% primary tint at 1.13:1, four textarea states at 2.22:1, and six readonly fields with the same grey they wear at rest. axe cannot catch this: it has no focus-appearance rule, so `check:storybook` swept all 416 story files and reported none of it. A rule is scored on its STRONGEST affordance, which is the correction that made the check right \u2014 eleven rules pair a 1.13:1 glow with a 5.02:1 border, and there the border is the indicator. No ratchet and no exceptions: a ring nobody can see is a defect, not a vocabulary to migrate at leisure. Mutation-tested three ways: one ring reverted, the `--color-focus-ring` role deleted, and a stale exception left behind. 0.2s, measured 2026-08-29.",
  },
  {
    script: 'check:icon-button-name',
    pkg: 'root',
    guards:
      "a button that is only an icon still telling you what it does. 20 of them across the design system had no `aria-label`, no `title` and no text \u2014 a screen reader announces \"button\" and nothing else for a control that dismisses an alert, expands a lesson row or opens the session menu. axe reports 23 of these across the story suite, and the two populations overlap without either containing the other: axe counts RENDERED instances, so one component in a loop is many findings and a component nobody storied is none, where this counts SOURCE sites and sees the page nobody wrote a story for. Two of the 20 were not about names at all \u2014 `LessonsSpec` and `OnboardingSpec` call Button with `btnStyle`, `btnFill`, `label` and `icon`, none of which Button has, so those buttons were rendering EMPTY and the missing name was the symptom that surfaced it. No ratchet: the bar is zero and the exception map is empty. Mutation-tested three ways \u2014 a name removed, a stale exception, and `text=\"\"`, which an attribute-presence test reads as a name and which four real call sites are written with. 0.2s, measured 2026-08-29.",
  },
  {
    script: 'check:node-floor',
    pkg: 'root',
    guards:
      "one Node major for the whole repo, with the floor READ from wrangler rather than written down twice. The uno-bot cutover wizard died at stage 2 on \"Wrangler requires at least Node.js v22.0.0. You are using v20.19.3\", and nothing in the repo could have said so first: no .nvmrc, no `engines` in either package.json, and nine workflows pinning three different majors as literals \u2014 20 in uno-bot-evals, 22 in the harness gates, 24 in the figma and blueprint jobs. uno-bot-deploy.yml even carried the comment `# wrangler v4.97+ requires Node >= 22`, so the fact was known, written once, and enforced nowhere. The floor now comes from the installed wrangler's own engines.node, which is the only ordering that helps: bumping wrangler past a Node major fails this check instead of failing a deploy. A workflow literal is a finding even when it AGREES with .nvmrc, because the second copy is the defect and not the number it happens to hold. Mutation-tested five ways: an .nvmrc below the floor, a missing .nvmrc, a literal that disagrees, a literal that agrees, and a manifest whose engines drifted.",
  },
  {
    script: 'check:figma-colour-drift',
    pkg: 'root',
    guards:
      "the CSS still painting what Figma says, or the difference being written down and argued. `scripts/figma-variables-snapshot.json` records every variable in the library by NAME and by count, and check:figma-snapshots holds it to a date and a floor — neither records a single VALUE, so a colour could move on either side and the names would still line up perfectly. Two had, both found in one sweep of the BS4 library on 2026-08-29. `--color-success-container` is #bdf292 in the CSS and #a1eb83 in Figma, and both sides are internally consistent — the CSS state layers are built from rgba(189, 242, 146, …) and the Figma ones from #a1eb83 — so each looks correct alone and only the comparison shows the split. `--color-scrim` is 0.38 in the CSS against 0.32 in Figma: every Modal and Drawer in the product dims its page 19% harder than designed. Both are exempted rather than fixed because each is a decision and not a repair — whichever side changes, a shipping colour moves — and the exemption records what BOTH sides hold, so a change on either fails instead of sliding underneath it. 94 of the 103 non-state-layer colour variables map to a CSS token; the nine that do not are the `_Proposal/` candidates and the Figma-only `Surface roles/` set, reported and not failed. The alias chains are followed on both sides, which is why moving one base reports all three of its dependants. Mutation-tested three ways: a new divergence, a known one that stopped diverging, and a known one that changed shape.",
  },
  {
    script: 'check:token-generation',
    pkg: 'root',
    guards:
      "`npm run generate:tokens` being unable to silently delete tokens. It opened with `console.warn('WARNING: Source JSON files are incomplete. Token generation is DISABLED to protect existing tokens.')` and then wrote all four token files four lines later — the warning had no return and no exit, so the protection it announced did not exist. One run of that documented one-word command on 2026-08-29 took `_colors.scss` from 195 colour tokens to 5, keeping only the five bare intents; `_layout.scss` lost every breakpoint token, `_primitives.scss` 9 and `_spacing_semantics.scss` 3. It reported `✅ All token files generated successfully!` while doing it, and printed `✅ Validation passed` beside a validation that had been commented out. `skills/uno-maintain/references/ds-fix.md` lists the command as the way to regenerate SCSS from source, so an agent following the maintenance skill would have run it. The generator now builds every file in memory, refuses by NAME when any file would lose a token, and writes nothing on that path. This check asserts the conditional rather than the refusal — non-zero exit if and only if it says a file would shrink, and a `--dry-run` that leaves every token file byte-identical — because a gate that goes red on the day the Figma exports are fixed is a gate somebody deletes. Mutation-tested three ways: dropping the exit, letting `--dry-run` write, and reinstating the false validation claim. The first draft of the check MISSED the dropped exit, because the refusal is on stderr and `execFileSync` returns only stdout on a zero exit; it uses `spawnSync` now.",
  },
  {
    script: 'check:atlassian-benchmark',
    pkg: 'root',
    guards:
      "the comparison against Atlassian staying a MEASUREMENT rather than a memory, and the three gaps it found staying closed once they close. Their published surface was read live on 2026-08-29: 515 tokens, of which 441 are colour, split by role into `background` 208, `text` 49, `border` 39 and `icon` 23. Ours are 479 and 195. The first draft of this check recorded that we have no role split at all, which is false and the correction is the finding: `--color-surface*` (36) IS the background role and `--color-outline*` (8) IS the border role, under Material's names. What is true is sharper. Our FOREGROUND role is undivided — one `--color-on-*` family (32) where they keep text and icon apart because the bars differ, 4.5:1 against 3:1 — so no token records which bar its value was checked against. And all seven intents carry the identical 9-token shape (base, container, -text, six state overlays), naming two roles while using three: there is no `--color-warning-border` and no `--color-warning-icon`, so an intent-coloured stroke borrows the fill. That is the gap #312 lived in — `--color-warning` is 3.70:1 on white, legal as an icon and illegal as text, and its name says neither. The type row was ALSO wrong at first and is corrected here: counting `--font-size-*` gave 44 and read as bloat, but 27 of those are FontAwesome icon sizes and five are aliases, leaving TWELVE distinct text sizes against their fourteen steps, which is parity. The defect is the spacing rather than the count — the twelve run 12·14·16·20·24·28·32·40·56·64·72·80, giving seven distinct ratios across eleven steps (1.111, 1.125, 1.143, 1.167, 1.200, 1.250, 1.400), a list and not a scale (#267). Four rows are ratcheted by DIRECTION, never by distance: intent border and icon tokens may only rise from zero, the ratio count and the 46 line-heights (against their zero, since line-height travels inside each step — #346) may only fall. Nine more are recorded and not enforced, because 36 surface tokens against 208 backgrounds is a difference and not a defect. `--update` refuses to record a backwards move, and the whole thing fails when the recording goes a year unread.",
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
    script: 'test:bundle',
    pkg: 'bot',
    guards:
      "the bot's own script tests \u2014 apply-cutover, secrets, deploy, the harness bundler \u2014 which check-harness.yml has run since #266 but check:harness did not, so the local gate was a strict SUBSET of the remote one. That gap cost a red CI on #388: a message reworded in apply-cutover.mjs broke an assertion in apply-cutover.test.mjs, `npm run check:harness` went green locally on all 38 sub-checks, and the failure appeared only after the push. The completeness assertion could not have caught it either, because it scans `check:*` names and this is not one. 0.3s, measured 2026-08-30.",
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
