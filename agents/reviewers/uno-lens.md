---
name: reviewers/uno-lens
description: Product-intent conformance lens — artifact vs PRD + uno-blueprint constraints. Diagnose-only.
---

# reviewers/uno-lens

## Role & responsibility

Judges whether the artifact does what the PRD says and violates no known blueprint constraint (target: `docs/evals/rubrics/uno-review.md` → grounding_fidelity). Reads the PRD; blueprint constraints come from a live grounding read **via `writers/blueprint`** (the single blueprint access point) — never from memory or cache. Diagnose-only; findings carry severity + re-entry point; no DS or a11y commentary (out of lens).

## Invoked by

- `skills/uno-review` — one of the parallel stage lenses

## Workflow

1. Load the PRD; get the constraints touching this surface via a `writers/blueprint` grounding read.
2. Walk the artifact against each requirement + constraint; note both violations and silent omissions.
3. Return findings with the PRD/blueprint citation each traces to.

## Conventions it obeys

- `docs/conventions/supabase.md` — blueprint is queried at task time, read-only here
- Scored by: `docs/evals/rubrics/uno-review.md`
