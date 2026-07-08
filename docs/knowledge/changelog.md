<!-- Tier: 2 -->
---
domain: changelog
type: changelog
confidence: high
created: 2026-04-11
tags: [restructure, architecture]
---

## [2026-04-11] Three-Tier Context Architecture Restructure
- Implemented three-tier context loading (always-loaded, on-demand, ephemeral)
- Restructured docs/ into docs/context/ (Tier 1+2) and docs/knowledge/ (long-term memory)
- Distributed .agent/assets/ and .agent/references/ to individual skills
- Created handoff mechanism (.agent/handoffs/) for pipeline stage bridging
- Added uno-research and uno-plan skills to pipeline
- Source: docs/plans/2026-04-11-001-refactor-three-tier-context-architecture-plan.md

## 2026-07-07 — Harness IA revision (six-skill alignment)

Restructured per `docs/plans/2026-07-07-001-harness-six-skill-revision-plan.md` after a five-agent audit: `.agent/` and `bot-skills/` dissolved; `skills/` (six, dual-face SKILL.md + bot.md) and `agents/` (researchers · reviewers · writers + uno-bot embodiment) promoted to top level; AGENTS.md became the single constitution (SKILL.md router, AGENT.md, bot AGENTS.md, agent-persona.md all folded in); `docs/conventions/` split from `docs/context/` with Notion-mirrored tool conventions (provenance headers); `docs/evals/` created (rubrics + scenarios + runs); superseded docs → `docs/knowledge/archive/`. See ADR-013.
