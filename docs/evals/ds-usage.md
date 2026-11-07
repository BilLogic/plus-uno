---
summary: The design-system usage eval — whether the harness keeps an agent inside the design system, scored by check:ds-usage first; how to run it and read its ledger
---

# Design-system usage eval

Does the harness help? Six coded tasks, built by fresh agents with and without it, scored by the same checker. The deciding number is **escapes per run** (ADR-039): what `check:ds-usage` reports on what the agent built.

## Tasks

Under `scenarios/ds-usage/`, each a `BRIEF.md` (plus `frame.png` for the frame task), started from `_template/`:

| Task | Asks for |
|---|---|
| `page-from-prd` | a full page from a PRD excerpt |
| `form-states` | a form with every validation state |
| `table-states` | a table with loading, empty, error and loaded states |
| `overlay-flow` | a confirm-and-notify flow |
| `frame-to-code` | a component from an exported design frame |
| `trap-missing-component` | a drag-and-drop board PLUS has no component for: the right answer names the gap |

## Arms

- **control**: the repo with the harness out of reach. What the copy loses, exactly (`CONTROL_REMOVED` and `controlAgents` in `scripts/eval-ds-usage.mjs`):
  - AGENTS.md is cut to its title and the Identity paragraph: the skills, agents, conventions, loading contract, Hard rules and loading table go, and so do the Identity bullets that route claims to the harness's sources;
  - `design-system/agent-views/`, `design-system/guidelines/` and `design-system/figma/`;
  - `docs/connectors/storybook-mcp.md`, `docs/engineering/coding.md` and `docs/engineering/ds-usage-rules.md`;
  - `skills/`, `.claude/skills/`, `.cursor/` and `.codex/`;
  - the project hooks in `.claude/settings.json` (the uno-prototype gate, whose scripts live in `.cursor/`).

  Component source stays: a repo without a harness still has code.
- **current**: the repo as it is at the commit, project hooks included. The uno-prototype gate passes the eval's build prompt through unchanged (checked 2026-11-07).
- **upgraded** is not an arm of its own: it is `current` run again on a later commit, and the ledger's `harness_commit` tells the two apart.

Both arms also lose `docs/evals/`, so no agent reads the scenarios or the judge.

Each run is a headless `claude -p` on the logged-in subscription (no API key), in a `git archive` copy of the repo outside this checkout, so no parent AGENTS.md or project memory reaches it. User settings and hooks, MCP servers, skills, subagents and web tools are off in both arms. The agent is confined to its copy: edits outside the working directory are refused (`acceptEdits` with no one to approve), and Bash runs in the sandbox, which writes only to the working directory and temp folders (checked 2026-11-07: a `touch` into the checkout failed with "Operation not permitted"). the user's global CLAUDE.md may still reach both arms alike, and it carries no design-system rules. Storybook MCP is unavailable to both, because it needs a running Storybook.

Why not subagents: a subagent inherits the parent session's project instructions, and a probe on 2026-11-06 showed plus-uno's AGENTS.md, Hard rules included, in a subagent's context. A control arm run that way would see the rules it is meant to lack.

## Scoring

1. **Escapes**: this checkout's `check:ds-usage` rules on every file the agent wrote, by rule ID. Fail-level only; warnings are counted beside them.
2. **Judge**: one read-only `claude -p` with `scenarios/ds-usage/judge.md` decides only what no checker sees: whether the trap task named the gap, and whether a page used the layout formula. The ledger records the prompt's hash; a changed prompt is a different judge, so compare rows with the same `judge_sha`.

## Run it

```bash
node scripts/eval-ds-usage.mjs run --arms control,current --runs 2 --model sonnet
```

`--tasks` narrows the set, `--ref` picks the commit the arms copy, and `--scratch` the folder the throwaway copies go in (removed as each run finishes). A full run is 24 builds and 24 judgements, one at a time, so it takes hours: start it in the background. Each build is copied to `~/Documents/Claude/Projects/PLUS/evals/ds-usage/<run-id>/` with the agent's result JSON.

## Read the ledger

`ds-usage-ledger.jsonl` gains one row per run, losses and agent errors included: date, model, harness commit, `scenarios_sha` (the briefs, template and judge are read from the working tree, so this hash says which ones), arm, task, run, escapes and `by_rule`, judge verdicts and `judge_sha`, tokens, turns, cost and wall time, and where the build was kept.

```bash
node scripts/eval-ds-usage.mjs summary --since 2026-11-06
```

prints, per arm: escapes per run, escapes by rule, the trap pass rate, the layout-formula rate, mean turns and minutes. Compare arms within one model, one `judge_sha` and one `scenarios_sha`. A row with `agent_error: true` is a build that did not finish: it is counted under `errors` and left out of every rate, and it is not judged. A judge that returns no JSON sets `judge.judge_error`.
