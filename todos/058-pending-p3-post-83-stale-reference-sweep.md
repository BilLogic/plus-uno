---
status: pending
priority: p3
issue_id: 058
tags: [code-review, docs, staleness]
dependencies: []
---

# Post-#83/#85/#86 stale references sweep

- Counts: `README.md:111` + `docs/context/product/plus-uno.md:8,66` say 57 UI components; regenerated index says 56 (SidebarTab/Section de-dup landed after the docs). SUSPECTED: "42 DataViz charts" vs 41 chart dirs on disk — recount.
- `playground/` survivors invisible to the link guard: `design-system/figma/component-alignment.md:72`, `.cursor/hooks/uno-writeback/storage.mjs:133` (live agent instruction!), usage examples in `scripts/audit-figma-writeback.mjs:4` + `validate-figma-writeback-manifest.mjs:4`, `skills/uno-review/SKILL.md:43` prose, `docs/evals/scenarios/uno-prototype.md:7`.
- `docs/evals/scenarios/uno-prototype.md:39,46` cites FSM state `fidelity_select` and signal `uno-prototype:execute` — neither exists (states are reflect_*; the engine emits buildHandoffMessage). The skill's quality bar tests a retired flow.
- `scripts/figma-variables-snapshot.json:2` names a generator script + npm task that don't exist (real consumer: generate-token-registry.mjs:22).
- 559 lines of completed one-shot `migrate-*.mjs` scripts referenced nowhere.
- `constants.mjs:131` comment says "four reflect_* states" above a set of six.
- AGENTS.md rule 17 "Never batch PRD/fidelity/Figma" describes the old step roster.
- SKILL.md:342-346 Constraints lists two hook runtimes; :74-76 lists three (Codex). Align.
