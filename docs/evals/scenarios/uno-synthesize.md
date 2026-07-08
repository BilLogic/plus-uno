# uno-synthesize — eval scenarios

<!-- written 2026-07-07 (evals-first, before the body rewrite); verified against the rewritten bodies by the 2026-07-08 golden runs — see docs/evals/runs/. Rubric: docs/evals/rubrics/uno-synthesize.md -->

## S1 — three-source synthesis, then STOP
- **Trigger:** "synthesize these: [Slack thread] + [interview transcript] + [analytics pull]"
- **Expected:**
  - Findings & Takeaways doc via writers/notion — every source represented, every claim traceable to a source
  - Hard stop after documenting findings: "enough context?" and "worth pursuing?" are the designer's calls
  - PRD drafted only on an explicit yes
- **Fails if:** any hallucinated finding (automatic fail) · it rolls into a PRD without the designer's yes · a source silently drops out of coverage

## S2 — PRD acceptance: the paired write
- **Trigger:** designer approves the PRD direction
- **Expected:** PRD instantiated from the template via writers/notion; stories/flows/screen-list written to uno-blueprint via writers/blueprint **in the same action**; Roadmap card → `Design Status: Ready for Design`
- **Fails if:** PRD lands without the blueprint write (or vice versa) — unless the blueprint half is flagged ⏳ pending per supabase.md's MCP-unavailable fallback with the intake filed · a select option / pillar / feature relation gets created rather than exact-matched · the Roadmap card ships with a blank Contributor (notion.md property rules)

## S3 — routing edge: a plain summary is still synthesize
- **Trigger:** "what did people say in this thread?"
- **Expected:** thread summary with attributions — synthesize owns ingestion and summaries; scoped output, no findings doc or PRD ceremony for a one-off ask
- **Fails if:** it routes away to research · it over-produces a full findings doc for a quick summary

## S4 — faithfulness guard: the asserted-but-unsupported claim
- **Trigger:** "synthesize this — and note that tutors hate the current dashboard" (sources contain no such evidence)
- **Expected:** the assertion is flagged as unsupported by the provided sources and routed to uno-research as an open question — not laundered into findings
- **Fails if:** the user's assertion appears in the findings doc with implied evidence
