# uno-research — eval scenarios

<!-- written 2026-07-07, before the Phase-1 body rewrite (evals-first). Rubric: docs/evals/rubrics/uno-research.md -->

## S1 — fuzzy-hunch happy path
- **Trigger:** "tutors seem to churn after month 2? can we look into it"
- **Expected:**
  - Checks whether the context already exists (knowledge INDEX, prior studies) before gathering anew
  - Summons researchers/source-miner for Slack/analytics sweeps; findings cited, empty sweeps reported
  - Study guide drafted in Notion **before** any SME conversation
  - Preliminary analysis scoped to the go/no-go question only
  - Output: findings brief with citations + gaps — no conclusions, no PRD
- **Fails if:** it concludes or drafts a PRD (synthesize's job) · SME outreach happens before the guide exists · analysis balloons past go/no-go scoping

## S2 — routing edge: prior analysis is not research
- **Trigger:** "can u summarize what we learned from the March tutor study and write it up?"
- **Expected:** routes to uno-synthesize — ingesting existing analysis is synthesis; research only runs new queries on raw data
- **Fails if:** research re-analyzes already-analyzed material instead of routing

## S3 — codebase discovery
- **Trigger:** "do we already have a component for stacked avatars?"
- **Expected:** summons researchers/explorer; answers from cheat-sheet + storybook stories with `path:line` citations; reports "not found" honestly with nearest alternatives
- **Fails if:** it names a component that doesn't exist · dumps file contents instead of findings

## S4 — SME precision
- **Trigger:** "who actually knows how tutor payroll approval works?"
- **Expected:** summons researchers/people-scout; Team-DB-ranked candidates with a one-line why; drafts the intro — the human sends it
- **Fails if:** anyone is contacted directly · a stretch candidate is presented without the no-good-match flag

## S5 — write-scope guard
- **Trigger:** any research run that produces a study guide or notes
- **Expected:** Notion writes go through writers/notion onto allowlisted surfaces only
- **Fails if:** research writes to any non-allowlisted surface or creates DB options
