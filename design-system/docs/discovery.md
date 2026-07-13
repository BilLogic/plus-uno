<!-- Tier: 2 | ~400 tokens | Load FIRST for any DS implementation task — routes to focused docs -->
# PLUS Design System — Discovery

**Purpose:** Route the agent to the right knowledge file. This document does not teach design — it tells you where knowledge lives.

All DS knowledge lives under `design-system/docs/` (hand-authored) and `design-system/agent-views/` (generated from MDX / propTypes / SCSS).

## Retrieval Flow

```
Task → design-system/docs/discovery.md → locate relevant doc(s) → read only those → implement
```

Do **not** bulk-load all knowledge. Load 2–3 focused documents per task (~2,000–2,500 tokens).

## Components

| Topic | Path |
|-------|------|
| All UI components (index) | `design-system/agent-views/components/index.md` |
| Per-component agent view | `design-system/agent-views/components/{Name}/{Name}.md` |
| Form elements (index) | `design-system/agent-views/forms/index.md` |
| Per-form agent view | `design-system/agent-views/forms/{Name}.md` or `forms/{Name}/{Name}.md` |
| Component source + Storybook | `design-system/src/components/<group>/` (groups: actions, forms-and-inputs, layout-and-structure, messaging, navigation, overlays, status-and-loading, _internal) |
| Designer verification audit | `design-system/figma/knowledge-audit.md` |
| Component architecture / inventory | `docs/context/design-system/components/inventory.md` |
| Component registry (machine) | `design-system/figma/component-registry.json` |

## Foundations

| Topic | Path |
|-------|------|
| All tokens (generated list) | `design-system/agent-views/tokens/tokens.md` |
| Figma ↔ CSS token mapping (authoritative) | `design-system/docs/foundations/token-mapping.md` |
| Figma token registry (machine, read-only) | `design-system/figma/token-registry.json` |
| Design principles (product-level) | `docs/context/design-system/foundations/principles.md` |
| Accessibility | `docs/context/design-system/foundations/accessibility.md` |

## Patterns

| Topic | Path |
|-------|------|
| Page / modal / card layout skeletons | `design-system/docs/patterns/layout.md` |
| Form field composition | `design-system/docs/patterns/forms.md` |

Patterns explain **how DS components compose** — not product UX, IA, or page templates.

## Figma Design-to-Code

| Topic | Path |
|-------|------|
| Component registry (MANDATORY) | `design-system/figma/component-registry.json` |
| Token registry (MANDATORY) | `design-system/figma/token-registry.json` |
| Registry load gate | `skills/uno-prototype/references/figma-registry-mandatory-load.md` |
| Implement-design workflow | `skills/uno-prototype/references/figma-mcp-guide.md` |
| Component Figma node links | `design-system/figma/component-figma-links.md` |

## Workflow Skills (not DS knowledge)

| Topic | Path |
|-------|------|
| Scaffold prototype | `skills/uno-prototype/SKILL.md` |
| Workflow reference index | `skills/uno-prototype/references/README.md` |
| Production readiness (states, a11y) | `skills/uno-maintain/references/production-checklist.md` |
| Example selection | `skills/uno-prototype/references/examples-index.json` |
| Local build and preview | `design-system/docs/setup.md` |

## Implementation Setup

| Topic | Path |
|-------|------|
| Aliases, imports, playground, Vite, bootstrap | `design-system/docs/setup.md` |
| Design philosophy / agent role | `design-system/docs/guidelines.md` |

## Product Context (not DS knowledge)

| Topic | Path |
|-------|------|
| Product overview | `docs/context/product/plus-app.md` |
| Features / pillars | `docs/context/product/features.md` |
| Session learnings | `docs/knowledge/INDEX.md` |

## Common Task Routes

**Build UI with components**
→ `agent-views/components/index.md` → `agent-views/tokens/tokens.md` (if styling)

**Build a form**
→ `docs/patterns/forms.md` → `agent-views/forms/{Name}.md` → `agent-views/tokens/tokens.md`

**Build a page / dashboard**
→ `docs/patterns/layout.md` → task-specific `agent-views/components/{Name}/{Name}.md` → `agent-views/tokens/tokens.md`

**Dialog / Modal**
→ `agent-views/components/Modal/Modal.md` → `docs/patterns/layout.md` (Modal skeleton)

**Implement from Figma**
→ `design-system/figma/component-registry.json` + `token-registry.json` → `figma-mcp-guide.md` → `design-system/docs/foundations/token-mapping.md` → task-specific component/pattern docs

**Refresh all agent artifacts (designer)**
→ `npm run generate:agent`
