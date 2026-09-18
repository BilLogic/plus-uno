/**
 * The check registry — one row per check, read by everything that needs the list.
 *
 * WHY IT IS A MODULE AND NOT PART OF THE RUNNER. This list used to live inside
 * `scripts/check-harness.mjs`, where only the runner could see it. So the same
 * set was re-listed by hand in three more places — the `check:*` block of the
 * root package.json, `.github/workflows/harness-integrity-sweep.yml` and
 * `.github/workflows/storybook-gate.yml` — and nothing compared the four. A
 * check listed in one and forgotten in another is the orphan this harness
 * exists to prevent, one level up: not a check that runs nowhere, but a check
 * whose membership is stated four times and agreed nowhere.
 *
 * It stays JS rather than JSON or YAML for two reasons: the `guards` and
 * `reason` prose is the reasoning for the set and comments have to survive
 * beside it, and a row may carry a function (`module`, below, resolves to one).
 *
 * WHO READS IT.
 *   - `scripts/harness-runner.mjs`      runs CHECKS; asserts completeness.
 *   - `scripts/generate-check-scripts.mjs` writes the generated blocks of the
 *     root package.json and of the two workflows above; `--check` fails on
 *     drift (`npm run check:check-registry`).
 *   - `scripts/check-harness.test.mjs`   tests both of the above.
 *
 * ROW SHAPE.
 *   name      the npm script name, e.g. `check:glossary`. Unique across the
 *             registry, `EXCLUDED` included.
 *   script    the npm command that name is bound to, verbatim. This is what
 *             lets the package.json block be GENERATED rather than compared:
 *             the registry is the author of those lines.
 *   pkg       'root' | 'bot' — which package.json owns the name.
 *   trigger   where the check actually runs: 'pull_request' (on every pull
 *             request — composed into `check:harness`, reached through it as a
 *             step of `check:agent`, or standing as its own named job in
 *             `.github/workflows/uno-bot-checks.yml`, which is where an
 *             EXCLUDED row can still carry this trigger), 'sweep' (a step of
 *             the monthly integrity sweep), 'storybook-gate' (the browser job),
 *             'deploy' (a gate of the `deploy` chain in agents/uno-bot —
 *             `DEPLOY_CHAIN`, below). A string, or an array when a check
 *             genuinely runs in more than one place. ALL FOUR ARE ASSERTED, in
 *             both directions: a row with a trigger and no step fails, and a
 *             step with no row fails. 'sweep' and 'storybook-gate' against
 *             `WORKFLOW_STEPS`, 'pull_request' against the run lines of
 *             `PULL_REQUEST_WORKFLOWS`, 'deploy' against `DEPLOY_CHAIN`.
 *   stepOf    the composed row that runs this row as a sub-process, for a row
 *             that reaches its trigger through another. The five generators of
 *             `check:agent` are the only ones: each is uncomposed, so the
 *             `pull_request` assertion would call it unreachable, and it is in
 *             fact gated one level down. `reason` says the same thing in prose
 *             and the drift check holds the two together.
 *   guards    what goes red when it fails, written for whoever reads the CI log
 *             and did not write the check. Registered rows only.
 *   reason    why the row is NOT composed. `EXCLUDED` rows only.
 *   baseline  the ratchet file, where the check holds a recorded set rather
 *             than a threshold. Declared so a reader can find the record
 *             without opening the script; the drift check asserts the file
 *             exists and that the script names it. What SHAPE that record is,
 *             and what reading and writing it means, is `scripts/lib/ratchet.mjs`
 *             and the one-row-per-record survey beside it in
 *             `scripts/lib/ratchet-shapes.mjs` (#599) — the twelve records here
 *             are twelve shapes, and the path declared on this row is the key
 *             they are surveyed under.
 *   module    a path to an ES module exporting `run(ctx) => Finding[]` (see
 *             `scripts/lib/findings.mjs`). The runner calls it in-process and
 *             renders one banner for it. 42 of the 59 rows carry one.
 *   kind      'spawn' — and nothing else. The row cannot answer the findings
 *             interface, so the runner runs `npm run <name>` and reads its exit
 *             code. A spawn row carries `spawnReason`.
 *   spawnReason  why this row is a process rather than a function, in one
 *             sentence, on the same rule as `guards` and `reason`: written for
 *             whoever reads the registry next.
 *
 * EVERY ROW DECLARES ONE OR THE OTHER (#509). Before it, a row with no `module`
 * was "legacy" and got spawned by default — so the registry's SILENCE was a
 * decision, made 45 times and stated nowhere, and "migrate the legacy checks"
 * was a category nobody could enumerate without reading every script. The two
 * kinds are now both explicit, the spawned ones each say why, and a row
 * carrying neither is a registry bug the runner reports rather than guesses at.
 *
 * THE RUNNER IMPORTS ONLY A DECLARED `module`. It cannot discover the interface
 * by importing a script to look for `run`: a spawn-kind script does its work at
 * module scope and calls `process.exit`, so importing one to interrogate it
 * would run it, inside the runner's own process.
 */

/**
 * The composition of `check:harness`. Four rules decided the set, and they are
 * argued in the header of `scripts/check-harness.mjs`: no member another member
 * already runs, no member that cannot fail, no member that cannot run on a
 * clean checkout, no member that costs minutes.
 */
