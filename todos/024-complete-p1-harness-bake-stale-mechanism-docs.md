---
status: pending
priority: p1
issue_id: 024
tags: [code-review, harness, docs, ops]
dependencies: []
---

# Docs still describe the retired runtime-fetch harness — one claim is operationally dangerous

## Problem Statement

The harness moved from runtime GitHub-Raw fetch to a build-time bundle (`scripts/bundle-harness.mjs` → `src/generated/harness.ts`). Five docs still describe the old mechanism. One of them tells a maintainer that editing guidance and pushing to `main` reprograms the bot. It does not — the bot only changes on `wrangler deploy`, and the deploy workflow is `workflow_dispatch`-only. Someone edits `AGENTS.md`, pushes, and believes the bot changed.

## Findings

- `README.md:30` — "Push a doc change to `main` and every embodiment picks it up — no code deploy needed for guidance changes." Contradicted by `agents/uno-bot/README.md:16` and by `package.json` `deploy` = `check:fetch && bundle:harness && wrangler deploy`.
- `AGENTS.md:5` — calls the Worker "which fetches this file". Line 5 of the first doc in the bundle, so the bot reads a false claim about itself.
- `agents/uno-bot/README.md:45` — "fetched into the system prompt at runtime", 36 lines after `:9` says it is baked.
- `compound-engineering.local.md:11` — "fetched from GitHub Raw at runtime by `src/agent/skills.ts`".
- `docs/knowledge/decisions.md:109` (ADR-014, Status "CONFIRMED live") — records raw-fetch + `SKILLS_BASE_URL` as the live design, no amendment. Also names `resolve_pending_proposal` (real: `proposal_resolve`) and `pickModel()` (real: `pickModelTier`).
- Dead config presented as load-bearing: `SKILLS_BASE_URL` at `wrangler.toml:46` + `src/types.ts:20`, zero consumers. `agents/uno-bot/README.md:92` says it "must point at the harness repo".
- `agents/uno-bot/README.md:94` — `HARNESS_KV` described as "harness fallback/alert"; real consumers are `figma-poll.ts:436` and `slack/delivery.ts:29`.

## Proposed Solutions

1. Fix all five prose claims, delete `SKILLS_BASE_URL` from wrangler.toml + types.ts, amend ADR-014 with a supersession note. Small effort, no risk.
2. As above plus an ADR recording the bake decision (it never got one — ADR-022 covers the budget, not the harness bake). Small-medium, better provenance.

## Technical Details

`README.md`, `AGENTS.md`, `agents/uno-bot/README.md`, `compound-engineering.local.md`, `docs/knowledge/decisions.md`, `agents/uno-bot/wrangler.toml`, `agents/uno-bot/src/types.ts`.

## Acceptance Criteria

- [ ] No doc claims a push to `main` changes bot behavior
- [ ] `SKILLS_BASE_URL` gone from config and types, or documented as dead
- [ ] ADR-014 carries an amendment/supersession note
- [ ] `HARNESS_KV`'s described purpose matches its consumers

## Work Log

- 2026-07-30: Found by ce:review (architecture-strategist + consistency audit), each claim verified against source.
