---
embodiment: ide
summary: docs/engineering/operations.md owns the sweep names (shipped watchdog · weekly Tier-1 digest · Figma hygiene · conventions integrity · comment sweep)
---

<!-- ~350 tokens | Load when: running or triaging a standing sweep or a scored audit — not needed for ordinary intakes -->

# Sweeps & audits — IDE execution

- Summon `reviewers/auditor` with a named checklist from the registry —
  `docs/engineering/operations.md` owns the sweep names (shipped watchdog ·
  weekly Tier-1 digest · Figma hygiene · conventions integrity · comment
  sweep). The auditor inspects and files intakes; writers fix.
- The integrity sweep, Tier-1 digest, and shipped watchdog also run
  **headlessly on cron** — adapters in `scripts/prompts/uno-*/`, registry rows
  in `docs/engineering/operations.md`. Spot-run one with
  `gh workflow run <workflow-file>`; outcomes land in the Actions job summary
  (`gh run view`). Their findings arrive via the headless sweep queue
  (SKILL.md § Intake sources), so don't re-run a sweep whose issues are still
  undrained.
- Integrity sweep checklist:
  [`references/staleness-sweep.md`](staleness-sweep.md) (canonicality headers +
  agents↔docs cross-references + path integrity).
- Scored audits (rubric against an artifact) → summon
  `reviewers/rubric-applier`.
- Skill-quality audit (a skill is the target artifact): run
  [`references/skill-quality/audit-workflow.md`](skill-quality/audit-workflow.md)
  with [`references/skill-quality/checklist.md`](skill-quality/checklist.md) as
  criteria; report per `output-template.md`.
