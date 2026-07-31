<!-- ~550 tokens | Load when: the confirmed artifact is a wireframe or static mockup -->

# Deliverable — wireframe / static mockup

Three routes, by execution mode. Pick with the designer — the fidelity dials
usually decide (ASCII when Visual is low and speed matters; Figma when the
team needs to comment on canvas; spec when an external generator adds value).

## Route A — ASCII wireframe (in-chat, WIP artifact)

**Execution mode: in-chat — UNO produces it directly.** This is a deliberate
carve-out from "UNO is the prompt engineer, not the generator": ASCII is text,
no external tool is faked, so UNO draws it. Its job is **convergence, not
exit** — the designer reacts to boxes in the conversation, layout settles
cheap, and the settled structure feeds the next rung (a Stitch/Figma Make spec
or the coded build).

- Box-drawing characters, one screen per block, annotate interactive elements
  (`[button]`, `(radio)`, `▸ link`), name each screen and state.
- Iterate live; small revisions in-message. Style reference:
  `examples/ascii-wireframe.md`.
- Still checked against the brief card before it exits anywhere; if it exits,
  it produces the manifest line like every other artifact (method §5).

## Route B — Figma wireframe (MCP-direct)

**Execution mode: MCP-direct — UNO drives the Figma MCP.** All Figma writes go
through **writers/figma** (obeys `docs/conventions/figma-workspace.md` — file
placement, prefixes, annotations); never write to the workspace directly.
Building wireframes *from DS components* triggers the registry gate:
`design-system/figma/registry-load-gate.md`.

## Route C — external tool spec (spec-handoff)

**Target tools:** Stitch (PRD → wireframe generation) · Figma Make (mid visual
polish). Write an interactive/functional-shaped prompt-spec (normative shape:
method §2) — everything a diagram spec names, plus the asset spec — real copy,
sample data, screen states **including empty/error**, and what is out of scope
so the tool doesn't invent it. End with the embedded self-check block (brief
card + dial settings as pass/fail checks). Golden example:
`examples/wireframe-spec.md`; check with
`bash skills/uno-prototype/scripts/validate-spec.sh <spec.md>`. Offer the
paste-back re-check.

## Exit

All routes: method §5 — DS-lens pass at the artifact's own rigor · one-line
manifest (fidelity · tools · PRD link) · hand to uno-review.
