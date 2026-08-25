---
embodiment: ide
summary: AGENTS.md as single cross-agent entry point
status: superseded
verified: 2026-08-24 (#171)
---

# ADR-001: AGENTS.md as single cross-agent entry point

- **Date**: 2026-03-21
- **Status**: Superseded by ADR-013 (2026-07-07)
- **Context**: Platform files (CLAUDE.md, .windsurfrules, cursorrules.md) each contained their own instructions, creating inconsistency. Non-DS tasks had no agent guidance at all.
- **Decision**: Create AGENTS.md at repo root as THE single entry point. All platform files point to it. Contains voice, forbidden patterns, skills table, progressive loading, commands.
- **Source**: docs/plans/2026-03-21-001-feat-agents-md-compound-loop-agent-skills-plan.md
