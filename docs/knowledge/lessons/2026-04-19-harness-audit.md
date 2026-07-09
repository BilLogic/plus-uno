---
title: "Harness audit — 2026-04-19"
date: 2026-04-19
tags: [audit, layer-audit, harness-health]
rule_candidate: false
---

# Harness audit — 2026-04-19

## Top 3 priorities

1. Wire the new rubric layer into the actual review and ship gates so `docs/rubrics/` changes behavior instead of just documenting intent.
2. Refresh `hd-config.md` so its coexistence inventory matches the repo's current harness reality.
3. Fix repo-local broken links inside the copied starter rubrics before people start relying on them.

## Current state

- Tier 1 budget: pass. `AGENTS.md` is 95 lines; `docs/context/product/one-pager.md` is absent, so combined Tier 1 remains under budget.
- Layer 1 context: present and populated across `docs/context/product/`, `docs/context/design-system/`, `docs/context/conventions/`, and `docs/context/agent-persona.md`.
- Layer 2 skills: 6 custom `uno-*` skills under `.agent/skills/`; all current `SKILL.md` files are under 200 lines.
- Layer 3 orchestration: present via `.agent/SKILL.md`, `.agent/AGENT.md`, `.agent/loading-order.md`, and `.agent/handoffs/`.
- Layer 4 rubrics: present via `docs/rubrics/INDEX.md` plus 3 starter rubrics.
- Layer 5 knowledge: present via `docs/knowledge/INDEX.md`, 4 lesson domain files, `decisions.md`, `preferences.md`, `ideations.md`, and `changelog.md`.

## Findings

### P1 — structural (ship-blocking)

- No P1 structural findings in the current harness audit.

### P2 — drift (should fix)

- severity: p2
  category: rubrics-applied
  file: `.agent/skills/uno-review/SKILL.md`
  finding: The review workflow still uses its own checklist and scripts, but does not reference or invoke the new Layer 4 rubrics in `docs/rubrics/`.
  suggested_action: Update `uno-review` and the pipeline docs so review explicitly cites the rubric files that gate shipping.
  detected_by: local audit using Layer 4 criteria + `.agent/skills/uno-review/SKILL.md`

- severity: p2
  category: rubric-derived-rule-in-agents
  file: `AGENTS.md`
  finding: `AGENTS.md` contains strong conventions and forbidden patterns, but none are framed as explicit rubric-backed gates tied to `docs/rubrics/`.
  suggested_action: Add at least one explicit rule that binds shipping or review to the rubric layer, such as requiring accessibility and design-system compliance checks before ship/review completion.
  detected_by: local audit using Layer 4 criteria + `AGENTS.md`

- severity: p2
  category: index-sync
  file: `docs/rubrics/accessibility-wcag-aa.md`
  finding: The copied starter rubrics still contain plugin-relative links like `../../references/rubric-application.md` and an over-deep cheat-sheet link path that do not resolve inside this repo.
  suggested_action: Replace plugin-internal reference links with repo-local targets or remove them until a local rubric-application reference exists.
  detected_by: local audit using Layer 4 criteria + repo link scan

- severity: p2
  category: coexistence
  file: `hd-config.md`
  finding: `hd-config.md` under-reports the current harness surface. It lists only `.agent` and `.claude`, while the detector also finds `compound-engineering` signals via `docs/plans/`, and the repo has cross-agent pointer files in `.cursor/`, `.windsurf/`, `.github/`, and `CLAUDE.md`.
  suggested_action: Refresh `hd-config.md` so `other_tool_harnesses_detected`, tooling, and coexistence notes match the repo's actual current state.
  detected_by: local audit using `detect.py` + `hd-config.md`

- severity: p2
  category: rule-adoption-cadence
  file: `docs/knowledge/changelog.md`
  finding: The knowledge layer captures lessons and ADRs well, but there is no visible lesson-to-rule adoption trail in `changelog.md` even though AGENTS-level rules already exist.
  suggested_action: Start recording explicit lesson-to-rule promotions in `docs/knowledge/changelog.md` whenever a repeated lesson becomes an AGENTS rule or convention.
  detected_by: local audit using Layer 5 criteria + `docs/knowledge/changelog.md`

### P3 — polish (nice-to-have)

- severity: p3
  category: budget-check-coverage
  file: `/Users/billguo/.codex/harness-designing-plugin/skills/hd-review/scripts/budget-check.sh`
  finding: The deterministic budget script only scans `skills/*/SKILL.md`, so it does not measure this repo's actual `.agent/skills/*/SKILL.md` inventory.
  suggested_action: If you keep using `hd:review` here, adapt the budget check or add a repo-local wrapper so Layer 2 enforcement covers the real skill directory.
  detected_by: local audit using budget-check output + repo layout

## Suggested actions

1. Address the Layer 4 integration gap first: wire `docs/rubrics/` into `uno-review`, `AGENTS.md`, and orchestration gates.
2. Repair the copied rubric links so the new rubric layer is self-contained and trustworthy.
3. Refresh `hd-config.md` to reflect the actual coexistence surface and current detector output.
4. Add the first explicit lesson-to-rule adoption entry to `docs/knowledge/changelog.md` so compounding is visible, not just implied.

## Agents used

- Inline local audit using `detect.py`
- Inline local audit using `budget-check.sh`
- Inline application of Layer 1–5 audit criteria from `hd-review`

## Meta

- Execution mode: serial
- Agents invoked: 0
- Duration: 20s
- Report version: 1.0

---

**Note:** This audit report is itself a Layer 5 lesson — dated, append-only, history is sacred. Don't edit or delete this file; author a counter-lesson if findings need revising.
