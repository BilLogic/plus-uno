---
embodiment: ide
summary: Declarative route manifest over parallel maps
status: unverifiable
verified: 2026-08-24 (#171)
---

# ADR-012: Declarative route manifest over parallel maps

> **Verified against code 2026-08-24 (#171) — the artifact this decision describes could not be found.**
>
> No declarative route manifest exists under `design-system/src` or `src` by any
> name searched (`ROUTE_MANIFEST`, `routeConfig`, `pathToTab`, `routes.js`).
> Sidebar state today is passed per-spec as `activeTabId` through `PageLayout`.
> The decision may have been reverted, renamed, or never fully landed. Marked
> unverifiable rather than retired, because absence of a filename is not proof
> of absence of the pattern.


- **Date**: 2026-03-17
- **Status**: Active
- **Context**: Sidebar navigation required maintaining 3 parallel maps (`pathToTab`, `pathToUserType`, inline `onTabClick` if-chain). Every navigation change required code changes in 3+ locations.
- **Decision**: Single declarative route manifest that drives routing, sidebar state, breadcrumbs, and user type. Dynamic sub-items register/unregister at runtime. Adding a new route requires only a manifest entry.
- **Source**: docs/plans/2026-03-17-001-feat-toolkit-ia-revision-plan.md
