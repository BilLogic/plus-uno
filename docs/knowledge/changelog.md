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
- **2026-07-07 (tranche 2)** — evals-first skill rewrite executed: 7 rubrics + 7 scenario sets under `docs/evals/` (bot regression prompts migrated from REGRESSION.md); all six SKILL.md bodies rewritten with `references/method.md` extracted as the shared runtime-neutral core; 12 agent roster files defined at their first invocation sites; Worker prompt assembly fixed (v1 destructuring bug dropped 5 of 13 files) and now loads method.md per skill; link guard hardened (3 pipefail deaths) and re-passing; ADR-014/015/016 backfilled. Sources: plan 2026-07-07-001 Phases 1+4, Notion Skills-Upgrade hub (guidance, not pasted).
- **2026-07-07 (canonicality flip)** — ADR-017: docs/conventions/ (and evals rubrics) become repo-canonical; Notion playbook material obsoleted; staleness sweep → integrity sweep; apply-log lands at docs/evals/runs/apply-log.jsonl; Q9 blueprint-write stays maintain-routed; Q8 channel split confirmed.
- **2026-07-08 (verification round)** — merged to main (PR #30); two best-practices reviews (skills, agents) + six golden eval runs executed: 30/31 scenario verdicts pass; all findings fixed same-day — 2 frontmatter blockers (research fork/Explore conflict, synthesize missing Task), the publish↔maintain blueprint-propagation contradiction reconciled to §6 Q9 (maintain gains the handoff-pre-authorized path), run-review-checks.sh counter bug (live recall measured: script 44% vs full procedure 100%), 6 invocation-matrix edges repaired, taxonomy grows to 11 targets, fixtures corpus seeded (docs/evals/fixtures/), first run logs land in docs/evals/runs/. Cross-agent pointer files removed (AGENTS.md read natively).
