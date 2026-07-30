---
status: pending
priority: p3
issue_id: 059
tags: [code-review, simplification, fsm]
dependencies: [054]
---

# Streamline the intake ecosystem (~1,850 lines for an 8-question interview)

Simplicity review verdict: keep the FSM core (it fixed observed failures; enforces what prose cannot), but it is at its complexity ceiling. Levers, return-ranked:

1. Intake prose is specified FIVE times (SKILL.md Intake mode + Step 2 + Constraints, method.md §0, constants.mjs guidance). Make method.md §0 own the sequence, SKILL.md Intake mode own IDE rendering once; cut Step 2's rule restatement and the Constraints copy to pointers. ~90 lines off SKILL.md, sync surface 3→1.
2. Dead FSM code (~100 LOC, zero behavior change): unreachable `!strict` branches (`engine.mjs:308-311,326-329` — STRICT_GATE_STATE_IDS contains all states), write-only `prd-hints.mjs`, pass-through `resolveOptions/resolveType` (`states.mjs:139-149`), legacy `clearBriefing`.
3. Freeze the adapter matrix: verify Codex once or delete `.codex/`; close todo 037 (Antigravity/Windsurf) as won't-do — the manual path is the declared contract and each adapter adds ~0 capability at real verification cost. DECISION for Bill.
4. `test-fsm.mjs` (275 lines) runs in no CI and no npm script — wire it into the monthly sweep or delete it.
5. Wire `check:component-registry` + `check:token-registry` into the monthly integrity sweep (~5 yml lines) — currently guards only by prose.
6. Kill-switch conflict: manual path overrides `uno.prdGate: false` — SKILL.md needs "check .cursor/settings.json prdGate before manual intake".
7. PLAUSIBLE: engine's paste-PRD fast path (`engine.mjs:287-299`) skips two steps with no confirm tap, contradicting SKILL.md rule 4's one-tap-confirm promise — align doc or code.
