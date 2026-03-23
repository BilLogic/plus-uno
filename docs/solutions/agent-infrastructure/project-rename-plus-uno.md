---
title: "Project Rename: plus-one → plus-uno"
category: agent-infrastructure
date: 2026-03-22
tags:
  - rename
  - branding
  - project-name
module: project-wide
symptom: "Project name change from plus-one to plus-uno"
root_cause: "Branding decision — new name better reflects the project identity"
---

# Project Rename: plus-one → plus-uno

## Change

All references to "plus-one" renamed to "plus-uno" across the entire codebase.

## Scope

- 14 files modified, 42 references updated
- `docs/project/plus-one.md` → `docs/project/plus-uno.md`
- GitHub repo: `BilLogic/plus-one` → `BilLogic/plus-uno`
- Netlify site updated
- Memory files updated

## Files Modified

| File | Type |
|------|------|
| AGENTS.md | Active - entry point |
| README.md | Active - project readme |
| docs/project/plus-uno.md | Active - renamed from plus-one.md |
| docs/project/setup-guide.md | Active - onboarding |
| docs/design-system/platform-integration.md | Active - agent config |
| docs/plans/*.md (5 files) | Historical - plan docs |
| docs/solutions/*.md (3 files) | Historical - learnings |
| SemesterAtPLUS.stories.jsx | Component - story ID |

## Prevention

When renaming a project, grep comprehensively:
```bash
grep -rn "old-name" --include="*.md" --include="*.js" --include="*.jsx" --include="*.json" | grep -v node_modules | grep -v package-lock
```

Also update: memory files, GitHub repo name, Netlify site name, any CI/CD references.
