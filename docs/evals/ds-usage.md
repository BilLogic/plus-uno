---
summary: The design-system usage eval — whether the harness keeps an agent inside the design system, scored by check:ds-usage first; how to run it and read its ledger
---

# Design-system usage eval

Does the harness help? Ten coded tasks, built by fresh agents with and without it, scored by the same checker. The deciding number is **escapes per run** (ADR-039): what `check:ds-usage` reports on what the agent built.

## Tasks

Under `scenarios/ds-usage/`, each a `BRIEF.md` (plus `frame.png` for the frame task), started from `_template/`. A task's own files are copied over the template, so a task that ships `src/` starts with that code in the folder the scorer reads:

| Task | Asks for |
|---|---|
| `page-from-prd` | a full page from a PRD excerpt |
| `form-states` | a form with every validation state |
| `table-states` | a table with loading, empty, error and loaded states |
| `overlay-flow` | a confirm-and-notify flow |
| `frame-to-code` | a component from an exported design frame |
| `trap-missing-component` | a drag-and-drop board PLUS has no component for: the right answer names the gap |
| `two-page-flow` | a supervisor's escalation list and detail pages, each with its own address and navigation between them |
| `debt-extend` | a filter added to a file that already carries recorded debt: a trimmed copy of `prototypes/monthly-report/src/MonthlyReportsListContent.jsx`, with the 4 deep imports and 2 raw literals the baseline holds for it. The post-edit hook hands that debt back on the first edit; the score shows whether it was paid |
| `migrate-retired` | a call-off confirmation written in retired names (`Alert`, `Toast`, `Badge`, `size`/`fill`/`variant`, `--size-element-*`, `--color-surface-container`) to bring current, as the brief itself asks in those names |
| `forbidden-ask` | an onboarding checklist whose brief asks for Font Awesome duotone (Pro) icons and a hex color: the right answer names both rules and takes the compliant path |

`debt-extend` and `migrate-retired` are the seeded tasks (`SEEDED`): each row records `seeded_escapes` and `seeded_by_rule`, the folder's score before the agent began, so debt left reads against debt seeded. The scenarios sit under `docs/evals/`, outside every check's scope (`check:ds-usage` and `check:ads-language` read `prototypes/`, `src/` and `design-system/src`), so their deliberate escapes never reach the repo's own gates.

## Arms

- **control**: the repo with the harness out of reach. What the copy loses, exactly (`CONTROL_REMOVED` and `controlAgents` in `scripts/eval-ds-usage.mjs`):
  - AGENTS.md is cut to its title and the Identity paragraph: the skills, agents, conventions, loading contract, Hard rules and loading table go, and so do the Identity bullets that route claims to the harness's sources;
  - `design-system/agent-views/`, `design-system/guidelines/` and `design-system/figma/`;
  - `docs/connectors/storybook-mcp.md`, `docs/engineering/coding.md` and `docs/engineering/ds-usage-rules.md`;
  - the checker itself: `scripts/check-ds-usage.mjs`, `scripts/lib/ds-usage.mjs`, its baseline and its `package.json` script;
  - `skills/`, `.claude/skills/`, `.cursor/` and `.codex/`;
  - the project hooks in `.claude/settings.json` (the uno-prototype gate, whose scripts live in `.cursor/`).

  Component source stays: a repo without a harness still has code.
- **current**: the repo as it is on main (`--ref`, default `origin/main`), project hooks included. The uno-prototype gate passes the eval's build prompt through unchanged (checked 2026-11-07).
- **hook-off**: `current` without the post-edit hook. Its entry goes from the copy's `.claude/settings.json` and `.cursor/hooks.json`; every other hook stays, and the agent can still run `check:ds-usage` itself. Against `current`, it shows what feedback at write time adds over a checker the agent has to choose to run.
- **checker-removed**: `current` without the checker, while the post-edit hook keeps scoring each edit. Against `current`, it shows whether builds stay clean because the agent knows the system or because it ran the linter.
  - The copy loses `scripts/check-ds-usage.mjs`, `scripts/lib/ds-usage.mjs`, the baseline, the `check:ds-usage` script and its own `.cursor/hooks/ds-usage/` (`CHECKER_REMOVED`). Permission rules also deny Read on those paths in the copy and Bash on `npm run check:ds-usage`.
  - The hook entry in the copy's `.claude/settings.json` runs this checkout's `post-edit.mjs` with `DS_USAGE_ROOT` set to the copy. It checks the copy's files against the copy's facts, using this checkout's checker, and logs to the copy's `.local/`. When it finds an escape, it hands it back as the hook does in `current`, naming `check:ds-usage` and the rules doc.
  - What the agent can reach: everything `current` has except the checker. It can read the hook's command in `.claude/settings.json`, and so the path into this checkout. Read on that checkout's `scripts/` and `.cursor/` is denied, but a Bash `node` call on the checker there would still run. Such a call names the checkout, so it lands in `reached_checkout`, and a checker-removed run with an entry there had the checker after all.
  - The hook's checker is the scorer's, not the copy's. When `--ref` is behind this checkout, the hook can be stricter or looser than the one `current` gets at that ref.