export const CHECKS = [
  {
    name: 'check:agent',
    script: 'node scripts/generate-agent.js --check',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason:
      'a composite. It runs the seven generators as sub-processes with inherited stdio so ' +
      'each names its own failing step; the findings are theirs, and each generator is its ' +
      'own row in EXCLUDED below. What this row owns is the order they run in.',
    guards:
      'seven generated artifacts against the design-system SSOT (cheat sheet, component + forms index, component docs, INDEX.md, Figma component registry, token registry, knowledge audit). Names its own failing step.',
  },
  {
    name: 'check:deps',
    script: 'node scripts/check-deps.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-deps.mjs',
    guards:
      "the two dependency questions a version bumper cannot ask. Dependabot (.github/dependabot.yml) says what is out of date; this says what is DEAD — declared, upgraded forever, imported nowhere — and what is real but UNDECLARED, because a CDN <link> is invisible to every dependency tool there is. Both were live: two packages with zero references anywhere, and FontAwesome loaded from two CDNs at two different MAJOR versions in one codebase.",
  },
  {
    name: 'check:deprecated-apis',
    script: 'node scripts/check-deprecated-apis.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-deprecated-apis.mjs',
    guards:
      'dependency ranges against the majors that remove an API this repo still uses. A deprecation is otherwise discovered twice — once when someone reads the warning, once when the upgrade breaks — and only the second one is loud.',
  },
  {
    name: 'check:docs',
    script: 'node scripts/check-doc-links.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-doc-links.mjs',
    guards:
      'every relative markdown link in skills/ agents/ docs/ design-system/guidelines/ + root, and the repo paths inside the JSON indexes.',
  },
  {
    name: 'check:doc-identifiers',
    script: 'node scripts/check-doc-identifiers.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-doc-identifiers.mjs',
    guards:
      'every prop, variant, size and design token named in a docs page resolving to something in source. This is the #78 / #79 / #98 defect class — three fabricated-name fixes by hand in one day, 2026-08-25.',
  },
  {
    name: 'check:figma-links',
    script: 'node scripts/generate-figma-links-spreadsheet.js --check',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/generate-figma-links-spreadsheet.js',
    guards: 'the generated Figma-links spreadsheet against the component MDX it is built from.',
  },
  {
    name: 'check:figma-node-types',
    script: 'node scripts/check-figma-node-types.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-figma-node-types.mjs',
    guards:
      "each registry mapping claiming what its Figma node actually IS, against a dated measurement in design-system/figma/node-types.json. The field is called componentSetNodeId and 15 of the 95 mapped nodes are not sets — 3 PAGEs and 12 plain COMPONENTs. `isComponentSet: false` is how an entry says so, and until this check nothing in the repo READ that field, so six entries carried it and seven that needed it did not. Also catches a mapping nobody has measured, a recording for a mapping that no longer exists, an id recorded against the wrong one of the two Figma files, and a link that opens on nothing.",
  },
  {
    name: 'check:figma-snapshots',
    script: 'node scripts/check-figma-snapshots.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-figma-snapshots.mjs',
    guards:
      "the two Figma snapshots in scripts/ still describing the library: their capture dates against a 180-day ceiling, their declared totals against their own contents, their file key, and a floor under each so a snapshot that shrank silently is loud. #339's finding was that NOTHING watched these — the variables snapshot was five weeks behind a library that had gained seven variables it had never seen, and check:token-registry was green over every one of them, because it validates the snapshot against the SCSS and nothing validated the snapshot against Figma. The age is printed on every run, green or not. Since the #339 refresh pass it also asserts that the REMEDY it prints exists: each snapshot names the npm script that rewrites it, and that script must be in package.json. The component half had quietly lost its writer — the poller moved into the Worker on 2026-07-16 and the legacy script that remained opens a Notion PRD and posts to Slack before writing — so a ceiling that fired would have handed the reader a command nobody would run.",
  },
  {
    name: 'check:skill-surfaces',
    script: 'node scripts/generate-uno-skill-surfaces.mjs --check',
    pkg: 'root',
    trigger: ['pull_request', 'sweep'],
    module: 'scripts/generate-uno-skill-surfaces.mjs',
    guards:
      'the generated skill surfaces — .claude/skills/ stubs, the Worker command map, the Slack app-manifest block — against each SKILL.md.',
  },
  {
    name: 'check:check-registry',
    script: 'node scripts/generate-check-scripts.mjs --check',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/generate-check-scripts.mjs',
    guards:
      'this registry against the three places that state the same set — the `check:*` block of ' +
      'the root package.json, the check steps of harness-integrity-sweep.yml and those of ' +
      'storybook-gate.yml, each written between markers from these rows. Before #508 nothing ' +
      'compared the four, so a check could be registered and missing from a manifest, or run in ' +
      'a workflow while the registry said it ran nowhere, and every file read as correct from ' +
      'the inside. It also asserts what a generated block cannot state: that each row\'s command ' +
      'is the one its package.json holds (including agents/uno-bot/, which is compared rather ' +
      'than generated), that a declared `baseline` exists and is read by the script that ' +
      'declares it, and that `trigger` and the workflow steps agree in BOTH directions.',
  },
  {
    name: 'check:skill-overlap',
    script: 'node scripts/check-skill-overlap.mjs',
    pkg: 'root',
    trigger: ['pull_request', 'sweep'],
    module: 'scripts/check-skill-overlap.mjs',
    guards:
      'one rule, one home — no substantive line living in two faces of the same skill, and none living in two bundled docs. Reads the bundled set from the bundler, so a stale bundle stops it — and since #234 a SHORT set stops it too, rather than comparing the survivors and printing the narrowed number as the corpus.',
  },
  {
    name: 'check:knowledge-disposition',
    script: 'node scripts/check-knowledge-disposition.mjs',
    pkg: 'root',
    trigger: ['pull_request', 'sweep'],
    module: 'scripts/check-knowledge-disposition.mjs',
    guards: 'every file under docs/knowledge/ declaring what it became (a `disposition:`).',
  },
  {
    name: 'check:negation',
    script: 'node scripts/check-negation-ratchet.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-negation-ratchet.mjs',
    baseline: 'docs/evals/negation-baseline.json',
    guards:
      "the negation ratchet — the density of five imperative-ban tokens (never / don't / do not / cannot / must not) not climbing, over THREE scopes ratcheted separately from one baseline file: the bundled harness docs; since #174, the hand-authored IDE-side docs (the `embodiment: ide` complement of the bundled set within the bundler's own section roots, so docs/adr/ and the generated .claude/skills/ surfaces are out by structure); and since #425 the headless GitHub Actions prompts under scripts/prompts/, the third embodiment, which declare no embodiment: and are never bundled, so they are listed by where they live rather than found through the bundler. It counts PROHIBITION TOKENS, not negation as written: the two differ by roughly 3x and #234 chose the narrow, unarguable one on the evidence. Each scope also refuses to run against fewer docs than its baseline was recorded over — a ratchet only fails on a RISE, so a corpus that vanished otherwise passes with a smaller number. The script header carries the measurement.",
  },
  {
    name: 'check:pointers',
    script: 'node scripts/check-pointers.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-pointers.mjs',
    guards:
      "the pointer sweep over the always-loaded router (AGENTS.md): every backticked repo path resolves, every `path § Heading` names a heading that exists, and every § Progressive loading trigger leads with the word that carries its branch rather than filler. A pointer that does not resolve, or buries its trigger, is a document the agent will not reach — the same rot as a stale schema name in prose (#409), one layer up. Conditional pointers (\"when `path` exists\") and bare shape names (`SKILL.md`) are skipped by rule, and the rules are mutation-tested in check-pointers.test.mjs (#420).",
  },
  {
    name: 'check:glossary',
    script: 'node scripts/check-glossary.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-glossary.mjs',
    baseline: 'docs/evals/glossary-baseline.json',
    guards:
      'CONTEXT.md staying a glossary: no fenced code, no third-level headings, every section holding term rows, and prose lines ratcheted against docs/evals/glossary-baseline.json — the count may fall, never rise. The two sibling repos grew their CONTEXT.md to 40k and 18k chars one "just one more section" at a time (#420); this is what stops it here.',
  },
  {
    name: 'check:retired-spelling',
    script: 'node scripts/check-retired-spelling.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-retired-spelling.mjs',
    guards:
      'the contract of the maintenance-severity rename (#429): "Tier 1 / Tier 2" for a FIX stays retired across every hand-authored doc an agent reads — the constitution, glossary, agents/, skills/, docs/, the DS guidelines, the headless prompts and the workflows — because *Tier* now means the loading tiers and a maintenance "Tier 1" reads as always-loaded. Each shape is anchored on a severity noun (fix, digest, whitelist, pipeline, "suggested tier", the old file names), so the loading uses match nothing. History (docs/plans/, todos/), ADRs, the archive and generated artifacts are left as written by rule; the glossary row that names the old spelling in its Do NOT use cell is the one exemption.',
  },
  {
    name: 'check:cross-repo',
    script: 'node scripts/check-cross-repo-duplication.mjs',
    pkg: 'root',
    trigger: ['pull_request', 'sweep'],
    module: 'scripts/check-cross-repo-duplication.mjs',
    guards:
      "one meaning stated in TWO REPOSITORIES. The same rename map, in the same shape, sat in plus-uno-blueprint's glossary and in agentic-service-blueprinting's; nothing compared them and they drifted until each was deleted by its own ticket. This sweep compares the three repos' harness documents by SHINGLE — 12 consecutive normalised words, findings merged into runs of 30+ — because paragraph equality is defeated by one edited table cell and would have found ONE shared block across both of those glossaries, which shared 771 words. It reaches the blueprint the way sync-blueprint-contract.mjs does ($BLUEPRINT_REPO or a sibling checkout) and sb through the pinned development dependency this repo now holds the way the blueprint holds it. A vendored document is exempt by the marker its sync writes; three docs/agents/ files a shared plugin installs are exempt by name; two document pairs already duplicated are RECORDED with a ceiling their shared words may fall below and never rise above, and every exemption fails when it goes stale. WITH A SIBLING MISSING IT SKIPS LOUDLY rather than silently — it names the pairings it did not compare, on stdout and, on CI, as a ::warning:: and a job-summary line, because check:contract spent months exiting 0 on a missing checkout while a header called it a gate (#258).",
  },
  {
    name: 'check:button-contrast',
    script: 'node scripts/check-button-contrast.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-button-contrast.mjs',
    baseline: 'docs/evals/button-contrast-baseline.json',
    guards:
      "every combination Button's `$btn-themes` map GENERATES — 8 styles x 5 fills — rather than the ones a story happens to render. `check:storybook`'s a11y ratchet measures the DOM, and nothing renders a filled `warning` button, so a 3.70:1 label sat in the map unseen for the life of it (#312). It also asserts no two styles resolve to the same filled ground: `--color-info` is `var(--color-tertiary)`, so two names render one appearance, and no accessibility tool compares token values for equality because none knows they were meant to differ. Both current findings are colour-token decisions (#268) rather than Button's, so they are ratcheted in `docs/evals/button-contrast-baseline.json` — which may shrink and never grow, and reports an entry that has stopped failing.",
  },
  {
    name: 'check:token-collision',
    script: 'node scripts/check-token-collision.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-token-collision.mjs',
    guards:
      'no component stylesheet colouring text in the same token as the surface under it. `Navbar` shipped one for the life of the component at 1.00:1 (#219); axe cannot see this class, because the text sits in a transparent box over a painted ancestor.',
  },
  {
    name: 'check:colour-fallbacks',
    script: 'node scripts/check-colour-fallbacks.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-colour-fallbacks.mjs',
    baseline: 'docs/evals/colour-fallback-baseline.json',
    guards:
      'the literal beside a colour token agreeing with that token (#268). `var(--color-on-surface-variant, #5c5c5c)` reads as one decision and is two — that token is `#3f484a`, and it carries TEN different fallbacks across its uses, none of them the token. 191 of 473 comparable fallbacks disagree, so the recorded set is ratcheted and only a NEW one fails. It also holds 27 `--color-*` names that are referenced and defined nowhere, where the fallback IS the colour. Static and sub-second, which is why it composes here while the browser checks do not.',
  },
  {
    name: 'check:size-fallbacks',
    script: 'node scripts/check-size-fallbacks.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-size-fallbacks.mjs',
    baseline: 'docs/evals/size-fallback-baseline.json',
    guards:
      "the same rule as check:colour-fallbacks, over the tokens that decide layout rather than colour — and it is the bigger half. 454 of 1075 comparable fallbacks disagree with their token: `var(--size-section-gap-sm, 16px)` is written 61 times for a token that is `8px`, and `var(--size-element-pad-y-lg, 12px)` 52 times for one that is `8px`. Colour's version of this defect paints a wrong shade when the token sheet is late; this one lays out a different page. Ratcheted at 68 distinct pairs. One implementation (`scripts/lib/fallback-check.mjs`) and two entry points, because the families genuinely differ: dimensions have no shared name prefix and are selected by value, and an undefined dimension name is usually a component-local custom property rather than a defect.",
  },
  {
    name: 'check:undefined-tokens',
    script: 'node scripts/check-undefined-tokens.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-undefined-tokens.mjs',
    baseline: 'docs/evals/undefined-token-baseline.json',
    guards:
      "design tokens that are USED and defined nowhere. A bare `var(--x)` on a token that does not exist DROPS the whole declaration: `var(--font-weight-light)` was in six shipped components against a system that defines `--font-weight-normal: 300`, so text designed at 300 rendered at its inherited weight, and Tooltip's small variant reached for `--font-size-body4`, which does not exist, so its text had no size of its own. Nothing saw either — check:colour-fallbacks and check:size-fallbacks only read tokens written WITH a fallback and only in two namespaces, and check:doc-identifiers resolves names in docs pages, not in stylesheets. A ratchet: 145 names over 508 uses when it was written, and the count may fall and never rise, with the BARE count held down separately so converting a fallback into a bare use cannot pass by keeping the total flat.",
  },
  {
    name: 'check:font-families',
    script: 'node scripts/check-font-families.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-font-families.mjs',
    guards:
      "every font stack ending in a CSS generic, and every inline fallback naming the face its token names. A fallback only paints when the token fails to load, so a wrong one is wrong everywhere at once and invisible until then — the reasoning check:colour-fallbacks applies to colour, which nothing applied to type. Seven findings when it was written and all seven fixed: --font-family-display4 named one face and no generic; three files fell back from --font-family-body to Lato, which is the HEADER face, so body text would have rendered in the heading font; two fell back to a bare `Lato`. It also keeps #267's monospace rule, where --font-family-code fell back to sans-serif and the stack measured 171.13px against monospace's 480.08px.",
  },
  {
    name: 'check:figma-scopes',
    script: 'node scripts/check-figma-scopes.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-figma-scopes.mjs',
    guards:
      "no Figma colour variable offering itself for a role its contrast cannot carry. A variable's SCOPES are what the picker offers it FOR, and nothing recorded them — not the name snapshot, not the token registry. The sweep of 2026-08-29 found five variables outside the convention their peers follow, and every one of the five was offerable as a TEXT_FILL: `Primary/Primary` on ALL_SCOPES, which measures 4.31:1 and 4.08:1 on the two darkest surface steps; `Relationship/Relationship` likewise; `Warning/Warning Container` and `Advocacy/Advocacy Container` on ALL_FILLS, which includes text, where #ffe17a is 1.5:1 on white; and `Warning/Warning (Text)` on ALL_SCOPES — the inverse error, the one warning value that PASSES as text also offered as a ground. That is #368's finding reached from the designer's end: picking `Primary/Primary` for a label in Figma is what the 108 CSS declarations do, and the file was inviting it. The convention is DERIVED from the majority across the twelve accent groups rather than declared, so a finding reads 'this one disagrees with its peers' and not 'this one disagrees with me', and a new group that follows the pattern needs no edit. It also asserts that a convention was FOUND for each of the seven roles, since a naming change under classify() would otherwise let the check pass by having nothing to say. Mutation-tested by restoring each of the two worst violations and by emptying the recording.",
  },
  {
    name: 'check:intent-roles',
    script: 'node scripts/check-intent-roles.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-intent-roles.mjs',
    baseline: 'docs/evals/intent-role-adoption.json',
    guards:
      "the vocabulary of every intent-coloured EDGE in the design system. `_color_roles.scss` minted `--color-X-icon` and `--color-X-border` on 2026-08-29 and closed with the sentence that these tokens had no users yet \u2014 111 of the 137 border declarations now name the role, and this is the ratchet that keeps them there. The rename changes no pixel for six of the seven intents, which is the point: `border-color: var(--color-danger)` is a use of the bold FILL colour that happens to land on an edge, and `var(--color-danger-border)` is a declaration that an edge was intended and 3:1 was the bar. Only the second can move on its own, and warning must \u2014 #9f8205 is 2.87:1 on the darkest surface step, under even WCAG 1.4.11's non-text bar. It ratchets in BOTH directions: a count below its record is a finding too, because a baseline that describes code that no longer exists has stopped being readable. It also asserts the seven role tokens still EXIST, since a regeneration that removed `_color_roles.scss` would leave 111 call sites resolving to nothing while this check, which counts BASE uses, reported green. Mutation-tested four ways: a reverted call site, a deleted role, a baselined file with its reason removed, and a recorded remainder fixed without lowering the record. 0.1s, measured 2026-08-29.",
  },
  {
    name: 'check:focus-ring',
    script: 'node scripts/check-focus-ring.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-focus-ring.mjs',
    baseline: 'docs/evals/focus-ring.json',
    guards:
      "the one thing that tells a keyboard user where they are. Of the 84 focus rules in the design system, 29 had NO affordance reaching WCAG 1.4.11's 3:1 \u2014 `.plus-input:focus` announced itself with a #84cfff border at 1.62:1, the AM/PM toggle and the file drop zone with an 8% primary tint at 1.13:1, four textarea states at 2.22:1, and six readonly fields with the same grey they wear at rest. axe cannot catch this: it has no focus-appearance rule, so `check:storybook` swept all 416 story files and reported none of it. A rule is scored on its STRONGEST affordance, which is the correction that made the check right \u2014 eleven rules pair a 1.13:1 glow with a 5.02:1 border, and there the border is the indicator. No ratchet and no exceptions: a ring nobody can see is a defect, not a vocabulary to migrate at leisure. Mutation-tested three ways: one ring reverted, the `--color-focus-ring` role deleted, and a stale exception left behind. 0.2s, measured 2026-08-29.",
  },
  {
    name: 'check:icon-button-name',
    script: 'node scripts/check-icon-button-name.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-icon-button-name.mjs',
    baseline: 'docs/evals/icon-button-name.json',
    guards:
      "a button that is only an icon still telling you what it does. 20 of them across the design system had no `aria-label`, no `title` and no text \u2014 a screen reader announces \"button\" and nothing else for a control that dismisses an alert, expands a lesson row or opens the session menu. axe reports 23 of these across the story suite, and the two populations overlap without either containing the other: axe counts RENDERED instances, so one component in a loop is many findings and a component nobody storied is none, where this counts SOURCE sites and sees the page nobody wrote a story for. Two of the 20 were not about names at all \u2014 `LessonsSpec` and `OnboardingSpec` call Button with `btnStyle`, `btnFill`, `label` and `icon`, none of which Button has, so those buttons were rendering EMPTY and the missing name was the symptom that surfaced it. No ratchet: the bar is zero and the exception map is empty. Mutation-tested three ways \u2014 a name removed, a stale exception, and `text=\"\"`, which an attribute-presence test reads as a name and which four real call sites are written with. 0.2s, measured 2026-08-29.",
  },
  {
    name: 'check:node-floor',
    script: 'node scripts/check-node-floor.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-node-floor.mjs',
    guards:
      "one Node major for the whole repo, with the floor READ from wrangler rather than written down twice. The uno-bot cutover wizard died at stage 2 on \"Wrangler requires at least Node.js v22.0.0. You are using v20.19.3\", and nothing in the repo could have said so first: no .nvmrc, no `engines` in either package.json, and nine workflows pinning three different majors as literals \u2014 20 in uno-bot-evals, 22 in the harness gates, 24 in the figma and blueprint jobs. uno-bot-deploy.yml even carried the comment `# wrangler v4.97+ requires Node >= 22`, so the fact was known, written once, and enforced nowhere. The floor now comes from the installed wrangler's own engines.node, which is the only ordering that helps: bumping wrangler past a Node major fails this check instead of failing a deploy. A workflow literal is a finding even when it AGREES with .nvmrc, because the second copy is the defect and not the number it happens to hold. Mutation-tested five ways: an .nvmrc below the floor, a missing .nvmrc, a literal that disagrees, a literal that agrees, and a manifest whose engines drifted.",
  },
  {
    name: 'check:harness-budgets',
    script: 'node scripts/check-harness-budgets.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-harness-budgets.mjs',
    guards:
      "the char budgets WRITTEN DOWN in prose still being the ones the bundler asserts. The budgets are decided once, in `BUDGETS` in agents/uno-bot/scripts/bundle-harness.mjs, and a doc that blows one fails the build — but two harness documents also state a budget as a number a reader will act on: AGENTS.md § The loading contract (\"Budget ≤20k chars: a tier that bloats defeats the tier\") and skills/README.md (\"`bot.md` is on a 7,000-char budget the bundler asserts\"). Both are copies, and until #510 nothing compared them: raise `botFace` to 8,000 and the README goes on saying 7,000 with the build green, so the sentence a skill author reads before cutting a face is simply wrong. Prose is what an agent obeys, which makes this the direction the silence costs most. The bundler now writes a JSON manifest of what it computed — members, per-section totals, the census, `BUDGETS` verbatim — and this check reads the number out of each sentence and compares it to the constant it copies, naming the file, the line, the prose value and the constant. A sentence reworded past the pattern is a finding too, rather than a check that quietly matches nothing and passes (#234). On the findings interface (#508), so the runner calls it in-process. Mutation-tested three ways over a fixture root: a prose number raised, a prose number lowered, and a sentence rewritten out of reach.",
  },
  {
    name: 'check:figma-colour-drift',
    script: 'node scripts/check-figma-colour-drift.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-figma-colour-drift.mjs',
    guards:
      "the CSS still painting what Figma says, or the difference being written down and argued. `scripts/figma-variables-snapshot.json` records every variable in the library by NAME and by count, and check:figma-snapshots holds it to a date and a floor — neither records a single VALUE, so a colour could move on either side and the names would still line up perfectly. Two had, both found in one sweep of the BS4 library on 2026-08-29. `--color-success-container` is #bdf292 in the CSS and #a1eb83 in Figma, and both sides are internally consistent — the CSS state layers are built from rgba(189, 242, 146, …) and the Figma ones from #a1eb83 — so each looks correct alone and only the comparison shows the split. `--color-scrim` is 0.38 in the CSS against 0.32 in Figma: every Modal and Drawer in the product dims its page 19% harder than designed. Both are exempted rather than fixed because each is a decision and not a repair — whichever side changes, a shipping colour moves — and the exemption records what BOTH sides hold, so a change on either fails instead of sliding underneath it. 94 of the 103 non-state-layer colour variables map to a CSS token; the nine that do not are the `_Proposal/` candidates and the Figma-only `Surface roles/` set, reported and not failed. The alias chains are followed on both sides, which is why moving one base reports all three of its dependants. Mutation-tested three ways: a new divergence, a known one that stopped diverging, and a known one that changed shape.",
  },
  {
    name: 'check:token-generation',
    script: 'node scripts/check-token-generation.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-token-generation.mjs',
    guards:
      "`npm run generate:tokens` being unable to silently delete tokens. It opened with `console.warn('WARNING: Source JSON files are incomplete. Token generation is DISABLED to protect existing tokens.')` and then wrote all four token files four lines later — the warning had no return and no exit, so the protection it announced did not exist. One run of that documented one-word command on 2026-08-29 took `_colors.scss` from 195 colour tokens to 5, keeping only the five bare intents; `_layout.scss` lost every breakpoint token, `_primitives.scss` 9 and `_spacing_semantics.scss` 3. It reported `✅ All token files generated successfully!` while doing it, and printed `✅ Validation passed` beside a validation that had been commented out. `skills/uno-maintain/references/ds-fix.md` lists the command as the way to regenerate SCSS from source, so an agent following the maintenance skill would have run it. The generator now builds every file in memory, refuses by NAME when any file would lose a token, and writes nothing on that path. This check asserts the conditional rather than the refusal — non-zero exit if and only if it says a file would shrink, and a `--dry-run` that leaves every token file byte-identical — because a gate that goes red on the day the Figma exports are fixed is a gate somebody deletes. Mutation-tested three ways: dropping the exit, letting `--dry-run` write, and reinstating the false validation claim. The first draft of the check MISSED the dropped exit, because the refusal is on stderr and `execFileSync` returns only stdout on a zero exit; it uses `spawnSync` now.",
  },
  {
    name: 'check:atlassian-benchmark',
    script: 'node scripts/check-atlassian-benchmark.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-atlassian-benchmark.mjs',
    baseline: 'docs/evals/atlassian-benchmark.json',
    guards:
      "the comparison against Atlassian staying a MEASUREMENT rather than a memory, and the three gaps it found staying closed once they close. Their published surface was read live on 2026-08-29: 515 tokens, of which 441 are colour, split by role into `background` 208, `text` 49, `border` 39 and `icon` 23. Ours are 479 and 195. The first draft of this check recorded that we have no role split at all, which is false and the correction is the finding: `--color-surface*` (36) IS the background role and `--color-outline*` (8) IS the border role, under Material's names. What is true is sharper. Our FOREGROUND role is undivided — one `--color-on-*` family (32) where they keep text and icon apart because the bars differ, 4.5:1 against 3:1 — so no token records which bar its value was checked against. And all seven intents carry the identical 9-token shape (base, container, -text, six state overlays), naming two roles while using three: there is no `--color-warning-border` and no `--color-warning-icon`, so an intent-coloured stroke borrows the fill. That is the gap #312 lived in — `--color-warning` is 3.70:1 on white, legal as an icon and illegal as text, and its name says neither. The type row was ALSO wrong at first and is corrected here: counting `--font-size-*` gave 44 and read as bloat, but 27 of those are FontAwesome icon sizes and five are aliases, leaving TWELVE distinct text sizes against their fourteen steps, which is parity. The defect is the spacing rather than the count — the twelve run 12·14·16·20·24·28·32·40·56·64·72·80, giving seven distinct ratios across eleven steps (1.111, 1.125, 1.143, 1.167, 1.200, 1.250, 1.400), a list and not a scale (#267). Four rows are ratcheted by DIRECTION, never by distance: intent border and icon tokens may only rise from zero, the ratio count and the 46 line-heights (against their zero, since line-height travels inside each step — #346) may only fall. Nine more are recorded and not enforced, because 36 surface tokens against 208 backgrounds is a difference and not a defect. `--update` refuses to record a backwards move, and the whole thing fails when the recording goes a year unread.",
  },
  {
    name: 'check:unspread-rest',
    script: 'node scripts/check-unspread-rest.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-unspread-rest.mjs',
    guards:
      'no component in the published library collecting a `...rest` and never using it. ' +
      '`DateAndTimePicker` dropped every prop beyond its signature for the life of the ' +
      'component (#230) — React allows an unused rest element and propTypes never sees ' +
      'unknown props, so the props lost are the unwatched ones: aria-describedby, ' +
      'data-testid. Same shape as check:token-collision — a silent defect no browser run ' +
      'can observe, decidable from the file.',
  },
  {
    name: 'check:docs-tabs',
    script: 'node scripts/check-docs-tabs.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-docs-tabs.mjs',
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
    name: 'check:docs-token-literals',
    script: 'node scripts/check-docs-token-literals.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-docs-token-literals.mjs',
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
    name: 'check:docs-dead-selectors',
    script: 'node scripts/check-docs-dead-selectors.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-docs-dead-selectors.mjs',
    guards:
      "that no rule in the docs stylesheet aims at a class nothing puts in the DOM. #250's "
      + 'R1 asked for exactly this and was satisfied by a hand sweep, which leaked five: '
      + '`.sb-plus-intro-mini-grid` (named IN the ticket as 0 uses, and still there after '
      + 'the sweep that named it), `.responsive-frame-toolbar` and '
      + '`.responsive-frame-root--browser-fullscreen` (ResponsiveFrame emits neither — its '
      + 'only modifiers are `--native` and `--standalone`), and `.toc-container` / '
      + '`.toc-title`, written against a guess about "Storybook 8" and absent from both this '
      + 'repo and the installed packages. Every class in selector position is matched against '
      + "the repo's own sources; the classes Storybook and its addons emit are listed in "
      + 'VENDOR with the package file each was verified in. It cannot see a class assembled '
      + 'from fragments in a template literal, and it reads selectors rather than the cascade '
      + '— a live class whose declaration is out-`!important`-ed is the other half of R1, and '
      + 'that half is `check:docs-chrome`, in a browser.',
  },
  {
    name: 'check:page-outline',
    script: 'node scripts/check-page-outline.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-page-outline.mjs',
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
    name: 'check:intake-fsm',
    script: 'node .cursor/hooks/uno-prototype/test-fsm.mjs',
    pkg: 'root',
    trigger: ['pull_request', 'sweep'],
    kind: 'spawn',
    spawnReason:
      'an assert-based smoke suite over the intake FSM. It throws on the first broken ' +
      'invariant rather than collecting them, which is what a test suite is for and what a ' +
      'findings set is not.',
    guards: 'the intake FSM that gates every uno-prototype run.',
  },
  {
    name: 'test:scripts',
    script: 'node --test scripts/*.test.mjs scripts/lib/*.test.mjs',
    pkg: 'root',
    trigger: ['pull_request', 'sweep'],
    kind: 'spawn',
    spawnReason:
      '`node --test`. The runner\'s report IS the findings set, in TAP, and re-rendering it ' +
      'as Finding[] would be a second opinion about a format that already has one.',
    guards:
      'the unit tests of the guards themselves. A guard nobody has watched fail is a guard nobody knows works (#191).',
  },
  {
    name: 'check:secrets',
    script: 'node scripts/check-secrets.mjs',
    pkg: 'bot',
    trigger: ['pull_request', 'deploy'],
    module: 'agents/uno-bot/scripts/check-secrets.mjs',
    guards:
      "the secret declaration against `interface Env` and against [vars]. The [vars] half is the one with teeth: that table is COMMITTED, so a secret assigned there is a secret published to GitHub. The rest keeps wrangler.toml's expected-names list honest — hand-maintained, it drifted in both directions at once (four names not set, two set names missing) and #288's account move works from exactly that list.",
  },
  {
    name: 'check:worker-host',
    script: 'node scripts/check-worker-host.mjs',
    pkg: 'bot',
    trigger: 'pull_request',
    module: 'agents/uno-bot/scripts/check-worker-host.mjs',
    guards:
      'the single definition of the Worker\'s hostname. Its inputs are repo-root files — the eval workflows and docs/ — so a PR that never touches agents/uno-bot/ can still break it. A second hardcoded host is silent until a cutover (#288) misses one, and an eval pointed at the OLD deployment reports a clean pass, which is the shape of failure #249 already cost this repo.',
  },
  {
    name: 'check:typography-classes',
    script: 'node scripts/check-typography-classes.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-typography-classes.mjs',
    guards:
      "every `*-txt` class a page asks for against a rule that actually sets type. `.h1-txt`\u2013`.h6-txt` have never existed \u2014 headings are `.h1`\u2013`.h6` \u2014 and eleven places asked for them anyway, including two prototype pages and a guidelines example teaching it onward. A missing utility class fails silently by definition: the element keeps its own type, one step off the scale, with nothing to notice it. 0.1s, measured 2026-08-29.",
  },
  {
    name: 'check:text-contrast',
    script: 'node scripts/check-text-contrast.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-text-contrast.mjs',
    baseline: 'docs/evals/text-contrast-baseline.json',
    guards:
      "every `color:` declaration in the design system's stylesheets against the ground its own rule puts it on, compositing translucent state layers first. `--color-warning` is 3.52:1 on the page \u2014 below AA \u2014 and was the declared text colour in seven places including a `.color-warning` utility anyone could reach for, while `--color-warning-text` (8.24:1) sat in the token file unused. Nothing rendered any of the seven in a story, so `check:storybook`'s axe pass never measured one. Ratchet, because the remaining findings are open #268 token decisions and WCAG's inactive-component exemption, both recorded with a reason \u2014 and since #599 the ratchet itself is `scripts/lib/ratchet.mjs` rather than this check's own read and write, so an absent record now fails loudly instead of throwing ENOENT. 0.2s, measured 2026-08-29.",
  },
  {
    name: 'check:harness-bundle',
    script: 'node scripts/check-harness-bundle.mjs',
    pkg: 'bot',
    trigger: 'pull_request',
    module: 'agents/uno-bot/scripts/check-harness-bundle.mjs',
    guards:
      'the Worker prompt bundle against the root docs it is assembled from, and the char budgets in AGENTS.md § The loading contract. This is the artifact #196 had to repair.',
  },
  {
    name: 'typecheck',
    script: 'tsc --noEmit',
    pkg: 'bot',
    trigger: ['pull_request', 'deploy'],
    kind: 'spawn',
    spawnReason:
      '`tsc --noEmit`. The type errors are the compiler\'s, in the compiler\'s format, and ' +
      'nothing in this repo should paraphrase them.',
    guards:
      "the Worker's TypeScript — every file under agents/uno-bot/src/ (tsconfig.json § include). Before it was composed here it ran only inside `npm run deploy`, so a type error reached the one command whose failure is most expensive to discover. It ALSO has its own named pull-request job (.github/workflows/uno-bot-checks.yml § typecheck), because the whole composite shares one GitHub check, so a reviewer reading a red `check:harness` learns a type failure and a test failure as the same line and has to open the log to tell which (#580). 1.2s, measured 2026-09-17.",
  },
  {
    name: 'test:bundle',
    script: 'node --test scripts/*.test.mjs',
    pkg: 'bot',
    trigger: ['pull_request', 'deploy'],
    kind: 'spawn',
    spawnReason: '`node --test`, for the same reason as test:scripts.',
    guards:
      "the bot's own script tests \u2014 apply-cutover, secrets, deploy, the harness bundler \u2014 which check-harness.yml has run since #266 but check:harness did not, so the local gate was a strict SUBSET of the remote one. That gap cost a red CI on #388: a message reworded in apply-cutover.mjs broke an assertion in apply-cutover.test.mjs, `npm run check:harness` went green locally on all 38 sub-checks, and the failure appeared only after the push. The completeness assertion could not have caught it either, because it scans `check:*` names and this is not one. 0.3s, measured 2026-08-30.",
  },
  {
    name: 'test',
    script: 'tsc -p tsconfig.test.json && node --test .test-build/tests/*.test.js',
    pkg: 'bot',
    trigger: ['pull_request', 'deploy'],
    kind: 'spawn',
    spawnReason:
      '`tsc -p tsconfig.test.json && node --test`. A build step and a test runner; neither ' +
      'half is a comparison this process could make.',
    guards:
      "the Worker's unit suite — 723 tests across 65 suites at 2026-09-17, the largest in this repository, and gated by nothing at all until it was composed here: it ran in no workflow, and `npm run deploy` chose `test:bundle` and stopped. 2.2s, measured 2026-09-17. Found while verifying the TypeScript 7 bump (#298), which is exactly the change that needed them. #580 finished the job in both directions: `npm test` is in the deploy chain now, so a direct push to unprotected `main` meets it too, and the suite has its own named pull-request job (.github/workflows/uno-bot-checks.yml § tests) so its red is legible from the check list rather than only from a 40-second log. Among them is the harness name sweep (tests/harness-blueprint-names.test.ts), which reads the assembled prompt, the tool schemas and — since #425 — the Actions prompts under scripts/prompts/ for blueprint identifiers and conventions the schema no longer has; its inputs are repo-root files, which is the rule that composes a sub-package check here.",
  },
  {
    name: 'evals:local',
    script: 'cd ../.. && node agents/uno-bot/scripts/run-evals.mjs --transport=local',
    pkg: 'bot',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason:
      'the eval runner. A walk of the committed recordings that reports its census and then ' +
      'a LINE PER CASE — the shape this interface would flatten into one, which is the half ' +
      'that cannot move. The other half did (#617): the runner renders its findings and takes ' +
      'its exit code from `scripts/lib/findings.mjs` like every composed check, so a failing ' +
      'blocker is an error and a failing non-blocker a warning. ' +
      "The `cd ../..` is the runner's own contract: its " +
      'fixture and recording paths are repo-relative, as every documented invocation of it ' +
      'is, and the alternative is a second copy of those paths in a manifest.',
    guards:
      "the eval suite through the LOCAL transport: the Worker's Turn module in-process, on the recorded model replies in docs/evals/fixtures/recordings/. No WORKER_URL, no DEBUG_TOKEN, no judge credential and no model spend, which is what lets it run on a pull request at all — before the local transport (#512) the suite ran for the FIRST time on the Monday cron, against whatever was already deployed, so a turn-level regression reached main and sat there for up to a week. WHAT A RED MEANS: a Turn, routing or pointer regression on a FIXED DRAW — the dispositions, the gate's idempotency, the cancel bounce, the history write, the proposal routing the loop performs on a side-effect call, the reference a `read_reference` was asked for. Never a model that answered differently: nothing in-process measures the model, that stays with `uno-bot-evals.yml`'s Monday `--transport=worker` cron, and the summary's `transport` field is what keeps the two from being read as one number. The judge is absent by construction, so only the deterministic checks decide. A case with no recording is reported UNGATED — named in the run's opening census, named again where it is reached, counted apart and never failed. Failing those would turn a cheap gate into a wall of reds that all mean \"no recording\", which is the fastest way to have a gate switched off; but a skip nobody counts is a blocker that gates nothing while reading as though it did, so the word and the count are the compromise. A blocker that genuinely fails still exits 1. check-harness.yml has run this as a hand-written step since #512 while `npm run check:harness` did not, which is exactly the local-gate-is-a-subset-of-the-remote-one gap `test:bundle` above records paying for; that step is now this row. 0.3s on a warm .test-build, measured 2026-09-14.",
  },
];

