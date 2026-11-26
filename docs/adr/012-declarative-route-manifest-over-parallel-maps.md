---
embodiment: ide
summary: Declarative route manifest over parallel maps — retired; the manifest never landed
status: superseded
verified: 2026-11-26
---

# ADR-012: Declarative route manifest over parallel maps

> **Retired (2026-11-26).** Verified against code 2026-08-24 (#171) and again now:
> no route manifest exists under `design-system/` or anywhere else (`ROUTE_MANIFEST`,
> `routeConfig`, `pathToTab` match only this file), and the repo builds no routed app.
> Sidebar state belongs to the Frame template's Sidebar. The decision never landed, so
> it is retired rather than carried as an open question.

- **Date**: 2026-03-17
- **Status**: Superseded by the Frame template's Sidebar (`design-system/agent-views/templates/TemplatesOverview.md`); retired 2026-11-26
- **Context**: Sidebar navigation required maintaining 3 parallel maps (`pathToTab`, `pathToUserType`, inline `onTabClick` if-chain). Every navigation change required code changes in 3+ locations.
- **Decision**: Single declarative route manifest that drives routing, sidebar state, breadcrumbs, and user type. Dynamic sub-items register/unregister at runtime. Adding a new route requires only a manifest entry.
- **Source**: `git show 7b0cea5ef:docs/plans/2026-03-17-001-feat-toolkit-ia-revision-plan.md`
