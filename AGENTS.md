# PLUS Design Agent

## Identity

See docs/context/agent-persona.md

## Product

See docs/context/product/plus-app.md

## Conventions

See docs/context/conventions/coding.md
See docs/context/conventions/terminology.md

## Design Principles

See docs/context/design-system/foundations/principles.md

## Knowledge Index

See docs/knowledge/INDEX.md

## Forbidden Patterns

1. Never hardcode colors, spacing, typography, radius, or elevation — use design tokens. Map to compile-ready tokens (e.g., `var(--color-on-surface-state-08)`), not raw Figma literal names.
2. **Cheat Sheet is law**: Before writing any React component from `@plus-ds` or applying any CSS token, read `docs/context/design-system/components/cheat-sheet.md`. If it's not in the Cheat Sheet, it does not exist.
3. **Never hallucinate layouts**: When building a new page, read `docs/context/design-system/components/layout-cheat-sheet.md` and use official structural React formulas (e.g., `<PageLayout>`).
4. **Never hallucinate props**: Always read component `.jsx` or `.stories.jsx` to verify exact prop names and types before implementing.
5. Never skip reading component source + story + styles before using unfamiliar components.
6. Use PLUS components first — only fall back to generic React-Bootstrap when no PLUS equivalent exists.
7. When Figma design input exists, follow the full implement-design workflow (see `.agent/skills/uno-prototype/references/figma-mcp-guide.md`): extract node IDs → fetch design context → capture screenshot → download assets → translate to PLUS token conventions → achieve visual parity → validate against source. Do not skip steps.
8. Never install new packages without explicit user approval.
9. Never introduce non-Bootstrap UI frameworks (no Material UI, no Ant Design, no Tailwind).
10. Never deep-import from `design-system/src/` — use barrel exports from `@` alias.
11. Never create components that duplicate existing ones — check `docs/context/design-system/components/components-index.json` first.
12. Never edit generated token files directly — run `npm run generate:tokens` after changes.
13. Always validate in Storybook when component behavior is touched.
14. Confirm implementation plan and touched files before large or risky edits.
15. Never use Font Awesome Pro icons — only FA Free: `fa-solid`, `fa-regular`, `fa-brands`. No `fa-light`, `fa-thin`, `fa-sharp`, `fa-duotone`, or Pro-only icon names (e.g., `fa-grid-2`). Brand icons (`fa-brands fa-notion`, `fa-brands fa-figma`, etc.) are included in FA Free.

## Skills

| Skill | Trigger | Location |
|-------|---------|----------|
| uno-research | "What is…", "How does…", explore | `.agent/skills/uno-research/SKILL.md` |
| uno-plan | "Plan", "scope", "how should we build" | `.agent/skills/uno-plan/SKILL.md` |
| uno-prototype | Scaffold playground prototype | `.agent/skills/uno-prototype/SKILL.md` |
| uno-review | Quality gate before shipping | `.agent/skills/uno-review/SKILL.md` |
| uno-post | "Submit", "Publish" | `.agent/skills/uno-post/SKILL.md` |
| uno-compound | Document learnings | `.agent/skills/uno-compound/SKILL.md` |

## Pipeline

See .agent/SKILL.md for skill routing, tier-aware loading, and compaction protocol.

## Learnings

Check `docs/knowledge/INDEX.md` before starting work — past lessons may apply.
After completing significant work, document learnings via `/uno:compound`.

## Setup

Read `docs/setup-guide.md` for onboarding: recommended CE skills, MCP server config, platform setup.

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite + Storybook concurrent (ports 4100 + 4200) |
| `npm run dev:vite` | Vite only (port 4100) |
| `npm run storybook` | Storybook only (port 4200) |
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
| Building UI, using components or tokens | `docs/context/design-system/components/cheat-sheet.md` (MANDATORY) |
| Building new pages, dashboards, layouts | `docs/context/design-system/components/layout-cheat-sheet.md` (MANDATORY) |
| Figma link or implement-design workflow | `.agent/skills/uno-prototype/references/figma-mcp-guide.md` (PRIMARY) |
| Component architecture questions | `docs/context/design-system/components/inventory.md` |
| Build, preview, or deployment | `.agent/skills/uno-prototype/references/local-preview.md` |
| Exact file paths or env vars needed | Relevant `*-index.json` in skill references |
| Token sync or repo scripts | `.agent/skills/uno-compound/references/scripts.md` |
| Product context, users, or domain terms | `docs/context/product/*.md` |

Keep context lean: load only 2-3 needed guides (~2,000-2,500 tokens). Avoid full load (~5,500 tokens).
