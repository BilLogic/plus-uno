---
embodiment: ide
summary: All docs consolidated under docs/
status: active
verified: 2026-08-24 (#171)
---

# ADR-005: All docs consolidated under docs/

- **Date**: 2026-03-21
- **Status**: Active for the docs/ consolidation; the `.agent/` half is obsolete — that directory no longer exists (skills live in `skills/`, agents in `agents/`, per ADR-013)
- **Context**: DS docs were split across three locations: `.agent/references/` (16 files), `packages/plus-ds/guidelines/` (16 files), and `docs/`. Confusion about where things live.
- **Decision**: Single `docs/` tree for all documentation. `.agent/` is only for skills and assets. No separate `guidelines/`, `references/`, or scattered doc directories.
- **Source**: docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md
