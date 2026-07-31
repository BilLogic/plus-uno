---
name: uno-prototype
description: >
  Turns a PRD or direction into a design artifact at a chosen fidelity —
  grounds the brief against uno-blueprint, then either engineers prompt-specs
  for external generative tools (low/mid fidelity) or builds hi-fi directly on
  the design system in the prototypes. Use when the user says "prototype this",
  "sketch the flow", "map the data flow", "generate a draft to validate",
  "build this PRD", "scaffold a prototype", "implement this Figma design",
  or has an approved requirement and needs a reviewable artifact. Not for
  critique (uno-review), sharing/handoff (uno-publish), or writing the PRD
  itself (uno-synthesize).
user-invocable: true
argument-hint: [prd-required] [fidelity]
allowed-tools: Read, Grep, Glob, Write, Edit, Bash, Task, mcp__figma__*, mcp__figma-plus__*, mcp__figma-parsnip__*, mcp__notion-plus__*
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

1. **Gate + interview** — PRD check, then the 8-question intake ending in a
   confirmed **brief card** (goal · artifact · fidelity dials · won't-include).
   The card is the contract for everything after.
2. **Understand** — ground via writers/blueprint + researchers/explorer
   (method §1), summarize the PRD back; recommend nothing yet.
3. **Deliver** — the confirmed artifact selects ONE deliverable doc (table
   below); plan, produce, validate per that doc.
4. **Exit** — ds-lens pass · one-line manifest · hand to `skills/uno-review`
   (method §5). Iteration or a failed review re-enters at the reflection, not
   at "fix the artifact".

Always optimize for **learning, not completeness**: the successful prototype is
the smallest artifact that lets the designer confidently answer their current
design question. Help the designer reduce scope, not grow it.

## Deliverables & routing

The designer chooses; UNO routes — no gold-plating past the ask.

| Confirmed artifact | Mode | Load |
|---|---|---|
| user flow · journey map · data-flow map | spec → FigJam / Stitch | `references/deliverables/flow-map.md` |
| wireframe · static mockup | ASCII in-chat · Figma MCP · spec → Stitch / Figma Make | `references/deliverables/wireframe.md` |
| concept image | spec → GPT / Gemini image gen | `references/deliverables/concept-image.md` |
| storyboard | spec → sequenced image prompts + captions | `references/deliverables/storyboard.md` |
| interactive · functional prototype | spec → Claude design / Figma Make / Stitch / v0 / AI Studio | `references/deliverables/interactive.md` |
| hi-fi build (approved PRD, settled direction) | UNO builds on the DS in `prototypes/` | `references/deliverables/coded-build.md` |

WIP ladder: flow map → ASCII → concept image / storyboard → Figma wireframe →
interactive → coded build. Each rung optional; WIP artifacts exist to converge
cheaply before the next rung.

## Load table

| Moment | Load |
|---|---|
| Always, on invocation | `references/method.md` (the shared core) |
| A prototype run starts | `references/intake.md` (the interview + fidelity dials) |
| Brief card confirmed | the ONE deliverable doc the artifact selects (table above) |
| Figma design input | `design-system/figma/registry-load-gate.md` (MANDATORY, registries first) → `design-system/figma/mcp-guide.md` |
| Building UI (components/tokens) | DS agent-views per **AGENTS.md § Progressive loading**; estate conventions per **loading-order.md § Tier 2** |

## Constraints

- **The intake owns its eight steps** (`references/intake.md`) — one question
  per message, never skipped, never batched; ends only at the confirmed brief
  card. The "do you have a Figma file?" question belongs to the coded-build
  doc, asked right before generation.
- **PRD gate is never skipped** (method §0). Exit the hook with
  `terminate this process` / `skip PRD upload` — that releases the workflow,
  it does not grant a PRD bypass.
- **Grounding is never skipped** (method §1) — not even for "just a quick
  sketch".
- **Generate only after the brief and plan are confirmed**, and stay within
  the agreed scope — never expand it because the PRD lists more.
- Low/mid external-tool routes: the output is the prompt-spec, never the
  generated artifact. In-chat and MCP-direct routes (ASCII, Figma wireframe)
  are the named exceptions — see the deliverable docs.
- Hi-fi: AGENTS.md forbidden patterns apply in full — tokens over literals,
  agent-views are law, no deep imports from `design-system/src/`, PLUS
  components first, FA Free icons only.
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
