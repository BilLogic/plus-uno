# Skill Audit Output Template

Use this exact structure for all audits.

---

## Skill Audit Report

### Audit Scope
- Target skill(s): `{path or list of paths}`
- Audit date: `{YYYY-MM-DD}`
- Checklist source: `references/skill-quality/checklist.md`

### Executive Summary
- Overall result: `{Ready / Needs Revision / Major Revision Required}`
- Skills audited: `{N}`
- Total issues: `{N}` (`P0: x`, `P1: y`, `P2: z`)
- Top risks:
  - `{risk 1}`
  - `{risk 2}`

---

## Per-Skill Findings

### Skill: `{skill name}`
- Path: `{path/to/SKILL.md}`
- Checklist score summary:
  - `Pass: {n}`
  - `Partial: {n}`
  - `Fail: {n}`
  - `N/A: {n}`

#### Issues

##### Issue `{index}` - `{short issue title}`
- Priority: `{P0 | P1 | P2}`
- Checklist section: `{section number and title}`
- Checklist item: `{exact item text}`
- Code location: `{file path + heading/section}`
- Specific problem:
  - `{what is wrong, concise and testable}`
- Why this is a problem:
  - `{impact on reliability, trigger quality, output consistency, or maintainability}`
- Original code:
```md
{exact snippet from source}
```
- Improvement suggestion:
  - `{specific rewrite intent}`
- Suggested revised code:
```md
{proposed replacement snippet}
```
- Acceptance check:
  - `{how reviewer confirms issue is fixed}`

---

## Cross-Skill Consistency Summary

Include only when auditing 2 or more skills.

- Shared strengths:
  - `{item}`
- Shared gaps:
  - `{item}`
- Pattern-level recommendation:
  - `{standardization suggestion}`

---

## Prioritized Fix Plan

1. `{P0 action}` - `{reason}`
2. `{P1 action}` - `{reason}`
3. `{P2 action}` - `{reason}`

---

## Audit Notes

- Missing references or unresolved evidence:
  - `{item}`
- Assumptions:
  - `{item}`
- Not applicable checklist items:
  - `{item + rationale}`
