---
status: pending
priority: p2
issue_id: 031
tags: [code-review, docs, accuracy]
dependencies: []
---

# Counts stated as fact across the harness, several wrong, one gating a mandatory pre-work check

## Problem Statement

The harness states many counts as present-tense fact. Six are wrong. One of them is the knowledge index that `AGENTS.md:106` makes a mandatory pre-work read, so five ADRs are invisible to anyone routing through it.

## Findings

- `docs/knowledge/INDEX.md:14` — "Decisions | decisions.md | 17 | 2026-07-08". Actual: 22 ADRs, newest 2026-07-30. ADR-018, -020, -021, -022 invisible. INDEX.md:1 also claims `<!-- Tier: 1 -->` while loading-order.md says Tier 1 is exactly two files.
- `loading-order.md:37` — "carries 7 of the 11 conventions". Actual: 8 of 12. (Introduced by commit e33a0a3a; `article-writing-style.md` was omitted from the count entirely.)
- `AGENTS.md:47` — enumerates 8 + 3 = 11; `docs/conventions/` holds 12. `article-writing-style.md` (39,213 chars) appears in no roster, no budget, no loading table.
- `agents/uno-bot/README.md:14` gives a third answer: 6 conventions.
- `README.md:111` and `docs/context/product/plus-uno.md:8,62-66` — "44 components, 20 form components". Generated source of truth: `design-system/agent-views/components/index.md:9` says 35; `forms/index.md:9` says 0. `AGENTS.md:87` makes agent-views authoritative ("if a component is not listed, it does not exist"), so the docs assert what the law denies. DataViz 42/6 categories and 7 spec areas verify correct.
- `tech-stack.md` versions — Storybook 10.2.7 vs installed ^10.5.0; Framer Motion 12.33.0 vs ^12.38.0; Highcharts listed 12.5.0, installed ^12.4.0 (doc claims a version ahead of reality). No as-of date on the table.
- `loading-order.md:7` — "~210 lines total" for Tier 1; actual 186.
- `docs/evals/README.md:12` — "12 bot regression prompts"; `docs/evals/fixtures/uno-bot-cases.json` has 9. R4, R5, R7 never run.

Counter-example worth copying: `blueprint-navigation.md:15` labels its own counts a dated snapshot and forbids quoting them as current.

## Proposed Solutions

1. Correct each count, and mark every count either generated or explicitly dated as a snapshot. Small-medium.
2. As above plus regenerate DS counts from agent-views in a script so README and plus-uno.md cannot drift. Medium.

## Acceptance Criteria

- [ ] INDEX.md reflects 22 ADRs and the current date
- [ ] One convention count, correct, in all four places that state it
- [ ] `article-writing-style.md` accounted for in the roster
- [ ] DS component counts either match agent-views or are removed
- [ ] R4/R5/R7 either get fixtures or the count is stated as 9 executing

## Work Log

- 2026-07-30: Found by consistency + bundle audits; every count re-verified against source.
