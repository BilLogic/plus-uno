---
embodiment: ide
summary: Three wireframe routes by execution mode — ASCII in-chat, Figma wireframe, or static wireframe prompt-spec
---

<!-- ~550 tokens | Load when: the confirmed artifact is a wireframe (ASCII or Figma) -->

# Deliverable — wireframe

Three routes, by execution mode. Pick with the designer — the five fidelity
dials decide (ASCII when Visual is low and speed matters; Figma wireframe when
Visual is low–mid and the team comments on canvas; external wireframe spec when
a generator drafts the static layout). When Visual is high and Interaction is
none–low, route to `deliverables/static-mockup.md` instead.

## Route A — ASCII wireframe (in-chat, WIP artifact)

**Execution mode: in-chat — UNO produces it directly.** This is a deliberate
carve-out from "UNO is the prompt engineer, not the generator": ASCII is text,
no external tool is faked, so UNO draws it. Its job is **convergence, not
exit** — the designer reacts to boxes in the conversation, layout settles
cheap, and the settled structure feeds the next rung (a Figma wireframe,
static mockup, interactive spec, or coded build).

- Box-drawing characters, one screen per block, annotate interactive elements
  (`[button]`, `(radio)`, `▸ link`), name each screen and state.
- Iterate live; small revisions in-message. Style reference:
  `skills/uno-prototype/examples/ascii-wireframe.md`.
- Still checked against the brief card before it exits anywhere; if it exits,
  it produces the manifest line like every other artifact (method §5).

## Route B — Figma wireframe (MCP-direct)

**Execution mode: MCP-direct — UNO drives the Figma MCP.** All Figma writes go
through **writers/figma** (obeys `docs/connectors/figma/overview.md` — file
placement, page sections, annotations); write to the workspace through that
writer rather than directly. Building wireframes *from DS components* triggers
the registry gate: `design-system/guidelines/figma/registry-load-gate.md`.

## Route C — external wireframe spec (spec-handoff)

**Target tools:** Stitch (PRD → wireframe generation) · Figma Make (low–mid
wireframe layout). Write a **static wireframe prompt-spec** (normative shape:
method §3) — screen list, layout hierarchy, content blocks, real copy, sample
data, static screen states **including empty/error**, and what is out of scope
so the tool stays within the brief. Keep the spec scoped to static layout and
structure rather than interactive or functional behavior (interactive flows
belong in `deliverables/interactive.md`). End with the embedded self-check
block (brief card + the five dial settings as pass/fail checks). Golden
example: `skills/uno-prototype/examples/wireframe-spec.md`; check with
`bash skills/uno-prototype/scripts/validate-spec.sh <spec.md>`. Offer the
paste-back re-check.

**Where the spec lives.** Put it in the prototype's GitHub issue, in the body
or a comment, and give the designer the issue link plus the ready-to-paste
text. The Notion PRD may link it. The issue is what `uno-review` receives with
the manifest.

## Exit

All routes: method §5 — DS-lens pass at the artifact's own rigor · one-line
manifest (fidelity · tools · PRD link) · hand to uno-review.
