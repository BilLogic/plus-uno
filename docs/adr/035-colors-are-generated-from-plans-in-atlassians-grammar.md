---
embodiment: ide
summary: PLUS colors follow Atlassian's token grammar under --ds- (semantic) and --palette- (primitive), generated in the repo from plan files that hold primitive values only; a plan swaps without touching the semantic layer, and a parity check enforces it (2026-10-25)
status: active
verified: 2026-10-25 (#1454)
---

# ADR-035: Colors are generated from plans in Atlassian's grammar (2026-10-25)

**Decision.** PLUS color tokens take Atlassian's semantic grammar, `color.property.role.emphasis.state`, written `--ds-*` in CSS, over OKLCH primitive ramps written `--palette-*`, in four modes (light, dark and each with increased contrast). The repo generates them: `npm run generate:color-tokens` reads a **plan** (`scripts/lib/color/plans/plan-*.json`) and the vendored Atlassian reference (`scripts/lib/color/atlassian-tokens.json`, @atlaskit/tokens 20.7.0) and writes `design-system/src/tokens/color/`, the Figma spec included. A plan holds primitive values only: ramp recipes, neutral hexes, alpha slot percents, shadow geometry. The semantic layer, every PLUS override included, is one module shared by every plan (`scripts/lib/color/semantics.mjs`). `ACTIVE_PLAN` picks the plan the repo builds (Plan A, Paper); Plan B stays generated and checked.

**Why.** Swapping a direction should change values, never meanings: if a plan could remap a token, choosing a plan would be choosing a second semantic layer nobody reviewed. Generating in the repo makes the contrast promises checkable on every pull request rather than in a design file. Atlassian's grammar comes with its elevation pairs, increased-contrast themes and published usage guidance, which PLUS would otherwise author from nothing. The research, the 24 decisions and the specs are in `docs/plans/2026-10-24-color-system-proposal.md`.

**Consequences.** `check:color-system` fails when two plans map any token to different primitive references (plan parity), or when either plan breaks a contrast pair, accent pairing, row-state ground, collapsed state, tint against the frame, chart color-vision separation or teal-against-Lagoon distance. `check:color-tokens` fails on drift between the plan and the committed files. For color, Figma is downstream of the repo, the reverse of the other token families. — uno (agent), Oct 2026, recording the decision Bill settled in the proposal
