---
embodiment: ide
summary: Hi-fi build on the design system — manifests first, retrieval proof, check:ds-usage as the exit gate
---

<!-- ~1,100 tokens | Load when: the confirmed route is a hi-fi build on the design system -->

# Deliverable — coded build (hi-fi, on the design system)

**Execution mode: UNO builds directly** in `prototypes/`, against
uno-storybook. Direction is settled; the work is execution on the system
(method §2) — DS compliance by construction, not by review catching it later.

## Plan first (Step 3)

Generate the prototype plan — **open by restating the confirmed brief card**
(goal · artifact · fidelity dials · won't include), then: pages or frames ·
user flows · interactions · component requirements · variants (if useful) ·
prototype outputs. **Confirm the plan + touched files with the designer before
any large or risky edit**. Small iterations don't need the gate.

## Build (Step 4)

a. **Ask for a Figma file first — one question, before any build:** *"Do you
   already have a Figma file you want to build upon?"* (one question this
   message, Yes/No).
   - **Yes** → get the link, then follow the full implement-design workflow in
     `design-system/guidelines/figma/mcp-guide.md` — no skipped steps; registries load
     first per `design-system/guidelines/figma/registry-load-gate.md` (MANDATORY);
     variables translate to tokens via `design-system/figma/token-registry.json`.
   - **No** → build from the confirmed plan on the design system directly.
b. Scaffold: `bash skills/uno-prototype/scripts/scaffold-prototype.sh <slug>`
   — writes the Vite app with a first page in the default template, names it, picks the next free port
   (details: `docs/engineering/setup.md`; config shape:
   `skills/uno-prototype/examples/vite-config-example.js`).
c. **Load the design system before any component or token use, in this
   order:** `design-system/agent-views/components.json` and `tokens.json` (the
   exact names, props, enum values and token tiers), then
   `design-system/agent-views/components/index.md` (what exists, and its
   *Not here → use instead* table). Usage and intent come from the
   component's generated doc, its Storybook MDX and `*.stories.jsx`, or the
   Storybook MCP's `get-documentation`. Every name you write comes from one of
   these, looked up in this run; read spacing, size and radius at the ladder
   step for their role (`tokens.md` § Ladder Semantics).
d. **Gate — DS gap (method §4):** needed component not in
   `design-system/agent-views/components/index.md` → name the gap, propose the
   nearest existing composition, file a uno-maintain intake. Never hand-roll a
   lookalike.
e. Playground or WIP pages in Figma → summon **writers/figma**
   (obeys `docs/connectors/figma/overview.md`).

`AGENTS.md` § Hard rules apply in full; `check:ds-usage` is their gate in code
(the loop below). Build only what the plan names — never add screens or
interactions just because the PRD lists more.

f. **Retrieval proof.** The build ends with a short table in the chat: each
   component, and each token family, the prototype uses, with where its name
   came from in this run. A name a gate round changes gets its row updated, so
   the table matches the code that exits.

   | Name | Kind | Source |
   |---|---|---|
   | `Button` `appearance="primary"` | component, prop value | `components.json` record |
   | `--stack-md`, `--pad-x-md` | ladder semantics | `tokens.json` |
   | `SectionMessage` | component | index line, then its generated doc |

   A name with no source is an escape: look it up, or replace it.

## Outside plus-uno

When the working directory is not plus-uno (no `design-system/` here), there is no `prototypes/`, no barrel and no `agent-views/`: build with the registry and the package instead (ADR-047).

- Lookup: the MCP `plus-ds` (`npx -y @plus-uno/cli mcp`) or `npx @plus-uno/cli find | get | tokens | guide`. Every name you write comes from one of these in this run; keep the retrieval proof (step f) with `ds` as the source.
- Install: `npx @plus-uno/cli add <item>` for each component, pattern, template or chart the plan names (`find` names the item). Load `plus-ds/styles/main.scss` once at the entry and paste `plus-ds/head.html` into the HTML head.
- Gap: an item `find` does not list is absent; name the gap and propose the nearest composition.
- Exit gate: `npx @plus-uno/cli check <paths>` replaces `check:ds-usage`; fix every fail-level finding.
- The Figma question and `AGENTS.md` hard rules (Font Awesome Free, tokens over literals) still apply; the scaffold script and Vite aliases are plus-uno only.

## Validate & exit (the loop — method §5)

Iterate until clean, **max 3 attempts** (stop early if an attempt fixes
nothing — same failures twice in a row → carry remaining failures into the
manifest and stop). **The loop's objective is the brief-card contract plus the
machine checks**: the artifact serves the confirmed goal, sits at the confirmed
fidelity dials, and contains nothing from the won't-include list — a build that
passes every script but violates the brief has NOT converged. If anything
fails, fix and re-run the FULL set (a fix can break a check that passed).

Each attempt, in order:

1. **Self-check**: apply the closing *Before you finish* list of
   `design-system/agent-views/components/index.md` to what you wrote.
2. **The gate**: `npm run check:ds-usage -- prototypes/{project}` until it
   reports no escapes. The post-edit hook catches most of them as you write;
   this exit run is the gate of record. Each finding names its fix; the rules
   are `docs/engineering/ds-usage-rules.md`.

The rest of the check set — a runtime without Storybook MCP or a browser runs
the two scripts and records the rest as unavailable, not as failures:

- `bash skills/uno-prototype/scripts/validate-prototype.sh prototypes/{project}`
  — the project's shape (App, export, config, name).
- `bash skills/uno-review/scripts/run-review-checks.sh prototypes/{project}/src`
  — the pre-flight review runs: the same checker plus the raw-HTML-controls
  grep; fixing hits here saves a review round-trip (the review lenses still
  run on exit).
- Stories touched → Storybook MCP `run-story-tests` (a11y included).
- Open the running preview: pages render, key interactions work, console
  clean — scripts can pass while the page is visibly broken; the browser is
  the check of record for UI.

A runtime with a goal-loop primitive may drive this with it (goal = contract +
checks pass; cap = 3); elsewhere run the loop as written.

**Exit:** summon **reviewers/ds-lens** for the conformance pass · write the
one-line artifact manifest: fidelity · tools · PRD link · checker result
(`clean`, or the escapes left after the cap, by rule) · retrieval proof (above)
· any other unresolved check failures · hand to `skills/uno-review` for the
stage lens.