/**
 * Every `check:*` script NOT composed needs a reason here. The completeness
 * assertion in `scripts/harness-runner.mjs` reads this; an unlisted,
 * uncomposed check fails the gate.
 *
 * A guard whose name lacks the `check:` prefix is invisible to that assertion,
 * so it is listed here BY NAME or nowhere — which is how `test:workerd` came to
 * be a row (#587). It was gated, as a hand-written step of a workflow, and the
 * registry said it ran nowhere at all: the shape of orphan this file exists to
 * prevent one level up.
 *
 * These rows carry `script`, `pkg` and `trigger` like any other, because the
 * package.json block is generated from the whole registry: a check excluded
 * from the composite is still a line in a manifest, and `check:storybook`,
 * `check:docs-chrome` and `test:workerd` are still jobs or steps of a workflow.
 */
export const EXCLUDED = [
  {
    name: 'check:harness',
    script: 'node scripts/check-harness.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason:
      'this script — the composite itself. It is the process every other row reports into, ' +
      'so it has no findings of its own to return.',
    reason:
      'this script.',
  },
  {
    name: 'check:component-docs',
    script: 'node scripts/generate-component-docs.mjs --check',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason:
      'a generator. `--check` is its own assembly pass with the writes withheld, and ' +
      'check:agent spawns it so the step names itself.',
    stepOf: 'check:agent',
    reason:
      'step 3 of check:agent.',
  },
  {
    name: 'check:index',
    script: 'node scripts/generate-index.mjs --check',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason: 'a generator, spawned as a step of check:agent — see check:component-docs.',
    stepOf: 'check:agent',
    reason:
      'step 4 of check:agent.',
  },
  {
    name: 'check:component-registry',
    script: 'node scripts/generate-component-registry-from-storybook.js --check',
    pkg: 'root',
    trigger: ['pull_request', 'sweep'],
    kind: 'spawn',
    spawnReason: 'a generator, spawned as a step of check:agent — see check:component-docs.',
    stepOf: 'check:agent',
    reason:
      'step 5 of check:agent.',
  },
  {
    name: 'check:token-registry',
    script: 'node scripts/generate-token-registry.mjs --check',
    pkg: 'root',
    trigger: ['pull_request', 'sweep'],
    kind: 'spawn',
    spawnReason: 'a generator, spawned as a step of check:agent — see check:component-docs.',
    stepOf: 'check:agent',
    reason:
      'step 6 of check:agent.',
  },
  {
    name: 'check:knowledge-audit',
    script: 'node scripts/generate-knowledge-audit.js --check',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason: 'a generator, spawned as a step of check:agent — see check:component-docs.',
    stepOf: 'check:agent',
    reason:
      'step 7 of check:agent.',
  },
  {
    name: 'check:storybook',
    script: 'node scripts/check-storybook.mjs',
    pkg: 'root',
    trigger: 'storybook-gate',
    kind: 'spawn',
    spawnReason:
      'it drives a real Chromium over the story suite. The result is a browser run\'s exit ' +
      'code and a Playwright report, not a set of findings this process could compute.',
    baseline: 'docs/evals/a11y-baseline.json',
    reason:
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
  },
  {
    name: 'check:docs-chrome',
    script: 'node scripts/check-docs-chrome.mjs',
    pkg: 'root',
    trigger: 'storybook-gate',
    kind: 'spawn',
    spawnReason: 'it starts a Storybook and drives a real Chromium — see check:storybook.',
    reason:
'the same reason as check:storybook, and it runs in the same job: it needs `npm ci`, a ' +
    'Playwright chromium and a Storybook server before it can measure anything. It exists ' +
    'because `check:storybook` does NOT cover docs pages — that suite tests stories, and #263 ' +
    'found four chrome defects on docs pages that no check could ever have caught. It is a ' +
    'step in `.github/workflows/storybook-gate.yml`, which already pays for the browser.',
  },
  {
    name: 'check:fetch',
    script: 'node scripts/check-fetch.mjs',
    pkg: 'bot',
    trigger: 'deploy',
    module: 'agents/uno-bot/scripts/check-fetch.mjs',
    reason:
      'reads only agents/uno-bot/src/. A root-only PR cannot break it, and `npm run deploy` gates it at its own boundary.',
  },
  {
    name: 'check:contract',
    script: 'node scripts/sync-blueprint-contract.mjs --check',
    pkg: 'bot',
    trigger: 'deploy',
    kind: 'spawn',
    spawnReason:
      'a sync. `--check` is that sync with the write withheld, and a missing sibling ' +
      'checkout is an exit code by design (see the reason above).',
    reason:
      'compares against a sibling checkout of BilLogic/plus-uno-blueprint that no runner has. It exits 1 on a missing source by design, so composing it would make this gate permanently red.',
  },
  {
    name: 'test:workerd',
    script: 'vitest run --config vitest.workerd.config.mts',
    pkg: 'bot',
    trigger: ['pull_request', 'deploy'],
    kind: 'spawn',
    spawnReason:
      'vitest, in a pool that boots workerd. The result is a runtime run\'s exit code, and the ' +
      'interesting failures are a Durable Object\'s — an RPC that threw, storage that read back ' +
      'wrong — in vitest\'s own format.',
    reason:
      "it boots a RUNTIME, and this gate's whole argument is that it stays seconds long: " +
      '3.1s warm and 4.5s cold locally, 4s as a step of the harness job and 5s as the ' +
      'job of its own it became (measured 2026-09-17), against a ~14s composite. The cost is the startup rather than the assertions — vitest ' +
      "reports 1.7s for the run, of which 1.05s is the import. So it sits beside the composite " +
      'rather than inside it, on the same `pull_request` trigger, as its OWN NAMED JOB — ' +
      '`.github/workflows/uno-bot-checks.yml` § conformance — which is also what makes its red ' +
      'legible: a step of `check-harness.yml` (where it lived from #493 until #587) landed on ' +
      "the same single `check:harness / harness` check as 48 other sub-checks, so \"the Durable " +
      'Object broke" and "a doc link broke" arrived as one line. It is in the `npm run deploy` ' +
      'chain too (#587), because `main` is unprotected and a PR-only gate is a gate a direct ' +
      'push walks past. WHAT A RED MEANS: the two ThreadState adapters have stopped agreeing. ' +
      'The suite is the contract between the in-memory store and the Durable Object — 49 cases ' +
      'over one shared conformance body (tests/helpers/thread-state-conformance.ts), run twice: ' +
      'here against real DO SQLite through RPC, and inside `npm test` against the in-memory ' +
      'adapter. Durable Object storage, the input gate that makes "the delete is the claim" ' +
      'true, and the retirement semantics that keep a replaced proposal card from executing are ' +
      'all only observable in the runtime, which is why exactly one file pays for workerd and ' +
      'it is the file whose subject IS the runtime.',
  },
];

