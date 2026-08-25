---
embodiment: ide
summary: Harness IA — one constitution, dual-face skills, derived agent roster (2026-07-07)
status: active
verified: 2026-08-24 (#171)
---

# ADR-013: Harness IA — one constitution, dual-face skills, derived agent roster (2026-07-07)

**Decision.** (1) One constitution: root `AGENTS.md` is the only identity/routing doc; CLAUDE.md removed (AGENTS.md is read natively). *(#164: the tier contract, originally the second tier-1 file `loading-order.md`, folded into `AGENTS.md` — Tier 1 is one file.)* (2) Six dual-face skills at `skills/`: SKILL.md (IDE) + bot.md (Worker) + references/method.md (shared core). (3) `agents/` holds roles derived from a task×skill matrix — researchers/ · reviewers/ · writers/ (the only estate writers) + the uno-bot embodiment (definition + Worker body in one folder). (4) `docs/conventions/` (normative, incl. Notion mirrors with `source:`/`synced:` provenance) split from `docs/context/` (descriptive). (5) Interaction contract: humans speak in skills · skills summon agents · agents obey conventions. (6) Placement rule: content lives with its consumer; cache the foundation, retrieve the rest (uno-blueprint = product truth, uno-storybook = DS truth, Notion = convention truth).

**Why.** The April three-tier harness drifted: the six-skill pivot existed only as prose in bot-skills/AGENTS.md; uno-synthesize was unrouteable; three skill surfaces had three loading semantics; Notion conventions had 13/20 items missing from the repo; the knowledge loop was dead since 2026-04-11. Full evidence: the 2026-07-07 plan §0.

**Supersedes.** ADR-001 (AGENTS.md entry point — strengthened: now the *only* one), ADR-007 (skills agent-agnostic under .agent/ — now top-level skills/ with per-runtime faces), ADR-008 (compound loop via uno-compound — now uno-maintain), the .agent/SKILL.md mode/pipeline router.

**Pending, closed.** The Pipedream→Cloudflare cutover outcome is recorded in ADR-014 (Status CONFIRMED live, 2026-07-08). Skill-body rewrites (plan Phase 1) landed with evals-first scenarios.
