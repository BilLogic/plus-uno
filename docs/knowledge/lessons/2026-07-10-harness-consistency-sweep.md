# 2026-07-10 — Harness consistency sweep (uno + uno-bot)

**What:** full-repo audit of harness docs vs code reality, followed by fixes and README rewrites (root `README.md`, `agents/uno-bot/README.md`).

## What drifted, and why

1. **Provider switch outran the docs.** `MODEL_PROVIDER` flipped to `gemini` (2026-07-10) but README/AGENT.md still described the Anthropic-only setup (sonnet lanes, `advisor`/`delegate`/`web_search`, hosted MCPs — none of which exist on the Gemini path). Fix: AGENT.md § Orchestration now describes both lanes and forbids assuming either; uno-bot README documents the switch.
   → **Lesson: anything the `wrangler.toml` vars can flip must be documented as a *switch*, not as a state.**
2. **A constant changed without a grep for its old value.** `PROPOSAL_TTL_MS` went 15→60 min in code, but "15 minutes" survived in AGENT.md, `tool-definitions.json`, and the model-facing prompt in `skills.ts` — three doc surfaces for one number. Same failure shape: `proposal_resolve` was renamed from `resolve_pending_proposal`, and the *live system prompt* still instructed the old name; `SKILL_PATHS` shrank 22→20 but comments still budgeted for 22.
   → **Lesson: when changing a constant or tool name, `grep -r` the old literal across `src/`, `*.json`, AGENT.md, and docs before merging.**
3. **The cheat-sheet → agent-views rename never finished.** AGENTS.md and uno-research/uno-review migrated; uno-prototype's SKILL.md (7 dead paths incl. two MANDATORY loads), its references/README.md, `figma-registry-mandatory-load.md`, ds-lens, the Actions codegen prompt (`scripts/prompts/uno-implement`), and eval scenarios did not. Dead `.agent/` paths also survived in `design-system/docs/` + `figma/` docs.
   → **Lesson: a knowledge-layer rename is done when `validate-doc-links.sh` passes, not when AGENTS.md is updated.**
4. **Counts rot fastest.** README said 74 form elements (actual: 20), 9 DataViz (actual: 42), 8 page specs (actual: 7 areas); `plus-uno.md` disagreed with both. Counts now live once (inventory table in `plus-uno.md`) with an audit-date comment; README states them coarsely and links there.
5. **The validator existed but wasn't green.** `scripts/validate-doc-links.sh` would have caught most of #3 — it was failing on node_modules noise and two over-greedy patterns, so nobody ran it. Fixed (excludes `agents/*/node_modules`, allows `design-system/docs/foundations/`); it now passes clean.
   → **Lesson: run `bash scripts/validate-doc-links.sh` in every harness-touching PR; a failing guard is worse than no guard because it trains people to ignore it.**

Also fixed in the sweep: `.dev.vars.example` now lists all secrets (was 4 of ~15, with a wrong repo name); dead `figma:fetch-component`/`figma:write-back` npm scripts removed; dead `pickModel` router deleted; `ToolName` union completed; automations registry row for the removed `figma-library-poll.yml` corrected; stale tool names (`create_prd`, `find_experts`, `send_email`) purged from live docs.
