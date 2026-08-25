---
embodiment: ide
summary: Three-tier context loading architecture
status: superseded
verified: 2026-08-24 (#171)
---

# ADR-010: Three-tier context loading architecture

> **Verified against code 2026-08-24 (#171) — the paths this decision names no longer exist.**
>
> `docs/context/` was dissolved in #171 into `docs/product-and-service/` and
> `design-system/guidelines/`, and `.agent/handoffs/` was already gone. The tier
> contract lives in `loading-order.md`, as the original Status line said.


- **Date**: 2026-04-11
- **Status**: Superseded by `loading-order.md` (the tier contract) — Tier 1 is now exactly AGENTS.md + loading-order.md, docs/context/* is Tier 2, and Tier 3 means "retrieved live, never cached" rather than ephemeral handoffs; `.agent/handoffs/` no longer exists
- **Context**: Agent context windows are finite. The flat docs/ structure mixed always-loaded context with on-demand references. No way to distinguish essential product truth from supplementary guides.
- **Decision**: Implement three tiers: (1) Always-loaded -- identity, conventions, principles, knowledge index via AGENTS.md "See" references to `docs/context/`. (2) On-demand -- skills, detailed context, knowledge entries triggered by skill invocation. (3) Ephemeral -- tool outputs, exploration, handoffs in `.agent/handoffs/` (gitignored).
- **Source**: docs/plans/2026-04-11-001-refactor-three-tier-context-architecture-plan.md