/**
 * The workflow steps that run checks, as data.
 *
 * `scripts/generate-check-scripts.mjs` renders these into the marked regions of
 * the two workflows that used to re-list checks by hand. A step is a step
 * rather than one row per check because the workflows genuinely group them —
 * two registry generators share one step, and so do the skill-overlap check and
 * the script tests.
 *
 *   workflow  the file the region lives in.
 *   region    the marker pair it is rendered between. A workflow has more than
 *             one where hand-written YAML sits in the middle: the cross-repo
 *             step has to follow the sibling checkouts that give it something
 *             to compare.
 *   name      the step's `name:`.
 *   note      the comment lines above the step, verbatim, each without its `#`.
 *             This prose is the reason the sweep keeps its steps spelled out
 *             instead of calling the composite, so it moved here with the list
 *             rather than being dropped.
 *   runs      the npm script names the step runs, in order.
 *   env       environment the step needs, if any.
 */
export const WORKFLOW_STEPS = [
  {
    workflow: ".github/workflows/harness-integrity-sweep.yml",
    region: "sweep-checks",
    name: "Run registry checks",
    runs: ["check:component-registry", "check:token-registry"],
  },
  {
    workflow: ".github/workflows/harness-integrity-sweep.yml",
    region: "sweep-checks",
    name: "Intake FSM smoke tests",
    note: [
      "The intake FSM (.cursor/hooks/uno-prototype/) gates every prototype run,",
      "but its suite had no runner — it passed only when someone invoked node by",
      "hand. A test nobody runs protects nothing, so it rides the same monthly",
      "deterministic pass as the registries. Dependency-free; no npm install.",
    ],
    runs: ["check:intake-fsm"],
  },
  {
    workflow: ".github/workflows/harness-integrity-sweep.yml",
    region: "sweep-checks",
    name: "Skill-surface drift check",
    note: [
      "The six skills reach the IDEs and Slack only through generated surfaces",
      "(.claude/skills/ stubs, the Worker's command map, the app-manifest",
      "block). Edit a SKILL.md description without regenerating and the slash",
      "menu quietly describes the old skill — invisible until someone reads it.",
      "Dependency-free; no npm install.",
    ],
    runs: ["check:skill-surfaces"],
  },
  {
    workflow: ".github/workflows/harness-integrity-sweep.yml",
    region: "sweep-checks",
    name: "Knowledge disposition check",
    note: [
      "docs/knowledge/ became sediment because nothing forced a note to say",
      "what it became (#172). This is the forcing function: a file there",
      "without a `disposition:` fails the sweep. Dependency-free; no npm install.",
    ],
    runs: ["check:knowledge-disposition"],
  },
  {
    workflow: ".github/workflows/harness-integrity-sweep.yml",
    region: "sweep-checks",
    name: "Skill overlap check",
    note: [
      "A skill states each rule once — in references/method.md — and each face",
      "carries only its delta (skills/README.md § Where content goes). Two",
      "copies of a rule is two rules the moment one is edited, and each file",
      "still reads correctly alone, so nothing surfaces the drift. The tests",
      "ride along because a guard nobody has watched fail is a guard nobody",
      "knows works (#191). Dependency-free; no npm install.",
    ],
    runs: ["check:skill-overlap", "test:scripts"],
  },
  {
    workflow: ".github/workflows/harness-integrity-sweep.yml",
    region: "sweep-cross-repo",
    name: "Cross-repo duplicate sweep (the comparison, for real)",
    runs: ["check:cross-repo"],
    env: {
      BLUEPRINT_REPO: ".sibling-repos/plus-uno-blueprint",
      SB_REPO: ".sibling-repos/agentic-service-blueprinting",
    },
  },
  {
    workflow: ".github/workflows/storybook-gate.yml",
    region: "storybook-checks",
    name: "npm run check:storybook",
    note: [
      "One command, one exit code. A `play` failure or a render error fails the",
      "job outright; an accessibility violation fails it only if the story did",
      "not already carry that rule in `docs/evals/a11y-baseline.json`.",
    ],
    runs: ["check:storybook"],
  },
  {
    workflow: ".github/workflows/storybook-gate.yml",
    region: "storybook-checks",
    name: "npm run check:docs-chrome",
    note: [
      "Docs pages, which the suite above does not reach: it tests stories, and a",
      "docs page is not one. #263 found four chrome defects there by eye because",
      "nothing else could. This starts its own Storybook, so it goes after the",
      "suite rather than beside it — the browser and the install are already paid",
      "for by this point, and a failure here should not hide a story failure.",
    ],
    runs: ["check:docs-chrome"],
  },
];

