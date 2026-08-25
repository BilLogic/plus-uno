---
embodiment: ide
summary: Iframe embedding over proxy for Storybook
status: active
verified: 2026-08-24 (#171)
---

# ADR-003: Iframe embedding over proxy for Storybook

- **Date**: 2026-03-22
- **Status**: Active
- **Context**: Storybook's assets load at root paths (`/sb-manager/`, `/sb-addons/`) which bypass subpath proxy rewrites. Direct port links lose navigation context.
- **Decision**: Embed Storybook via full-screen iframe at `/storybook` route. Use `concurrently` to run both Vite (port 4100) and Storybook (port 4200) in parallel.
- **Source**: (pre-consolidation solution doc, no longer in the repo) _archive/solutions/agent-infrastructure/marketplace-storybook-navigation-architecture.md
