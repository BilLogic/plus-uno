---
name: uno-prototype
description: >
  Turns a PRD or direction into a design artifact at a chosen fidelity —
  grounds the brief against uno-blueprint, then either engineers prompt-specs
  for external generative tools (low/mid fidelity) or builds hi-fi directly on
  the design system in the playground. Use when the user says "prototype this",
  "sketch the flow", "map the data flow", "generate a draft to validate",
  "build this PRD", "scaffold a playground", "implement this Figma design",
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
reviewers/ds-lens (exit validation) · writers/figma (playground frames) —
defined in `agents/` (see `agents/README.md`). Per the interaction contract,
these are summoned by this skill, never by users.

PRD → design artifact, fidelity-routed. The full procedure is
[`references/method.md`](references/method.md) — this file is the IDE
execution layer over it.

## When to use / when NOT

**Use when** a **PRD is already available** (usually from uno-synthesize) and
needs to become an artifact: a flow sketch, a data-flow map, an interactive
draft, a working-UI proof, or a hi-fi playground build.

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
| "build it" (approved PRD) | high | builder — DS-compliant playground build against uno-storybook |
| designer draws it themselves | hand-craft | none — stay out of the way |

## Workflow (IDE execution of method.md)

### Intake mode — mandatory before anything else

When `.cursor/hooks/briefings/active-intake-question.json` exists, you are in
**hook-driven intake**. The hook FSM owns step order; you only render the
**current** step:

1. Read `active-intake-question.json` first — it is the only source of truth
   for what to ask this turn (`oneQuestionOnly` and `neverSkipStep` are always
   true).
2. **One question per message — no exceptions.** Ask exactly one hook step per
   reply. If `type` is `choice`, call **AskQuestion** with a `questions` array
   of length **1** — that single prompt and its options from the JSON file.
   If `type` is not `choice`, ask exactly that one question in plain text.
3. **Never skip a step — no exceptions.** Even when the PRD, the user's first
   message, or conversation history already states fidelity, Figma, scope, or
   deliverables, you still ask the matching FSM step as a **verification**
   question (e.g. “I see your PRD indicates high-fidelity — generate a high-fi
   prototype?”). Do not auto-route, auto-select, or start building.
4. **Forbidden during intake:** batching multiple hook steps into one
   AskQuestion call; listing PRD + fidelity + Figma together; loading
   `method.md`; grounding; building; tables of later steps; or any preview of
   steps the JSON file does not name.
5. Intake ends when the file is removed and the user sends `uno-prototype:execute`
   (read `active-prototype-briefing.md` then).

If intake JSON is absent and the user did not send `uno-prototype:execute`, do
**not** improvise the workflow or batch-ask PRD/fidelity/Figma yourself — tell
them to invoke `uno-prototype` / say `prototype this` so the hook can start
intake one step at a time.

0. **Gate: PRD required** (method §0 — before anything else). Verify a PRD is
   present (Notion link, local `.md`, or inline structured body). Missing →
   stop; explain that `skills/uno-synthesize` creates the PRD (`notion_create`
   on approval) and return here once filed. No exceptions at any fidelity.
1. **Ground** (method §1 — unconditional, scoped to the card).
   Summon **writers/blueprint** for the grounding read: this card's flows,
   constraints, current-state context + global constraints. Summon
   **researchers/explorer** for prior art in the repo (components, specs,
   `playground/` prototypes). Record the grounding snapshot in the working
   notes. On re-entry: diff first, re-ground only on change (method §1).
2. **Gate: missing context** (method §5). Empty/error states, ambiguous
   interactions, missing Figma target or DS expectations → ask before building.
