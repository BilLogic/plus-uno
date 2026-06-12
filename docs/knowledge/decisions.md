<!-- Tier: 2 -->
---
domain: decisions
type: adr
confidence: high
created: 2026-04-11
tags: [architecture, conventions]
---

## ADR-001: AGENTS.md as single cross-agent entry point
- **Date**: 2026-03-21
- **Status**: Active
- **Context**: Platform files (CLAUDE.md, .windsurfrules, cursorrules.md) each contained their own instructions, creating inconsistency. Non-DS tasks had no agent guidance at all.
- **Decision**: Create AGENTS.md at repo root as THE single entry point. All platform files point to it. Contains voice, forbidden patterns, skills table, progressive loading, commands.
- **Source**: docs/plans/2026-03-21-001-feat-agents-md-compound-loop-agent-skills-plan.md

## ADR-002: Vite over Next.js for prototype workspace
- **Date**: 2026-03-22
- **Status**: Active
- **Context**: Considered migrating to Next.js for auth, API routes, SSR. plus-uno does not need any of these -- it is a prototype builder, not the production platform.
- **Decision**: Stay on Vite. Upgrade to Vite 8 (Rolldown). If a production PLUS platform is built, it becomes a separate Next.js app consuming the shared design system.
- **Source**: _archive/solutions/agent-infrastructure/vite-8-upgrade-and-framework-decision.md

## ADR-003: Iframe embedding over proxy for Storybook
- **Date**: 2026-03-22
- **Status**: Active
- **Context**: Storybook's assets load at root paths (`/sb-manager/`, `/sb-addons/`) which bypass subpath proxy rewrites. Direct port links lose navigation context.
- **Decision**: Embed Storybook via full-screen iframe at `/storybook` route. Use `concurrently` to run both Vite (port 4100) and Storybook (port 4200) in parallel.
- **Source**: _archive/solutions/agent-infrastructure/marketplace-storybook-navigation-architecture.md

## ADR-004: 4-digit numeric IDs over slugs for prototype listings
- **Date**: 2026-03-22
- **Status**: Active
- **Context**: String slugs caused naming collisions and awkward URL paths. Creator-based directory grouping did not scale.
- **Decision**: Use 4-digit numeric IDs (1001+) for all prototype listings. Flat project-oriented playground structure with creator info as metadata.
- **Source**: _archive/solutions/agent-infrastructure/marketplace-storybook-navigation-architecture.md

## ADR-005: All docs consolidated under docs/
- **Date**: 2026-03-21
- **Status**: Active
- **Context**: DS docs were split across three locations: `.agent/references/` (16 files), `packages/plus-ds/guidelines/` (16 files), and `docs/`. Confusion about where things live.
- **Decision**: Single `docs/` tree for all documentation. `.agent/` is only for skills and assets. No separate `guidelines/`, `references/`, or scattered doc directories.
- **Source**: docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md

## ADR-006: Strip npm publishing from design system package
- **Date**: 2026-03-21
- **Status**: Active
- **Context**: `packages/plus-ds/` was configured as a publishable npm package but will never be published. Publishing config (`files`, `exports`, `prepublishOnly`) was misleading.
- **Decision**: Set `private: true`, strip all publishing fields. Keep the package where it is to avoid breaking relative path aliases in playground prototypes. Later flattened to `design-system/`.
- **Source**: docs/plans/2026-03-21-006-refactor-strip-npm-publishing-simplify-package-plan.md

## ADR-007: Agent-agnostic skills under .agent/skills/
- **Date**: 2026-03-21
- **Status**: Amended (2026-04-11)
- **Context**: Skills in `.claude/commands/` only work in Claude Code. Cursor and Windsurf agents cannot invoke them. Platform-specific frontmatter limits portability.
- **Decision**: All skills under `.agent/skills/` with platform-agnostic SKILL.md files. Each skill has SKILL.md + references/ + examples/ + scripts/.
- **Amendment (2026-04-11)**: Skill frontmatter MAY include `allowed-tools`, `context`, `agent`, and `disable-model-invocation` fields. These are treated as hints — Claude Code enforces them natively; other platforms ignore unknown frontmatter gracefully. This is preferred over maintaining separate platform-specific wrappers.
- **Source**: docs/plans/2026-03-21-004-feat-agent-infrastructure-consolidated-plan.md

## ADR-008: Compound loop for cross-session learning
- **Date**: 2026-03-21
- **Status**: Active
- **Context**: Learnings from bugs and gotchas were lost between sessions. Same mistakes repeated.
- **Decision**: After significant work, document in `docs/knowledge/lessons/` with YAML frontmatter. Periodically extract patterns into AGENTS.md forbidden patterns and conventions.md. The uno-compound skill codifies this.
- **Source**: docs/plans/2026-03-21-001-feat-agents-md-compound-loop-agent-skills-plan.md

## ADR-009: Bootstrap-first, no alternative UI frameworks
- **Date**: 2026-03-22
- **Status**: Active
- **Context**: The PLUS design system is built on React-Bootstrap / Bootstrap 5.3. Introducing Material UI, Ant Design, or Tailwind would fragment the component library and token system.
- **Decision**: Use PLUS DS components first, fall back to React-Bootstrap when no PLUS equivalent exists. Never introduce non-Bootstrap UI frameworks. FA Free only (no Pro icons).
- **Source**: _archive/solutions/agent-infrastructure/repo-restructure-agents-md-docs-consolidation.md

## ADR-010: Three-tier context loading architecture
- **Date**: 2026-04-11
- **Status**: Active
- **Context**: Agent context windows are finite. The flat docs/ structure mixed always-loaded context with on-demand references. No way to distinguish essential product truth from supplementary guides.
- **Decision**: Implement three tiers: (1) Always-loaded -- identity, conventions, principles, knowledge index via AGENTS.md "See" references to `docs/context/`. (2) On-demand -- skills, detailed context, knowledge entries triggered by skill invocation. (3) Ephemeral -- tool outputs, exploration, handoffs in `.agent/handoffs/` (gitignored).
- **Source**: docs/plans/2026-04-11-001-refactor-three-tier-context-architecture-plan.md

## ADR-011: Doc splitting by task context (Index + Modules pattern)
- **Date**: 2026-03-23
- **Status**: Active
- **Context**: Monolithic docs (400+ lines) wasted 60-70% of context budget per agent interaction. Docs were written for human top-to-bottom reading, not agent load-what-you-need consumption.
- **Decision**: Each monolith becomes a lightweight index file (<20 lines) linking to focused modules. Each module gets a `<!-- Load when: ... -->` header. New docs >150 lines must be split by task context from the start. Skill SKILL.md files stay under 80 lines.
- **Source**: _archive/solutions/agent-infrastructure/2026-03-23-doc-splitting-dynamic-context-loading.md

## ADR-012: Declarative route manifest over parallel maps
- **Date**: 2026-03-17
- **Status**: Active
- **Context**: Sidebar navigation required maintaining 3 parallel maps (`pathToTab`, `pathToUserType`, inline `onTabClick` if-chain). Every navigation change required code changes in 3+ locations.
- **Decision**: Single declarative route manifest that drives routing, sidebar state, breadcrumbs, and user type. Dynamic sub-items register/unregister at runtime. Adding a new route requires only a manifest entry.
- **Source**: docs/plans/2026-03-17-001-feat-toolkit-ia-revision-plan.md
