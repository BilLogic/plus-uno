<!-- ~350 tokens | Load when: the confirmed artifact is an interactive or functional prototype built by an external tool -->

# Deliverable — interactive / functional prototype (external tool)

**Execution mode: spec-handoff.** UNO writes an interactive/functional-shaped
prompt-spec (normative shape: method §3); the designer runs it. UNO does not
run the generation. (A functional prototype built *on the design system in
this repo* is `coded-build.md`, not this.)

**Target tools:** Claude design · Figma Make · Stitch · v0 · Google AI Studio.

## The spec must name

- Open by restating the confirmed brief card.
- Everything a diagram spec names (trigger → steps → outcome, actors,
  constraints from grounding), **plus the asset spec** the tool needs:
  - **real copy** — never lorem;
  - **sample data** — realistic values, enough rows to exercise the layout;
  - **screen states including empty and error** — a missing state here becomes
    invented behavior there (missing-context gate, method §4: if grounding
    lacks a state, ask, don't invent);
  - **the specific behavior under test** — which interaction must actually
    work, at which fidelity dial setting.
- **What is out of scope** — name it explicitly so the tool doesn't invent it
  (the won't-include list travels into the spec).
- End with the embedded **self-check block** (method §3): brief card + dial
  settings as pass/fail checks; the tool verifies its own output, regenerates
  once on failure. The loop travels inside the spec — no UNO-side runtime.

**Where the spec lives.** Write it to `prototypes/_specs/<slug>-<deliverable>.md`
and give the designer the path plus the ready-to-paste text. Not `docs/plans/`
— that belongs to `ce:plan`. The file is what `uno-review` receives with the
manifest.

## Handoff

Golden example: `skills/uno-prototype/examples/interactive-spec.md`. Before handing off, run
`bash skills/uno-prototype/scripts/validate-spec.sh <spec.md>`. Spec ready-to-paste, usable with at most one regeneration (the rubric's bar).
Offer the paste-back re-check against the same block. Exit per method §5:
DS-lens at the artifact's rigor · manifest line · uno-review.
