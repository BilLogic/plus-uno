# uno-synthesize — method

<!-- Runtime-neutral core, loaded by both faces (SKILL.md in the IDE, bot.md in the Worker).
     Golden scenarios: docs/evals/scenarios/uno-synthesize.md · rubric: docs/evals/rubrics/uno-synthesize.md -->

Distill context that already exists into documented findings, then — only on the
designer's explicit go — a PRD with its paired uno-blueprint write. Two exits, both
successes: a drafted PRD, or documented evidence to sunset or postpone.

## Scope — distill, don't generate

- Synthesize owns ingesting/condensing **existing** context and everything from the
  findings doc onward. Generating **new** evidence — new data queries, user studies,
  SME conversations — is uno-research. Boundary test: does the context exist yet?
- Data rule: ingesting a prior analysis or report is synthesize; running new queries
  against raw data is research, regardless of whether the data existed.
- **Match depth to the ask.** "What did people say in this thread?" gets a scoped
  summary with attributions — no findings doc, no PRD ceremony. The full pipeline
  below is for synthesis aimed at a build/no-build decision.

## 1 · Ingest

Sources arrive as threads, transcripts, meeting notes, docs, analytics pulls, and
designs — via a connector where one exists, pasted or exported text otherwise. Never
claim a connection that isn't there; work from what the designer provides. From every
source, extract: notes, goals, constraints, designs, timeline — what was actually
said or measured, never what you assume.

## 2 · Findings & Takeaways — the toll gate

Every gathering path (thread summary, ingested docs, data analysis, interview raw
material) converges on a documented **Findings & Takeaways** doc — Notion, Research
& notes DB — before any judgment. Documentation is the toll gate, not an afterthought;
it is what makes multi-pass gathering additive instead of circular.

Structure: key points · decisions (with who, when known) · action items · user flows ·
screen list · open questions · people/SMEs involved · recommendation.

Traceability discipline — the faithfulness spine:

- Every claim cites its source (thread, page, file, speaker, query result). No source,
  no claim. One invented finding fails the whole run.
- Every provided source appears in coverage. If a source contributed nothing, say so —
  never let one silently drop out.
- A designer-asserted claim the sources don't support is **not a finding**. Flag it as
  unsupported and park it in open questions as a uno-research candidate — never
  launder an assertion into evidence.
- Genuine unknowns go to open questions, never guessed. Attribute decisions only when
  the source makes the owner clear.

## 3 · STOP — the designer's two gates

After the findings doc, **stop**. Two sequential judgments follow; both are the
designer's calls, never the agent's:

1. **Enough context?** No → name exactly what's missing and loop back to gathering
   (more ingestion here, or hand to uno-research for new evidence). Findings
   accumulate across passes.
2. **Worth pursuing?** Three outcomes — never default to yes:
   - **Yes** (explicit) → draft the PRD (§4).
   - **No** → the findings doc plus its reasoning IS the deliverable: documented
     evidence to sunset or postpone, reusable when the idea resurfaces.
   - **Not sure** → a context deficit, not a soft no — loop back to gathering.
     Never force a call on thin evidence.

The agent recommends (the findings doc's recommendation section) and asks the gate
questions; it never answers them. Drafting a PRD on anything short of an explicit
yes is a scenario failure.

## 4 · PRD

Draft from the documented findings — reuse, don't re-derive: findings → summary /
problem / goals; user flows + screen list → requirements & scope; action items →
acceptance criteria; open questions carry over. Every key PRD claim traces to a
documented finding (target: 100%).

Instantiate from the Notion PRD template (see `docs/conventions/notion.md` —
templates are referenced, never duplicated). Draft first and let the designer
refine; instantiate/file only on approval.

## 5 · Acceptance — the paired write

On PRD acceptance, **in the same action**:

1. Write the structured distillation — stories, user flows, screen list — to
   uno-blueprint per the write schema (`docs/conventions/supabase.md`).
2. **PRD and blueprint update together.** A lone write to either is a defect and a
   rubric hard-gate failure.
3. Move the project's Roadmap card to `Design Status: Ready for Design` —
   exact-match existing select options; never create options, pillars, features, or
   OKR relations (`docs/conventions/notion.md`).

Blueprint writes in an accepted-PRD context are pre-authorized; any other blueprint
edit routes through uno-maintain.

## Variant — update summary (retrospective)

When a shipped change (e.g. a DS component update) needs distilling, produce an
**update summary** — a retrospective, not a PRD: what changed · why (link the PRD /
driving frame) · visual & behavioral impact · migration/usage notes · where to see
it. Report only changes the PRD / PR / Figma actually show — never invent change
items. Same faithfulness rules as §2.

## Quality bar

- `docs/evals/rubrics/uno-synthesize.md` — faithfulness (one hallucination =
  automatic fail) · coverage · template conformance · traceability; paired write and
  schema validity are hard gates.
- `docs/evals/scenarios/uno-synthesize.md` — the four golden scenarios every change
  to this skill must keep passing.
