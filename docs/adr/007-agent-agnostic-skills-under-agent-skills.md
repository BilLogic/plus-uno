---
embodiment: ide
summary: Agent-agnostic skills under .agent/skills/
status: superseded
verified: 2026-08-24 (#171)
---

# ADR-007: Agent-agnostic skills under .agent/skills/

- **Date**: 2026-03-21
- **Status**: Superseded by ADR-013 (2026-07-07); amended 2026-04-11 before that
- **Context**: Skills in `.claude/commands/` only work in Claude Code. Cursor and Windsurf agents cannot invoke them. Platform-specific frontmatter limits portability.
- **Decision**: All skills under `.agent/skills/` with platform-agnostic SKILL.md files. Each skill has SKILL.md + references/ + examples/ + scripts/.
- **Amendment (2026-04-11)**: Skill frontmatter MAY include `allowed-tools`, `context`, `agent`, and `disable-model-invocation` fields. These are treated as hints — Claude Code enforces them natively; other platforms ignore unknown frontmatter gracefully. This is preferred over maintaining separate platform-specific wrappers.
- **Source**: docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md
