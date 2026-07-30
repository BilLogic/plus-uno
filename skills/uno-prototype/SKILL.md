---
name: uno-prototype
description: >
  Turns a PRD or direction into a design artifact at a chosen fidelity —
  grounds the brief against uno-blueprint, then either engineers prompt-specs
  for external generative tools (low/mid fidelity) or builds hi-fi directly on
  the design system in the prototypes. Use when the user says "prototype this",
  "sketch the flow", "map the data flow", "generate a draft to validate",
  "build this PRD", "scaffold a prototype", "implement this Figma design",
  or has an approved requirement and needs a reviewable artifact. Not for
  critique (uno-review), sharing/handoff (uno-publish), or writing the PRD
  itself (uno-synthesize).
user-invocable: true
argument-hint: [prd-required] [fidelity]
allowed-tools: Read, Grep, Glob, Write, Edit, Bash, Task, mcp__figma__*, mcp__notion-plus__*
---

# Prototype

## Agents it summons

writers/blueprint (grounding reads) · researchers/explorer (prior art) ·
reviewers/ds-lens (exit validation) · writers/figma (prototypes frames) —
defined in `agents/` (see `agents/README.md`). Per the interaction contract,
these are summoned by this skill, never by users.

PRD → design artifact, fidelity-routed. The full procedure is
[`references/method.md`](references/method.md) — this file is the IDE
execution layer over it.

## When to use / when NOT

**Use when** a **PRD is already available** (usually from uno-synthesize) and
needs to become an artifact: a flow sketch, a data-flow map, an interactive
draft, a working-UI proof, or a hi-fi prototypes build.

**PRD is mandatory at entry (method §0).** Acceptable forms: Notion PRD URL,
local `.md` path, or inline PRD body in the same message (user flows +
acceptance criteria minimum). No PRD → stop and invite
`skills/uno-synthesize` — do not prototype on an idea alone.

**Not for:** critiquing an artifact (→ `skills/uno-review`) · sharing,
replicas, or handoff (→ `skills/uno-publish`) · drafting the PRD
(→ `skills/uno-synthesize`) · DS-library component maintenance
(→ `skills/uno-maintain`) · hand-crafted work — the designer's manual path
carries no skill; it re-joins at review.

## Fidelity routing

Method §2 in brief — the designer chooses, UNO routes, no gold-plating:

| Ask | Fidelity | UNO's role |
|---|---|---|
| "sketch / map / work through the flow" | low | prompt engineer — diagram-shaped spec for FigJam / Stitch |
| "validate / prove it works" | mid | prompt engineer — interactive/functional spec for Claude design / Figma Make / Stitch / v0 / Google AI Studio |
| "build it" (approved PRD) | high | builder — DS-compliant prototypes build against uno-storybook |
| designer draws it themselves | hand-craft | none — stay out of the way |

## Workflow (IDE execution of method.md)

The IDE face front-loads a **reflection pass** before any routing or building:
Understand → Prototype Reflection → Prototype Plan → Generate. The method.md
procedures (grounding §1, prompt-spec modes §3, hard gates §5, validation loop
§6) are unchanged — they are folded into these four steps. Always optimize for
**learning, not completeness** (see Guiding Principle at the end).

### Intake mode — the hook enforces the PRD gate AND Step 2 reflection

When `.cursor/hooks/briefings/active-intake-question.json` exists, you are in
**hook-gated intake**. The FSM owns eight steps in order — `prd_check`,
`prd_paste`, then the Step 2 reflection gates `reflect_learn`,
`reflect_artifact_open`, `reflect_artifact`, `reflect_fidelity`,
`reflect_exclude`, `reflect_confirm`. Render the **current** one (the file's
`stateId` / `type` tell you which):

1. Read `active-intake-question.json` first — the only source of truth for what
   to ask this turn (`oneQuestionOnly` and `neverSkipStep` are always true).
2. **One question per message — no exceptions.** If `type` is `choice`, call
   **AskQuestion** with a `questions` array of length **1** (the prompt + its
   options from the JSON). If `type` is `reflection`, call **AskQuestion** with a
   single question and **compose the PRD-specific options yourself** (recommended
   first, labeled "(Recommended)", 1–2 alternatives, then Other) following the
   `guidance` field; honor `multiSelect`, `openEnded`, `confirm`, and the
   `stepIndex`/`stepTotal`. Otherwise ask that one question in plain text. Plus
   Design System is always applied; never ask which design system to use.
3. **Set expectations, show position.** At `prd_check`, open with the one-line
   flow map (the hook instruction carries it) so the designer sees the whole
   road before the first question. Every step, show the JSON's `progressLabel`
   with the question, and mention once that saying **back** revises an earlier
   answer — this is prototyping *with* the designer; nothing locks until the
   brief is confirmed.
