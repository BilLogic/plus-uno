# Automations Registry

<!--
THE standing-automation registry — canonical (ADR-017; distilled 2026-07-07 from 📓 playbook §6, now superseded).
Rule: every automation names its agent — an automation without an agent is unowned by definition.
Rule: an automation invokes a skill's method; it never embeds its own copy of the logic. Migrate opportunistically as each is next touched.
An automation absent from this table is undocumented by definition.
-->

| Automation | Trigger | Skill / method it runs | Agent | Implementation | Owner | Status |
|---|---|---|---|---|---|---|
| Figma library sync | 15-min poll of BS4 publishes | uno-synthesize (DS-component PRD creation) | writers/notion | `.github/workflows/figma-library-poll.yml` → `scripts/poll-figma-library.js`, `create-notion-prd.js` | Bill | ✅ live (v1) |
| Implement component | `repository_dispatch` from uno-bot confirm | uno-prototype (codegen) | uno-bot proposes; Actions executes | `figma-implement.yml` → `scripts/implement-figma-changes.js` + `scripts/prompts/uno-implement` | Bill | ✅ live |
| Implement design | `repository_dispatch` from uno-bot confirm | uno-prototype (design → playground scaffold) | uno-bot proposes; Actions executes | `figma-implement-design.yml` + `scripts/prompts/uno-implement-design` | Bill | ✅ live |
| Marketplace add/edit | `repository_dispatch` | uno-publish (registration) | writers/notion (entry) | `marketplace-add.yml` / `marketplace-edit.yml` | Bill | ✅ live |
| Design QA trigger | Roadmap card → `Dev Status: Ready for QA (RTT)` | uno-review (Design QA checklist) | reviewers/design-qa | ❌ not built — needs `Design QA` status column (manual Notion setup) | — | planned |
| Shipped watchdog | weekly | uno-maintain (reconciliation check) | reviewers/auditor | ❌ not built | — | planned |
| Weekly Tier-1 digest | weekly | uno-maintain (digest of auto-applied fixes) | reviewers/auditor → uno-bot posts | ❌ not built | — | planned |
| Figma hygiene sweep | monthly | uno-maintain (hygiene checklist in `figma-workspace.md`) | reviewers/auditor | ❌ not built | — | planned |
| Conventions integrity sweep | monthly (retro) | uno-maintain (canonicality headers; agent↔doc cross-references both ways; superseded banners on legacy Notion playbook pages) | reviewers/auditor | ❌ not built | — | planned |
| Notion comment sweep | each flow run touching a page + monthly | uno-maintain (unresolved threads → incorporate or intake) | writers/notion | ❌ not built | — | planned |
| Eval run logging | every flow exit | rubric scoring → run entry | reviewers/rubric-applier | interim: `docs/evals/runs/*.jsonl`; target: Notion Eval Runs DB | — | planned |