/**
 * The name of the composite. Every `CHECKS` row reaches `pull_request` through
 * it, so the assertion below needs it as a datum rather than as prose.
 */
export const COMPOSITE = 'check:harness';

/**
 * The workflows that honour the `pull_request` trigger.
 *
 * These two are NOT generated, and the reason is in their own headers: their
 * steps are jobs with installs, working directories and forty lines of
 * measured argument around each `run:`, and a generator that owned them would
 * eat that reasoning — the same rule the marked regions of the other two
 * workflows are narrow for. What they get instead is an assertion in both
 * directions (`scripts/generate-check-scripts.mjs § pullRequestFindings`): a
 * run line naming something this registry does not hold fails, and a row
 * declaring `pull_request` that neither of them reaches — directly, through
 * `COMPOSITE`, or through `stepOf` — fails too. Before that, the trigger was
 * honoured by hand: `test:workerd` had been a gated step for three months
 * while the registry said it ran nowhere at all (#587).
 */
export const PULL_REQUEST_WORKFLOWS = [
  '.github/workflows/check-harness.yml',
  '.github/workflows/uno-bot-checks.yml',
];

/**
 * The `deploy` script of agents/uno-bot, in order, as data — the seven `deploy`
 * rows plus the two steps that are not checks.
 *
 * WHY ASSERTED AND NOT GENERATED. The rows alone cannot write this chain: they
 * are a set and the chain is a sequence, and its last two segments are not
 * checks at all. Writing it would also mean this generator authoring the line
 * that INVOKES the deployment — `node scripts/deploy.mjs`, the command that
 * reaches a real Cloudflare account — and how the deployment is authorised is
 * not a thing a drift check should hold the pen on. So the order and the tail
 * are stated here, once, and everything else is derived: every `runs` entry
 * must be a row carrying trigger 'deploy', every row carrying trigger 'deploy'
 * must be a `runs` entry, and the rendered chain must equal the one the
 * manifest holds, verbatim.
 *
 *   step      the segment of the `&&` chain, exactly as the manifest spells it.
 *   runs      the registry row that segment runs. A gate.
 *   notAGate  why this segment is in the chain without being a check. The
 *             chain's non-gates, said once, so a new segment appearing here
 *             is a decision rather than a silence.
 */