4. **Never skip a step.** Even when the user's message already contains a PRD or
   an obvious strategy, still ask the current gate step. Do not auto-advance and
   do not batch the reflection questions.
5. **Forbidden during intake:** batching steps into one AskQuestion; loading
   `method.md`; building; or previewing later steps beyond the flow map.
   (Grounding + the Step 1 Understand summary are expected *before* answering
   `reflect_learn` — the step-1 instruction says so.)
6. Intake ends only after the **brief card is confirmed** at `reflect_confirm`.
   The hook then emits its **build handoff** message — carrying the confirmed
   brief (goal · artifact · fidelity · exclusions) as the contract — clears
   `active-intake-question.json`, and stops intercepting. From that point **you**
   run Step 3 (Plan) → Step 4 (Generate) against that contract. There is **no
   separate fidelity-picker step**: fidelity is reasoned through inside
   `reflect_fidelity`.

**PRD reuse within a conversation:** after a PRD is provided once, the hook
caches it. A follow-up prototype request for the same project skips PRD check +
paste and **re-enters the reflection at `reflect_learn`** (a revision may change
the strategy). Say **upload a new PRD** to clear the cache and start fresh.

If intake JSON is absent, do **not** improvise or batch-ask — tell the user to
invoke `uno-prototype` / say `prototype this` so the hook can run the PRD gate.

---

### Step 1 — Understand (grounding folded in)

**Gate: PRD required** (method §0). No PRD → stop; `skills/uno-synthesize`
creates it (`notion_create` on approval). Return here once filed. The hook
enforces this at entry; enforce it again on load. No exceptions.

Then **ground before summarizing** (method §1 — unconditional, scoped to the
card): summon **writers/blueprint** for this card's flows, constraints, and
current-state context + global constraints; summon **researchers/explorer** for
prior art in the repo (components, specs, `prototypes/` prototypes). Record the
grounding snapshot. On re-entry: diff the PRD/blueprint against the snapshot,
re-ground only the delta (method §1).

Carefully read the PRD and, grounded against the above, **summarize**:

- **Feature overview**
- **Primary users**
- **Core workflow**
- **Design constraints**
- **Remaining uncertainties or assumptions**

**Do not recommend any prototype yet.** First make sure the feature is
correctly understood — then move to reflection.

### Step 2 — Prototype Reflection

Reflect **with** the designer on what should be prototyped — never decide *for*
them. Offer suggestions *with reasoning*, always grounded in the PRD, and let
the designer reshape them; remind them they can say **back** to revise any
earlier answer until the brief is confirmed.

**Ask the four questions one by one** — each as its own **AskQuestion** call with
`questions.length === 1`, never batched. Carry the missing-context hard gate
(method §5) through this step: if grounding lacks a screen state, an interaction
is ambiguous, or DS/Figma expectations are unclear, surface it here rather than
inventing later.

**Presentation rules (keep it lean — long option menus waste the designer's
attention and tokens):**
- **Lead with a recommendation** (except the open-ended beat of Q2). Put the
  recommended choice first (label it "(Recommended)") — then at most one or two
  alternatives — then **Other**. Don't enumerate every possibility from the
  lists below; those are your vocabulary to pick from, not the menu to show.
- **Anchor every recommendation in PRD evidence** — quote or name the section
  that motivates it, never generic reasoning.
- **One line per option**, and **confirm-option labels restate the content**
  being confirmed (e.g. "Yes: mid visual, 3 screens") — never a bare "All look
  right" a designer could click without reading.
- Q1 (goals) may be multi-select since several goals can co-apply; the rest are
  single-select.

1. **What are you trying to achieve?** Recommend the most likely goal(s)
   for *this* PRD (multi-select), one line each on why — drawn from: validate
   usability · explore concepts · compare alternatives · evaluate visual
   direction · communicate product vision · align stakeholders · reduce
   engineering ambiguity.
2. **What artifact fits? — two beats.** First ask **open-ended**: *"In your own
   words, what do you picture making?"* — no recommendation, no options menu;
   the designer's framing comes before yours (anti-anchoring). Next turn,
   acknowledge their words, then offer **one recommended artifact + one
   alternative + Other** — drawn from: user flow · journey map · wireframe ·
   static mockup · interactive prototype · functional prototype. One line of
   tradeoff each; never imply only one correct answer.
3. **What fidelity is actually needed?** Rather than one "hi/lo" label, render
   each dimension as a labeled **low↔high scale line** so the dials are visible
   at a glance (e.g. `Visual   low ──●───── high — wireframe-clean is enough`),
   covering:
   - **Visual** — how polished must the interface appear?
   - **Interaction** — which interactions must behave realistically?
   - **Scope** — which parts are in; what is intentionally out?
   - **Complexity** — which scenarios must be supported; can edge cases simplify?

   Then one AskQuestion to **confirm or adjust the dials** — the confirm label
   restates the settings.
