# plus-one — Agent Instructions

## Voice

You are working in the plus-one design system and prototyping workspace for the PLUS tutoring platform. Be precise about component names and file paths. Cite sources. Push back respectfully if something violates the product landscape, conventions, or forbidden patterns.

## Product Context

Read `docs/project/plus-app.md` before doing any work. It covers the PLUS mission, service system, AI+Human loop, and platform overview. Related docs:
- `docs/project/plus-app-users.md` — users, roles, stakeholders, team structure
- `docs/project/plus-app-features.md` — product pillars, feature tables, core entities, domain terminology
- `docs/project/plus-app-flows.md` — session lifecycle, sign-up, escalation, training, tutor coach

## Design System

For all design system work (components, tokens, Storybook, Figma), read `.agent/SKILL.md` for mode routing and guardrails. It defines 6 mutually exclusive modes:

| Signal | Mode |
|--------|------|
| "What is…" / "How does…" / "Where is…" | **Learning** |
| "Update the component" / "Sync tokens" / "Add to the DS" | **Maintaining** |
| "What should the layout be" / "Help me plan the page" | **Consulting** |
| "Show me options" / "Compare approaches" | **Iteration** |
| "Validate this idea" / "Quick check" / "Hack this together" | **Prototyping** |
| "Build this" / "Implement the design" / Figma link provided | **Finalization** |

Before executing any task, determine the correct mode and state it explicitly.

Refer to `.agent/AGENT.md` for identity, skills table, and grounding rules.

## Conventions

Read `docs/project/conventions.md` for file naming, imports, git conventions, and known gotchas.

## Forbidden Patterns

1. Never hardcode colors, spacing, typography, radius, or elevation — use design tokens. Map to compile-ready tokens (e.g., `var(--color-on-surface-state-08)`), not raw Figma literal names.
2. **Cheat Sheet is law**: Before writing any React component from `@plus-ds` or applying any CSS token, read `.agent/assets/PLUS_CHEAT_SHEET.md`. If it's not in the Cheat Sheet, it does not exist.
3. **Never hallucinate layouts**: When building a new page, read `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md` and use official structural React formulas (e.g., `<PageLayout>`).
4. **Never hallucinate props**: Always read component `.jsx` or `.stories.jsx` to verify exact prop names and types before implementing.
5. Never skip reading component source + story + styles before using unfamiliar components.
6. Use PLUS components first — only fall back to generic React-Bootstrap when no PLUS equivalent exists.
7. When Figma design input exists, fetch design context and screenshot via Figma MCP before implementing.
8. Never install new packages without explicit user approval.
9. Never introduce non-Bootstrap UI frameworks (no Material UI, no Ant Design, no Tailwind).
10. Never deep-import from `design-system/src/` — use barrel exports from `@` alias.
11. Never create components that duplicate existing ones — check `.agent/assets/components-index.json` first.
12. Never edit generated token files directly — run `npm run generate:tokens` after changes.
13. Always validate in Storybook when component behavior is touched.
14. Confirm implementation plan and touched files before large or risky edits.

## Skills

| Skill | Trigger | Location |
|-------|---------|----------|
| learn-plus | "How do I...", questions | `.agent/skills/learn-plus/SKILL.md` |
| design-consulting | "Brainstorm", "Plan" | `.agent/skills/design-consulting/SKILL.md` |
| building | "Build", "Create", Figma links | `.agent/skills/building/SKILL.md` |
| maintaining | "Update", "Fix", "Sync" | `.agent/skills/maintaining/SKILL.md` |
| submit-to-market | "Submit", "Publish" | `.agent/skills/submit-to-market/SKILL.md` |
| po-prototype | Scaffold playground prototype | `.agent/skills/po-prototype/SKILL.md` |
| po-compound | Document learnings | `.agent/skills/po-compound/SKILL.md` |
| po-review | Quality gate before shipping | `.agent/skills/po-review/SKILL.md` |

## Learnings

Check `docs/solutions/` before starting work — past solutions may apply.
After completing significant work, document learnings there via `/po:compound`.

## Setup

Read `docs/project/setup-guide.md` for onboarding: recommended CE skills, MCP server config, platform setup.

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run storybook` | Storybook (port 6006) |
| `npm run build` | Production build |
| `npm run build-storybook` | Build Storybook static site |
| `npm run sync:tokens` | Sync tokens from Figma |
| `npm run generate:tokens` | Generate SCSS/JS from token source |
| `npm run dev:home-redesign` | Home redesign prototype |
| `npm run dev:monthly-report` | Monthly report prototype |

## Progressive Loading

Load docs on-demand based on what comes up in conversation:

| Trigger | Load |
|---------|------|
| Building UI, using components or tokens | `.agent/assets/PLUS_CHEAT_SHEET.md` (MANDATORY) |
| Building new pages, dashboards, layouts | `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md` (MANDATORY) |
| Figma link or MCP tools mentioned | `docs/design-system/integrations.md` |
| Component architecture questions | `docs/design-system/components.md` |
| Build, preview, or deployment | `docs/design-system/guides/local-preview.md` |
| Exact file paths or env vars needed | Relevant `.agent/assets/*-index.json` |
| Token sync or repo scripts | `docs/design-system/maintenance/scripts.md` |
| Product context, users, or domain terms | `docs/project/plus-app*.md` |

Keep context lean: load mode file first, then only 2-3 needed guides (~2,000-2,500 tokens). Avoid full load (~5,500 tokens).
