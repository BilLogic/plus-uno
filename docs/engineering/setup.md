---
embodiment: ide
summary: Aliases, package structure, prototype conventions, token workflow, local preview.
---

<!-- Tier: 2 | ~500 tokens | Load for: repo setup, imports, prototypes scaffolding, build tooling -->
# PLUS Design System — Setup

Implementation requirements only. For design rules, load `design-system/guidelines/overview.md`. For component/token lists, use `design-system/agent-views/`.

## Stack

- React + React-Bootstrap on Bootstrap, built with Vite, documented in Storybook.
- SCSS with design tokens from `design-system/src/tokens/`.
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

**New files import from the barrel.** Existing deep imports inside
`design-system/src/specs/` are grandfathered — see `coding.md` § Imports for the
full rule and what the code actually does.

## Package Structure

```
design-system/
  src/           # DS source (components, forms, specs, tokens, styles, MDX)
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
- **Starter template:** scaffold with `bash skills/uno-prototype/scripts/scaffold-prototype.sh <slug>` — copies `prototypes/starter/` (DS aliases, SCSS config, shared React resolution) and sets the `index.html` title and an unused `server.port` (check `prototypes/*/vite.config.js`; range ~3000–3025)
- Each prototype has its own `vite.config.js` with `@` → `../../design-system/src`
- Register in **Notion Marketplace** with the Deploy Preview / standalone URL — do **not** add numeric SPA routes on `main`
- Optional local script: `"dev:{project-name}": "vite --config prototypes/{project-name}/vite.config.js"` (branch only)
- **Production on `main`:** live app (`/home`) + Full Demo Walkthrough (`/demo/demo.html`, id `1028`) via `prototypes/home-redesign/`

**Starter includes:**

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
blank. Copy the `<link>` from `prototypes/starter/index.html` rather than typing
it. Icons themselves are FA Free — `fa-solid`, `fa-regular`, `fa-brands`
(AGENTS.md § Hard rules 3).

**Minimal structure** (if not using starter):

```
prototypes/{project-name}/
├── index.html
├── src/App.jsx
├── src/main.jsx
├── vite.config.js
```

## Example Selection

When mirroring existing code: nearest `*.stories.jsx` → matching `specs/**` → `prototypes/**`.

## Bootstrap & Providers

- Use PLUS components (Bootstrap-based) — not raw Bootstrap markup for DS surfaces
- Load `main.scss` for token variables
- Prototype Vite configs must set `@` alias or imports fail

## Token Workflow

```
Figma → npm run sync:tokens → npm run generate:tokens → commit SCSS
```

- Never edit generated token files (`_colors.scss`, `_spacing_semantics.scss`, etc.) directly
- Token source is Figma; SCSS is generated output
- Figma mapping tables: `design-system/guidelines/figma/token-mapping.md`
- Refresh agent views: `npm run generate:agent`

## Generated skill surfaces

`skills/<name>/SKILL.md` is canonical, and `skills/` is a discovery path for
nothing: Claude Code and Cursor read `.claude/skills/`, and Slack reads the app
manifest. `npm run generate:skill-surfaces` publishes all three from the
canonical frontmatter:

| Surface | Path | Serves |
|---|---|---|
| IDE stubs | `.claude/skills/<name>/SKILL.md` | `/uno-*` in the Claude Code and Cursor slash menus |
| Worker commands | `agents/uno-bot/src/generated/slack-commands.ts` | the Worker's `/slack/commands` route |
| Slack manifest | `agents/uno-bot/slack-app-manifest-commands.yaml` | pasted at api.slack.com |

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

That registry is also the author of the three places that used to state the same
set by hand: the `check:*` block of `package.json`, the check steps of
`.github/workflows/harness-integrity-sweep.yml` and those of
`.github/workflows/storybook-gate.yml`. Each carries a generated region between
markers; run `npm run generate:check-registry` after editing a row, and
`npm run check:check-registry` fails on drift.

A check returns findings rather than exiting. `scripts/lib/findings.mjs` is that
interface — a check exports `run(ctx) => Finding[]` and decides nothing about
output; the runner renders the banner and picks the exit code, and the check's
own CLI entry (`main()` in that module) prints the same string when you run it
by hand. `main()` also takes a `flags` map for a check's TERMINAL side doors —
`--list`, `--update` — so the entry comparison is written once; a side flag that
prints and then still gates is not one of those and stays hand-rolled (#609).
`scripts/check-font-families.mjs` is the shape to copy, and
`scripts/generate-check-scripts.mjs` the shape for a generator whose `--check`
is one half of it. Each registry row declares its `module`; the few checks whose
result is an exit code by nature — a browser suite, `tsc`, a test runner, the
seven-generator composite `check:agent` — declare `kind: 'spawn'` and the reason
in the same row, and a row declaring neither fails the gate rather than being
run on a guess (#509).

All three embodiments are swept, not two: the headless Actions prompts under
`scripts/prompts/` are a subject of the negation ratchet (`check:negation`, its
`actions` scope) and of the harness name sweep (the Worker's
`harness-blueprint-names` test), listed by where they live because they carry
no `embodiment:` and reach a model by their own loader rather than the bundle (#425).

When it reports a generated artifact as stale, the fix is always to regenerate
and commit:

```bash
npm run generate:agent
npm run generate:index
npm --prefix agents/uno-bot run bundle:harness
npm --prefix agents/uno-bot run evals:docs
```

The last one writes the three documents that state facts about the uno-bot eval
suite — `docs/evals/scenarios/uno-bot.md` in full, and the census blocks in
`docs/evals/README.md` and `docs/evals/fixtures/recordings/README.md` — from the
fixture and the recordings. `test:bundle` fails when what is committed is not
what the fixture says, which is how a count in prose stops drifting from a count
in a file.

## The Worker's own checks

`.github/workflows/uno-bot-checks.yml` runs three jobs on every pull request —
`typecheck` (`tsc --noEmit` over `agents/uno-bot/src/**`), `tests` (the Worker's
unit suite, the largest in this repository) and `conformance` (`test:workerd`,
the ThreadState suite against a real Durable Object under workerd). All three
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
from the `wrangler` already in devDependencies, against a Durable Object
miniflare creates in a temporary directory. So a fork PR runs all three.

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

Two kinds of failure, two mechanisms:

- **`play` functions and render errors block outright.** There are none failing
  on `main`, so anything that appears was introduced by the branch. (How many
  there are: five story files, fourteen `play` blocks, at 2026-08-26. The "284
  of 382" figure in #154 was never real — it came from a grep that matched
  `display:` in inline style objects, and #209 re-measured it at zero. The five
  are `LabelAssociation` (#206), `DeclaredApi` (#207), and `ModalDismissal`,
  `PageAndTabSelection` and `SelectCommit` (#209), which cover the four
  highest-usage components whose behaviour is the product. Everything else in
  the corpus is asserted to render, and to survive axe, and nothing more.)
- **Accessibility is a ratchet**, not a threshold. `docs/evals/a11y-baseline.json`
  records which axe rules each story already violates (126 stories, 14 rules at
  2026-08-26). A story violating a rule it did not carry before fails the gate; a
  count that falls does not. Re-record a genuine improvement with
  `npm run check:storybook -- --update` and commit the file in the same PR.

**Which components carry `play` blocks, and why not all of them.** A `play`
block costs runtime on every PR, so the set is chosen rather than grown: a
component earns one when its behaviour *is* the product and its usage is high
enough that a break is expensive. Usage is #166's measurement, recorded in
`design-system/guidelines/components/overview.md` and re-run on today's tree:
files under `design-system/src/specs/` and `prototypes/` that import a component
and render it. Ranked that way, #209 took `Modal` (33 files), `Select` (24),
`Pagination` (13) and `NavTabs` (11) — the four highest-usage components that
are pure state machines and had no interaction cover.

The absences are as deliberate as the set. `Button` (138) and `Alert` (11) are
behavioural and already have unit tests beside their source, so a second
assertion in a browser buys nothing. `Badge` (62) does one thing, dismiss, and
`SelectCommit` exercises it where it actually matters. `Dropdown` (21) and
`Switch` (7) are covered by `DeclaredApi` (#207). `Table` (19), `ButtonGroup`
(17) and `Card` (14) render and do not act. Below that the ranking falls away
fast — `Accordion` is 2 files and `TagInput` is 0, so behaviour alone does not
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

## Local Preview

```bash
npm run build
npm run preview:react -- --host 127.0.0.1 --port 8080 --strictPort
# Storybook: npm run storybook → http://127.0.0.1:4200
```

## File Naming

- Components: PascalCase (`Button/Button.jsx`)
- Prototypes: kebab-case directories
- Docs/plans: `YYYY-MM-DD-NNN-type-slug-plan.md`

See `docs/engineering/coding.md` for full conventions.
