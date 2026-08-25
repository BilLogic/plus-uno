---
embodiment: ide
summary: The flow-map deliverable — its normative shape and how the designer runs it in the external tool.
---

<!-- ~350 tokens | Load when: the confirmed artifact is a user flow, journey map, or data-flow map -->

# Deliverable — flow map (user flow · journey map · data-flow)

**Execution mode: spec-handoff.** UNO writes a diagram-shaped prompt-spec
(normative shape: method §3); the designer runs it in the external tool. UNO
does not run the generation.

**Target tools:** FigJam (diagram generation) · Stitch (PRD → flow visuals).

## The spec must name

- Open by restating the confirmed brief card.
- The flow's **trigger → steps → outcome**, and every actor and system touched.
- The constraint list from grounding (blueprint constraints that shape the flow).
- **What feedback the sketch is meant to provoke** — a flow map exists to be
  reacted to; say what reaction is being fished for.
- End with the embedded **self-check block** (method §3): the brief card —
  including the fidelity dial settings — restated as pass/fail checks the
  generating tool verifies against its own output, regenerating once on failure.

**Where the spec lives.** Write it to
`docs/plans/YYYY-MM-DD-NNN-<slug>-<deliverable>-spec.md` (repo date-prefix
convention, `docs/engineering/coding.md`) and give the designer the path plus
the ready-to-paste text. The file is what `uno-review` receives with the
manifest.

## Handoff

Golden example: `skills/uno-prototype/examples/flow-map-spec.md`. Before handing off, run
`bash skills/uno-prototype/scripts/validate-spec.sh <spec.md>` — a [MISS] means
fill the section, not ship anyway. Deliver the spec ready-to-paste. Offer the paste-back: designer brings the
generated result here, UNO re-checks it against the same self-check block.
Exit per method §5: DS-lens pass at sketch rigor (no token nits on a flow
sketch) · one-line artifact manifest · hand to uno-review.
