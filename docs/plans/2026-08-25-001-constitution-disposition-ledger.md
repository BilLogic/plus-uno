---
status: applied
date: 2026-08-25
summary: The counterfactual pass over every constitution rule — kept, rewritten with a positive twin, or deleted, with the answer recorded per rule (#164).
---

# Constitution disposition ledger (#164)

Every normative statement in `AGENTS.md` and the folded `loading-order.md`, put
through one test: **would a competent agent behave differently without it?**

The test is model-relative, not reader-relative — a rule that only restates what
the model already does is a no-op, and a no-op costs context on every turn. Three
verdicts: **keep** · **rewrite** (survives, but is restated positively, deduped,
or narrowed to what is true) · **cut**. A fourth column records where content
went when it left the constitution without dying.

Rules that were bans and survived carry a positive twin, per the negation axis:
steering by prohibition makes the forbidden behaviour more available, so the
surviving rule states the target and lets the banned thing go unspoken.

## Headline

| Measure | Before | After |
|---|---:|---:|
| `AGENTS.md` characters | 20,404 | 16,270 |
| `AGENTS.md` prohibitions (`check:negation` regex) | 38 | 6 |
| Bundled-harness prohibitions | 324 | 291 |
| Tier-1 files | 2 | 1 |
| Numbered hard rules | 18 | 15 |

## Identity and routing

| # | Rule | Would an agent behave differently without it? | Verdict |
|---|---|---|---|
| A1 | What this file is; who reads it | No behaviour, but it is the frame every other rule hangs on | keep |
| A2 | Interaction contract — humans speak in skills · skills summon agents · agents obey conventions | Yes — without it agents advertise internal agents to users and restate conventions inline | keep |
| A3 | Identity, production surfaces, demo entry id `1028` | Yes — the agent otherwise renames the demo entry or misroutes a URL | keep; "do not rename the entry" → "keep that entry id" |
| A4 | Not a hardened backend; no auth/SSR/API evaluation | Yes — an unprompted model reviews prototype code as if it were production | rewrite → states what to evaluate (DS fidelity, flows, a11y), with the out-of-frame list following |
| A5 | Ground claims per estate, cite links, surface conflicts (ADR-021) | Yes — measured: docs-only context scored 36% vs 100% guided, and blending was the sharpest failure | keep |
| A6 | Two vocabularies — blueprint vs Roadmap | Yes — see ADR-023; without it "where are we on X" gets answered from an estate that has no statuses | **ratified** (ADR-023); constitution keeps a one-line pointer, `CONTEXT.md` keeps the table |
| A6b | Inside that table: "`path` is identified by NAME, not `path_type`" | The rule is **dead** — `blueprint-navigation.md` §4a says `path_type` is a real three-value vocabulary and states the old rule is retired | cut; replaced with "read both `path_type` and `name`" |
| A7 | Escalate product direction; never invent requirements/pillars/OKRs | Yes — the failure it guards is confident invention, which is the model's default under pressure | rewrite → positive: direction comes from Bill or a cited estate, so escalate |
| A8 | Embodiment deltas live in `agents/` | Yes — otherwise Slack-only rules get written into the shared constitution | keep |
| A9 | Harness components table (incl. "query at task time, never cache") | Yes — caching blueprint answers across a session is a real, observed failure | keep |
| A10 | Skills table + routing paragraph | Yes — this is the routing surface | keep |
| A11 | Dual-face skills: `SKILL.md` (IDE) · `bot.md` (Worker) · shared `references/method.md` | Yes — an agent editing one face silently drifts the other | keep |
| A12 | Skill surfaces are generated from canonical frontmatter | Yes — the natural move is to edit `.claude/skills/…`, which is overwritten on the next generate | rewrite → the rule stays (≈250 chars, down from ~700); the three generated paths move to `docs/engineering/setup.md` § Generated skill surfaces |
| A13 | A Slack `/uno-*` run posts a public framing message and threads under it | Yes for the Worker only | moved → `docs/connectors/slack.md` § Threading & mentions |
| A14 | Agents are internal; never taught to users, never invoked directly | Duplicate of A2's "Skills invoke agents; users never do" | cut (deduped into A2); the roster sentence stays |
| A15 | Conventions: three homes, ADR-017 canonical, lineage headers | Yes — otherwise a Notion playbook is treated as the source | keep |
| A15b | The bundled-doc roster written out in prose | No — and worse than a no-op: this was one of the three places the roster was stated, and the counts disagreed. Frontmatter + the bundler decide membership | cut; replaced with the sentence that membership is a property of the document |
| A15c | `writing/{principles,mechanics,registers,sources}.md` in that roster | The files no longer exist (`eb35928a` collapsed writing to one file) | cut |
| A16 | Placement rule · cache-the-foundation · DS precedence | Yes — DS precedence decides real conflicts and names the intake | keep |

## Contracts that were doing a second job

| # | Rule | Counterfactual | Verdict |
|---|---|---|---|
| A17 | Knowledge Architecture section (two DS homes, `generate:agent`) | No — `guidelines/overview.md` is already the mandatory entry and says the same thing better; the regenerate half is now hard rule 11 | cut |
| A18 | Storybook MCP: endpoint, four tools, "call `get-storybook-story-instructions` first" | Yes, but only on story/API work — a narrow branch paying Tier-1 rent on every turn | moved → `docs/connectors/storybook-mcp.md`, with a § Progressive loading trigger |
| A19 | Story-authoring conventions (one concept per story, JSDoc, `!manifest`) | Yes, same narrow branch | moved → same doc |
| A20 | Documentation IA contract (taxonomy, tree, specs grammar, naming) | Yes, when adding a story or renaming a folder | moved → `design-system/guidelines/documentation-ia.md` |
| A21 | Docs-page MDX shell + "pipe tables do not parse here" | Yes — authoring an MDX page without it produces broken tables | moved → same doc (it is a documentation rule, not a grid rule) |
| A22 | Grid & breakpoint contract (modes, two Figma grids, spans, ownership layering) | Yes, on layout work | moved → `design-system/guidelines/foundations/grid.md`, merged with what was already there |
| A23 | Commands table (10 npm scripts) | No — `package.json` is the source, and the table had already drifted | cut |
| A24 | Tech-stack version table | Already deleted in stage 2; the residual version line in `docs/engineering/setup.md` § Stack went with it | cut |

## Hard rules (the numbered list)

| Old # | Rule | Counterfactual | Verdict | New # |
|---|---|---|---|---|
| 1 | DS knowledge is law; not listed means it does not exist | Yes — the model will assert a plausible component | rewrite (absorbs old 13) | 1 |
| 2 | Never hallucinate props | Yes — but the ban is the weaker half; the action is "read the source" | rewrite → positive, and names the MCP alternative | 2 |
| 3 | FA Free only, no Pro families | Yes — Pro names are not licensed and render blank; a model trained on the full icon set reaches for them | rewrite → positive first (which families are available), consequence stated | 3 |
| 4 | Notion writes follow `notion.md`; exact-match options | Yes — inventing a select option is a real, observed write failure | rewrite → positive twin ("a value that does not exist is a question for the requester") | 4 |
| 5 | PLUS components first; no Material/Ant/Tailwind | Yes for the framework choice — **but the text was false**: `package.json` declares three Tailwind packages (ADR-009 is recorded `contradicted`) | rewrite → narrowed to the truth: Bootstrap for product UI; Tailwind exists, scoped to `design-system/src/storybook-docs/`, and is not a precedent | 5 |
| 6 | Never hardcode colours/spacing/type/radius/elevation | Yes | rewrite → positive ("style with design tokens") | 6 |
| 7 | Never hallucinate layouts; read `composition/layout.md` | Yes — page skeletons are repo-specific | rewrite → positive | 7 |
| 8 | Never skip reading component source + story + styles | Same instruction as rule 2 in different words | cut (folded into 2) | — |
| 9 | Full implement-design workflow, registries MANDATORY first | Yes | rewrite → merged with 10; one rule, one load gate | 8 |
| 10 | Figma registries are law | Duplicate of 9's load gate | cut (folded into 8) | — |
| 11 | Never install packages without approval | Yes — installing is otherwise a routine unblock | rewrite → positive ("ask before installing") | 9 |
| 12 | Import only from `@/components`; deep imports forbidden | Yes for new files — **but the text described a codebase that does not exist**: ~400 deep imports inside `design-system/src/specs/`, ~70 barrel call sites | rewrite → states the rule for new files, names the grandfathered set and its size, and names the two cases that were never violations (a component's own siblings; spec shells from area group indexes). The 543 call sites stay out of scope, per the ticket | 10 |
| 13 | Never create duplicate components | Yes, but it is the same check as rule 1's existence index | cut (folded into 1) | — |
| 14 | Never edit generated token files | Yes — and the same trap exists for five other generated artifacts | rewrite → generalised to all generated files, each with its regenerate command | 11 |
| 15 | Always validate in Storybook when behaviour is touched | Yes — the model's default is to trust the build | rewrite → names the test tool | 12 |
| 16 | Confirm the plan before large or risky edits | Borderline: a careful agent often does, but not reliably under a long task | keep, unchanged | 13 |
| 17 | Prototype intake is one step per message | Yes — batching intake questions is the model's strong default and the hook exists because of it | rewrite → the two bans collapse into one positive clause | 14 |
| 18 | Figma write-back uses the DS gate, never screenshot import | Yes — this guards a specific incident | rewrite → positive lead ("the `[replica]` is always placed instances"), gate and scripts intact, the no-hook exemption kept | 15 |

## The loading contract (folded in)

| # | Rule | Counterfactual | Verdict |
|---|---|---|---|
| L1 | Tier 1 = `AGENTS.md` + `loading-order.md`, with per-file budgets | The second file existed to say that it existed. Folding it in makes Tier 1 one file and one budget (≤20k chars) | fold |
| L2 | Tier 2 table (skill / agent / estate-write / blueprint / long-form / UI / orientation rows) | Yes, but four of seven rows already existed in § Progressive loading — the duplication the census flagged | fold, deduped: the trigger table is the one home; what remains of Tier 2 is the two rows it did not carry (a skill's own references, an agent's named conventions) |
| L3 | Tier 3 — retrieved live, never cached; conventions are not Tier 3 | Yes — it is what stops an agent caching product truth | keep |
| L4 | Worker runtime note: no on-demand loading; bundler globs frontmatter; budgets | Yes — split: "everything is always in context" is a fact uno-bot needs and stays unfenced; the bundler mechanics are IDE-side and sit inside the `ide-only` fence | keep, split |
| L5 | "The Worker does not bundle this file" | Self-referential; dies with the file | cut |
| L6 | GitHub Actions loader note | Yes, for anyone editing `scripts/prompts/*` | keep, one line |

## Second pass, against `writing-for-agents`

The rewrite was then read back against the upstream skill the constitution's own
trigger table names — the standard harness prose is reviewed against. Four
findings, all applied:

- **Duplication.** "query at task time, never cache" was stated in three bundled
  places: the harness-components table, `CONTEXT.md`'s glossary, and the Tier 3
  line. The loading contract is its single source of truth; the other two now
  point at it.
- **Pointer collision.** "adding a story" was the trigger word on two different
  § Progressive loading rows, so a story task fired both. One trigger per branch:
  `storybook-mcp.md` takes *writing a story's code / verifying an API*,
  `documentation-ia.md` takes *titling a story / naming a folder*.
- **No-op.** "Two or three documents per task, **never the full set**" — the
  positive bound already says the whole thing; the ban added load and no meaning.
- **Duplication.** The new `storybook-mcp.md` restated the no-MCP fallback that
  `connectors/overview.md` already carries for every tool. Cut.

## Candidate considered and not adopted

**"the bot" is not a name** (issue comment, from #159). The counterfactual answer
is *yes for writing* — an agent drafting a reply sees `uno-bot`, `the Worker` and
"the bot" used interchangeably and has no basis to choose. It is not adopted
here because adopting it means a ~230-edit sweep across the harness, and a rule
whose sweep has not run is a rule the estate visibly violates — which is the
shape this ticket exists to stop. It needs its own issue, paired with a
forbidden-word assertion in `check:harness` so it is enforced mechanically
rather than by review. The constitution's own single use of "the bot" was
removed while rewriting.

## What is not measured here

The eval suites run against the **deployed** Worker (`uno-bot-evals.yml` →
`agents/uno-bot/scripts/run-evals.mjs` hits `/debug/eval` on the live Worker), so
the behavioural delta cannot be produced from a working tree. The rewrite is
isolated in its own commit for exactly this reason: after the next
`npm run deploy`, `gh workflow run uno-bot-evals.yml` scores the 16 R/P cases
against it and the delta is attributable to that commit alone.
