/**
 * The check registry — one row per check, read by everything that needs the list.
 *
 * WHY IT IS A MODULE AND NOT PART OF THE RUNNER. This list used to live inside
 * `scripts/check-harness.mjs`, where only the runner could see it. So the same
 * set was re-listed by hand in three more places — the `check:*` block of the
 * root package.json, a monthly sweep workflow (since retired) and
 * `.github/workflows/storybook-gate.yml` — and nothing compared the four. A
 * check listed in one and forgotten in another is the orphan this harness
 * exists to prevent, one level up: not a check that runs nowhere, but a check
 * whose membership is stated four times and agreed nowhere.
 *
 * It stays JS rather than JSON or YAML so comments survive beside the rows and
 * a row may carry a function (`module`, below, resolves to one).
 *
 * WHO READS IT.
 *   - `scripts/harness-runner.mjs`      runs CHECKS; asserts completeness.
 *   - `scripts/generate-check-scripts.mjs` writes the generated blocks of the
 *     root package.json and of storybook-gate.yml; `--check` fails on
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
 *             EXCLUDED row can still carry this trigger), 'storybook-gate' (a
 *             job of storybook-gate.yml),
 *             'deploy' (a gate of the `deploy` chain in agents/uno-bot —
 *             `DEPLOY_CHAIN`, below). A string, or an array when a check
 *             genuinely runs in more than one place. ALL THREE ARE ASSERTED, in
 *             both directions: a row with a trigger and no step fails, and a
 *             step with no row fails. 'storybook-gate' against
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
 *             `guards`, `reason` and `spawnReason` are each one line of at most
 *             `PROSE_CAP` characters; the check's own header carries the rest.
 *   baseline  the ratchet file, where the check holds a recorded set rather
 *             than a threshold. The drift check asserts the record opens
 *             through `scripts/lib/ratchet.mjs` and that the check reaches it
 *             through its imports. Every record shares one envelope, described
 *             in that module's header.
 *   update    the line that re-records the baseline, ending in the flag the
 *             check offers. Absent where the record is kept by hand, and then
 *             the check offers no `--update` at all. `npm run regenerate` runs
 *             every one.
 *   floors    the sentinel thresholds the check enforces — minimum file / rule /
 *             component / variable counts, and maximum ages. Same class of
 *             datum as a `baseline`, and asserted the same way (#613): the
 *             drift check reads the number the check compares and refuses a
 *             row whose declared floor is not that number, and a check that
 *             still holds the number as a private constant.
 *   module    a path to an ES module exporting `run(ctx) => Finding[]` (see
 *             `scripts/lib/findings.mjs`). The runner calls it in-process and
 *             renders one banner for it. 43 of the 60 rows carry one.
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

import { TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';

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
    spawnReason: 'a composite: it runs the seven generators as sub-processes, in order, so each names its own failing step.',
    guards: 'the seven generated artifacts (cheat sheet, indexes, component docs, Figma and token registries, knowledge audit) against the design-system source.',
  },
  {
    name: 'check:deps',
    script: 'node scripts/check-deps.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-deps.mjs',
    guards: 'dependencies that are declared but imported nowhere, and ones used (a CDN <link> included) but never declared.',
  },
  {
    name: 'check:deprecated-apis',
    script: 'node scripts/check-deprecated-apis.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-deprecated-apis.mjs',
    guards: 'dependency ranges against the majors that remove an API this repo still uses.',
  },
  {
    name: 'check:docs',
    script: 'node scripts/check-doc-links.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-doc-links.mjs',
    guards: 'every relative markdown link in skills/, agents/, docs/, design-system/guidelines/ and the root, and the repo paths inside the JSON indexes.',
  },
  {
    name: 'check:doc-identifiers',
    script: 'node scripts/check-doc-identifiers.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-doc-identifiers.mjs',
    guards: 'every prop, variant, size and design token a docs page names resolving to something in source.',
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
    name: 'check:component-barrel',
    script: 'node scripts/generate-component-barrel.mjs --check',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/generate-component-barrel.mjs',
    guards: 'design-system/src/components/index.js against the folder shape it is generated from; a hand edit or an unregenerated move shows as drift.',
  },
  {
    name: 'check:icon-lists',
    script: 'node scripts/generate-icon-lists.mjs --check',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/generate-icon-lists.mjs',
    guards: 'the committed Free icon lists in design-system/src/lib/ against the generator that writes them; a hand edit shows as drift.',
  },
  {
    name: 'check:figma-node-types',
    script: 'node scripts/check-figma-node-types.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-figma-node-types.mjs',
    baseline: 'scripts/baselines/figma-node-types.json',
    update: 'node scripts/check-figma-node-types.mjs --update',
    guards: "each registry mapping's claim about what its Figma node is (set, component or page) against the dated measurement in design-system/figma/node-types.json.",
  },
  {
    name: 'check:figma-snapshots',
    script: 'node scripts/check-figma-snapshots.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-figma-snapshots.mjs',
    floors: { MAX_AGE_DAYS: 180, MIN_VARIABLES: 361, MIN_COMPONENTS: 1347 },
    guards: 'the two Figma snapshots in scripts/: capture date under a 180-day ceiling, declared totals against contents, file key, and a floor under each.',
  },
  {
    name: 'check:skill-surfaces',
    script: 'node scripts/generate-uno-skill-surfaces.mjs --check',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/generate-uno-skill-surfaces.mjs',
    guards: 'the generated .claude/skills/ stubs against each SKILL.md.',
  },
  {
    name: 'check:check-registry',
    script: 'node scripts/generate-check-scripts.mjs --check',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/generate-check-scripts.mjs',
    guards: 'this registry against the generated check:* block of the root package.json and the check steps of storybook-gate.yml.',
  },
  {
    name: 'check:skill-overlap',
    script: 'node scripts/check-skill-overlap.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-skill-overlap.mjs',
    guards: "one rule, one home: no line in both an uno skill's method and its SKILL.md, nor in two docs the Worker reads.",
  },
  {
    name: 'check:knowledge-disposition',
    script: 'node scripts/check-knowledge-disposition.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-knowledge-disposition.mjs',
    guards: 'every file under docs/knowledge/ declaring what it became (a `disposition:`).',
  },
  {
    name: 'check:negation',
    script: 'node scripts/check-negation-ratchet.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-negation-ratchet.mjs',
    baseline: 'scripts/baselines/negation-baseline.json',
    update: 'node scripts/check-negation-ratchet.mjs --update',
    guards: "the density of imperative-ban words (never, don't, do not, cannot, must not) not climbing in the bundled, IDE-side and workflow docs.",
  },
  {
    name: 'check:pointers',
    script: 'node scripts/check-pointers.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-pointers.mjs',
    guards: 'every backticked path and `path § Heading` in AGENTS.md and agents/**/*.md resolving, and each § Progressive loading trigger leading with its trigger.',
  },
  {
    name: 'check:glossary',
    script: 'node scripts/check-glossary.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-glossary.mjs',
    baseline: 'scripts/baselines/glossary-baseline.json',
    update: 'node scripts/check-glossary.mjs --update',
    guards: 'GLOSSARY.md staying a glossary in the plugin format, with its prose lines ratcheted against scripts/baselines/glossary-baseline.json.',
  },
  {
    name: 'check:ads-language',
    script: 'node scripts/check-ads-language.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-ads-language.mjs',
    guards: 'the old component language (state steps, legacy tags, style x fill and small/medium/large props, retired words) staying out of the tree.',
  },
  {
    name: 'check:slot-names',
    script: 'node scripts/check-slot-names.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-slot-names.mjs',
    guards: 'one naming rule for slots: iconBefore / elemBefore by what the slot accepts, with leadingVisual, trailingVisual and a bare leading slot staying out of the tree.',
  },
  {
    name: 'check:old-system',
    script: 'node scripts/check-old-system.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-old-system.mjs',
    guards: 'the code holding only the current design system: a hard ban, no baseline, on any name from a retired token family.',
  },
  {
    name: 'check:state-mixin',
    script: 'node scripts/check-state-mixin.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-state-mixin.mjs',
    baseline: 'scripts/baselines/state-mixin.json',
    update: 'node scripts/check-state-mixin.mjs --update',
    guards: 'the state mixin staying the one place hover, press, selection, disabled and the focus ring are drawn; hand-rolled states may fall, never rise.',
  },
  {
    name: 'check:inline-jsx-tokens',
    script: 'node scripts/check-inline-jsx-tokens.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-inline-jsx-tokens.mjs',
    baseline: 'scripts/baselines/inline-jsx-tokens.json',
    update: 'node scripts/check-inline-jsx-tokens.mjs --update',
    guards: 'literal values inside `style={{...}}` in components, counted per file; a count may fall and never rise, and a new file starts at zero.',
  },
  {
    name: 'check:motion-literals',
    script: 'node scripts/check-motion-literals.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-motion-literals.mjs',
    baseline: 'scripts/baselines/motion-literals.json',
    update: 'node scripts/check-motion-literals.mjs --update',
    guards: 'raw ms/s durations and cubic-bezier() in component and docs source, counted per file; a count may fall and never rise, and a new file starts at zero.',
  },
  {
    name: 'check:motion-registry',
    script: 'node scripts/check-motion-registry.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-motion-registry.mjs',
    baseline: 'scripts/baselines/motion-registry.json',
    update: 'node scripts/check-motion-registry.mjs --update',
    guards: 'every interactive component having a motion row naming real tokens; the allow-list of components without one may only shrink.',
  },
  {
    name: 'check:raw-buttons',
    script: 'node scripts/check-raw-buttons.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-raw-buttons.mjs',
    floors: { MIN_FILES: 300 },
    guards: 'raw `<button>` tags and Bootstrap `btn` classes in stories and MDX docs, which render unstyled; use the PLUS Button, IconButton or CloseButton.',
  },
  {
    name: 'check:retired-spelling',
    script: 'node scripts/check-retired-spelling.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-retired-spelling.mjs',
    guards: '"Tier 1 / Tier 2" for a maintenance fix staying retired across every hand-authored doc an agent reads; Tier now means the loading tiers.',
  },
  {
    name: 'check:cross-repo',
    script: 'node scripts/check-cross-repo-duplication.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-cross-repo-duplication.mjs',
    guards: "one meaning stated in two repositories: a shingle sweep over the three repos' harness documents, held to the recorded pairs.",
  },
  {
    name: 'check:button-contrast',
    script: 'node scripts/check-button-contrast.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-button-contrast.mjs',
    baseline: 'scripts/baselines/button-contrast-baseline.json',
    guards: "contrast of every combination Button's `$btn-themes` map generates, not only the rendered ones, and no two styles generating the same button.",
  },
  {
    name: 'check:token-collision',
    script: 'node scripts/check-token-collision.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-token-collision.mjs',
    floors: { MIN_FILES: 100 },
    guards: 'no component stylesheet coloring text in the same token as the surface under it, a clash axe cannot see.',
  },
  {
    name: 'check:color-fallbacks',
    script: 'node scripts/check-color-fallbacks.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-color-fallbacks.mjs',
    baseline: 'scripts/baselines/color-fallback-baseline.json',
    update: 'npm run check:color-fallbacks -- --update',
    guards: 'the literal fallback beside a color token agreeing with that token; recorded disagreements may fall and never rise.',
  },
  {
    name: 'check:ds-fallbacks',
    script: 'node scripts/check-ds-fallbacks.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-ds-fallbacks.mjs',
    floors: { MIN_FILES: 700 },
    guards: 'no `--ds-*` color token written with a fallback.',
  },
  {
    name: 'check:size-fallbacks',
    script: 'node scripts/check-size-fallbacks.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-size-fallbacks.mjs',
    baseline: 'scripts/baselines/size-fallback-baseline.json',
    update: 'npm run check:size-fallbacks -- --update',
    guards: 'the literal fallback beside a size, spacing or padding token agreeing with that token; recorded disagreements may fall and never rise.',
  },
  {
    name: 'check:undefined-tokens',
    script: 'node scripts/check-undefined-tokens.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-undefined-tokens.mjs',
    floors: { MIN_FILES: 700 },
    baseline: 'scripts/baselines/undefined-token-baseline.json',
    update: 'npm run check:undefined-tokens -- --update',
    guards: 'design tokens used and defined nowhere, which silently drop the whole declaration; the recorded set may fall and never rise.',
  },
  {
    name: 'check:font-families',
    script: 'node scripts/check-font-families.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-font-families.mjs',
    floors: { MIN_FILES: 700 },
    guards: 'every font stack ending in a CSS generic, and every inline fallback naming the face its token names.',
  },
  {
    name: 'check:font-size-literals',
    script: 'node scripts/check-font-size-literals.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-font-size-literals.mjs',
    floors: { MIN_FILES: 200 },
    guards: 'no component, pattern or shared style setting a raw font size; text takes a text style and an icon glyph an icon size.',
  },
  {
    name: 'check:figma-scopes',
    script: 'node scripts/check-figma-scopes.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-figma-scopes.mjs',
    floors: { MIN_SCOPED: 75 },
    guards: 'no Figma color variable offering itself, through its scopes, for a role its contrast cannot carry.',
  },
  {
    name: 'check:intent-roles',
    script: 'node scripts/check-intent-roles.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-intent-roles.mjs',
    floors: { MIN_FILES: 100 },
    baseline: 'scripts/baselines/intent-role-adoption.json',
    guards: 'intent-colored edges naming their role token (`--color-X-icon`, `--color-X-border`), ratcheted per file in both directions, and the role tokens existing.',
  },
  {
    name: 'check:focus-ring',
    script: 'node scripts/check-focus-ring.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-focus-ring.mjs',
    floors: { MIN_FILES: 100, MIN_RULES: 33 },
    baseline: 'scripts/baselines/focus-ring.json',
    guards: "every focus rule in the design system drawing an affordance that reaches WCAG 1.4.11's 3:1; recorded exceptions carry a reason.",
  },
  {
    name: 'check:icon-button-name',
    script: 'node scripts/check-icon-button-name.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-icon-button-name.mjs',
    floors: { MIN_FILES: 400 },
    baseline: 'scripts/baselines/icon-button-name.json',
    guards: 'every icon-only button carrying an accessible name (aria-label, title or text); recorded exceptions carry a reason.',
  },
  {
    name: 'check:node-floor',
    script: 'node scripts/check-node-floor.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-node-floor.mjs',
    guards: "one Node major for the whole repo: .nvmrc at the floor read from wrangler's engines, and no workflow pinning its own Node literal.",
  },
  {
    name: 'check:harness-budgets',
    script: 'node scripts/check-harness-budgets.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-harness-budgets.mjs',
    guards: 'budget numbers having one home, `BUDGETS` in bundle-harness.mjs: a doc cites a budget by its key, never by its number.',
  },
  {
    name: 'check:bot-skills',
    script: 'node scripts/check-bot-skills.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-bot-skills.mjs',
    guards: 'every bot skill naming only tools that exist, ending in a `## Exit` of answer, file or hand off, with a description within its budget.',
  },
  {
    name: 'check:token-generation',
    script: 'node scripts/check-token-generation.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-token-generation.mjs',
    guards: '`npm run generate:tokens` refusing to write when its source JSON is incomplete, so it cannot silently delete tokens.',
  },
  {
    name: 'check:token-intent',
    script: 'node scripts/check-token-intent.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-token-intent.mjs',
    guards: 'every token a plan defines carrying its intent in `tokens.json`, and no primitive carrying the field; unplanned groups are counted.',
  },
  {
    name: 'check:color-system',
    script: 'node scripts/check-color-system.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-color-system.mjs',
    guards: "the generated color system's contrast promises in both plans and all four modes, for text, icons, edges, accents, links and focus.",
  },
  {
    name: 'check:color-tokens',
    script: 'node scripts/generate-color-tokens.mjs --check',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/generate-color-tokens.mjs',
    guards: 'the generated color token files in design-system/src/tokens/color/ against the active plan; drift is a hand edit or an unregenerated plan change.',
  },
  {
    name: 'check:design-tokens',
    script: 'node scripts/generate-design-tokens.mjs --check',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/generate-design-tokens.mjs',
    guards: 'the generated token ladder files in design-system/src/tokens/ladder/ against scripts/lib/tokens/plan.mjs; drift means a hand edit or an unregenerated plan.',
  },
  {
    name: 'check:ds-usage',
    script: 'node scripts/check-ds-usage.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-ds-usage.mjs',
    baseline: 'scripts/baselines/ds-usage.json',
    update: 'node scripts/check-ds-usage.mjs --update',
    guards: 'escapes from the design system in prototypes/ and src/: unknown components, props or tokens, deep imports, raw literals, Pro icons.',
  },
  {
    name: 'check:no-primitive-reads',
    script: 'node scripts/check-no-primitive-reads.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-no-primitive-reads.mjs',
    baseline: 'scripts/baselines/no-primitive-reads.json',
    update: 'node scripts/check-no-primitive-reads.mjs --update',
    guards: 'components and patterns reading a numbered primitive instead of a tier token, counted per file; the residue may fall and never rise.',
  },
  {
    name: 'check:unspread-rest',
    script: 'node scripts/check-unspread-rest.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-unspread-rest.mjs',
    floors: { MIN_FILES: 100 },
    guards: 'no component in the published library collecting a `...rest` prop and never spreading it.',
  },
  {
    name: 'check:docs-tabs',
    script: 'node scripts/check-docs-tabs.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-docs-tabs.mjs',
    baseline: 'scripts/baselines/docs-tabs.json',
    update: 'node scripts/check-docs-tabs.mjs --update',
    guards: 'component docs pages keeping their Examples, Code, Usage and Changelog tab split, with tabbed pages held to a floor.',
  },
  {
    name: 'check:ds-writing',
    script: 'node scripts/check-ds-writing.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-ds-writing.mjs',
    guards: 'component docs pages holding the Usage spine and its writing rules; warns on every page, fails on a stale marker.',
  },
  {
    name: 'check:ds-vocabulary',
    script: 'node scripts/check-ds-vocabulary.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-ds-vocabulary.mjs',
    guards: 'DS docs pages using glossary terms over avoid-words (warns; strict pages fail), and no avoid-word colliding with a DS name.',
  },
  {
    name: 'check:docs-token-literals',
    script: 'node scripts/check-docs-token-literals.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-docs-token-literals.mjs',
    floors: { MIN_TOKENS: 200 },
    guards: 'the docs stylesheet `.storybook/storybook-overrides.css` using tokens for values the design system already tokenizes.',
  },
  {
    name: 'check:docs-dead-selectors',
    script: 'node scripts/check-docs-dead-selectors.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-docs-dead-selectors.mjs',
    floors: { MIN_SOURCES: 500 },
    guards: 'no rule in the docs stylesheet aiming at a class nothing puts in the DOM.',
  },
  {
    name: 'check:storybook-categories',
    script: 'node scripts/check-storybook-categories.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-storybook-categories.mjs',
    floors: { MIN_FILES: 90 },
    guards: 'component folders and Storybook titles keeping one category taxonomy, with sentence-case title segments.',
  },
  {
    name: 'check:intake-fsm',
    script: 'node .cursor/hooks/uno-prototype/test-fsm.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason: 'an assert-based smoke suite that throws on the first broken invariant rather than collecting findings.',
    guards: 'the intake FSM that gates every uno-prototype run.',
  },
  {
    name: 'test:scripts',
    script: 'node --test .cursor/hooks/ds-usage/*.test.mjs scripts/*.test.mjs scripts/lib/*.test.mjs scripts/lib/color/*.test.mjs netlify/functions/docs-agent/*.test.mjs netlify/functions/ds-mcp/*.test.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason: "`node --test`: the runner's TAP report is already the findings set.",
    guards: 'the unit tests of the guards themselves.',
  },
  {
    name: 'check:secrets',
    script: 'node scripts/check-secrets.mjs',
    pkg: 'bot',
    trigger: ['pull_request', 'deploy'],
    module: 'agents/uno-bot/scripts/check-secrets.mjs',
    guards: "the Worker's secret declarations against `interface Env`, and no secret assigned in the committed [vars] of wrangler.toml.",
  },
  {
    name: 'check:worker-host',
    script: 'node scripts/check-worker-host.mjs',
    pkg: 'bot',
    trigger: 'pull_request',
    module: 'agents/uno-bot/scripts/check-worker-host.mjs',
    guards: "the single definition of the Worker's hostname across workflows and docs/.",
  },
  {
    name: 'check:text-contrast',
    script: 'node scripts/check-text-contrast.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    module: 'scripts/check-text-contrast.mjs',
    baseline: 'scripts/baselines/text-contrast-baseline.json',
    update: 'npm run check:text-contrast -- --update',
    guards: "every `color:` declaration in the design system's stylesheets against the ground its rule puts it on, state layers composited first.",
  },
  {
    name: 'check:harness-bundle',
    script: 'node scripts/check-harness-bundle.mjs',
    pkg: 'bot',
    trigger: 'pull_request',
    module: 'agents/uno-bot/scripts/check-harness-bundle.mjs',
    guards: 'the Worker prompt bundle against the root docs it is assembled from, and its char budgets.',
  },
  {
    name: 'typecheck',
    script: 'tsc --noEmit',
    pkg: 'bot',
    trigger: ['pull_request', 'deploy'],
    kind: 'spawn',
    spawnReason: "`tsc --noEmit`: the type errors are the compiler's, in the compiler's format.",
    guards: "the Worker's TypeScript, every file under agents/uno-bot/src/.",
  },
  {
    name: 'test:bundle',
    script: 'node --test scripts/*.test.mjs measurement/*/*.test.mjs',
    pkg: 'bot',
    trigger: ['pull_request', 'deploy'],
    kind: 'spawn',
    spawnReason: '`node --test`, for the same reason as test:scripts.',
    guards: "the bot's own script tests: cutover, secrets, deploy, the harness bundler and the measurement tools.",
  },
  {
    name: 'test',
    script: `node -e "require('fs').rmSync('.test-build',{recursive:true,force:true})" && tsc -p tsconfig.test.json && node --test .test-build/tests/*.test.js`,
    pkg: 'bot',
    trigger: ['pull_request', 'deploy'],
    kind: 'spawn',
    spawnReason: '`tsc -p tsconfig.test.json && node --test` after clearing `.test-build`: a build and a test runner, neither a comparison this process makes.',
    guards: "the Worker's unit suite, the largest in this repository.",
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
    name: 'bench:ds-find:timing',
    script: 'DS_BENCH_TIMING=1 node --test --test-concurrency=1 --test-name-pattern="first find on a fresh lookup" scripts/bench-ds-find.test.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason: '`node --test`, for the same reason as test:scripts.',
    reason: 'a wall-clock budget measures the machine inside the parallel harness, so CI runs it alone, as its own step.',
  },
  {
    name: 'check:harness',
    script: 'node scripts/check-harness.mjs',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason: 'the composite itself: every other row reports into it, so it has no findings of its own.',
    reason: 'this script.',
  },
  {
    name: 'check:component-docs',
    script: 'node scripts/generate-component-docs.mjs --check',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    baseline: 'scripts/baselines/component-docs.json',
    update: 'npm run generate:component-docs -- --update',
    spawnReason: 'a generator: `--check` is its assembly pass with the writes withheld, spawned by check:agent so the step names itself.',
    stepOf: 'check:agent',
    reason: 'step 3 of check:agent.',
  },
  {
    name: 'check:index',
    script: 'node scripts/generate-index.mjs --check',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason: 'a generator, spawned as a step of check:agent; see check:component-docs.',
    stepOf: 'check:agent',
    reason: 'step 4 of check:agent.',
  },
  {
    name: 'check:component-registry',
    script: 'node scripts/generate-component-registry-from-storybook.js --check',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason: 'a generator, spawned as a step of check:agent; see check:component-docs.',
    stepOf: 'check:agent',
    reason: 'step 5 of check:agent.',
  },
  {
    name: 'check:token-registry',
    script: 'node scripts/generate-token-registry.mjs --check',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason: 'a generator, spawned as a step of check:agent; see check:component-docs.',
    stepOf: 'check:agent',
    reason: 'step 6 of check:agent.',
  },
  {
    name: 'check:knowledge-audit',
    script: 'node scripts/generate-knowledge-audit.js --check',
    pkg: 'root',
    trigger: 'pull_request',
    kind: 'spawn',
    spawnReason: 'a generator, spawned as a step of check:agent; see check:component-docs.',
    stepOf: 'check:agent',
    reason: 'step 7 of check:agent.',
  },
  {
    name: 'check:storybook',
    script: 'node scripts/check-storybook.mjs',
    pkg: 'root',
    trigger: 'storybook-gate',
    kind: 'spawn',
    spawnReason: "it drives a real Chromium over the story suite; the result is a browser run's exit code and a Playwright report.",
    baseline: 'scripts/baselines/a11y-baseline.json',
    update: 'npm run check:storybook -- --update',
    reason: 'it needs `npm ci`, Playwright Chromium and about 130s, so it runs beside this gate as its own storybook-gate job.',
  },
  {
    name: 'check:storybook-links',
    script: 'node scripts/check-storybook-links.mjs',
    pkg: 'root',
    trigger: 'storybook-gate',
    kind: 'spawn',
    spawnReason: 'it builds Storybook to read the index of ids that exist; see check:storybook.',
    reason: 'it needs a Storybook build for the ids in `index.json`, so it is a step of storybook-gate, which already installs.',
  },
  {
    name: 'check:docs-chrome',
    script: 'node scripts/check-docs-chrome.mjs',
    pkg: 'root',
    trigger: 'storybook-gate',
    kind: 'spawn',
    spawnReason: 'it starts a Storybook and drives a real Chromium; see check:storybook.',
    reason: 'it needs `npm ci`, Playwright Chromium and a Storybook server, so it runs in the storybook-gate job beside check:storybook.',
  },
  {
    name: 'test:design-system',
    script: 'npm --prefix design-system test',
    pkg: 'root',
    trigger: 'storybook-gate',
    kind: 'spawn',
    spawnReason: '`vitest run` in design-system/, for the same reason as test:scripts.',
    reason: 'it needs the root `npm ci`, which this gate skips, so it is the `design-system` job of storybook-gate.',
  },
  {
    name: 'check:fetch',
    script: 'node scripts/check-fetch.mjs',
    pkg: 'bot',
    trigger: 'deploy',
    module: 'agents/uno-bot/scripts/check-fetch.mjs',
    reason: 'it reads only agents/uno-bot/src/, so a root-only PR cannot break it, and `npm run deploy` gates it at its own boundary.',
  },
  {
    name: 'check:contract',
    script: 'node scripts/sync-blueprint-contract.mjs --check',
    pkg: 'bot',
    trigger: 'deploy',
    kind: 'spawn',
    spawnReason: 'a sync: `--check` withholds the write, and a missing sibling checkout is an exit code by design.',
    reason: 'it compares against a sibling plus-uno-blueprint checkout no runner has, and exits 1 without one, so composed it would stay red.',
  },
  {
    name: 'test:workerd',
    script: 'vitest run --config vitest.workerd.config.mts',
    pkg: 'bot',
    trigger: ['pull_request', 'deploy'],
    kind: 'spawn',
    spawnReason: "vitest in a pool that boots workerd; its failures are a Durable Object's, in vitest's own format.",
    reason: 'it boots workerd, so it runs as its own job in uno-bot-checks.yml and in the deploy chain; red means the two ThreadState adapters disagree.',
  },
];