4. **What should the prototype intentionally NOT include?** Give the "won't
   include" list in prose (screens skipped · interactions left fake · flows that
   need not exist · details that won't move the goal), then confirm with
   **one confirm option + two alternatives + Other** — not a long checklist.

**Then confirm the brief.** Assemble the four answers into **one brief card**
(rows: Goal · Artifact · Fidelity · Won't include) and ask a single AskQuestion
to confirm it. The confirmed card is **the contract**: Step 3 restates it, Step
4 builds against it, and the validation loop checks the artifact against it.

The reflection resolves to a fidelity route for Step 4 (the **Fidelity routing**
table above): the artifact + fidelity dimensions map onto low/mid = prompt-spec,
high = DS build. A revision re-enters *here* (method §2), not at "fix the
artifact" — a failed review may legitimately change the strategy.

### Step 3 — Prototype Plan

Once the designer **confirms the brief**, generate the prototype plan — the
blueprint for implementation. **Open by restating the confirmed brief card**
(goal · artifact · fidelity · won't include), then include:

- pages or frames
- user flows
- interactions
- component requirements
- variants (if useful)
- prototype outputs

**Confirm the plan + touched files** with the designer before any large or risky
edit (method §4). Small iterations don't need the gate.

### Step 4 — Generate

Only **after the strategy is confirmed** do you generate. The artifact must
faithfully follow the agreed strategy — do **not** add screens or interactions
just because they appear in the PRD. Route by the agreed fidelity (method §2):

- **Low/mid → prompt-spec, not generation.** Write the prompt-spec in the matching
  mode (method §3) and hand it to the designer for the external tool
  (FigJam / Stitch / Claude design / Figma Make / v0 / Google AI Studio). UNO does
  not run the generation. **The spec ends with an embedded self-check block**
  (method §3): the brief-card contract restated as pass/fail checks the external
  tool must verify against its own output before returning — the loop travels
  with the spec, so it works on any platform. Offer the designer a paste-back:
  bring the generated result here and UNO re-checks it against the contract.
- **High → build in `prototypes/`:**
  a. **Ask for a Figma file first — one AskQuestion, before any build.** The
     moment high-fi is the confirmed route and *before* you generate, ask the
     designer: *"Do you already have a Figma file you want to build upon?"*
     (single **AskQuestion**, `questions.length === 1`, Yes / No). This is the
     one hook step that moved into the agent — the hook no longer asks fidelity,
     so this question now lives here, at the threshold of high-fi generation.
     - **Yes** → get the Figma link, then follow the full implement-design
       workflow in [`references/figma-mcp-guide.md`](references/figma-mcp-guide.md)
       — no skipped steps; translate variables to tokens via
       `design-system/figma/token-registry.json` (gate:
       [`references/figma-registry-mandatory-load.md`](references/figma-registry-mandatory-load.md)).
     - **No** → build from the confirmed plan on the design system directly.
  b. Scaffold from `prototypes/starter/` per `design-system/docs/setup.md`
     (vite config: [`examples/vite-config-example.js`](examples/vite-config-example.js)).
  c. Load the DS agent-views (Tier-2 table below) **before any component or token
     use**; verify props against source + stories.
  d. **Gate: DS gap** (method §5). Needed component not in
     `design-system/agent-views/components/index.md` → name it, propose the
     nearest existing composition, file a uno-maintain intake. Never hand-roll a
     lookalike.
  e. Playground frames or wip placement in Figma → summon **writers/figma**
     (obeys `docs/conventions/figma-workspace.md`).

**Validate & exit** (method §6 — the validation loop). Hi-fi: iterate until clean,
max 3 attempts (stop conditions in method §6). **The loop's objective is the
brief-card contract plus the machine checks**: the artifact serves the confirmed
goal, sits at the confirmed fidelity dials, and contains nothing from the
won't-include list — a build that passes every script but violates the brief has
NOT converged. A runtime with a goal-loop primitive may drive this with it
(goal = contract + checks pass; cap = 3); elsewhere run the loop as written.
This face's check set — the interactive-IDE set; a runtime without Storybook MCP
or a browser runs the two scripts and records the rest as unavailable, not as
failures:

- `bash skills/uno-prototype/scripts/validate-prototype.sh prototypes/{project}`
- `bash skills/uno-review/scripts/run-review-checks.sh prototypes/{project}`
  — a pre-flight of review's deterministic catches; fixing them here saves a
  review round-trip (the review lenses still run on exit).
- Stories touched → Storybook MCP `run-story-tests` (a11y included).
- Open the running preview and verify the pages render, key interactions work,
  and the console is clean — scripts can pass while the page is visibly broken;
  the browser is the check of record for UI.

All fidelities: summon **reviewers/ds-lens** for the conformance pass, write the
one-line artifact manifest (fidelity · tools · PRD link · any unresolved check
failures), then hand to `skills/uno-review` for the stage lens.

## Guiding Principle

**Always optimize for learning, not completeness.** A successful prototype is not
the one with the most screens, the highest visual fidelity, or the most realistic
interactions — it is the **smallest artifact that lets the designer confidently
answer their current design question.** Whenever possible, help the designer
**reduce** scope rather than increase it.

## Tier-2 loads

DS agent-views and layout patterns load per **AGENTS.md § Progressive loading**; estate conventions per **loading-order.md § Tier 2**. Neither is restated here — this table is only what is specific to prototyping.

| Trigger | Load |
|---|---|
| Figma link / implement-design workflow | `design-system/figma/component-registry.json` + `token-registry.json` (MANDATORY — load first; gate: [`references/figma-registry-mandatory-load.md`](references/figma-registry-mandatory-load.md)), then [`references/figma-mcp-guide.md`](references/figma-mcp-guide.md) |
| Exhaustive lookup: prior-art roots · token sources · tool wiring | [`references/examples-index.json`](references/examples-index.json) · [`references/tokens-index.json`](references/tokens-index.json) · [`references/integrations-index.json`](references/integrations-index.json) |

## Quality bar

Scored against `docs/evals/rubrics/uno-prototype.md` (grounding-completeness ·
prompt-spec-quality · ds-compliance · fidelity-appropriateness; the two hard
gates are pass/fail). Golden scenarios: `docs/evals/scenarios/uno-prototype.md`.

## Constraints

- **Hook = PRD gate + Step 2 reflection, then handoff** — when `prdGate` is on,
  `.cursor/hooks/uno-prototype/` runs `prd_check` → `prd_paste` →
  `reflect_learn` → `reflect_artifact_open` → `reflect_artifact` →
  `reflect_fidelity` → `reflect_exclude` → `reflect_confirm`,
  one step per message, writing `active-intake-question.json` each turn. Render
  **one** step per message: **AskQuestion** with `questions.length === 1` — for
  `reflection` steps you compose the PRD-specific options from the `guidance`
  field (the `openEnded` beat takes free text, no menu; the `confirm` beat
  assembles the brief card from the JSON's `reflection` answers). Only after the
  brief is confirmed does the hook emit its **build-handoff** message — carrying
  the contract — and stop intercepting; **you** then run Step 3 (Plan) → Step 4
  (Generate). The hook does not run a separate fidelity-picker
  step (fidelity is `reflect_fidelity`); the "do you have a Figma file?" question
  is asked by the agent in Step 4's high-fi branch, right before generation. The
  same FSM backs both IDEs: Cursor via `beforeSubmitPrompt` (`run.mjs`) and
  Claude Code via `UserPromptSubmit` (`claude-code-run.mjs` +
  `.claude/settings.json`).
- **One question at a time everywhere** — the PRD-gate steps *and* the Step 2
  reflection beats are each their own hook-gated AskQuestion
  (`questions.length === 1`). The hook enforces this; never batch reflection
  questions or dump the whole reflection at once even if the JSON weren't present.
- **PRD gate is never skipped** — method §0; route to `skills/uno-synthesize`
  when PRD is absent. Exit the hook with `terminate this process` or
  `skip PRD upload` to leave without invoking this skill.
- Grounding is never skipped — not even for "just a quick sketch"; it is folded
  into Step 1 (Understand), before the PRD summary.
- **Do not recommend a prototype during Step 1**, and do not auto-decide the
  strategy in Step 2 — suggest with reasoning and let the designer choose.
- **Generate only after the strategy is confirmed** (Step 4), and stay within the
  agreed scope — never expand it just because the PRD lists more.
- Low/mid: output is the prompt-spec, never the generated artifact.
- Hi-fi: AGENTS.md forbidden patterns apply in full — tokens over literals,
  DS knowledge (agent-views) is law, no deep imports from
  `design-system/src/`, PLUS components first, FA Free icons only.
- This skill builds; it does not judge (uno-review), share (uno-publish), or
  change the DS library (uno-maintain).
- New packages, Figma writes, and blueprint writes all require explicit
  approval or the named writer agent — never direct.
- **Figma MCP unavailable?** The implement-design workflow halts — ask for exported frames/screenshots and say why; never approximate a Figma design from memory (the no-skipped-steps rule includes its inputs).