- **lookup**: `current` plus the design-system lookup as an MCP server: the copy's own `scripts/ds-mcp.mjs`, wired in through the agent's `--mcp-config` as `plus-ds` (in place of the empty config every other arm gets), with its five tools allowed (`lookupWiring`). The server is the copy's, so it answers from the commit under test. The copy needs a `--ref` that has the lookup; a run on one without it stops before any agent starts.

  The `ds` command stays reachable, as in `current`: `npm run ds -- <tool> …` answers all five tools from a shell, `check` included.
- **upgraded** is not an arm of its own: it is `current` run again on a later commit, and the ledger's `harness_commit` tells the two apart. So a comparison between arms holds only when both ran at the same `harness_commit`: when the harness moves, rerun `control` there too (`--arms control`).

Every arm also loses `docs/evals/`, so no agent reads the scenarios or the judge.

Each run is a headless `claude -p` on the logged-in subscription (no API key), in a `git archive` copy of the repo outside this checkout, so no parent AGENTS.md or project memory reaches it. User settings and hooks, skills, subagents and web tools are off in every arm, and so are MCP servers, except `plus-ds` in the lookup arm. The agent writes only inside its copy: edits outside the working directory are refused (`acceptEdits` with no one to approve), and Bash runs in the sandbox, which writes only to the working directory and temp folders (checked 2026-11-07: a `touch` into the checkout failed with "Operation not permitted"). Reads are held only in part. Permission rules deny the Read, Grep and Glob tools this checkout's harness and worktrees, but a Bash read still succeeds: the copy's `node_modules` link points into the checkout, so an agent that follows it can reach the real harness. So each run's tool calls are recorded (`stream-json`), and a call that names the checkout outside `node_modules` lands in the row's `reached_checkout`; a control run with an entry there saw the harness, and is read as such. The user's global CLAUDE.md may still reach every arm alike; it carries no design-system rules. Storybook MCP is unavailable to all of them, because it needs a running Storybook.

Why not subagents: a subagent inherits the parent session's project instructions, and a probe on 2026-11-06 showed plus-uno's AGENTS.md, Hard rules included, in a subagent's context. A control arm run that way would see the rules it is meant to lack.

## Scoring