/**
 * The workflow steps that run checks, as data.
 *
 * `scripts/generate-check-scripts.mjs` renders these into the marked regions of
 * the workflow that used to re-list checks by hand. A step is a step rather
 * than one row per check because a workflow may genuinely group them.
 *
 *   workflow  the file the region lives in.
 *   region    the marker pair it is rendered between. A workflow has more than
 *             one where hand-written YAML sits in the middle.
 *   name      the step's `name:`.
 *   note      the comment lines above the step, verbatim, each without its `#`.
 *   runs      the npm script names the step runs, in order.
 *   env       environment the step needs, if any.
 */
export const WORKFLOW_STEPS = [
  {
    workflow: ".github/workflows/storybook-gate.yml",
    region: "storybook-checks",
    name: "npm run check:storybook",
    note: [
      "One command, one exit code. A `play` failure or a render error fails the",
      "job outright; an accessibility violation fails it only if the story did",
      "not already carry that rule in `scripts/baselines/a11y-baseline.json`.",
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
  {
    workflow: ".github/workflows/storybook-gate.yml",
    region: "storybook-checks",
    name: "npm run check:storybook-links",
    note: [
      "Every link to a Storybook page against the built index of ids. A page move",
      "changes its id, and links written with the old one open nothing without",
      "turning any build red. This builds Storybook, so it goes after the suite.",
    ],
    runs: ["check:storybook-links"],
  },
  {
    workflow: ".github/workflows/storybook-gate.yml",
    region: "design-system-checks",
    name: "npm run test:design-system",
    note: [
      "The design system's unit and contract tests: vitest on jsdom, over",
      "design-system/src/**/*.test.* and design-system/tests/. No browser.",
    ],
    runs: ["test:design-system"],
  },
];

/**
 * The name of the composite. Every `CHECKS` row reaches `pull_request` through
 * it, so the assertion below needs it as a datum rather than as prose.
 */
export const COMPOSITE = 'check:harness';

/**
 * The workflows that honor the `pull_request` trigger.
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
 * honored by hand: `test:workerd` had been a gated step for three months
 * while the registry said it ran nowhere at all (#587).
 */
export const PULL_REQUEST_WORKFLOWS = [
  '.github/workflows/check-harness.yml',
  '.github/workflows/uno-bot-checks.yml',
];

/**
 * The `deploy` script of agents/uno-bot, in order, as data — the seven `deploy`
 * rows plus the four steps that are not checks.
 *
 * WHY ASSERTED AND NOT GENERATED. The rows alone cannot write this chain: they
 * are a set and the chain is a sequence, and four of its segments are not
 * checks at all — the two writes that open it and the two that close it. Writing it would also mean this generator authoring the line
 * that INVOKES the deployment — `node scripts/deploy.mjs`, the command that
 * reaches a real Cloudflare account — and how the deployment is authorized is
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
  {
    step: 'npm run generate:storybook-docs',
    notAGate:
      'it WRITES. Each component\'s Storybook docs id is baked from design-system/figma/' +
      'component-registry.json into src/generated/storybook-docs.ts before anything is ' +
      'typechecked or bundled, so the link `github_read` hands back is the registry on main ' +
      'at deploy (#1563). Not a pull-request check on purpose: the registry changes with ' +
      'every component PR, and a drift gate here would redden those PRs for a file only the ' +
      'deploy reads.',
  },
  {
    step: 'npm run generate:ds-facts',
    notAGate:
      'it WRITES. The design-system facts (scripts/lib/ds-facts.mjs: components, patterns, ' +
      'tokens and the names that are not here) are baked into src/generated/ds-facts.ts before ' +
      'anything is typechecked or bundled, so `github_read`\'s `lookup` and the weekly precedence ' +
      'check read the facts on main at deploy, as the IDE does. Not a pull-request check, for the ' +
      'Storybook docs map\'s reason: the facts change with every component PR.',
  },
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

/** The longest a row's prose field may run: one sentence a CI log prints on one line. */
export const PROSE_CAP = 160;

/** What is wrong with a row's `guards`, `reason` and `spawnReason`: each is one line of at most `PROSE_CAP` characters. */
export const proseFaults = (row) =>
  ['guards', 'reason', 'spawnReason']
    .filter((field) => typeof row[field] === 'string')
    .filter((field) => row[field].includes('\n') || row[field].length > PROSE_CAP)
    .map((field) => `${row.name} ${field} is ${row[field].length} characters; write one line of at most ${PROSE_CAP}`);

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
