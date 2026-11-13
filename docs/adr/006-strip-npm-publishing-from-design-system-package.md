---
embodiment: ide
summary: Strip npm publishing from design system package
status: superseded
verified: 2026-11-13 (#2405)
---

# ADR-006: Strip npm publishing from design system package

> **Superseded by [ADR-047](047-the-design-system-ships-outside-the-repo.md).** The design system package itself stays private; what ships outside the repo is the `@plus-uno/cli` package and its registry.

- **Date**: 2026-03-21
- **Status**: Superseded by [ADR-047](047-the-design-system-ships-outside-the-repo.md) (2026-11-13)
- **Context**: `packages/plus-ds/` was configured as a publishable npm package but was not published at the time (superseded by ADR-047). Publishing config (`files`, `exports`, `prepublishOnly`) was misleading.
- **Decision**: Set `private: true`, strip all publishing fields. Keep the package where it is to avoid breaking relative path aliases in prototypes. Later flattened to `design-system/`.
- **Source**: docs/plans/2026-03-21-006-refactor-strip-npm-publishing-simplify-package-plan.md
