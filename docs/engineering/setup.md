---
embodiment: ide
summary: Aliases, package structure, prototype conventions, token workflow, local preview.
---

<!-- Tier: 2 | ~500 tokens | Load for: repo setup, imports, prototypes scaffolding, build tooling -->
# PLUS Design System — Setup

Implementation requirements only. For design rules, load `design-system/guidelines/overview.md`. For component/token lists, use `design-system/agent-views/`.

## Stack

- React, built with Vite, documented in Storybook. No Bootstrap (ADR-041).
- SCSS with design tokens from `design-system/src/tokens/`.
- Every interactive component's behavior is built on Base UI (`@base-ui/react`, headless), styled on `--ds-*` tokens — ADR-037, widening the AI-only scope ADR-036 set.
- Versions live in `package.json` and nowhere else — read them there rather than from a doc that goes stale on the next bump.

## Import Aliases

| Alias | Resolves to |
|-------|-------------|
| `@` | `design-system/src` (Storybook, DS Vite, prototypes configs) |
| `~` | `node_modules` |

**Barrel exports — always import from index:**

```js
import { Button, Alert, Modal, Input, Select, Checkbox } from '@/components';
import '@/styles/main.scss';
```

**Entry points:**
- `design-system/src/index.js`
- `design-system/src/components/index.js` (form elements live in `design-system/src/components/forms-and-inputs/`, re-exported via this barrel)

**Files import from the barrel** — see `coding.md` § Imports for the full rule.

## Package Structure

```
design-system/
  src/           # DS source (components, patterns, tokens, styles, MDX)
  guidelines/    # Authored DS protocol (foundations, components, composition, figma)
  agent-views/   # Generated facts — component index, forms redirect, token list
  figma/         # Registries + alignment runbooks
prototypes/{name}/     # Standalone prototypes
.storybook/            # Storybook config
scripts/               # Token sync, registry + agent-view generation
skills/         # Workflow skills (uno-prototype, uno-review, …)
```

## Prototype conventions

- Experiments: `prototypes/{project-name}/` on a **feature branch** (flat, kebab-case)
- **Scaffold:** `bash skills/uno-prototype/scripts/scaffold-prototype.sh <slug>` writes the prototype (DS aliases, SCSS config, shared React resolution, a first page in the default template) with its `index.html` title and the next unused `server.port`
- Each prototype has its own `vite.config.js` with `@` → `../../design-system/src`
- Register in **Notion Marketplace** with the Deploy Preview / standalone URL — do **not** add numeric SPA routes on `main`
- Optional local script: `"dev:{project-name}": "vite --config prototypes/{project-name}/vite.config.js"` (branch only)
- **Production on `main`:** Storybook only. The Vibe app and the Full Demo Walkthrough are on the `archive/legacy-ds` branch; `/home`, `/app` and `/demo` redirect to Storybook

**The scaffold writes:**

| File | Purpose |
|------|---------|
| `index.html` | Entry HTML with DS stylesheet + the pinned Font Awesome link |
| `src/App.jsx` | Root component with DS import examples |
| `src/main.jsx` | React 19 entry point |
| `vite.config.js` | `@` alias, SCSS loadPaths, ESM-safe `__dirname` |

**Font Awesome** loads from jsdelivr, pinned:
`https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@7.2.0/css/all.min.css`.
That is the host and path that serve FA 7's `all.min.css`; the cdnjs path most
agents reach for by habit is laid out differently for FA 7 and the icons come up
blank. Copy the `<link>` from `skills/uno-prototype/scripts/scaffold-prototype.sh` rather than typing
it. Icons themselves are FA Free — `fa-solid`, `fa-regular`, `fa-brands`
(AGENTS.md § Hard rules 3).

**Minimal structure** (if not using the scaffold):

```
prototypes/{project-name}/
├── index.html
├── src/App.jsx
├── src/main.jsx
├── vite.config.js
```

## Example Selection

When mirroring existing code: nearest `*.stories.jsx` → `prototypes/**`.

## Styles & Providers