export const DEPLOY_CHAIN = [
  { step: 'npm run typecheck', runs: 'typecheck' },
  { step: 'npm run check:fetch', runs: 'check:fetch' },
  { step: 'npm run check:contract', runs: 'check:contract' },
  { step: 'npm run check:secrets', runs: 'check:secrets' },
  { step: 'npm run test:bundle', runs: 'test:bundle' },
  { step: 'npm test', runs: 'test' },
  { step: 'npm run test:workerd', runs: 'test:workerd' },
  {
    step: 'npm run bundle:harness',
    notAGate:
      'it WRITES. The harness bundle the Worker serves is assembled here so the deployed ' +
      'artifact carries the tree that just passed the seven gates above; `check:harness-bundle` ' +
      'is the check that the committed bundle matches, and that one is a pull-request row.',
  },
  {
    step: 'node scripts/deploy.mjs',
    notAGate:
      'it is the deployment. Everything before it is what earns the right to run it, and its ' +
      'own configuration — the deployment name, the account, the secrets — is the Worker\'s, ' +
      'not this registry\'s.',
  },
];

/** Every row, composed or not. */
export const ALL = [...CHECKS, ...EXCLUDED];

// A name stated twice is two rows that will disagree. Fail at import rather
// than let the last one win somewhere downstream.
{
  const seen = new Set();
  for (const row of ALL) {
    if (seen.has(row.name)) throw new Error(`checks.registry: '${row.name}' is registered twice`);
    seen.add(row.name);
  }
}

