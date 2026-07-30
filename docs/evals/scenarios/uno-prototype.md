# uno-prototype — eval scenarios

<!-- written 2026-07-07 (evals-first, before the body rewrite); verified against the rewritten bodies by the 2026-07-08 golden runs — see docs/evals/runs/. Rubric: docs/evals/rubrics/uno-prototype.md -->

## S0 — PRD required gate (entry)
- **Trigger:** "prototype this tutor-onboarding idea" (no PRD link, file, or inline body)
- **Expected:** stops before grounding; invites `skills/uno-synthesize` to create a PRD; does not scaffold, write a prompt-spec, or touch `playground/`
- **Fails if:** it proceeds without a PRD · it invents requirements to fill the gap

## S1 — low-fi: prompt engineer, not generator
- **Trigger:** "quick flow sketch of the tutor-onboarding idea to react to"
- **Expected:** grounds against the card's PRD/blueprint records + global constraints; produces a prompt-spec for the external tool (diagram-shaped mode) rather than building; fidelity stays low
- **Fails if:** it gold-plates a hi-fi build for a sketch ask · it skips grounding because "it's just low-fi"

## S2 — hi-fi: build against the design system
- **Trigger:** "build the approved monthly-report PRD in the prototypes"
- **Expected:**
  - Grounding reads via writers/blueprint (live, this card's scope) + researchers/explorer for prior art
  - Built directly against uno-storybook; agent-views consulted before any component/token use
  - reviewers/ds-lens validation pass before the artifact leaves the skill
- **Fails if:** hardcoded colors/spacing/typography · a component absent from the agent-views appears · deep imports from `design-system/src/`

## S3 — missing-context gate
- **Trigger:** a PRD from the seeded incomplete set (`docs/evals/fixtures/uno-prototype-seeds/` — spans fidelities), e.g. one with no empty/error states and an ambiguous filter interaction
- **Expected:** the missing-context prompt fires and asks before building (100% catch on the seeded incomplete set)
- **Fails if:** it fills gaps with invented behavior

## S4 — DS-gap protocol
- **Trigger:** the design needs a component that is not in the agent-views / uno-storybook (the gate keys on component-index absence, not BS4)
- **Expected:** gap protocol fires — names the gap, proposes nearest existing composition, files a uno-maintain intake for the missing component; zero silent inventions
- **Fails if:** a lookalike gets hand-rolled without the protocol

## S5 — re-entry after review
- **Trigger:** stage-lens review returned major issues; prototype re-enters
- **Expected:** re-grounds only if the PRD/blueprint diff changed since the first pass; otherwise fixes against the existing grounding
- **Fails if:** it re-does the full grounding ritual on every loop (waste) or skips re-grounding when the PRD actually changed

## S6 — intake: one question per turn
- **Trigger:** `active-intake-question.json` exists at a choice FSM state (e.g. `fidelity_select`) after the user says "prototype this" and shares a PRD
- **Expected:** agent reads the JSON file and asks **exactly one** hook step this message — AskQuestion with `questions.length === 1`, or one plain-text question
- **Fails if:** it batches PRD + fidelity + Figma (or any later steps) into one AskQuestion call · it lists a multi-step intake checklist · it improvises the full workflow when the JSON file is present

## S7 — intake: never skip a step
- **Trigger:** user starts with inline PRD that already states high-fidelity, Figma link, and scope (e.g. "prototype this student dashboard" + deliverables in the same message)
- **Expected:** hook still starts at the PRD check choice (`prd_check`, AskQuestion); agent still asks each later FSM step in order — verification wording when PRD hints exist, but **no auto-advance** past unanswered steps
- **Fails if:** it skips the PRD check or `fidelity_select` because the PRD already answers them · it starts grounding or building before intake JSON is cleared and `uno-prototype:execute` is sent
