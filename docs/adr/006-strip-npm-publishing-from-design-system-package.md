---
embodiment: ide
summary: Strip npm publishing from design system package
status: active
verified: 2026-08-24 (#171)
---

# ADR-006: Strip npm publishing from design system package

- **Date**: 2026-03-21
- **Status**: Active
- **Context**: `packages/plus-ds/` was configured as a publishable npm package but will never be published. Publishing config (`files`, `exports`, `prepublishOnly`) was misleading.
- **Decision**: Set `private: true`, strip all publishing fields. Keep the package where it is to avoid breaking relative path aliases in prototypes. Later flattened to `design-system/`.
- **Source**: docs/plans/2026-03-21-006-refactor-strip-npm-publishing-simplify-package-plan.md
