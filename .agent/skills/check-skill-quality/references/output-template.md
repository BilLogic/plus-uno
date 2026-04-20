# Audit Output Template

Use this template exactly when reporting results.

---

## Skill Audit: {skill-name}

### Metadata
- Target path: `{path}`
- Files reviewed: `{list}`
- Audit scope: `{single-skill | multi-skill}`
- Overall rating: `{Pass with minor gaps | Needs improvement | Major revision needed}`

### Checklist Summary
| Section | Pass | Partial | Fail | N/A |
|---|---:|---:|---:|---:|
| 1. Skill Definition | {n} | {n} | {n} | {n} |
| 2. Scope | {n} | {n} | {n} | {n} |
| 3. Instructions | {n} | {n} | {n} | {n} |
| 4. Output Structure | {n} | {n} | {n} | {n} |
| 5. Context Design | {n} | {n} | {n} | {n} |
| 6. Workflow Value | {n} | {n} | {n} | {n} |
| 7. Trigger -> Action Mapping | {n} | {n} | {n} | {n} |
| 8. Scalability & Maintainability | {n} | {n} | {n} | {n} |
| 9. Failure Handling | {n} | {n} | {n} | {n} |

### Findings

Repeat this block for every `Partial` or `Fail` issue:

#### Finding {index}: {short title}
- Severity: `{High|Medium|Low}`
- Checklist item: `{section}.{item}`
- Code location: `{relative-path}`
- Section heading: `{heading}`

**Original code**
```md
{exact snippet}
```

**Issue**
- {why this violates or only partially satisfies the checklist}

**Improvement suggestion**
- {specific actionable change}

**Suggested rewrite**
```md
{proposed replacement text}
```

### Strengths
- {clear strengths worth preserving}

### Priority Fixes
1. {highest-impact fix}
2. {second fix}
3. {third fix}

### Suggested Next Step
- {for example: "apply rewrites and re-run check-skill-quality on same folder"}

---

## Cross-Skill Summary (only for multi-skill audits)

### Shared Gaps
- {gap pattern seen across multiple skills}

### Inconsistencies
- {naming/style/structure differences affecting maintainability}

### Standardization Recommendations
1. {repo-wide rule}
2. {repo-wide template update}
3. {validation or linting suggestion}

---

## Notes

- Always include evidence before recommendations.
- Do not report checklist items as failed without quoting source content.
- Keep suggested rewrites minimal and directly applicable.
