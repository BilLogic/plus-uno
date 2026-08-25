---
embodiment: ide
summary: The intake sequence is eight steps in order — prdcheck, prdpaste, then the Step 2 reflection gates reflectlearn, reflectartifactopen, reflectartifact, reflectfidelity, reflectexclu
---

<!-- ~2,400 tokens | Load when: a prototype run starts — this is the interview that produces the brief card -->

# uno-prototype — intake (the 8-question interview)

The intake sequence is eight steps in order — `prd_check`, `prd_paste`, then
the Step 2 reflection gates `reflect_learn`, `reflect_artifact_open`,
`reflect_artifact`, `reflect_fidelity`, `reflect_exclude`, `reflect_confirm`.
**The sequence is the contract; the hook is an accelerator.** Flow map (show it
with the first question): PRD → what you want to achieve → the artifact (your
words first, then a suggestion) → fidelity → what to leave out → confirm the
brief → build.

## Which mode am I in?

| Situation | How to tell | What to do |
|---|---|---|
| Hook-gated (Cursor · Claude Code · Codex) | `.cursor/hooks/briefings/active-intake-question.json` exists, its `conversationId` matches this session | Render the file's **current** step (`stateId`/`type`), per the rules below |
| Stale hook file | `conversationId` mismatch, or older than a day | Ignore the file; take the manual path |
| Gate off | `.cursor/settings.json` → `"uno": { "prdGate": false }` | Skip the interview; PRD gate still applies as an ordinary rule (method §0) |
| Manual (no adapter, hook failed) | No JSON appears, but there is a person to answer | Run the SAME eight steps yourself, in order, tracking your own position — the hook automates this procedure, it does not own it |
| Non-interactive (headless, CI, cron, scripted driver) | No turn exists in which anyone could answer | Same eight steps, answered from the PRD, declared as assumptions on an **ASSUMED** brief card — see § When no answer can come back at all |

## How to ask — the contract, not a tool name

**One question per message.** How it renders depends on what your runtime has,
and both forms are equally valid:

