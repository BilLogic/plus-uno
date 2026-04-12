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
