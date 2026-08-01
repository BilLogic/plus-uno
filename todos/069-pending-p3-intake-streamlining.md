---
status: pending
priority: p3
issue_id: 069
tags: [code-review, simplification, fsm]
dependencies: [064]
---

# Streamline the intake ecosystem (~1,850 lines for an 8-question interview)

Simplicity review verdict: keep the FSM core (it fixed observed failures; enforces what prose cannot), but it is at its complexity ceiling. Levers, return-ranked:

1. Intake prose is specified FIVE times (SKILL.md Intake mode + Step 2 + Constraints, method.md §0, constants.mjs guidance). Make method.md §0 own the sequence, SKILL.md Intake mode own IDE rendering once; cut Step 2's rule restatement and the Constraints copy to pointers. ~90 lines off SKILL.md, sync surface 3→1.
2. ~~Dead FSM code (~100 LOC, zero behavior change): unreachable `!strict` branches (`engine.mjs:308-311,326-329` — STRICT_GATE_STATE_IDS contains all states), write-only `prd-hints.mjs`, pass-through `resolveOptions/resolveType` (`states.mjs:139-149`), legacy `clearBriefing`.~~ STRUCK 2026-08-01 — the dead code was already deleted.
3. Freeze the adapter matrix: verify Codex once or delete `.codex/`; close todo 037 (Antigravity/Windsurf) as won't-do — the manual path is the declared contract and each adapter adds ~0 capability at real verification cost. DECISION for Bill.
4. ~~`test-fsm.mjs` (275 lines) runs in no CI and no npm script — wire it into the monthly sweep or delete it.~~ STRUCK 2026-08-01 — `check:intake-fsm` exists in package.json and runs in `harness-integrity-sweep.yml`.
5. Wire `check:component-registry` + `check:token-registry` into the monthly integrity sweep (~5 yml lines) — currently guards only by prose.
6. Kill-switch conflict: manual path overrides `uno.prdGate: false` — SKILL.md needs "check .cursor/settings.json prdGate before manual intake".
7. PLAUSIBLE: engine's paste-PRD fast path (`engine.mjs:287-299`) skips two steps with no confirm tap, contradicting SKILL.md rule 4's one-tap-confirm promise — align doc or code.

## Work Log (2026-07-31 — item 1 done, adapter decision made)
- Prose duplication cut: Intake mode owns the sequence + presentation rules; Step 2 keeps only its unique content; Constraints points instead of restating. SKILL.md -39/+16.
- Adapter matrix (item 3): Bill's ruling — Windsurf dropped, Antigravity still wanted, Codex kept. Not a freeze; todo 037 stays open for Antigravity.
- Item 6 (prdGate kill switch) done. Items 2 (dead FSM code), 4 (test-fsm in CI), 5 (registry checks — DONE, wired into the monthly sweep) tracked here.
