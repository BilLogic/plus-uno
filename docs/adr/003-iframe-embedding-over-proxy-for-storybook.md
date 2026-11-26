---
embodiment: ide
summary: Iframe embedding over proxy for Storybook
status: superseded
verified: 2026-11-26
---

> **Superseded (2026-11-26).** No Vite app runs on 4100 and no `/storybook` iframe route exists: `main` is Storybook alone (`npm run storybook`, port 4200). `prototypes/README.md` says where the old app went.

# ADR-003: Iframe embedding over proxy for Storybook

- **Date**: 2026-03-22
- **Status**: Superseded by `main` hosting Storybook only (2026-11-26); the Vite app and its iframe route left `main` (`prototypes/README.md`)
- **Context**: Storybook's assets load at root paths (`/sb-manager/`, `/sb-addons/`) which bypass subpath proxy rewrites. Direct port links lose navigation context.
- **Decision**: Embed Storybook via full-screen iframe at `/storybook` route. Use `concurrently` to run both Vite (port 4100) and Storybook (port 4200) in parallel.
- **Source**: (pre-consolidation solution doc, no longer in the repo) _archive/solutions/agent-infrastructure/marketplace-storybook-navigation-architecture.md
