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
   — copies `prototypes/starter/`, patches the name, picks the next free port
   (details: `docs/engineering/setup.md`; config shape:
   `skills/uno-prototype/examples/vite-config-example.js`).
c. **Load the DS agent-views before any component or token use** (AGENTS.md
   § Progressive loading: `design-system/agent-views/components/index.md` +
   `tokens/tokens.md`); read props, variants and usage from the component's
   Storybook MDX and `*.stories.jsx` — they are the only source for that half.
d. **Gate — DS gap (method §4):** needed component not in
   `design-system/agent-views/components/index.md` → name the gap, propose the
   nearest existing composition, file a uno-maintain intake. Never hand-roll a
   lookalike.
e. Playground frames or wip placement in Figma → summon **writers/figma**
   (obeys `docs/conventions/figma-workspace.md`).

Hi-fi hard rules (AGENTS.md forbidden patterns in full): tokens over literals ·
official layout formulas · PLUS components before generic primitives · no deep
imports from `design-system/src/` · FA Free icons only. Build only what the
plan names — never add screens or interactions just because the PRD lists more.

## Validate & exit (the loop — method §5)

Iterate until clean, **max 3 attempts** (stop early if an attempt fixes
nothing — same failures twice in a row → carry remaining failures into the
manifest and stop). **The loop's objective is the brief-card contract plus the
machine checks**: the artifact serves the confirmed goal, sits at the confirmed
fidelity dials, and contains nothing from the won't-include list — a build that
passes every script but violates the brief has NOT converged. If anything
fails, fix and re-run the FULL set (a fix can break a check that passed).

The interactive-IDE check set — a runtime without Storybook MCP or a browser
runs the two scripts and records the rest as unavailable, not as failures:

- `bash skills/uno-prototype/scripts/validate-prototype.sh prototypes/{project}`
- `bash skills/uno-review/scripts/run-review-checks.sh prototypes/{project}` —
  a pre-flight of review's deterministic catches; fixing them here saves a
  review round-trip (the review lenses still run on exit).
- Stories touched → Storybook MCP `run-story-tests` (a11y included).
- Open the running preview: pages render, key interactions work, console
  clean — scripts can pass while the page is visibly broken; the browser is
  the check of record for UI.

A runtime with a goal-loop primitive may drive this with it (goal = contract +
checks pass; cap = 3); elsewhere run the loop as written.

**Exit:** summon **reviewers/ds-lens** for the conformance pass · write the
one-line artifact manifest (fidelity · tools · PRD link · any unresolved check
failures) · hand to `skills/uno-review` for the stage lens.
