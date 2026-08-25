---
embodiment: ide
summary: Vite over Next.js for prototype workspace
status: active
verified: 2026-08-24 (#171)
---

# ADR-002: Vite over Next.js for prototype workspace

- **Date**: 2026-03-22
- **Status**: Active
- **Context**: Considered migrating to Next.js for auth, API routes, SSR. plus-uno does not need any of these -- it is a prototype builder, not the production platform.
- **Decision**: Stay on Vite. Upgrade to Vite 8 (Rolldown). If a production PLUS platform is built, it becomes a separate Next.js app consuming the shared design system.
- **Source**: (pre-consolidation solution doc, no longer in the repo) _archive/solutions/agent-infrastructure/vite-8-upgrade-and-framework-decision.md
