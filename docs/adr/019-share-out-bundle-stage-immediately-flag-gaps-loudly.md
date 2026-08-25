---
embodiment: ide
summary: Share-out bundle — stage immediately, flag gaps loudly on the card (2026-07-16)
status: active
verified: 2026-08-24 (#171)
---

# ADR-019: Share-out bundle — stage immediately, flag gaps loudly on the card (2026-07-16)

**Decision.** uno-bot's feedback rail stages a `shareout_post` proposal the moment a summary is in hand — it never interrogates for missing bundle pieces before staging. The confirmation card carries a code-enforced bundle audit (`proposal-render.ts: shareoutBundleNote` — Loom walkthrough / live preview / Decisions DB link for prototype share-outs); ✅ on that card is informed consent to post partial, or the user drops links in-thread and the bot folds them in. The IDE publish flow (`skills/uno-publish`) keeps its hard gate — a partial bundle never posts from there.

**Why.** (Bill, 2026-07-16, "stage, but flag gaps loudly"): the 2026-07-16 evals exposed a three-way spec contradiction — AGENT.md required "bundle complete" before staging, preflight.ts hard-REJECTED partial prototype share-outs, while the eval cases (R3/R6) expected immediate staging from a bare link. The primary model happened to satisfy the evals; the fallback model read the docs literally and asked-then-staged, which surfaced as an approval being stonewalled ("go ahead" had nothing to resolve). A renderer-level audit keeps the disclosure deterministic on any model lane while removing the ask-first round-trip.

**Consequences.** preflight.ts bundle rejection removed (min-substance summary check stays); loud audit added to the proposal card; aligned surfaces: AGENT.md dispatch row, skills/uno-publish/bot.md + SKILL.md + references/method.md, docs/conventions/slack.md, tool-definitions.json (shareout_post description), regenerated harness. Evals R3/R6 unchanged — they now match the contract.
