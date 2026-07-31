<!-- Runtime-neutral core — loaded by BOTH faces (SKILL.md in the IDE, bot.md in the Worker).
     No IDE tool names, no Slack formatting here; execution specifics live in the faces. -->

# uno-prototype — method

Turn a written requirement into a design artifact. UNO's role depends on the
deliverable's execution mode: for external-tool routes UNO is the **prompt
engineer, not the generator** — the spec is the output, the external tool
generates. Where UNO itself holds the medium (an in-chat text sketch, a
connected design tool driven through its gated writer), producing directly is
legitimate — the rule's target is hand-faking what a tool must render, never
delegated production through sanctioned channels. Hi-fi builds UNO makes
directly, against `uno-storybook`. Critique belongs to uno-review; sharing and
handoff to uno-publish. The hand-craft path bypasses this skill by design —
but nothing bypasses the stage-lens review.

## 0. PRD required — entry gate, all fidelities

No PRD → do not enter this skill. Applies to every route including hand-craft;
there are no exceptions and no "idea-only" bypass.

**Acceptable PRD forms (any one):**

1. **Notion PRD URL** — the document of record from `skills/uno-synthesize`
2. **Local PRD file** — a `.md` path in the repo (e.g. eval fixtures)
3. **Inline PRD body** — pasted in the same turn, with structured sections
   (user flows, acceptance criteria, scope, or equivalent)

**When PRD is missing:** stop immediately. Do not ground, scaffold, write a
prompt-spec, or touch `prototypes/`. Invite the designer to run
`skills/uno-synthesize` first (`notion_create` flow) and return with the PRD
link or approved inline draft. Never invent requirements to fill the gap.

**The intake contract.** Before any routing or building, an interview settles —
one question per message, no step skipped, a step the conversation already
answered rendered as a one-tap confirm (cite the source), never re-asked cold —
and ends in a confirmed **brief card**: goal · artifact · fidelity (as explicit
per-dimension dial settings) · won't-include. The card is the **contract**
carried into planning, generation, and validation. Plus Design System is always
applied and is never asked. Any runtime that can ask a question can run the
interview; runtimes with an intake hook automate it, others run it manually —
same steps, same order, same card.

## 1. Ground the brief — unconditional, scoped

No path from PRD to prototyping skips grounding, at any fidelity.

- Pull user flows, constraints, and current-state context from `uno-blueprint`,
  **scoped to this project's Roadmap card** plus globally-flagged constraints.
  Summarize long records — grounding is scoped retrieval, never a blueprint dump.
- Sweep for prior art: existing components, specs, and prototypes
  touching the same surface.
- **Figma grounding when a frame is in play — the runtimes are NOT symmetric:**
  the **IDE** connects to Figma directly (design context, screenshots, variable
  reads, gated write-back; see `design-system/figma/mcp-guide.md`). **uno-bot**
  gets a rendered screenshot of a pasted frame link (with `node-id`) plus
  text-layer reads — qualitative grounding only; variables, tokens, and
  computed values are IDE-only (the bot's full capability statement lives in
  `agents/uno-bot/AGENT.md § My lane`). The bot grounds the rest from the
  Notion doc/PRD that references the frame and runs its wall-ritual for
  spec-level work.
- Keep a grounding snapshot (what was read, when). Re-entry depends on it.

**Re-grounding rule:** on every re-entry — review returned issues, or the
designer iterates by choice — diff the PRD/blueprint against the grounding
snapshot. Changed → re-ground the delta. Unchanged → fix against the existing
grounding; never re-run the full ritual out of habit.

## 2. Choose the route

The designer chooses; UNO routes — and never gold-plates past the ask. The
confirmed artifact selects the deliverable: a **flow map**, **wireframe or
static mockup**, **concept image**, **storyboard**, or **interactive proof**
exits as a prompt-spec (or, where sanctioned, a directly-produced WIP
artifact); a **hi-fi build** is executed directly on the design system. Each
deliverable's procedure lives in its own reference; every deliverable honors
the same contract and exit ritual below.

A revision re-enters *here*, not at "fix the artifact" — a failed review may
legitimately change the deliverable or tool, not just content.

## 3. The prompt-spec — shape, then the self-check block

**Every prompt-spec names the same skeleton:** the flow's **trigger → steps →
outcome**, the actors and systems touched, and the constraints from grounding.
Specs for something interactive add the asset spec the generating tool needs —
real copy (never lorem), sample data, screen states **including empty and
error**, and the specific behavior under test. Always name what is out of scope,
so the tool doesn't invent it. Each deliverable's reference adds its own
specifics on top of this skeleton.

**Direct production is sanctioned only where UNO holds the medium:** an in-chat
text sketch, or a write through a gated design-tool writer. Everything else is a
spec the designer carries to the external tool.


Every prompt-spec ends with an embedded self-check: the confirmed brief
restated as concrete pass/fail checks (serves the goal · right artifact shape ·
at the agreed fidelity dials · nothing from the won't-include list, plus the
spec's own named states/constraints). The block instructs the generating tool
to verify its output against these checks and regenerate once if any fail. The
loop travels inside the spec, so it runs on any platform — no UNO-side runtime
needed. Where UNO can see the result (the designer pastes it back), UNO
re-checks against the same block. A spec is done when it is usable with at
most one regeneration.

## 4. Hard gates — at any fidelity

**Missing context → ask, never invent.** If the grounded brief lacks what the
artifact needs — screen states (empty/error/loading), an ambiguous interaction,
a missing Figma target or frame intent, unclear DS expectations — stop and ask
before building. Filling a gap with invented behavior is a defect, not a draft.

**DS gap → protocol, never silent invention.** When the design needs a
component the system doesn't have: (1) name the gap explicitly, (2) propose the
nearest existing composition as the interim, (3) file a uno-maintain intake for
the missing component. Zero hand-rolled lookalikes — a gap is a finding, not a
license to invent. Filing is an external-estate write, so it needs the usual
approval: if no approver is present, record the intake in the artifact manifest
as pending and say so — never drop the gap silently, and never write unasked.

## 5. Exit — validation, manifest, hand off

Before any artifact leaves the skill:

1. **Validation.** Coded artifacts run the validation loop their deliverable
   reference defines (objective: every available machine check passes AND the
   brief card is honored; capped attempts). Headless codegen faces run the
   check set as a deterministic post-step whose results land in the draft PR
   under "Machine checks" — the PR review is their fix loop, and a ❌ there
   blocks review sign-off, not PR creation. Spec deliverables carry their
   validation inside the spec (§3).
2. **DS-lens validation pass** — a conformance check at the artifact's own
   fidelity (no token nits on a flow sketch; full rigor on a hi-fi build).
   Major findings loop back to the route decision (§2).
3. **Artifact manifest** — one line: fidelity · tools used · PRD link, plus
   any unresolved check failures. Review's mandatory input; **every path exit
   produces it**.
4. Hand to **uno-review** for the stage-lens review. Passing review and being
   ready to share are separate gates — iteration by choice re-enters at §2.

## Quality bar

Scored against `docs/evals/rubrics/uno-prototype.md` — grounding-completeness ·
prompt-spec-quality · ds-compliance · fidelity-appropriateness, plus the two
hard gates above (pass/fail, they override the score). Golden scenarios:
`docs/evals/scenarios/uno-prototype.md`.
