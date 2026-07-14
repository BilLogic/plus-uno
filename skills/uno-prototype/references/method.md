<!-- Runtime-neutral core — loaded by BOTH faces (SKILL.md in the IDE, bot.md in the Worker).
     No IDE tool names, no Slack formatting here; execution specifics live in the faces. -->

# uno-prototype — method

Turn a written requirement into a design artifact at a chosen fidelity. At low
and mid fidelity UNO is the **prompt engineer, not the generator** — external
tools generate from UNO's briefs. Only at hi-fi does UNO build directly, against
`uno-storybook`. Critique belongs to uno-review; sharing and handoff to
uno-publish. The hand-craft path bypasses this skill by design — but nothing
bypasses the stage-lens review.

## 0. PRD required — entry gate, all fidelities

No PRD → do not enter this skill. Applies to low, mid, high, and hand-craft
routing alike; there are no exceptions and no "idea-only" bypass.

**Acceptable PRD forms (any one):**

1. **Notion PRD URL** — the document of record from `skills/uno-synthesize`
2. **Local PRD file** — a `.md` path in the repo (e.g. eval fixtures)
3. **Inline PRD body** — pasted in the same turn, with structured sections
   (user flows, acceptance criteria, scope, or equivalent)

**When PRD is missing:** stop immediately. Do not ground, scaffold, write a
prompt-spec, or touch `playground/`. Invite the designer to run
`skills/uno-synthesize` first (`notion_create` flow) and return with the PRD
link or approved inline draft. Never invent requirements to fill the gap.

The IDE enforces this at prompt submit via `.cursor/hooks/require-prd-for-prototype.sh`
(a data-driven conversation FSM in `.cursor/hooks/uno-prototype/` — stateless per message,
scoped by `conversation_id`); the skill body enforces it again on load.

**IDE hook behavior:** when prototype intent is detected, the hook runs a finite-state
workflow (PRD check → PRD upload/verify → fidelity branch [verification if PRD
hints] → branch-specific inputs → hi-fi settings table confirm / tool select) and blocks each message
until the current step is satisfied. **No step may be skipped** — PRD hints only
rephrase the current step as verification (e.g. high-fi in PRD → “generate high-fi?”).
Hi-fi confirmation shows a **single verification table** (project name, scope,
fidelity, required screens) prefilled from the PRD; Plus Design System is always
applied and is never asked.

**Agent rendering contract (intake):** the coding agent displays hook content
**one question per message** — never batches PRD, fidelity, Figma, or later steps
into a single AskQuestion call or reply. When
`.cursor/hooks/briefings/active-intake-question.json` exists, the agent reads only
that file's current `stateId` and `question`; choice steps use AskQuestion with
`questions.length === 1`; hi-fi confirm uses `type: confirmation_table` with one
AskQuestion for confirm/edit. Skipping a step because the user already answered in an
earlier message, attached a PRD, or named fidelity/Figma in the same turn is
forbidden — the FSM still asks that step for explicit verification.

To exit without invoking uno-prototype, say
`skip PRD upload` or `terminate this process`. That releases the workflow but does not grant a PRD bypass
inside the skill. After hi-fi settings are confirmed, the hook stops intercepting;
send `uno-prototype:execute` when ready to build. The briefing is written to
`.cursor/hooks/briefings/active-prototype-briefing.md`. Disable the gate for local testing:
`"uno": { "prdGate": false }` in `.cursor/settings.json`.

## 1. Ground the brief — unconditional, scoped

No path from PRD to prototyping skips grounding, at any fidelity.

- Pull user flows, constraints, and current-state context from `uno-blueprint`,
  **scoped to this project's Roadmap card** plus globally-flagged constraints.
  Summarize long records — grounding is scoped retrieval, never a blueprint dump.
- Sweep for prior art: existing components, specs, and playground prototypes
  touching the same surface.
- **Figma grounding when a frame is in play — the runtimes are NOT symmetric:**
  the **IDE** connects to Figma directly (`get_design_context`, `get_screenshot`,
  `get_variable_defs`, write-back via `create_new_file`, ✅-gated; see
  `figma-mcp-guide.md`). **uno-bot** gets a rendered screenshot of a pasted frame
  link (with `node-id`) plus text-layer reads — qualitative grounding only;
  variables, tokens, and computed values are IDE-only (the bot's full capability
  statement lives in `agents/uno-bot/AGENT.md § My lane`). The bot grounds the
  rest from the Notion doc/PRD that references the frame and runs its wall-ritual
  for spec-level work.
