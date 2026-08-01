---
status: pending
priority: p3
issue_id: 068
tags: [code-review, docs, staleness]
dependencies: []
---

# Post-#83/#85/#86 stale references sweep

- ~~Counts: `README.md:111` + `docs/context/product/plus-uno.md:8,66` say 57 UI components; regenerated index says 56 (SidebarTab/Section de-dup landed after the docs). SUSPECTED: "42 DataViz charts" vs 41 chart dirs on disk — recount.~~ DONE — resolved by the 2026-07-31 restructure (both files now say 56 / 25).
- `playground/` survivors invisible to the link guard: `design-system/figma/component-alignment.md:72`, `.cursor/hooks/uno-writeback/storage.mjs:133` (live agent instruction!), usage examples in `scripts/audit-figma-writeback.mjs:4` + `validate-figma-writeback-manifest.mjs:4`, `skills/uno-review/SKILL.md:43` prose, `docs/evals/scenarios/uno-prototype.md:7`.
- ~~`docs/evals/scenarios/uno-prototype.md:39,46` cites FSM state `fidelity_select` and signal `uno-prototype:execute` — neither exists (states are reflect_*; the engine emits buildHandoffMessage). The skill's quality bar tests a retired flow.~~ DONE — `fidelity_select` rename resolved by the 2026-07-31 restructure; the remaining `uno-prototype:execute` citation fixed by the 2026-08-01 scenario edit (S7 now says the hook emits its build-handoff message and clears the intake JSON).
- `scripts/figma-variables-snapshot.json:2` names a generator script + npm task that don't exist (real consumer: generate-token-registry.mjs:22).
- 559 lines of completed one-shot `migrate-*.mjs` scripts referenced nowhere.
- ~~`constants.mjs:131` comment says "four reflect_* states" above a set of six.~~ DONE — resolved by the 2026-07-31 restructure (comment no longer states a count).
- ~~AGENTS.md rule 17 "Never batch PRD/fidelity/Figma" describes the old step roster.~~ DONE — resolved by the 2026-07-31 restructure (rule 17 now states the one-step-per-message contract without the old roster).
- ~~SKILL.md:342-346 Constraints lists two hook runtimes; :74-76 lists three (Codex). Align.~~ DONE — resolved by the 2026-07-31 restructure.
