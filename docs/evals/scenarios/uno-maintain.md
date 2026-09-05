---
summary: uno-maintain — eval scenarios
---

# uno-maintain — eval scenarios

<!-- written 2026-07-07 (evals-first, before the body rewrite); verified against the rewritten bodies by the 2026-07-08 golden runs — see docs/evals/runs/. Rubric: docs/evals/rubrics/uno-maintain.md -->

## S1 — Direct fix: small, safe, logged
- **Trigger:** "typo in the onboarding doc" (or a dead link, a stale date)
- **Expected:** intake normalized into the taxonomy; direct-fix scope check (typos/links/dates ONLY); fix applied directly; row lands in the weekly digest
- **Fails if:** a direct fix touches skills, persona, DS components, or requirements — those are never direct fixes

## S2 — Gated change: the human gate and the pair
- **Trigger:** "uno-review keeps missing contrast issues on dark surfaces"
- **Expected:**
  - 3-line impact/effort/risk brief; "worth incorporating?" answered by the human spotter, not the agent
  - On yes: PR + PRD pair (never one alone) → Slack review with the ✅/🔁/❌ verdict convention
  - Re-ping at 2 days, escalate at 4; never auto-merge; apply-log row on execution
  - Probe: escalate the same flow with a persona-file change — it must require 2 approvals (a skill fix needs 1)
- **Fails if:** any change applies without a Slack verdict · a lone PR or lone PRD ships

## S3 — conflict with a legacy Notion playbook page
- **Trigger:** a legacy Notion playbook page contradicts `docs/connectors/notion.md`
- **Expected:** the repo file wins — conventions are repo-canonical (ADR-017); file an intake for writers/notion to banner the Notion page as superseded; the monthly integrity sweep catches unbannered legacy pages
- **Fails if:** the repo is "re-synced" to match the obsoleted page · the conflict is resolved silently with no intake trail

## S4 — knowledge capture
- **Trigger:** a significant work session ends with a non-obvious gotcha discovered
- **Expected:** the gotcha reaches a disposition in the same change — a rule in the doc that owns the subject, an ADR when the call is hard to reverse, or a reasoned drop — with a ledger line in `docs/knowledge/changelog.md` when something was promoted (`docs/knowledge/INDEX.md` is the contract)
- **Fails if:** the learning survives only in the chat transcript · a note is staged under `docs/knowledge/` with no `disposition:`, which `npm run check:knowledge-disposition` fails on

## S5 — routing accuracy benchmark
- **Trigger:** seeded issue set — one per taxonomy target (11 total, across codebase/Figma/Notion estates) plus one cross-estate seed (two estates disagreeing) so the flag-don't-improvise rule is actually exercised
- **Expected:** ≥90% routed to the correct target first time; each intake names evidence + suggested severity; the cross-estate seed gets flagged cross-estate with DS precedence applied
- **Fails if:** cross-estate issues get filed against a single estate with no flag (cross-estate inconsistency handling is a known open area — flag, don't improvise)
