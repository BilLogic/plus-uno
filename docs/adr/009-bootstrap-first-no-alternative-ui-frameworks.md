---
embodiment: ide
summary: Bootstrap-first, no alternative UI frameworks — superseded by ADR-037 on the fallback-behavior half and retired in full by ADR-042, which removes Bootstrap
status: superseded
verified: 2026-11-03
---

# ADR-009: Bootstrap-first, no alternative UI frameworks

> **Retired in full by [ADR-042](042-plus-ships-no-bootstrap.md), 2026-11-11.**
> PLUS ships no Bootstrap. The ban on other UI frameworks is carried by
> `AGENTS.md` hard rule 5.

> **Superseded by [ADR-037](037-base-ui-is-the-behavior-layer-for-every-component.md), 2026-11-03.**
>
> React-Bootstrap is no longer the fallback source of behavior for an
> interactive component with no PLUS equivalent — Base UI is. The
> no-other-frameworks half of this decision (no Material UI, no Ant Design,
> FA Free only) stands; only the Bootstrap-fallback half is replaced.

> **Update 2026-11-09:** Tailwind is removed; the docs chrome is styled on the app's tokens, so the Tailwind half of the ban holds again.
>
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
