---
embodiment: ide
summary: The intake sequence is eight steps across four questions — prdcheck, prdpaste, reflectlearn, reflectartifactopen, reflectfidelity, reflectartifact, reflectexclude, reflectconfirm
---

<!-- ~1,800 tokens | Load when: a prototype run starts — this is the interview that produces the brief card -->

# uno-prototype — intake (eight steps, four questions)

The intake sequence is **eight steps across four questions** in order —
`prd_check`, `prd_paste`, then the Step 2 reflection steps `reflect_learn`
(Q1: goal and audience), `reflect_artifact_open` (Q2: designer's own words),
`reflect_fidelity` (Q3 beat 1: the five fidelity dials), `reflect_artifact`
(Q3 beat 2: suggested deliverable from the dials), `reflect_exclude` (Q4:
won't-include), and `reflect_confirm` (brief card confirmation).

**One source of question text:** `.cursor/hooks/uno-prototype/intake-steps.json`
holds the step list, the question text, the five dimension definitions, and the
full deliverable vocabulary (`user flow`, `journey map`, `data-flow map`,
`ASCII wireframe`, `Figma wireframe`, `concept image`, `storyboard`,
`static hi-fi mockup`, `interactive prototype`, `functional prototype`,
`hi-fi build on the design system`). Both the hook runner and this reference
read that file so hooked and manual sessions offer the exact same questions and
deliverable options.

Flow map (show with `prd_check`):
`PRD → goal & audience → your words → five fidelity dials → deliverable suggestion → what to leave out → confirm the brief → build`.

## Which mode am I in?

| Situation | How to tell | What to do |
|---|---|---|
| Hook-gated (Cursor · Claude Code · Codex) | This turn's hook message points at the session's brief card (`.cursor/hooks/briefings/<session>.json`) and names `current step = <id>` | Ask only the named current step; when the designer answers, write their answer to that step's field on the brief card (one field per turn) |
| Gate off | `.cursor/settings.json` → `"uno": { "prdGate": false }` | Skip the interview; PRD gate still applies as an ordinary rule (method §0) |
| Manual (no hook context, person present) | No hook message appears, and there is a person to answer | Read `.cursor/hooks/uno-prototype/intake-steps.json` and run the same eight steps in order, one per message |
| Non-interactive (headless, CI, cron, scripted driver) | No turn exists in which a person could reply | Answer the eight steps from the PRD, record them as a numbered assumption list, and label the brief card **`ASSUMED — not confirmed`** |

## How to ask — the contract, not a tool name

**One question per message.** Render with your runtime's interactive choice tool
when present, or as a numbered plain-text list when absent — both forms are
first-class. Show the `progressLabel` from `intake-steps.json`, mark the
recommended choice when offering options, and always accept a free-form answer
or a bare option number. Mention once at the start that saying **back** clears
the last filled field on the brief card and **restart** resets the card to
`prd_check`.

**When no answer can come back at all** (headless, CI, cron, scripted driver):
answer the eight steps from the PRD and grounding snapshot, write them down as
a numbered assumption list, and label the brief card **`ASSUMED — not confirmed`**.
Carry that label into the spec and the artifact manifest, and surface any
missing-context items (method §4) visibly alongside the output.

## Rules — every step, both modes

1. **Single source:** read `.cursor/hooks/uno-prototype/intake-steps.json` for
   the step order, `question`, `progressLabel`, `options`, and `guidance`.
2. **One step per message — no exceptions.** In hooked sessions, write the
   designer's answer to the current step's field in `.cursor/hooks/briefings/<session>.json`
   before asking the next empty step. Filling more than one field in a single
   turn triggers a hook warning.
3. **Verify rather than skip when pre-answered.** When the PRD or conversation
   already answers the current step, present that answer as the recommended
   one-tap confirm (quoting where it came from) rather than skipping the step or
   asking cold.
4. **Stay in intake until `reflect_confirm` is filled.** Only after the brief
   card is confirmed do you load the selected deliverable reference (§ Handoff
   below) and proceed to Step 3 (Plan) → Step 4 (Generate).

## Step 1 — Understand (after `prd_paste`, before Q1)

Gate: PRD required (method §0) — if `prd_check` is `No`, stop and route to
`skills/uno-synthesize`. Once the PRD arrives at `prd_paste`, ground first
(method §1): summon `writers/blueprint` for the card's flows and constraints,
and `researchers/explorer` for prior art; record the grounding snapshot. Then
summarize the PRD: feature overview · primary users · core workflow · design
constraints · remaining uncertainties. **Recommend nothing yet.**

## Step 2 — the four questions (steps 3–8 in `intake-steps.json`)

Reflect *with* the designer. Every recommendation cites concrete PRD evidence;
confirm labels restate the content being confirmed. Carry the missing-context
gate (method §4) through so missing states or ambiguous interactions surface
here.

1. **Q1 (`reflect_learn`) — What are you trying to achieve, and who will see it?**
   (multi-select). Ask both the learning goal and the audience (teammates,
   students/tutors in a study, stakeholders, engineers) — audience drives
   **Visual** and **Data/Content**. Vocabulary in `intake-steps.json`:
   validate usability · explore concepts · compare alternatives · evaluate
   visual direction · communicate product vision · align stakeholders · reduce
   engineering ambiguity.
2. **Q2 (`reflect_artifact_open`) — In your own words, what do you picture making?**
   Open-ended beat first, before any dials or deliverable recommendation
   (anti-anchoring).
3. **Q3, beat 1 (`reflect_fidelity`) — The five fidelity dimensions.**
   Define and render all five dimensions as labeled low↔high dial lines, each
   placement justified by PRD evidence, the audience from Q1, and the designer's
   words from Q2:
   - **Visual** — how closely the look and styling match production (rough boxes ↔ design-system tokens and components).
   - **Interaction** — how much of the UI responds to user input (static ↔ clickable transitions ↔ working controls and state).
   - **Breadth** — how much of the product or journey is covered (one moment ↔ a few screens ↔ an end-to-end flow).
   - **Depth** — how fully a single feature or path is worked through (happy path ↔ edge cases, empty/error states, and branching logic).
   - **Data/Content** — how realistic the copy and data are (labels only ↔ representative sample rows ↔ real copy and production-shaped data).

   ```
   Visual        low ──●───── high — wireframe-clean is enough
   Interaction   low ────●─── high — the filter flow must actually work
   Breadth       low ──●───── high — 3 screens, no settings
   Depth         low ─●────── high — happy path only
   Data/Content  low ───●──── high — realistic sample rows, real labels
   ```

   Ask one question to confirm or adjust the five dials; the confirm label
   restates the five settings.
4. **Q3, beat 2 (`reflect_artifact`) — Deliverable suggestion from the dials.**
   Acknowledge the designer's words from Q2, then suggest the deliverable
   selected by the confirmed dials per the routing table in
   `skills/uno-prototype/SKILL.md` § Deliverables & routing (plus 1–2 competing
   alternatives from `intake-steps.json`, naming the tradeoff for each).
   **Rule:** only **Interaction** high or **Data/Content** high routes to a
   coded build; high **Visual** with none–low **Interaction** routes to the
   **static hi-fi mockup** in Figma on DS components.
5. **Q4 (`reflect_exclude`) — What should the prototype intentionally NOT include?**
   State the exclusions in prose (screens skipped · interactions left fake ·
   flows omitted), each traceable to the PRD, goal, or low dials, and confirm
   with a label that restates the key exclusions.
6. **Confirm the brief (`reflect_confirm`).** Assemble the answers into ONE
   brief card — Goal & audience · Designer's words · Fidelity (all five dial
   settings) · Deliverable · Won't include — and ask a single confirmation
   question.

## Handoff — the confirmed deliverable selects ONE reference doc

| Confirmed deliverable | Load |
|---|---|
| user flow · journey map · data-flow map | `deliverables/flow-map.md` |
| ASCII wireframe · Figma wireframe | `deliverables/wireframe.md` |
| concept image | `deliverables/concept-image.md` |
| storyboard | `deliverables/storyboard.md` |
| static hi-fi mockup (Figma MCP on DS components) | `deliverables/static-mockup.md` |
| interactive prototype · functional prototype | `deliverables/interactive.md` |
| hi-fi build on the design system | `deliverables/coded-build.md` |

A failed review or an iteration by choice re-enters at `reflect_learn`, rather
than at "fix the artifact" — the dials or deliverable may change.

## One step per turn

When this turn's hook context points at the session's brief card
(`.cursor/hooks/briefings/<session>.json`), read `.cursor/hooks/uno-prototype/intake-steps.json`
and ask only the current step (the first empty field on the card). Write at most
one field per turn into the brief card as the designer answers each step. Only
the person's own turn advances a step: a `<task-notification>`, a
`<system-reminder>`, a subagent hand-back, or a message relayed from another
session leaves the brief card untouched.
