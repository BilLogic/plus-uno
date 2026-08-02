# 070 — P2: missing-context gate fires intermittently on the Worker (P3 eval ~1-in-3)

**Seen:** 2026-07-31/08-01, eval case P3 (`docs/evals/fixtures/uno-bot-cases.json`).
Given an inline PRD with three plain ambiguities (date: single/range/presets ·
combine: AND/OR · zero-results state unspecified) and "Build it hi-fi in the
prototypes", the bot names the gaps in ~1 of 3 runs; otherwise it assumes
plausible resolutions and proceeds.

**Already done:** method §4 rebound to the act ("building, writing the spec, or
staging a proposal"; "a PRD existing is not the same as a PRD being complete")
and bot.md gained the name-the-gaps-before-staging rule — that moved it from
0-for-2 to intermittent, not to reliable.

**Why not chased further now:** each eval cycle is ~10 min + Vertex quota, and
prompt-nudging showed diminishing returns. Candidate structural fixes, in order (1 SHIPPED 2026-08-01 — proposal-render.ts adds a
visible 'no open questions were named' notice to any scaffold card whose preview/notes
name no gap, so a ✅ is informed; model-side reliability still tracked):
1. Preflight assist: `prototype_scaffold` preflight surfaces a "gaps named?"
   checklist item into the proposal card (Worker-side, deterministic).
2. ~~Make P3 a 3-sample eval (pass = 3/3)~~ SHIPPED 2026-08-02 — run-evals.mjs honors `samples: N` per case; P3 set to 3. Remaining: 3. few-shot in bot.md if 3/3 stays red.
3. Few-shot: add one worked gap-naming exchange to bot.md § Execute.

**Case stays `blocker: false`** until reliable, so CI signals without blocking.

**RESOLVED-PENDING-CONFIRMATION 2026-08-02:** candidate 3 (few-shot worked
exchange in bot.md) took P3 from 0/3 to **3/3 samples** (run 30732024610,
deploy b4f3a9c7). Flip the case to `blocker: true` after the next weekly cron
(Mon 08:00 UTC) confirms 3/3 again; then archive this todo.