- Use PLUS components first. An interactive PLUS component's behavior comes from Base UI (ADR-037); layout is PLUS components and `--ds-*` tokens.
- Load `main.scss` for token variables and the element baseline (`_base.scss`)
- Prototype Vite configs must set `@` alias or imports fail

## Token Workflow

```
Figma export → design-system/src/tokens/source/*.json → npm run generate:tokens → commit SCSS
```

- The source JSON is exported through the Figma MCP, read-only: one file per
  collection (`spacing _ primitives.json`, `spacing _ foundations.json`,
  `spacing _ layout.json`, `spacing _ patterns.json`, `color _ patterns.json`,
  `typography.json`). Each is `{ modes, variables }`, and every variable
  carries `id`, `name`, `resolvedType`, `valuesByMode` (aliases kept as
  `VARIABLE_ALIAS`), `resolvedValuesByMode`, `scopes` and `codeSyntax`. A
  variable's `codeSyntax.WEB` (`var(--pad-x-sm)`, say) is its CSS name, so the
  generator refuses a variable without one instead of deriving a name. It
  writes `_scales.scss`, `_frame_layers.scss` and `_type.scss`.
- The four-tier token ladder (semantics, patterns, components, layers) and
  motion generate the other direction, code → Figma, via
  `npm run generate:design-tokens` (ADR-038). `generate:tokens` drops the
  retired names (`RETIRED_TOKENS` in `scripts/lib/tokens/plan.mjs`) that the
  Figma exports still carry.
- Edit the source, then regenerate: every token file is generated output except
  `_fonts.scss`, the hand-authored fallback faces and base heading and body type.
- Where a token deliberately differs from Figma, or is not in Figma, the
  generator says so in a named constant (`CODE_ONLY_FRAME_LAYERS`,
  `FAMILY_FALLBACKS`, `CODE_ONLY_TYPE_STYLES` and their neighbors in
  `scripts/generate-all-tokens.js`). The generator refuses to write when a
  constant has gone stale: a code-only name Figma now has.
- Token source is Figma; SCSS is generated output
- Figma mapping tables: `design-system/guidelines/figma/token-mapping.md`
- Refresh agent views: `npm run generate:agent`

The color set (`--ds-*`, `--palette-*`) is generated by
`npm run generate:color-tokens` into `design-system/src/tokens/color/`, from a
plan file in `scripts/lib/color/plans/` and the vendored Atlassian reference in
`scripts/lib/color/`. A plan holds primitive values only; a role that needs
another step changes `scripts/lib/color/semantics.mjs`, which every plan shares.
The generator refuses to write while `check:color-system` fails.

The harness checks that read color (`check:focus-ring`, `check:button-contrast`,
`check:text-contrast`, `check:color-fallbacks`, `check:intent-roles`) read the
`--ds-*` tokens. The three that measure contrast measure the LIGHT value only: a token's first
definition is its light block. Dark and increased-contrast pairs are
`check:color-system`'s, which holds every plan to them in all four modes.

Figma follows the repo for color. `npm run push:figma-color` turns the
generated `figma-spec.json` into Plugin API scripts that upsert the collections
and shadow styles by name and leave everything else in the file as it is;
`-- --probe` prints the read-only drift check and `-- --diff FILE` names what
its result found. Both run inside the target file through the Figma MCP's
`use_figma` or a plugin console, since only the Plugin API writes variables on
this plan, so the drift check is a manual command and sits outside the harness
gate. Run against a scratch file before a library.

## Generated skill surfaces

`skills/<name>/SKILL.md` is canonical, and `skills/` is a discovery path for
neither IDE: Claude Code and Cursor read `.claude/skills/`. `npm run
generate:skill-surfaces` publishes a stub there for each skill from the
canonical frontmatter, which puts it in both slash menus. Slack reaches skills
by DM and @mention, so it has no generated surface.

Edit the canonical `SKILL.md` and regenerate; `npm run check:skill-surfaces`
fails the harness gate on drift.

## The harness gate

