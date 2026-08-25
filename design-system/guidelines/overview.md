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

## The tree

| Folder | Holds | Start at |
|--------|-------|----------|
| [`foundations/`](foundations/overview.md) | The fourteen foundations — tokens, colour, type, spacing, grid, elevation, iconography, accessibility, content, and the five not yet authored | `foundations/overview.md` |
| [`components/`](components/overview.md) | Per-component guidance: when to use, correct and incorrect, accessibility | `components/overview.md` |
| [`composition/`](composition/overview.md) | How components combine — layout, hierarchy, surfaces, forms | `composition/overview.md` |
| [`figma/`](figma/overview.md) | Design-to-code: registries, the load gate, token mapping, MCP workflows | `figma/overview.md` |

## Common task routes

**Build UI with components**
→ `agent-views/components/index.md` (does it exist?) → `agent-views/tokens/tokens.md` (token names) → the component's Storybook MDX (props, usage)

**Build a page or dashboard**
→ `composition/layout.md` → `composition/hierarchy.md` → `foundations/grid.md`

**Build a form**
→ `composition/forms.md` → `agent-views/components/index.md` → `foundations/spacing.md`

**Dialog, modal, card, table, empty or loading state**
→ `composition/surfaces.md`

**Style something**
→ `agent-views/tokens/tokens.md` for the name → `foundations/<topic>.md` for the rule

**Implement from Figma**
→ `figma/registry-load-gate.md` (MANDATORY) → `figma/mcp-guide.md` → `figma/token-mapping.md`

**Write product copy**
→ `foundations/content/overview.md`

## Machine artifacts

| Artifact | State |
|----------|-------|
| `design-system/agent-views/components/index.md` | Generated — the existence law. Not listed means it does not exist. |
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

### Bootstrap-First

Use design system components built on Bootstrap before anything custom. Never introduce non-Bootstrap UI frameworks (no Material UI, no Ant Design, no Tailwind). When Bootstrap lacks a pattern, extend it — don't replace it.

### Compound Designing

Each iteration should make the next one easier. Document decisions, extract reusable patterns, and write tokens — not one-off styles. Today's prototype becomes tomorrow's component.

### Accessibility by Default

WCAG 2.1 AA is the minimum bar, not a stretch goal. Semantic HTML first, ARIA when needed, keyboard access always. See `foundations/accessibility.md` for specifics.

### Consistency Over Novelty

Reuse existing patterns before inventing new ones. Check the component library and existing pages first. A familiar interaction that's slightly imperfect beats a novel one the tutor has to learn mid-session.

### Use Tokens, Never Hardcode

Every color, spacing value, radius, and elevation comes from a design token. Map to compile-ready variables, not raw hex or pixel values. This keeps theming possible and drift impossible.

### Verify Before You Build

Read component source and stories before using unfamiliar components. Never hallucinate props, layouts, or icon names. If it's not in the cheat sheet, it doesn't exist yet.

### The agent's role

The coding agent is an **implementation assistant**. It faithfully realises
designer intent while enforcing the design system. It does not make UX, IA, or
product decisions.

- Cite concrete files for a recommendation; a claim with no path is a guess.
- Ask for clarification when several component families are equally plausible,
  rather than picking one and building it.

### Implementation

- **PLUS components first** — fall back to generic React-Bootstrap only where no PLUS equivalent exists.
- **Barrel imports** — public components (forms and dataviz included) are named exports from `@/components`; spec shells come from spec group indexes such as `@/specs/Universal/Pages`. There is no `@/specs` root barrel.
- **Figma registries are law** — for design-to-code, load `design-system/figma/component-registry.json` and `token-registry.json` before mapping nodes or tokens.
- **No hallucinated props or layouts** — use the skeletons in `composition/layout.md` and read the source for prop names.
- **Minimal scope** — match surrounding conventions; do not add unrelated changes.

### How this knowledge is organised

- **One responsibility per document** — load only what the task requires; `overview.md` routes.
- **Discovery over duplication** — route to the canonical doc; never copy knowledge into a prompt or a stub.
- **Composable** — foundations, components and composition compose; they do not replace workflow skills, which own Scope → Scaffold → Build → Validate → Register.

## Not design-system knowledge

| Topic | Lives at |
|-------|----------|
| Local build, aliases, Vite, prototypes | `docs/engineering/setup.md` |
| Product overview and features | `docs/context/product/` |
| How agents write (commits, PRDs, Slack, articles) | `docs/conventions/` |
| Scaffolding and review workflow | `skills/uno-prototype/`, `skills/uno-review/` |
| Production readiness checklist | `skills/uno-maintain/references/production-checklist.md` |