3. **Route by fidelity** (method §2).
   - **Low/mid** → write the prompt-spec in the matching mode (method §3) and
     hand it to the designer for the external tool. Do not generate.
   - **High** → build in `playground/`:
     a. Scaffold from `playground/starter/` per
        [`references/template-selection-guide.md`](references/template-selection-guide.md)
        (vite config: [`examples/vite-config-example.js`](examples/vite-config-example.js)).
     b. Load the DS cheat-sheets (Tier-2 table below) **before any component
        or token use**; verify props against source + stories.
     c. **Confirm the implementation plan + touched files** with the user
        before large edits (method §4).
     d. Figma input? Follow the full implement-design workflow in
        [`references/figma-mcp-guide.md`](references/figma-mcp-guide.md) —
        no skipped steps; translate values per
        [`references/figma-token-mapping.md`](references/figma-token-mapping.md).
     e. Playground frames or wip placement in Figma → summon **writers/figma**
        (obeys `docs/conventions/figma-workspace.md`).
4. **Gate: DS gap** (method §5). Needed component not in the cheat-sheet →
   name it, propose the nearest existing composition, file a uno-maintain
   intake. Never hand-roll a lookalike.
5. **Validate & exit** (method §6). Hi-fi: run
   `bash skills/uno-prototype/scripts/validate-prototype.sh playground/{project}`.
   All fidelities: summon **reviewers/ds-lens** for the conformance pass,
   write the one-line artifact manifest (fidelity · tools · PRD link), then
   hand to `skills/uno-review` for the stage lens.

## Tier-2 loads (mirrors AGENTS.md § Progressive loading)

| Trigger | Load |
|---|---|
| Building UI, using components or tokens | `docs/context/design-system/components/cheat-sheet.md` (MANDATORY) — content sections: [`references/cheat-components.md`](references/cheat-components.md) · [`references/cheat-forms.md`](references/cheat-forms.md) · [`references/cheat-tokens.md`](references/cheat-tokens.md) |
| Building new pages, dashboards, layouts | `docs/context/design-system/components/layout-cheat-sheet.md` (MANDATORY) |
| Figma link / implement-design workflow | [`references/figma-mcp-guide.md`](references/figma-mcp-guide.md) (PRIMARY) |
| Grounding read / any blueprint touch | `docs/conventions/supabase.md` |
| Writing frames/annotations to Figma | `docs/conventions/figma-workspace.md` |
| Exhaustive lookup: prior-art roots · token sources · tool wiring | [`references/examples-index.json`](references/examples-index.json) · [`references/tokens-index.json`](references/tokens-index.json) · [`references/integrations-index.json`](references/integrations-index.json) |

## Quality bar

Scored against `docs/evals/rubrics/uno-prototype.md` (grounding-completeness ·
prompt-spec-quality · ds-compliance · fidelity-appropriateness; the two hard
gates are pass/fail). Golden scenarios: `docs/evals/scenarios/uno-prototype.md`.

## Constraints

- **Hook FSM + AskQuestion intake** — when `prdGate` is on, `.cursor/hooks/uno-prototype/`
  advances one step per message and writes `active-intake-question.json`. You
  render **one** step per message: **AskQuestion** with `questions.length === 1`
  (choice steps) or a single plain-text question. Never batch steps; never skip a
  step because context already answers it; never dump the full PRD/fidelity/Figma
  checklist during intake.
- **PRD gate is never skipped** — method §0; route to `skills/uno-synthesize`
  when PRD is absent. The IDE hook runs a finite-state workflow before the agent
  starts; exit with `terminate this process` or `skip PRD upload` to leave the
  workflow without invoking this skill. After invoke branches complete, send
  `uno-prototype:execute` and read `.cursor/hooks/briefings/active-prototype-briefing.md`.
- Grounding is never skipped — not even for "just a quick sketch".
- Low/mid: output is the prompt-spec, never the generated artifact.
- Hi-fi: AGENTS.md forbidden patterns apply in full — tokens over literals,
  cheat-sheet is law, no deep imports from `design-system/src/`, PLUS
  components first, FA Free icons only.
- This skill builds; it does not judge (uno-review), share (uno-publish), or
  change the DS library (uno-maintain).
- New packages, Figma writes, and blueprint writes all require explicit
  approval or the named writer agent — never direct.
- **Figma MCP unavailable?** The implement-design workflow halts — ask for exported frames/screenshots and say why; never approximate a Figma design from memory (the no-skipped-steps rule includes its inputs).
