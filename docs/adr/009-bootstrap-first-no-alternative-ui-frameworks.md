---
embodiment: ide
summary: Bootstrap-first, no alternative UI frameworks
status: contradicted
verified: 2026-08-24 (#171)
---

# ADR-009: Bootstrap-first, no alternative UI frameworks

> **Verified against code 2026-08-24 (#171) — the ban on Tailwind is contradicted by the code.**
>
> `package.json` declares `tailwindcss`, `@tailwindcss/vite` and `tailwind-merge`,
> and Tailwind classes appear in roughly 65 source files. The decision says
> "Never introduce non-Bootstrap UI frameworks (no Material UI, no Ant Design,
> no Tailwind)." Either the rule is dead or the code is in violation at scale;
> that call is #164's (rule disposition), and the code sweep is its own effort.
> Recorded here rather than silently carried forward as Active.


- **Date**: 2026-03-22
- **Status**: Active
- **Context**: The PLUS design system is built on React-Bootstrap / Bootstrap 5.3. Introducing Material UI, Ant Design, or Tailwind would fragment the component library and token system.
- **Decision**: Use PLUS DS components first, fall back to React-Bootstrap when no PLUS equivalent exists. Never introduce non-Bootstrap UI frameworks. FA Free only (no Pro icons).
- **Source**: (pre-consolidation solution doc, no longer in the repo) _archive/solutions/agent-infrastructure/repo-restructure-agents-md-docs-consolidation.md
