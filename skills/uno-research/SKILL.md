---
name: uno-research
description: >
  Gathers context that does not exist yet: preliminary data analysis, user-study
  guides, SME and participant sourcing, Slack/analytics evidence sweeps, and
  codebase/design-system discovery. Instrument-first — the study guide is
  written before any conversation — and it hands cited findings to
  uno-synthesize rather than concluding. Use for fuzzy hunches ("tutors seem to
  churn — can we look into it?"), discovery questions ("do we already have a
  component for X", "where is", "how does"), sourcing knowledge-holders ("who
  actually knows how Y works?"), or evidence toward a go/no-go. Not for
  summarizing prior studies, ingesting pasted context, or drafting PRDs — that
  is uno-synthesize.
context: fork
user-invocable: true
argument-hint: [question / hunch / who-knows-X]
allowed-tools: Read, Grep, Glob, Task, WebSearch, mcp__notion-plus__API-post-search, mcp__notion-plus__API-retrieve-page-markdown, mcp__notion-plus__API-get-block-children, mcp__notion-plus__API-query-data-source
---
<!-- context: fork runs this skill in a forked context with the DEFAULT agent — it must keep Task
     (it dispatches researchers/* and writers/notion). Notion tools are the READ set only; the one
     write (study guide) goes through writers/notion, so write scopes live there, not here. -->

# uno-research — IDE face

Gather context that doesn't exist yet. The procedure lives in
[`references/method.md`](references/method.md) — **read it first**. This file
adds only IDE execution: which agents to summon, and what to load when.

## When to use / when not

- **Use** for the fuzzy front end (no requirement yet, evidence needed),
  codebase/DS discovery, SME or participant sourcing, and preliminary data passes.
- **Don't use** when the context already exists — summarizing a prior study,
  ingesting pasted notes, or drafting a PRD routes to `uno-synthesize`. Edge
  cases fall to method.md's data rule: ingesting a prior analysis → synthesize;
  running new queries on raw data → research.

## Agents it summons

researchers/explorer · researchers/source-miner · researchers/people-scout —
defined in `agents/` (see `agents/README.md`). Per the interaction contract,
these are summoned by this skill, never by users. Study-guide writes go through
writers/notion.

## Workflow — method.md spine, IDE execution

1. **Inventory first** (method.md gate 1). Read `docs/knowledge/INDEX.md`; check
   the Research & notes DB for prior studies via `mcp__notion-plus__*`. Context
   already exists → route to `uno-synthesize` and stop.
2. **Repo/DS questions** → Task `researchers/explorer`. It owns the heavy reads
   and returns `path:line`-cited findings, never file dumps.
3. **Org-evidence questions** (Slack history, analytics, research DBs) → Task
   `researchers/source-miner`, naming the source types worth mining. Empty
   sweeps come back as findings.
4. **People path** — the gate binds before outreach, not before identification:
   1. Identification-only asks ("who knows X?", no conversation planned) may
      Task `researchers/people-scout` directly for ranked candidates.
   2. Before any intro draft is sent or conversation planned: draft the study
      guide per method.md; `writers/notion` writes it to the Research & notes
      DB. Read `docs/conventions/notion.md` before the write — allowlisted
      surfaces only, never create select options. **Notion unreachable?** Draft
      the guide locally, flag it `⏳ pending Notion write`, and say so — the
      gate is satisfied by the guide existing and being shown, never by
      pretending the write happened.
   3. Only then people-scout's intro draft goes out — sent by the human, who
      runs the conversation.
5. **Data path** → preliminary analysis scoped to the go/no-go question
   (method.md gate 2). No connected source for the data needed? Ask the user for
   an export — never fabricate a pull.
6. **Compile the findings brief** (method.md output shape) and hand to
   `uno-synthesize`. Do not conclude.

## Tier-2 loads

| Trigger | Load |
|---|---|
| always, on invocation | `references/method.md` |
| component / pattern / token discovery, before dispatching explorer | `references/component-discovery.md` |
| scoping an explorer dispatch — repo layout, key paths, commands | `references/foundations-index.json` |
| DS usage-pattern questions | `references/patterns-index.json` |
| prior-knowledge check | `docs/knowledge/INDEX.md` → the relevant lesson file |
| writing the study guide (via writers/notion) | `docs/conventions/notion.md` |
| pointing source-miner at Slack | `docs/conventions/slack.md` (channel map) |

## Quality bar

Rubric: `docs/evals/rubrics/uno-research.md` (study-guide-quality ·
analysis-scoping · sme-precision; hard gate: guide in Notion before any SME
conversation). Golden scenarios: `docs/evals/scenarios/uno-research.md` — a
change to this skill must keep all five passing.

## Constraints

- **Read-only, one exception:** the study guide (and research notes), written
  via writers/notion to allowlisted Notion surfaces only.
- **Cite everything** — a finding without a citation doesn't ship.
- **Never contact people** — people-scout sources and drafts; humans send.
- **Never conclude** — no takeaways, no go/no-go, no PRD. Hand the brief to
  `uno-synthesize`.
- **Stay scoped** to the question asked; expand into adjacent topics only when
  they change the answer.