/** A row's triggers, always as an array. */
export const triggersOf = (row) => (Array.isArray(row.trigger) ? row.trigger : [row.trigger]);

/** @returns {object | undefined} */
export const byName = (name) => ALL.find((row) => row.name === name);

/** Every name the registry has an opinion about — what completeness is measured against. */
export const declaredNames = () => new Set(ALL.map((row) => row.name));

/**
 * The rows the generated `check:*` block of the root package.json is written
 * from: root-owned and `check:`-prefixed, composed rows first. `test:scripts`,
 * `typecheck`, `test` and `test:bundle` are registered checks but not `check:*`
 * names, so they stay hand-written where they are — the generated block owns
 * exactly the prefix the completeness assertion scans for.
 */
export const rootCheckRows = () =>
  ALL.filter((row) => row.pkg === 'root' && row.name.startsWith('check:'));

/** The steps of one marked region, in order. */
export const stepsIn = (workflow, region) =>
  WORKFLOW_STEPS.filter((step) => step.workflow === workflow && step.region === region);

/** Each workflow file the registry renders into, with its regions in file order. */
export const workflowRegions = () => {
  const out = new Map();
  for (const step of WORKFLOW_STEPS) {
    if (!out.has(step.workflow)) out.set(step.workflow, []);
    const regions = out.get(step.workflow);
    if (!regions.includes(step.region)) regions.push(step.region);
  }
  return out;
};

/** Every npm script name the workflow steps run. */
export const namesInWorkflows = () => new Set(WORKFLOW_STEPS.flatMap((step) => step.runs));
