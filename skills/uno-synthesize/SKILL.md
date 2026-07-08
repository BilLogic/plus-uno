---
name: uno-synthesize
description: >
  Distills gathered context — Slack thread exports, interview transcripts,
  meeting notes, analytics pulls, docs — into a documented Findings & Takeaways
  doc and, on the designer's explicit go, a PRD with its paired uno-blueprint
  write. Use when the user says "synthesize this", "summarize the findings",
  "what are the takeaways", "what did people say", "what would we build",
  "draft the PRD", "write the update summary", or has collected raw context
  that needs distilling toward a build/no-build decision. Ingests existing
  context only — running new queries against raw data is uno-research.
user-invocable: true
argument-hint: [sources-to-distill | "draft the PRD"]
allowed-tools: Read, Grep, Glob, Write, Task, mcp__notion-plus__*
---

# uno-synthesize — IDE face

The procedure lives in [`references/method.md`](references/method.md) (always load):
ingest → findings toll gate → STOP at the designer's two gates → PRD → paired
blueprint write. This file adds only IDE execution — sources, tools, and the agents
this skill summons.

## When to use / when NOT

- **Use** when context already exists — a pasted thread, transcript, notes, a prior
  analysis, referenced docs — and needs distilling: a scoped summary, a findings
  doc, a PRD, or a shipped-change update summary. Match depth to the ask
  (method § Scope): a quick "what did people say?" gets a summary with
  attributions, not the full pipeline.
- **NOT** for generating new evidence — new data queries, user studies, SME
  sourcing, codebase exploration → `skills/uno-research`. Not for building from an
  accepted PRD → `skills/uno-prototype`.
- Boundary test: does the context exist yet? For data: ingesting a prior analysis
  is synthesize; running new queries is research.

## Sources — how context arrives here

Only Notion and Figma have MCP in this repo; everything else arrives as pasted text
or an exported file/query result. Say so — never claim a connection that isn't there.

| Source | Path in |
|---|---|
| Notion pages | `mcp__notion-plus__*` or paste |
| Figma frames | Figma MCP or link/paste |
| Slack · Zoom · Gmail · Box · Clarity · Metabase | paste / export only |
| Local files, repo, research briefs | `Read` / `Grep` / `Glob` |

## Execution — method steps → IDE actions

| Method step | In the IDE |
|---|---|
| 1 · Ingest | `Read`/`Grep`/`Glob` local material; pull referenced Notion pages via `mcp__notion-plus__*` |
| 2 · Findings doc | summon **writers/notion** → Findings & Takeaways in the Research & notes DB |
| 3 · STOP | present findings + recommendation; ask "enough context?" then "worth pursuing?"; wait for the designer |
| 4 · PRD | draft inline for refinement; on approval, summon **writers/notion** → instantiate from the PRD template |
| 5 · Paired write | on acceptance, summon **writers/blueprint** → stories/flows/screens to uno-blueprint **in the same action** as the PRD write; Roadmap card → `Design Status: Ready for Design` |

No-go and not-sure outcomes at step 3 are deliverables too — see method § 3.

## Agents it summons

`writers/notion` · `writers/blueprint` — defined in `agents/` (see
`agents/README.md`). Per the interaction contract they are summoned by this skill,
never by users. writers/blueprint enforces the paired-write contract; writers/notion
enforces the allowlist and exact-match selects.

## Tier-2 loads

| When | Load |
|---|---|
| always | `references/method.md` |
| any Notion write | `docs/conventions/notion.md` |
| any blueprint write | `docs/conventions/supabase.md` |
| human-facing prose | `docs/conventions/writing-style.md` |

## Quality bar

`docs/evals/rubrics/uno-synthesize.md` scores every run — one hallucinated finding
is an automatic fail; PRD + blueprint updating together is a hard gate. Golden
scenarios: `docs/evals/scenarios/uno-synthesize.md`.

## Constraints

- Distills, drafts, and recommends; never makes the go/no-go call and never
  implements code.
- Stays scoped to the provided context — expanding into adjacent evidence-gathering
  is uno-research's job.
- All external writes go through the writers; never touch a Notion surface outside
  the allowlist.

## Hand-offs

- PRD accepted (paired write done) → `skills/uno-prototype` (Flow 2 entry).
- Not worth pursuing → the documented sunset/postpone evidence closes the flow.
- Not sure / thin evidence → more gathering, or `skills/uno-research` for new
  evidence.
- Learning surfaced → `skills/uno-maintain` (knowledge capture).