Three workflows run on every `pull_request`, concurrently: this one, the
Worker checks below it, and the Storybook gate further down.

`npm run check:harness` is the command to run before opening a PR
(`.github/workflows/check-harness.yml`). It composes the deterministic guards
into a single exit code and a report that
names each sub-check that failed, with that sub-check's own diagnostic under it —
it does not stop at the first, so one run tells you everything wrong with the
branch. The composite itself takes about 14 seconds; the job around it adds one
`npm ci` scoped to `agents/uno-bot`, which the Worker's `typecheck` and `test`
rows need.

`npm run check:harness -- --list` prints what it composes, what it deliberately
does not, and why. Those reasons are stated once, in `scripts/checks.registry.mjs` —
the check registry — and add a new `check:*` script to that file's `CHECKS` or
`EXCLUDED` when you write one. The gate fails on a check that is in neither,
because a check that runs nowhere protects nothing.

It asks the same question from the other end too (#612): a `check-*.mjs` in
`scripts/` or `agents/uno-bot/scripts/` that no row names — by `module` or
inside its `script` — is reported by name. The name scan alone could only see
an npm script, so a check with no script of its own read as part of the harness
to anyone opening the folder while running nowhere. The Figma-links reporter
was one from the day it landed, 2026-05-11: it printed a summary and exited
zero whatever it found, so it was deleted rather than bound.

And write the check's test with it. A guard nobody has watched fail is a guard
nobody knows works (#191): the test plants the failure the check exists to
catch, in a fixture tree, and proves each exemption by breaking the rule
somewhere the pass is meant to leave alone. `run({ repoRoot })` is what makes
that cheap — every findings check takes the root, so a test hands it a
throwaway directory instead of the repo. `scripts/check-doc-links.test.mjs` and
`scripts/check-knowledge-disposition.test.mjs` are the shape to copy, and
`npm run test:scripts` runs them.

That registry is also the author of the places that used to state the same
set by hand: the `check:*` block of `package.json` and the check steps of
`.github/workflows/storybook-gate.yml`. Each carries a generated region between
markers; run `npm run generate:check-registry` after editing a row, and
`npm run check:check-registry` fails on drift.

A check returns findings rather than exiting. `scripts/lib/findings.mjs` is that
interface — a check exports `run(ctx) => Finding[]` and decides nothing about
output; the runner renders the banner and picks the exit code, and the check's
own CLI entry (`main()` in that module) prints the same string when you run it
by hand. `main()` takes both of the side-door maps a check's CLI needs, so the
entry comparison is written once (#610): `flags` for a TERMINAL `--list` or
`--update`, which ends the run there, and `fallThrough` for a `--report`,
`--table` or `--stats` that prints and then lets the gate run, keeping the exit
code the findings'. Which map a flag belongs in is a reading of what it does
rather than of what it is called, and putting a fall-through flag in `flags`
would leave it printing the same text while the check stopped gating — so
`scripts/lib/side-flags.test.mjs` runs each of those flags against the real
check and holds its banner and exit code to the plain run's. A script with no
findings to render — a generator, a snapshot writer, a browser suite — asks the
same comparison as `isEntry(import.meta.url)`.
`scripts/check-font-families.mjs` is the shape to copy, and
`scripts/generate-check-scripts.mjs` the shape for a generator whose `--check`
is one half of it. Each registry row declares its `module`; the few checks whose
result is an exit code by nature — a browser suite, `tsc`, a test runner, the
seven-generator composite `check:agent` — declare `kind: 'spawn'` and the reason
in the same row, and a row declaring neither fails the gate rather than being
run on a guess (#509).

The headless prompts under `scripts/prompts/` — the shared headless-intake
contract — are swept too: a subject of the negation ratchet (`check:negation`,
its `actions` scope) and of the harness name sweep (the Worker's
`harness-blueprint-names` test), listed by where they live because they carry
no `embodiment:` and sit outside the bundle (#425).

When it reports a generated artifact as stale, the fix is always to regenerate
and commit. `npm run regenerate` (`scripts/regenerate.mjs`) runs every
generator and every ratchet's `--update` in the order each step's inputs
demand — generators first, `agents/uno-bot`'s harness bundle once its own
deps are installed, then the ratchets, which record what the generators just
produced:

```bash
npm run regenerate
```

### Harness seams

The words the harness checks are organized by.

**check registry**:
`scripts/checks.registry.mjs`, the one list of the repo's checks: each row says what a check runs and where it runs, and every place that runs checks is held to agree with it.
_Avoid_: "the check list", "COMPOSED"

**corpus**:
`scripts/lib/corpus.mjs`, the harness's one reader of repo files: what documents exist and what each one says. Checks ask it rather than the filesystem. Not the **Asks corpus** of the measurement window.
_Avoid_: "the walker", "the parser" (there is one of each)

**ratchet**:
`scripts/lib/ratchet.mjs`, a check's recorded baseline: a count may fall and a rise is a finding, an entry the run stops finding is a finding too, and a missing record fails loudly.
_Avoid_: "the whitelist", "the exceptions file", "the allow-list"

## The ds-usage post-edit hook

After an agent edits a file in `prototypes/`, `.cursor/hooks/ds-usage/post-edit.mjs` runs `check:ds-usage` on that file and hands any fail-level escape back to the agent, with its fix, so the agent corrects it before going on. The file is held to zero, as the checker holds any file a change touches, so escapes recorded in the baseline come back too. Edits anywhere else return at once.

- **Claude Code**: `PostToolUse` on `Edit|Write|MultiEdit` in `.claude/settings.json`. Exit 2 puts the findings in front of the agent; the edit itself has already landed.
- **Cursor**: `afterFileEdit` in `.cursor/hooks.json`. Cursor takes no reply from this event, so there it only logs.

Each run appends a line to `.local/ds-usage-runs.jsonl` (git-ignored): time, file, session, finding counts by rule, and `duration_ms`, what the run cost the edit, measured from the hook's start so the checker import counts.

To turn it off locally, set `DS_USAGE_HOOK=off` in the environment the editor or `claude` starts from. A checker that fails to load or throws leaves the agent undisturbed: the hook exits 0 and says nothing.

## The Worker's own checks

`.github/workflows/uno-bot-checks.yml` runs three jobs on every pull request —
`typecheck` (`tsc --noEmit` over `agents/uno-bot/src/**`), `tests` (the Worker's
unit suite, the largest in this repository) and `conformance` (`test:workerd`,
the ThreadState suite against a real Durable Object under workerd, and the
UsageLog suite against a local D1 with the real migrations applied). All three
are registry rows; the first two are composed into `check:harness` as well, so
the pre-push command stays whole. The jobs exist for their NAMES. A red
`check:harness` is one GitHub check covering the whole composite, so
"the types broke" and "a test broke" arrive as the same line, and telling them
apart means opening the log. From the check list, `uno-bot — Worker checks /
typecheck`, `… / tests` and `… / conformance` answer that directly (#580, #587).

All three commands are in the `npm run deploy` chain too, so a push straight to
`main` — unprotected, and 19 people can make one — meets the same gates on the
way to production. None reads a secret: `tsc` reads the checkout, the unit suite
is pure functions plus mocked `fetch`, and `conformance` boots workerd locally
from the `wrangler` already in devDependencies, against a Durable Object and a
D1 database miniflare creates in a temporary directory. So a fork PR runs all three.

`conformance` is the one that costs a runtime, which is why it is a job of its
own rather than a member of the fast composite: 3.1s warm and 4.5s cold locally,
4s as a step of the harness job, against that composite's ~14s (measured
2026-09-17). It was a step of the harness workflow from #493 until #587, where
its red was indistinguishable from a broken doc link; moving it out shortened
that job from 40s to 34–38s — a saving inside the runner's own spread, so the
line in the check list is what the move was really for. `scripts/checks.registry.mjs`
§ EXCLUDED carries the full reasoning.

Run them locally with `npm --prefix agents/uno-bot run typecheck`,
`npm --prefix agents/uno-bot test` and
`npm --prefix agents/uno-bot run test:workerd`.

## The Storybook gate

`npm run check:storybook` runs the browser suite — every story rendered in
headless chromium, any `play` block executed, axe run over the result
(`.github/workflows/storybook-gate.yml`). It is a separate workflow because it
needs `npm ci` and a Playwright browser and takes ~130s; `check:harness` needs
neither and takes ~14s, and merging them would make the fast answer slow.

The same workflow runs the design system's unit suite, `npm run
test:design-system` (vitest on jsdom, no browser), as its own `design-system`
job; its row's `reason` in `scripts/checks.registry.mjs` says why it lives there.

Two kinds of failure, two mechanisms:

- **`play` functions and render errors block outright.** There are none failing
  on `main`, so anything that appears was introduced by the branch. (How many
  there are: five story files, fourteen `play` blocks, at 2026-08-26. The "284
  of 382" figure in #154 was never real — it came from a grep that matched
  `display:` in inline style objects, and #209 re-measured it at zero. The five
  are `LabelAssociation` (#206), `DeclaredApi` (#207), and `ModalDismissal`,
  `PageAndTabSelection` and `SelectCommit` (#209), which cover the four
  highest-usage components whose behavior is the product. Everything else in
  the corpus is asserted to render, and to survive axe, and nothing more.)
- **Accessibility is a ratchet**, not a threshold. `scripts/baselines/a11y-baseline.json`
  records which axe rules each story already violates (54 stories, 8 rules at
  2026-08-29). A story violating a rule it did not carry before fails the gate; a
  count that falls does not. Re-record a genuine improvement with
  `npm run check:storybook -- --update` and commit the file in the same PR.
- **What a ratchet IS, for every check that holds one**, is
  `scripts/lib/ratchet.mjs`: which direction fails, the stale-entry sweep, the
  placeholder-reason sweep and the `--update` write. Every record shares one
  envelope — `why`, any other prose the check reads, then `sets`, each set an
  optional `direction` and `reasons` and its `entries` of `{count, reason?}` —
  so a new ratchet needs no table row. `--update` is a merge that leaves every
  key the module does not own exactly as it found it. `scripts/lib/ratchet.test.mjs`
  holds every live record to the envelope and to a no-movement `--update` that
  changes no byte.
- **The component language is a hard ban** (`check:ads-language`): old names,
  props, state steps and words are findings wherever they appear in
  `design-system/src` and `prototypes`. There is no baseline and no
  `--update`; a citation that must stay is named in the check itself.
- **The old design system is a hard ban** (`check:old-system`): a name from a
  token family generated from an archived Figma collection fails anywhere in
  `design-system/src` and `prototypes`, comments included. There is no baseline; each family that moves to the current
  system adds its row to the check.
- **The harness and docs records read it too** (#601) — the glossary's prose
  count, the negation scopes with their corpus floors, and the benchmark's
  floor. Each words its own findings and reads its record through the module:
  the half the module owns as `entries`, the rest — a recorded reading, a date,
  Atlassian's published surface — through `envelope()`.
- Several records are maintained by hand and offer no `--update` (no
  `update` on their registry row), because the value of an entry in them IS the
  argument for it. `--update` seeds the envelope onto a record written from
  nothing and then leaves it to whoever edits the file, which is why the two
  checks that stamp a date ask for it by hand.
- **The registry asserts the pointer, not the filename** (#602). A `baseline:`
  row is checked by `check:check-registry`: every set of the record opens (an
  unreadable record fails there rather than reading as an empty set, which is
  green), the check that declares it reaches the record
  through its own imports — so a check that opens its record through the module
  without naming the file passes, and the fallback pair is credited to
  `scripts/lib/fallback-check.mjs` where the record work actually is — and the
  `--update` its row's `update` names is a flag the check offers, in whichever
  of `main()`'s two slots the check chose (`check:glossary`'s writes and then
  still gates). A row with no `update` must offer none. The a11y baseline is
  the one record its check still parses itself, named as an exemption in
  `scripts/generate-check-scripts.mjs` with the reason: the browser suite's
  migration is its own piece of work.

**Which components carry `play` blocks, and why not all of them.** A `play`
block costs runtime on every PR, so the set is chosen rather than grown: a
component earns one when its behavior *is* the product and its usage is high
enough that a break is expensive. Usage is #166's measurement, recorded in
`design-system/guidelines/components/overview.md`: files under the Specs code
and `prototypes/` that imported a component and rendered it, measured before the
Specs code left `main`. Ranked that way, #209 took `Modal` (33 files), `Select` (24),
`Pagination` (13) and `Tabs` (11) — the four highest-usage components that
are pure state machines and had no interaction cover.

The absences are as deliberate as the set. `Button` (138) and `Alert` (11) are
behavioral and already have unit tests beside their source, so a second
assertion in a browser buys nothing. `Badge` (62) does one thing, dismiss, and
`SelectCommit` exercises it where it actually matters. `Dropdown` (21) and
`Switch` (7) are covered by `DeclaredApi` (#207). `Table` (19), `ButtonGroup`
(17) and `Card` (14) render and do not act. Below that the ranking falls away
fast — `Accordion` is 2 files and `TagInput` is 0, so behavior alone does not
earn a slot. Adding to the set is fine; adding without a usage number and a
sentence saying what breaks is how a four-minute gate becomes a ten-minute one.

Fixing the inherited violations is tracked separately at #153 — the ratchet
exists so that work does not have to finish before anything else can merge. A
rule that genuinely does not apply to a story belongs in that story's own
`parameters.a11y`, with the reason written next to it; re-baselining is not a
substitute for that decision.

```bash
npm run check:storybook                       # gate
npm run check:storybook -- --update           # re-record the a11y baseline
npx vitest run --project=storybook -t "Name"  # one story, for triage
```

## Docs AI agent (Netlify function)

The Storybook docs' AI agent is answered by `netlify/functions/docs-agent`: Gemini on Vertex AI, service account only (ADR-018), with no API-key path. Set these in the Netlify site's environment variables; none of them reaches the browser bundle.

| Variable | Value |
|---|---|
| `GEMINI_SA_EMAIL` | the service account's email |
| `GEMINI_SA_PRIVATE_KEY` | its PKCS8 private key (literal `\n` escapes are fine) |
| `GEMINI_PROJECT_ID` | the Vertex project, `hcii-plus` |
| `GEMINI_MODEL` | optional, default `gemini-3.8-flash` |
| `GEMINI_REGION` | optional, default `global` |

The function signs a JWT with Node's `crypto`, exchanges it for an OAuth token and calls `generateContent`. Its grounding is the generated design-system index, bundled through `included_files` in `netlify.toml`. Tests: `npm run test:scripts`. The per-IP rate limit is best effort: it is held per warm function instance, so a cold start resets it. Without the variables, or on an error or a 429, the chat falls back to the docs search.

## Hosted design-system MCP (Netlify function)

The hosted copy of the `plus-ds` lookup is `netlify/functions/ds-mcp`, served at `/mcp/ds` (`docs/connectors/ds-mcp.md` § Hosted). It reads the repo files bundled through `[functions."ds-mcp"] included_files` in `netlify.toml`, so it answers from the same build as that deploy's Storybook; `netlify/functions/ds-mcp/handler.test.mjs` fails when a file the five tools open is missing from that list. Set this in the Netlify site's environment variables:

| Variable | Value |
|---|---|
| `DS_MCP_KEY` | the shared key clients send as `Authorization: Bearer <key>` or `x-ds-mcp-key`. Unset or empty, the function refuses every request. |

Tests: `npm run test:scripts`.

## Local Preview

```bash
npm run storybook          # http://127.0.0.1:4200
```

## File Naming

- Components: PascalCase (`Button/Button.jsx`)
- Prototypes: kebab-case directories
- Docs/plans: `YYYY-MM-DD-NNN-type-slug-plan.md`

See `docs/engineering/coding.md` for full conventions.