- **Runtime has an interactive question/choice tool** (any name — Claude Code's
  `AskUserQuestion`, Cursor's question UI, anything equivalent): use it for a
  SINGLE question with the options.
- **Runtime has no such tool** (some Cursor models, Codex, headless, plain
  chat): ask in plain text with the options as a **numbered list**.

The plain-text form is a first-class rendering, **not a degradation** — the
contract is one question, options shown, recommendation marked, free-form
answer always accepted (a bare number matching an option parses too — phrase
that affordance however fits the question you just asked, or leave it implicit).
Don't narrate tool mechanics mid-intake — just ask the question — and never
refuse to proceed because a tool is missing.

**When no answer can come back at all** — a single-shot or non-interactive run
(headless, CI, cron, a scripted driver), where there is no turn in which a
person could reply — asking is not available in any rendering. Proceed, but
proceed *visibly*:

- Answer each of the eight steps yourself, from the PRD and the grounding
  snapshot, and **write the answers down** as a numbered assumption list.
- Label the brief card **`ASSUMED — not confirmed`**. Confirmation is a human
  act; a card nobody confirmed is not a confirmed card, whatever it contains.
- Carry that label into the spec and the artifact manifest, so `uno-review`
  and the next human turn both see which decisions were nobody's.
- The missing-context gate (method §4) still fires. An assumption you had to
  make is exactly the thing it exists to surface — list it, don't smooth it.

Assuming in silence is the defect, not assuming. This is a degraded run by
construction: the interview's value is the designer's answers, and a run with
no designer in it has none of them.

## Rules — every step, both modes

1. Hook-gated: read `active-intake-question.json` first — the only source of
   truth for what to ask this turn.
2. **One question per message — no exceptions**, rendered per § How to ask.
   `choice` steps use the options from the JSON. Reflection steps: compose the
   PRD-specific options yourself (lead with the recommendation and mark it as
   such; add the alternatives that genuinely compete; always leave room to
   answer freely); honor `multiSelect`,
   `openEnded`, `confirm`, `stepIndex`/`stepTotal`. Plus Design System is always
   applied; never ask which design system to use.
3. **Set expectations, show position.** Open `prd_check` with the one-line flow
   map. Every step, show the `progressLabel` and mention once that saying
   **back** revises an earlier answer — nothing locks until the brief is
   confirmed.
4. **Never skip a step — but never re-interview either.** When the conversation
   already answers the current step, render that answer as the recommended
   option and ask to confirm, quoting where it came from ("your PRD's Goals
   section says X — confirm?"). The step still fires; a pre-answered step costs
   one tap. Only ask cold when the context is genuinely silent. No auto-advance,
   no batching.
5. **Forbidden during intake:** asking more than one question in a message;
   building; previewing later steps beyond the flow map.
6. Intake ends only when the **brief card is confirmed** at `reflect_confirm`.
   Then load the deliverable doc (§ Handoff below) and proceed to plan →
   generate. There is no separate fidelity-picker step.
   **Hard stop:** planning, spec-writing or building without having loaded that
   doc is a defect, not a shortcut — each one carries rules that exist nowhere
   else (the attempt cap, the machine-check set, the Figma question, the
   scaffold script, the asset-spec contract). If you cannot name the deliverable
   doc you loaded, you have not loaded it: stop and load it.

**PRD reuse:** after a PRD is provided once, the hook caches it — a follow-up
prototype request re-enters at `reflect_learn` (a revision may change the
strategy). Say **upload a new PRD** to start fresh. Exit without invoking the
skill: `skip PRD upload` / `terminate this process` (releases the workflow,
grants no PRD bypass).

## Step 1 — Understand (before Q1)

Gate: PRD required (method §0) — no PRD → stop, route to `skills/uno-synthesize`.
Ground first (method §1): writers/blueprint for this card's flows + constraints,
researchers/explorer for prior art; record the grounding snapshot. Then
summarize the PRD: feature overview · primary users · core workflow · design
constraints · remaining uncertainties. **Recommend nothing yet.**

## Step 2 — the four questions

Reflect *with* the designer, never decide for them. Every recommendation cites
concrete PRD evidence; confirm labels RESTATE the content (never a bare "looks
good"). Carry the missing-context gate (method §4) through — a missing screen
state or ambiguous interaction surfaces here, not as invented behavior later.
The lists below are vocabulary to pick from, not menus to show.

1. **What are you trying to achieve?** (multi-select — goals co-apply)
   Vocabulary: validate usability · explore concepts · compare alternatives ·
   evaluate visual direction · communicate product vision · align stakeholders ·
   reduce engineering ambiguity.
2. **What artifact fits? — two beats.** First OPEN-ENDED: *"In your own words,
   what do you picture making?"* — no options, no recommendation (anti-anchoring).
   Next turn, acknowledge their words, then a recommended artifact plus the
   alternatives that genuinely compete. Vocabulary: user flow · journey map ·
   data-flow map · wireframe · static mockup · concept image · storyboard ·
   interactive prototype · functional prototype · hi-fi build on the design
   system. Name the tradeoff for each.
3. **What fidelity is actually needed?** Render each dimension as a labeled
   low↔high dial line, each placement justified by PRD evidence:

   ```
   Visual        low ──●───── high — wireframe-clean is enough
   Interaction   low ────●─── high — the filter flow must actually work
   Scope         low ──●───── high — 3 screens, no settings
   Complexity    low ─●────── high — happy path only
   ```

   Then ONE question to confirm or adjust; the confirm option restates the
   settings ("Yes: mid visual, real interactions, 3 screens").
4. **What should it intentionally NOT include?** State the won't-include list
   in prose (screens skipped · interactions left fake · flows that need not
   exist), each item traceable to the PRD or goal; confirm with an option that
   restates the key exclusions, plus room to adjust or answer freely.

**Confirm the brief.** Assemble the answers into ONE brief card — Goal ·
Artifact · **Fidelity (the dial settings, not a label)** · Won't include — and
ask a single confirmation question. The confirmed card is the contract: the
plan restates it, generation builds against it, validation checks against it.

## Handoff — the Q2 answer selects the deliverable doc

| Confirmed artifact | Load |
|---|---|
| user flow · journey map · data-flow map | `deliverables/flow-map.md` |
| wireframe · static mockup | `deliverables/wireframe.md` |
| concept image | `deliverables/concept-image.md` |
| storyboard | `deliverables/storyboard.md` |
| interactive · functional prototype | `deliverables/interactive.md` |
| hi-fi build on the design system | `deliverables/coded-build.md` |

A failed review or an iteration by choice re-enters at the reflection
(`reflect_learn`), not at "fix the artifact" — the strategy itself may change.
