---
embodiment: ide
summary: Doc splitting by task context (Index + Modules pattern)
status: active
verified: 2026-08-24 (#171)
---

# ADR-011: Doc splitting by task context (Index + Modules pattern)

- **Date**: 2026-03-23
- **Status**: Active
- **Context**: Monolithic docs (400+ lines) wasted 60-70% of context budget per agent interaction. Docs were written for human top-to-bottom reading, not agent load-what-you-need consumption.
- **Decision**: Each monolith becomes a lightweight index file (<20 lines) linking to focused modules. Each module gets a `<!-- Load when: ... -->` header. New docs >150 lines must be split by task context from the start. Skill SKILL.md files stay under 80 lines.
- **Amendment (2026-07-30)**: the 80-line SKILL.md cap is retired — it was a proxy for context cost, and SKILL.md files are IDE-side and never enter the Worker bundle, so their real cost is human attention. The budgets that bind are in `loading-order.md` § Tier 1 and § Runtime notes, stated in characters, because these files have paragraph-length lines. `uno-prototype` (129), `uno-research` (101), `uno-synthesize` (97), and `uno-publish` (90) exceeded the retired cap.
- **Source**: (pre-consolidation solution doc, no longer in the repo) _archive/solutions/agent-infrastructure/2026-03-23-doc-splitting-dynamic-context-loading.md