1. **Escapes**: this checkout's `check:ds-usage` rules on every file the agent wrote, by rule ID. Fail-level only.
2. **Warnings**: the warn-level findings on the same files (`prefer-plus-component`, `no-retired-name`, `page-starts-from-pattern`), by rule ID. They never decide a run, but a clean fail-level score can still hide drift, so they are counted.
3. **Layout formula**: `ds/page-starts-from-pattern` read as a verdict, row field `layout_formula`. `true` when no page-level module of the build (the rule's definition, which follows `App` to the module it renders) starts from a hand-styled container; `false` when one does; `null` when no page-level module renders an element, as when `App` still returns `null`. A component brief is judged through the module `App` renders, so a card built on `PatternCard` passes and one inside a styled `div` does not.
4. **Judge**: one read-only `claude -p`, on a copy of the build alone, with `scenarios/ds-usage/judge.md` decides only what no checker sees: whether the build rendered what the brief asks for at all, whether the trap task named the gap, and whether the forbidden ask was refused or escalated (`escalated`: each forbidden part named by its rule, with the compliant path taken or offered). A trap run passes only when it named the gap *and* rendered a board, so zero escapes cannot mean "built nothing". The ledger records the prompt's hash; a changed prompt is a different judge, so compare rows with the same `judge_sha`. Adding `escalated` and the four scenarios moved it from `36f5464460e9` to `48f9d84d8784`; moving layout from the judge to the rule moved it to `991269ccf73c`, and `scenarios_sha` with it.
5. **Accessibility**: each finished build is served by vite in its copy and checked by axe in headless Chromium. Violations are counted by affected node, by axe rule ID. They are reported, never gated: if playwright, a browser or the build itself fails, the row records `a11y_error` and the run goes on.

## Run it

```bash
node scripts/eval-ds-usage.mjs run --model sonnet
```

The default run is small: three arms (`control`, `current`, `checker-removed`), four tasks (`page-from-prd`, `trap-missing-component`, `debt-extend`, `forbidden-ask`) and two runs a cell, 24 builds that answer whether the harness or the checker earns the result. Widen it by flags only when a small run leaves that unclear: `--arms` and `--tasks` take any of the arms and tasks above, and `--runs` sets the repeats. `--model` is the model both the build and the judge run on (default `sonnet`), recorded on every row. `--ref` picks the commit the arms copy (default `origin/main`), and `--scratch` the folder the throwaway copies go in (removed as each run finishes). A run uses the `claude` login, so on a subscription it costs no tokens; it refuses to start when an API key, Vertex or Bedrock is set in the environment, unless `--allow-metered` says the per-token bill is intended. Builds run one at a time, so start a run in the background. Each build is copied to `~/Documents/Claude/Projects/PLUS/evals/ds-usage/<run-id>/` with the agent's result JSON.

## Read the ledger

`ds-usage-ledger.jsonl` gains one row per run, losses and agent errors included: date, model, harness commit, `scenarios_sha` (the briefs, template and judge are read from the working tree, so this hash says which ones), arm, task, run, escapes and `by_rule`, warnings and `warn_by_rule`, `seeded_escapes` and `seeded_by_rule`, judge verdicts and `judge_sha`, tokens, turns, cost and wall time, `reached_checkout`, `read_set`, `a11y_violations` or `a11y_error`, and where the build was kept.

- **Tokens**: the raw `input_tokens`, `output_tokens`, `cache_read_tokens` and `cache_creation_tokens`, and `total_input_tokens`, their input sum. Fresh input is a few dozen tokens a run because nearly all of it is cached, so the total is the one that measures cost.
- **`read_set`**: from the run's own stream, `files` lists what the agent opened with Read, relative to its copy and in first-read order, its own task folder left out; `lookups` lists its Grep, Glob and Bash calls, and each `plus-ds` tool call by tool name with its input (`ds_find {"query":"card"}`). It shows which harness files and lookups agents actually use.

```bash
node scripts/eval-ds-usage.mjs summary --since 2026-11-06
```

prints, per arm and per model within it: escapes and warnings per run, each by rule; the trap pass rate and how many trap boards rendered; the escalation rate on `forbidden-ask`; per seeded task, the escapes seeded and left per run and their delta, negative when the agent paid debt down; the layout-formula rate; mean input tokens (the total above), turns and minutes; the read set (mean files and lookups per run, and the files most runs read); and axe violations per measured build, by rule. Rows from before a field existed (warnings by rule, `rendered`, `escalated`, `seeded_escapes`, `read_set`, axe) leave that part empty, and a trap row with no `rendered` verdict does not count as a pass. The layout-formula rate reads the row's `layout_formula`, and a row scored before the rule existed falls back to its judge's verdict, so the rate stays comparable across the move; `rescore` replaces the judge's verdict with the rule's on every kept build. Scoring is deterministic, so when a `check:ds-usage` rule changes, `node scripts/eval-ds-usage.mjs rescore` recomputes every row's escapes, warnings and layout formula from its kept build with this checkout's rules and stamps the row's `scored_at`; a seeded row's seed is re-scored too while the scenarios are still the ones it ran from (`scenarios_sha`). The agent fields stay as recorded.

Compare arms within one model, one `harness_commit`, one `judge_sha` and one `scenarios_sha`. A row with `agent_error: true` is a build that did not finish: it is counted under `errors` and left out of every rate, and it is not judged. A judge that returns no JSON sets `judge.judge_error`.

## Does the lookup pay off?

The lookup arms run beside `current` at one commit, so the baseline shares their harness:

```bash
node scripts/eval-ds-usage.mjs run --arms current,lookup --tasks page-from-prd,trap-missing-component,debt-extend,forbidden-ask --runs 2 --model sonnet
node scripts/eval-ds-usage.mjs compare
```

Repeat the run with a second `--model`. `compare` applies the keep rule to the ledger: per lookup arm and per model, against the baseline arm (`--baseline`, default `current`) at the same `harness_commit` (`--commit`, default the latest one a lookup arm ran at), keep the lookup when **fail-level escapes fall, or, at zero escapes on both sides, mean total input tokens fall by at least 20% or mean turns fall by at least 3**, across the arm's completed runs. Quality comes first: a lookup that cuts escapes stays even when it costs more. An arm is kept only when every model it ran on keeps it; one delete deletes it, and a model without completed runs on either side reads `no data`. It prints, per arm, the verdict and, per model, the verdict, `input_drop` (a fraction of the baseline), `turns_drop`, the escapes, a one-line reason, and both sides' runs, mean input tokens, mean turns and escapes. Errored runs are left out. When it reads delete, both adapters are deleted (`docs/connectors/ds-mcp.md`).

## Baseline (2026-11-07)

24 runs on `sonnet`, harness at main `59481616c`, scored at the commit in each row's `scored_at`. No run errored, and no run reached the checkout.

| | control | current |
|---|---|---|
| Escapes per run | 9.75 | 9.33 |
| Raw literals | 70 | 49 |
| Primitive reads | 33 | 62 |
| Deep imports | 6 | 0 |
| Unknown tokens | 3 | 0 |
| Unknown props or values | 5 | 1 |
| Trap task, gap named | 2/2 | 2/2 |
| Layout formula used | 1/9 | 2/11 |
| Mean turns / minutes | 17.6 / 1.2 | 20.7 / 1.3 |

Read: the harness as on main barely moves the total. It removes deep imports, unknown tokens and most unknown props, and trades raw literals for primitive reads: agents with the harness reach for tokens, but at the primitive tier. Two runs per cell is enough to see direction, not to rank small differences.

## After phase 1 (2026-11-07)

12 runs of the current arm on `sonnet`, harness at main `f21aa53e2`: the checker and its manifests, the post-edit hook, the ds-lens rewrite, the index's "Not here" header and self-check with the ladder tokens in the token view, and the coded-build retrieval proof with the checker as its gate. No run errored, and no run reached the checkout.

| | current, baseline | current, after phase 1 |
|---|---|---|
| Escapes per run | 9.33 | 0 |
| Raw literals | 49 | 0 |
| Primitive reads | 62 | 0 |
| Unknown props or values | 1 | 0 |
| Trap task, gap named | 2/2 | 2/2 |
| Layout formula used | 2/11 | 2/12 |
| Mean turns / minutes | 20.7 / 1.3 | 21.5 / 1.6 |

Read: every build came out clean, and the post-edit hook never had to hand one back, so the escapes stopped at write time rather than at the gate. Builds read the ladder (`--inline-md`, `--page-stack-md`, `--pad-x-lg`) where the baseline read `--space-*` primitives. Eleven of twelve runs ran `check:ds-usage` themselves before finishing. One difference from the baseline setup: there, the checker could not run in a copy without git, so the gate was out of reach; here it runs. Layout is unmoved: ten of twelve outer structures are still hand-made, which is the next lever. The control arm was not re-run, since nothing it reads changed.

## Patterns in the agent views (2026-11-07)

12 runs of the current arm on `sonnet`, at `a38f37532`: the component index gained a Patterns section (`PageLayout` and the Frame, Page, Section, Card, Table, Overlays, Popups and AI patterns, each with its import line), a "Not here" row sending `Card` to `PatternCard`, and a self-check line, "a page or card starts from its pattern". No run errored, and no run reached the checkout.

| | after phase 1 | with patterns |
|---|---|---|
| Escapes per run | 0 | 0 |
| Trap task, gap named | 2/2 | 2/2 |
| Layout formula used | 2/12 | 11/12 |
| Mean turns / minutes | 21.5 / 1.6 | 19.5 / 1.3 |

Read: every full page now sits in `PageLayout`, and both frame-to-code builds are a `PatternCard`, where the runs before wrote that the system had no card. The one miss is an overlay flow whose outer view was hand-made. An overlay-flow agent also chose the `Modal` component over `PatternModal` because the pattern draws inline with no focus trap, which is right; the row now says so. After this run the review also dropped a wrong "Not here" row for `Section` (a real menu part), renamed the table's first column and named all three barrels in the index header; none of those touch what a page agent reads first.

## Phase 2 baseline (2026-11-07)

The small default run at `45aeeea59`: three arms, four tasks (`page-from-prd`, `trap-missing-component`, `debt-extend`, `forbidden-ask`), two runs a cell, sonnet, on the subscription login. 24 builds, no errors. Two runs a cell show direction, not rank.

| Arm | Escapes per run | Layout from a pattern | Trap passed | Forbidden ask escalated | Debt left (seeded 6) | Mean input tokens | Mean turns |
|---|---|---|---|---|---|---|---|
| control | 13.88 | 2/8 | 2/2 | 0/2 | 9 | 467,726 | 16.5 |
| current | 1.13 | 5/8 | 2/2 | 2/2 | 3 | 688,834 | 17.6 |
| checker-removed | 1.50 | 4/8 | 2/2 | 2/2 | 4 | 589,324 | 15.8 |

- **The harness earns most of the result, not the checker.** Taking the checker away moves escapes from 1.13 to 1.50 a run; taking the harness away moves them to 13.88. The agent that cannot run the checker still escalates the forbidden ask and still pays down debt.
- **The harder tasks are not at zero.** The remaining escapes are raw literals and deep imports, mostly in the seeded debt task; the control arm adds to the debt it starts with, the harness arms halve it.
- **The harness costs input.** About 47% more input tokens than control for about one more turn, which is the reading that buys the drop in escapes. The lookup arms are measured against this.
- **Accessibility is measured, not good.** Every arm averages 8 to 13 axe violations a build, almost all `region` (content outside a landmark); the harness does not teach landmarks yet.
- **The read set is thin.** Most of what agents open goes through shell search and is counted as lookups, so "files read" undercounts; treat it as a floor.

## Lookup arms (2026-11-07)

The lookup run at `6cc39f0d7`: `current`, `lookup` (the five MCP tools) and `lookup-min` (`ds_find` and `ds_get` only), the four default tasks, two runs a cell, sonnet, on the subscription login. 24 builds, no errors.

| Arm | Escapes (8 runs) | Layout from a pattern | Debt left (seeded 6) | Mean input tokens | Mean turns | Mean minutes |
|---|---|---|---|---|---|---|
| current | 17 | 3/8 | 5.5 | 533,762 | 14.1 | 1.39 |
| lookup | 0 | 8/8 | 0 | 586,987 | 24.4 | 1.24 |
| lookup-min | 10 | 6/8 | 5 | 528,228 | 20.0 | 1.47 |

- **`compare` says delete both**, because the keep rule asks for cheaper runs at equal quality, and neither arm is cheaper: `lookup` uses 10% more input and 10 more turns.
- **The rule's premise did not hold.** It assumed the baseline already sat at zero escapes. Here `current` left 17 and `lookup` left none, laid out every build from a pattern and paid all the seeded debt, in less wall time. That is a quality gain the rule has no column for, so the verdict waits on a decision rather than deleting the adapters.
- **Two tools are not enough.** `lookup-min` keeps half the escapes; the gain comes with `ds_tokens`, `ds_guide` and `ds_check` in reach.
- **Decision (2026-11-07): keep all five tools.** Bill kept the lookup on the quality gain. The keep rule now puts escapes first (§ Does the lookup pay off?), and on these rows `compare` reads keep. The `lookup-min` arm and the server's `--tools` flag are gone; its rows stay in the ledger.

## Retrieval bench

Whether `ds_find` puts the right component first is measured apart from the agent runs, in seconds and with no model: `node scripts/bench-ds-find.mjs`. It scores two sets under `scripts/bench/ds-find/`:

- **`authored.json`**: queries written to probe the lookup, each `{q, want[], kind}` with kind `intent` (a need in plain words) or `name` (a component name).
- **`heldout.json`**: the queries agents really sent to `ds_find` in the ledger, labeled by hand against the task brief (`real-intent`, `real-name`, `real-token`, `real-icon`). A row is never edited to fit the ranker; a wrong label is fixed against the brief.

A row scores its rank: the first result that is a wanted component, where a not-here row counts when its redirect names one. The script prints hit@1, hit@3 and MRR per set and kind, and every miss (rank above 3). Icon rows score against the committed Free icon lists (`design-system/src/lib/icon-free.generated.js` and the regular list beside it).

| Flag | Does |
|---|---|
| `--verbose` | prints every row, not only the misses |
| `--no-aliases` | runs the ranker with the alias field zeroed, so an alias can never paper over a ranker regression (a no-op until aliases exist) |
| `--ledger` | lists `ds_find` queries in the ledger that no set carries yet; label them (add a row to `heldout.json`) so the held-out set grows with every eval run |
| `--update` | rewrites `ratchet.json` from this run |

**The ratchet** (`ratchet.json`) records the hit@1 and hit@3 counts per set and kind, for both arms. `scripts/bench-ds-find.test.mjs`, part of `test:scripts`, fails when any count falls below it, when a name row misses rank 1, when an intent query returns a constant, or when a query without token vocabulary returns a token. MRR is reported, not gated, since it moves with ties. A change that earns a gain runs `--update` in the same PR, and the ratchet diff is reviewed like a baseline change; the ratchet only moves up.
