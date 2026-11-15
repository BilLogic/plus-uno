---
name: uno-prototype
description: >
  Turns a PRD or direction into a design artifact at a chosen fidelity —
  grounds the brief against uno-blueprint, sets the five fidelity dimensions
  (Visual, Interaction, Breadth, Depth, Data/Content), then routes to the
  matching deliverable: flow map, wireframe, concept image, storyboard, static
  hi-fi mockup in Figma, interactive prompt-spec, or coded build on the design
  system. Use when the user invokes /uno-prototype or has an approved
  requirement and needs a reviewable artifact. Not for critique (uno-review),
  sharing/handoff (uno-publish), or writing the PRD itself (uno-synthesize).
argument-hint: "[prd-required] [fidelity]"
allowed-tools: Read, Grep, Glob, Write, Edit, Bash, Task, mcp__figma__*, mcp__figma-plus__*, mcp__figma-parsnip__*, mcp__notion-plus__*
embodiment: ide
summary: PRD → design artifact
---

# Prototype

PRD → design artifact. This file routes; the procedures live in the
references below — load them at the moments the load table names.

## Agents it summons

writers/blueprint (grounding reads) · researchers/explorer (prior art) ·
reviewers/ds-lens (exit validation) · writers/figma (Figma frames) — defined
in `agents/` (see `agents/README.md`). Summoned by this skill, never by users.

## When to use / when NOT

**Use when** a **PRD is already available** (usually from uno-synthesize) and
needs to become an artifact. **PRD is mandatory at entry (method §0)** —
Notion PRD URL, local `.md` path, or inline PRD body (user flows + acceptance
criteria minimum). No PRD → stop and invite `skills/uno-synthesize`.

**Not for:** critiquing an artifact (→ `skills/uno-review`) · sharing or
handoff (→ `skills/uno-publish`) · drafting the PRD (→ `skills/uno-synthesize`)
· DS-library component maintenance (→ `skills/uno-maintain`) · hand-crafted
work — the designer's manual path carries no skill; it re-joins at review.

## The workflow

1. **Gate + interview** — eight steps across four questions (`references/intake.md`
   and `.cursor/hooks/uno-prototype/intake-steps.json`): PRD check + PRD paste,
   then Q1 (goal and audience), Q2 (designer's own words), Q3 (the five fidelity
   dials → suggested deliverable), Q4 (won't-include), and brief confirmation.
   Ends in a confirmed **brief card** — the contract for everything after.
2. **Understand** — ground via writers/blueprint + researchers/explorer
   (method §1), summarize the PRD back; recommend nothing yet.
3. **Deliver** — the five fidelity dials select the deliverable and its ONE
   reference doc (table below); plan, produce, validate per that doc.
4. **Exit** — ds-lens pass · one-line manifest · hand to `skills/uno-review`
   (method §5). Iteration or a failed review re-enters at the reflection
   (`reflect_learn`), not at "fix the artifact".

Always optimize for **learning, not completeness**: the successful prototype is
the smallest artifact that lets the designer confidently answer their current
design question. Help the designer reduce scope, not grow it.

## Deliverables & routing

The five fidelity dimensions (`Visual`, `Interaction`, `Breadth`, `Depth`,
`Data/Content`) choose the deliverable; UNO routes without gold-plating past the
dials. **Rule: only Interaction high or Data/Content high sends work to a coded
build; high Visual with none–low Interaction routes to the static hi-fi mockup
in Figma on DS components, not a coded build.**

| Visual | Interaction | Breadth | Depth | Data | Deliverable, tool | Load |
|---|---|---|---|---|---|---|
| any | none | wide | shallow | none | Flow map (user flow · journey map · data-flow map), FigJam / Stitch | `references/deliverables/flow-map.md` |
| low | none–low | few screens | low | low | ASCII wireframe, in chat | `references/deliverables/wireframe.md` |
| low–mid | none | few screens | low | low–mid | Figma wireframe, Figma MCP | `references/deliverables/wireframe.md` |
| high | none | one moment / a sequence | none | — | Concept image / storyboard, image generation | `references/deliverables/concept-image.md` · `references/deliverables/storyboard.md` |
| high | none–low | few screens | low | mid–high | **Static hi-fi mockup, Figma MCP on DS components** | `references/deliverables/static-mockup.md` |
| low–mid | mid–high | narrow | mid | low–mid | Interactive / functional prototype, Figma Make / Stitch / v0 / Claude design | `references/deliverables/interactive.md` |
| any | high | any | high or Data high | | Coded build on the design system, `prototypes/` (or `@plus-uno/cli`) | `references/deliverables/coded-build.md` |

WIP ladder: flow map → ASCII → concept image / storyboard → Figma wireframe →
static hi-fi mockup → interactive → coded build. Each rung optional; WIP
artifacts exist to converge cheaply before the next rung.

## Load table

| Moment | Load |
|---|---|
| Always, on invocation | `references/method.md` (the shared core) |
| A prototype run starts | `references/intake.md` + `.cursor/hooks/uno-prototype/intake-steps.json` (the 8-step, 4-question interview + five fidelity dials) |
| Brief card confirmed | the ONE deliverable doc the confirmed deliverable selects (table above) |
| Figma design input or static hi-fi mockup | `design-system/guidelines/figma/registry-load-gate.md` (MANDATORY, registries first) → `design-system/guidelines/figma/mcp-guide.md` |
| Building UI (components/tokens) | DS agent-views per **AGENTS.md § Progressive loading**; estate conventions per **AGENTS.md § The loading contract** |

## Constraints

- **The intake owns its eight steps and four questions** (`references/intake.md`,
  `.cursor/hooks/uno-prototype/intake-steps.json`) — one step per message, never
  skipped, never batched; ends only at the confirmed brief card. The "do you
  have a Figma file?" question belongs to the coded-build doc, asked right
  before generation.
- **PRD gate is never skipped** (method §0). Exit the hook with
  `terminate this process` / `skip PRD upload` — that releases the workflow,
  it does not grant a PRD bypass.
- **Grounding is never skipped** (method §1) — not even for "just a quick
  sketch".
- **Generate only after the brief and plan are confirmed**, and stay within
  the agreed scope — never expand it because the PRD lists more.
- **The deliverable doc is not optional.** Planning, spec-writing or building
  without loading the one the confirmed deliverable selects is a defect — it
  carries rules that exist nowhere else. If you cannot name the doc you loaded,
  stop and load it.
- External-tool routes: the output is the prompt-spec, never the generated
  artifact. Direct production is sanctioned only where UNO holds the medium
  (in-chat ASCII, or a gated MCP writer — Figma, image gen); each deliverable
  doc names its own routes.
- Hi-fi coded builds: `AGENTS.md` § Hard rules apply in full, and
  `check:ds-usage` is their gate at exit (`references/deliverables/coded-build.md`).
- This skill builds; it does not judge (uno-review), share (uno-publish), or
  change the DS library (uno-maintain).
- New packages, Figma writes, and blueprint writes require explicit approval
  or the named writer agent — never direct.
- **Figma MCP unavailable?** The implement-design workflow halts — ask for
  exported frames/screenshots and say why; never approximate a Figma design
  from memory.

## Quality bar

Scored against `docs/evals/rubrics/uno-prototype.md` (grounding-completeness ·
prompt-spec-quality · ds-compliance · fidelity-appropriateness; the two hard
gates are pass/fail). Golden scenarios: `docs/evals/scenarios/uno-prototype.md`.
