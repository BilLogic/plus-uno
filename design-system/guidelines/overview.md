---
summary: says where design knowledge lives
---

<!-- Tier: 2 | ~450 tokens | Load FIRST for any DS task — routes to focused docs -->

# Design System Guidelines

**Purpose:** route to the right file. This document does not teach design; it
says where design knowledge lives.

Design-system knowledge has exactly two homes:

- **`design-system/guidelines/`** — authored protocol. Rules, procedures, correct and incorrect examples. This folder.
- **`design-system/agent-views/`** — generated facts. What exists and what it is named. Never authored by hand.

Anything else is narrative (`*.mdx` beside the component, for humans) or a
machine registry (`*.json`).

## Retrieval flow

```
Task → guidelines/overview.md → locate 2–3 focused docs → read only those → implement
```

Do not bulk-load. Two or three documents per task is the budget.

To look a name, prop, token or rule up without reading files, ask the `ds` command or the `plus-ds` MCP: `docs/connectors/ds-mcp.md`.

## The tree

| Folder | Holds | Start at |
|--------|-------|----------|
| [`foundations/`](foundations/overview.md) | The fourteen foundations — tokens, color, type, spacing, grid, elevation, iconography, accessibility, content, and the five not yet authored | `foundations/overview.md` |
| [`components/`](components/overview.md) | Per-component guidance: when to use, correct and incorrect, accessibility | `components/overview.md` |
| [`composition/`](composition/overview.md) | How components combine — layout, hierarchy, surfaces, forms | `composition/overview.md` |
| [`figma/`](figma/overview.md) | Design-to-code: registries, the load gate, token mapping, MCP workflows | `figma/overview.md` |
| [`documentation-ia.md`](documentation-ia.md) | The documentation IA contract — the shared tree and the MDX page shell | read it before adding a story or renaming a folder |

## Common task routes

**Build UI with components**
→ `agent-views/components/index.md` (does it exist?) → the component's generated doc, linked from that index (props, variants, tokens touched) → `agent-views/tokens/tokens.md` if styling beyond them

**Start a page or a container from a pattern**: a template (`Frame` with the PLUS `Sidebar` and a breadcrumb, or the focused `Frame` with no sidebar) for every full page; `Frame`, `PatternSidebar`, `Page`, `PatternSection`, `PatternCard`, `PatternTable`, `PatternModal`, `PatternDrawer`, `Backdrop` and `AiChat` from `@/patterns`; the Popups (`DropdownMenu`, `Popup`, `Flag`, `Tooltip`) from `@/components`. When to reach for each: `agent-views/components/index.md` § Patterns.

**Build a page or dashboard**
→ `agent-views/components/index.md` § Patterns (the Frame and the Section, Card and Table shells, with their imports) → `composition/layout.md` → `composition/hierarchy.md` → `src/styles/Grid.mdx`

**Build a form**
→ `composition/forms.md` → `agent-views/components/index.md` → `src/styles/Spacing.mdx`

**Dialog, modal, drawer, card, table, empty or loading state**
→ `agent-views/components/index.md` § Patterns (the shell and its import) → `composition/surfaces.md`

