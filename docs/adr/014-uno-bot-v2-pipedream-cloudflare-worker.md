---
embodiment: ide
summary: uno-bot v2 — Pipedream → Cloudflare Worker (backfilled 2026-07-07 from git history)
status: active-with-correction
verified: 2026-08-24 (#171)
---

# ADR-014: uno-bot v2 — Pipedream → Cloudflare Worker (backfilled 2026-07-07 from git history)

> **Verified against code 2026-08-24 (#171) — one mechanism named here no longer exists.**
>
> **Skills are no longer raw-fetched from GitHub at runtime.** `SKILLS_BASE_URL`
> appears nowhere in `agents/uno-bot/src/`. The harness is assembled at build
> time by `agents/uno-bot/scripts/bundle-harness.mjs` into `src/generated/harness.ts` and served
> as a constant — zero subrequests, updating on deploy rather than on edit. The
> Pipedream→Worker decision itself stands; only the loading mechanism changed.
> The same stale claim was diagrammed in the v2 flowcharts and corrected in #158.


**Original date:** 2026-06-17/18 (`fff9ca43` bot-skills to main "Tier B cutover prep", `b2a7cfee` Worker source to main).

**Decision.** The Slack bot's runtime moved from Pipedream workflows to a Cloudflare Worker (`agents/uno-bot/`, formerly `uno-bot/`): Slack events → Worker → Anthropic API with tool dispatch, thread state, and a proposal gate (side-effect tools stage a confirmation card; only the requester's ✅ executes, via `resolve_pending_proposal`). Skills load by raw-fetching repo files from GitHub at runtime (`SKILLS_BASE_URL`), prompt-cached per isolate — deploys decouple from guidance edits. Model tiering (`pickModel()`: intent → haiku/sonnet/opus, keyword-based) landed 2026-07-01 (`d892346f`, rubric dimension D2).

**Why.** Rationale not recorded in-repo; inferred from the archived Pipedream docs (`docs/knowledge/archive/`) and eval commits: Pipedream limited control over tool orchestration, state, and observability; the Worker gives one TypeScript codebase, telemetry (`c48e1c30` build tags — round-2 evals unknowingly tested a stale deployment), and subrequest-budget control.

**Amendment (2026-07-30).** Three details above are no longer true and were corrected here rather than left to mislead a reader of the log. (1) **Skills no longer raw-fetch at runtime** — the harness is baked into the Worker bundle at build time by `agents/uno-bot/scripts/bundle-harness.mjs` (it cost ~20 subrequests against a 50-cap invocation). The consequence reverses: deploys are now *coupled* to guidance edits, and the deploy workflow is `workflow_dispatch`-only, so a doc edit reaches the bot only when someone deploys. `SKILLS_BASE_URL` is deleted. (2) The gate tool is `proposal_resolve`, not `resolve_pending_proposal`. (3) **Anyone in the thread may confirm**, not only the requester — the lock was removed 2026-07-14 (`src/slack/gate.ts`). Model tiering is `pickModelTier()`.

**Status.** CONFIRMED live (closed 2026-07-08 by evidence): eval rounds 1–3 ran through Slack against the Worker — round 2 diagnosed a stale *Worker* deployment serving Slack traffic and added /health build tags in response (`c48e1c30`), which is only possible with Event Subscriptions already pointed at workers.dev. Follow-up for a Slack-app admin: retire the v1 Pipedream workflow (out of the serving path either way).
