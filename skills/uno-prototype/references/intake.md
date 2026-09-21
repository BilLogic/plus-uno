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

**One question per message.** Use the interactive tool for every question this
step, whenever your runtime has one:

- **Runtime has an interactive question/choice tool** (any name — Claude Code's
  `AskUserQuestion`, Cursor's question UI, anything equivalent): render every
  question through it — that's the default whenever the tool exists, including
  single-choice confirm steps. It matters most on `multiSelect` questions: the
  tool is what lets the designer pick more than one option at once, so a
  multi-select step goes through it whenever it's there.
- **Runtime genuinely has no such tool this session** (some Cursor models,
  Codex, headless, plain chat): ask in plain text with the options as a
  **numbered list** — the fallback for when nothing else is available.

Either rendering keeps the same contract: one question, options shown,
recommendation marked, free-form answer always accepted (a bare number
matching an option parses too — phrase that affordance however fits the
question you just asked, or leave it implicit). Ask the question directly,
skipping any narration of tool mechanics mid-intake; when no tool is
available this session, keep the interview moving with the plain-text form.

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
3. **What fidelity is actually needed?** Five dimensions — Visual, Interaction,
   Scope, Complexity, Content (how realistic the sample data is, vs.
   lorem-ipsum placeholder). Work out a 0-100 position for each internally,
   justified by concrete PRD evidence, but state that justification to the
   designer in response text as **dimension + tier label + one-line reason
   only** — e.g. "Visual — High: the PRD asks for a hi-fi build reviewed
   against real design-system components". The tier label and reason are
   what reach the designer; the numeric score stays internal, used only to
   place the widget's slider (or the fallback scale's marker).

   If `mcp__visualize__show_widget` is available this session, render the
   interactive dial widget **exactly once**: copy
   `skills/uno-prototype/references/fidelity-dial-widget.html` verbatim,
   filling only the five `__..._VALUE__` placeholders with the computed
   positions, and pass a `title` on that call — the call fails without one,
   and a failed call followed by a retry is what makes the widget appear to
   render twice. The widget's own Confirm button is the only confirmation
   this step needs, and rendering it once completes the step — end the turn
   there.

   The Confirm button sends back a message naming each dimension's tier (e.g.
   "Confirmed fidelity — Visual: High, Interaction: Functional, Scope: Core
   screen, Complexity: Standard, Content: Realistic."). Treat that message as
   the recorded answer for this step — carry those tier labels verbatim into
   the brief card's Fidelity line rather than re-asking or re-deriving them.

   Otherwise (no widget tool this session) fall back to a labeled low↔high
   scale line per dimension, naming the tier rather than the number:

   ```
   Visual        low ──●───── high — High: needs to look production-real
   Interaction   low ────●─── high — Functional: the filter flow must actually work
   Scope         low ──●───── high — Core screen: 3 screens, no settings
   Complexity    low ─●────── high — Standard: happy path only
   Content       low ───●──── high — Realistic: a couple of realistic sample rows is enough
   ```

   Then ONE question, through the interactive tool when available, to confirm
   or adjust; the confirm option restates the settings using tier labels
   ("Yes: high visual, functional interaction, core screen scope, standard
   complexity, realistic content").
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

## One step per turn

When `.cursor/hooks/briefings/active-intake-question.json` exists, read it and ask exactly that one hook step — AskQuestion with `questions.length === 1`, or one plain question. One step per turn, even when context already answers a later one: the interview's value is the order, and each step is weighed in its own turn.