**Style something**
→ `agent-views/tokens/tokens.md` for the name → `npm run ds -- guide <topic>` for the rule (a foundation's file here, or its Storybook page once the file is retired)

**Implement from Figma**
→ `figma/registry-load-gate.md` (MANDATORY) → `figma/mcp-guide.md` → `figma/token-mapping.md`

**Write product copy**
→ `foundations/content/overview.md`

**Title a story, rename a docs folder, author an MDX page**
→ `documentation-ia.md`

## Machine artifacts

| Artifact | State |
|----------|-------|
| `design-system/agent-views/components/index.md` | Generated — the existence law. Not listed means it does not exist. |
| `design-system/src/components/<group>/<Name>/index.md` | Generated — per-component props, variants, tokens touched, derived from source. |
| `design-system/src/components/<group>/index.md` | Generated — group index, with authored-section coverage counted per component. |
| `design-system/agent-views/tokens/tokens.md` | Generated — token names. |
| `design-system/figma/component-registry.json` | Generated — import ↔ Figma component set ↔ props. |
| `design-system/figma/token-registry.json` | Generated — Figma variable ↔ CSS custom property. |

Refresh them all with `npm run generate:agent`. Never hand-edit a generated file.

## Principles

Nine principles guide every design and implementation decision across the
PLUS platform. They are stated once — here — and never restated in a
shortened form elsewhere.

### AI Augments Human Judgment

AI is a co-pilot, never the pilot. Surface recommendations, highlight patterns, prompt reflection — but the tutor always makes the final call. Design interfaces that make AI suggestions easy to accept, modify, or dismiss.

### Information Density

Tutors are time-pressured during live sessions. Every pixel earns its place. Prefer data-rich views over decorative whitespace. Remove chrome that doesn't serve the task at hand.

### Progressive Disclosure

Show what matters now; reveal detail on demand. Default views answer the immediate question. Expandable sections, tooltips, and drill-downs serve deeper exploration without cluttering the primary flow.

### PLUS-First

Use PLUS components and `--ds-*` tokens before anything custom. Interactive behavior is built on Base UI (`@base-ui/react`, headless); PLUS adds no other UI framework. When PLUS lacks a pattern, extend a PLUS component or propose a new one.

### Compound Designing

Each iteration should make the next one easier. Document decisions, extract reusable patterns, and write tokens — not one-off styles. Today's prototype becomes tomorrow's component.

### Accessibility by Default

WCAG 2.1 AA is the minimum bar, not a stretch goal. Semantic HTML first, ARIA when needed, keyboard access always. See `src/styles/Accessibility.mdx` for specifics.

### Consistency Over Novelty

Reuse existing patterns before inventing new ones. Check the component library and existing pages first. A familiar interaction that's slightly imperfect beats a novel one the tutor has to learn mid-session.

### Use Tokens, Never Hardcode

Every color, spacing value, radius, and elevation comes from a design token. Map to compile-ready variables, not raw hex or pixel values. This keeps theming possible and drift impossible.

### Verify Before You Build

Read component source and stories before using unfamiliar components. Never hallucinate props, layouts, or icon names. If it's not in the cheat sheet, it doesn't exist yet.

### The agent's role

The coding agent is an **implementation assistant**. It faithfully realizes
designer intent while enforcing the design system. It does not make UX, IA, or
product decisions.

- Cite concrete files for a recommendation; a claim with no path is a guess.
- Ask for clarification when several component families are equally plausible,
  rather than picking one and building it.

### Implementation

- **PLUS components first** — where no PLUS equivalent exists, propose one rather than reaching for another library.
- **Barrel imports** — public components (forms and dataviz included) are named exports from `@/components`; patterns from `@/patterns`.
- **Figma registries are law** — for design-to-code, load `design-system/figma/component-registry.json` and `token-registry.json` before mapping nodes or tokens.
- **No hallucinated props or layouts** — use the skeletons in `composition/layout.md` and read the source for prop names.
- **Minimal scope** — match surrounding conventions; do not add unrelated changes.

### How this knowledge is organized

- **One responsibility per document** — load only what the task requires; `overview.md` routes.
- **Discovery over duplication** — route to the canonical doc; never copy knowledge into a prompt or a stub.
- **Composable** — foundations, components and composition compose; they do not replace workflow skills, which own Scope → Scaffold → Build → Validate → Register.

## Not design-system knowledge

| Topic | Lives at |
|-------|----------|
| Local build, aliases, Vite, prototypes | `docs/engineering/setup.md` |
| Product overview and features | `docs/product-and-service/` |
| How agents write (commits, PRDs, Slack, articles) | `docs/conventions/` |
| Scaffolding and review workflow | `skills/uno-prototype/`, `skills/uno-review/` |
| Production readiness checklist | `skills/uno-maintain/references/production-checklist.md` |
