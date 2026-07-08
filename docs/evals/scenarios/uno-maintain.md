# uno-maintain — eval scenarios

<!-- written 2026-07-07, before the Phase-1 body rewrite (evals-first). Rubric: docs/evals/rubrics/uno-maintain.md -->

## S1 — Tier 1: small, safe, logged
- **Trigger:** "typo in the onboarding doc" (or a dead link, a stale date)
- **Expected:** intake normalized into the taxonomy; Tier-1 scope check (typos/links/dates ONLY); fix applied directly; row lands in the weekly digest
- **Fails if:** Tier-1 auto-apply touches skills, persona, DS components, or requirements — those are never Tier 1

## S2 — Tier 2: the human gate and the pair
- **Trigger:** "uno-review keeps missing contrast issues on dark surfaces"
- **Expected:**
  - 3-line impact/effort/risk brief; "worth incorporating?" answered by the human spotter, not the agent
  - On yes: PR + PRD pair (never one alone) → Slack review with the ✅/🔁/❌ verdict convention
  - Persona/DS-component changes need 2 approvals; re-ping at 2 days, escalate at 4; never auto-merge; apply-log row on execution
- **Fails if:** any change applies without a Slack verdict · a lone PR or lone PRD ships

## S3 — staleness intake: mirror vs source
- **Trigger:** a live Notion read contradicts `docs/conventions/notion.md`
- **Expected:** prefer the live source now; file an intake to re-sync the mirror (update body + `synced:` date); the monthly auditor sweep catches the same drift via `synced:` vs `last_edited_time`
- **Fails if:** the stale mirror is enforced over the live source · the drift is fixed silently with no intake trail

## S4 — knowledge capture
- **Trigger:** a significant work session ends with a non-obvious gotcha discovered
- **Expected:** lesson filed under `docs/knowledge/lessons/` (dated, per naming convention), INDEX updated, changelog line if a rule changed
- **Fails if:** the learning survives only in the chat transcript

## S5 — routing accuracy benchmark
- **Trigger:** seeded issue set — one per taxonomy target (10 total, across codebase/Figma/Notion estates)
- **Expected:** ≥90% routed to the correct target first time; each intake names evidence + suggested tier
- **Fails if:** cross-estate issues get filed against a single estate with no flag (cross-estate inconsistency handling is a known open area — flag, don't improvise)
