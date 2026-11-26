---
embodiment: ide
summary: the standing sweeps (Figma hygiene · conventions integrity · comment sweep), run by summoning reviewers/auditor
---

<!-- ~350 tokens | Load when: running or triaging a standing sweep or a scored audit — not needed for ordinary intakes -->

# Sweeps & audits — IDE execution

- Summon `reviewers/auditor` with a named sweep's checklist — Figma hygiene ·
  conventions integrity · comment sweep; `docs/engineering/operations.md`
  registers the automated ones. The auditor inspects and files intakes;
  writers fix.
- Integrity sweep checklist:
  [`references/staleness-sweep.md`](staleness-sweep.md) (canonicality headers +
  agents↔docs cross-references + path integrity).
- Scored audits (rubric against an artifact) → summon
  `reviewers/rubric-applier`.
- Skill-quality audit (a skill is the target artifact): load the
  `writing-for-agents` skill (upstream) and audit the skill against it, one
  finding per violated lever with the line it sits on.