- Keep a grounding snapshot (what was read, when). Re-entry depends on it.

**Re-grounding rule:** on every re-entry at the fidelity decision — review
returned issues, or the designer iterates by choice — diff the PRD/blueprint
against the grounding snapshot. Changed → re-ground the delta. Unchanged → fix
against the existing grounding; never re-run the full ritual out of habit.

## 2. Choose fidelity

The designer chooses; UNO routes — and never gold-plates past the ask.

| Branch | The question it asks | UNO's role → output |
|---|---|---|
| **Low** | what are you working through? | prompt engineer → diagram-shaped prompt-spec |
| **Mid** | what's the challenge (what needs proving)? | prompt engineer → interactive/functional prompt-spec |
| **High** | none — direction is settled | builder → DS-compliant build on `uno-storybook` |
| **Hand-craft** | any fidelity, fully manual | none — skill steps aside; review still applies |

A revision re-enters *here*, not at "fix the artifact" — a failed review may
legitimately change fidelity or tool, not just content.

## 3. Low / mid — the two prompt-engineering modes

Generation quality is a briefing problem: UNO's job is upstream of the tool.
The two modes differ in kind — never merge them into one template.

**Diagram-shaped (low).** For user-flow & supporting-system maps, data-flow
maps, or flow-variety ideation. The spec names: the flow's trigger → steps →
outcome, actors and systems touched, the constraint list from grounding, and
what feedback the sketch is meant to provoke.

**Interactive/functional-shaped (mid).** For layout/interaction validation or
working-UI proofs. Everything above, plus the asset spec the tool needs: real
copy, sample data, screen states (incl. empty/error), and the specific
behavior under test. Name what's out of scope so the tool doesn't invent it.

Either mode ends with a prompt-spec the designer carries to the external tool —
usable with at most one regeneration. UNO does not run the generation.

## 4. High — build on the design system

Direction is settled; the work is execution on the system. DS compliance is
enforced by construction, not by review catching it later:

- **DS knowledge first, always**: components and tokens come from the DS
  agent-views before any UI code. Not in the agent-views → it does not exist.
- Tokens over literals, official layout formulas, PLUS components before
  generic primitives — the constitution's forbidden patterns apply in full.
- **Plan before large edits**: confirm the implementation plan and the list of
  touched files with the designer before any large or risky edit — scaffold
  layout, component choices, data shape. Small iterations don't need the gate.

## 5. Hard gates — at any fidelity

**Missing context → ask, never invent.** If the grounded brief lacks what the
artifact needs — screen states (empty/error/loading), an ambiguous interaction,
a missing Figma target or frame intent, unclear DS expectations — stop and ask
before building. Filling a gap with invented behavior is a defect, not a draft.

**DS gap → protocol, never silent invention.** When the design needs a
component the system doesn't have: (1) name the gap explicitly, (2) propose the
nearest existing composition as the interim, (3) file a uno-maintain intake for
the missing component. Zero hand-rolled lookalikes — a gap is a finding, not a
license to invent.

## 6. Exit — validate, manifest, hand off

Before the artifact leaves the skill:

1. **DS-lens validation pass** — a conformance check at the artifact's own
   fidelity (no token nits on a flow sketch; full rigor on a hi-fi build).
   Major findings loop back to the fidelity decision (§2).
2. **Artifact manifest** — one line: fidelity · tools used · PRD link. Review's
   mandatory input; every path exit produces it.
3. Hand to **uno-review** for the stage-lens review. Passing review and being
   ready to share are separate gates — iteration by choice re-enters at §2.

## Quality bar

Scored against `docs/evals/rubrics/uno-prototype.md` — grounding-completeness ·
prompt-spec-quality · ds-compliance · fidelity-appropriateness, plus the two
hard gates above (pass/fail, they override the score). Golden scenarios:
`docs/evals/scenarios/uno-prototype.md`.
