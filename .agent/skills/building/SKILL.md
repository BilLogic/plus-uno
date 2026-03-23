---
name: building
description: >
  Build and create UI — from quick prototypes to production-ready implementations.
  Use for "Build", "Create", "Prototype", "Implement the design", Figma links, sketches.
  Covers both Prototyping mode (fast, disposable) and Finalization mode (production-ready).
---

# Building

Implement UI using the PLUS design system — from rapid prototypes to polished production code.

## Prerequisites (MANDATORY)

- `.agent/assets/PLUS_CHEAT_SHEET.md` — component names and token values. **Read before writing ANY UI code.**
- `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md` — page structural formulas. **Read before building ANY page.**
- `docs/design-system/modes/prototyping.md` — fast prototype workflow
- `docs/design-system/modes/finalization.md` — production-ready workflow

## Two Sub-Modes

### Prototyping (Fast, Disposable)
- High-fidelity appearance, low-rigor code
- Skip tests, accessibility edge cases, error states
- Use hardcoded mock data freely
- Goal: validate idea quickly
- Trigger: "Quick check", "Hack this together", "Validate this idea"

### Finalization (Production-Ready)
- All interactive states (hover, focus, disabled, loading, error, empty)
- Accessibility: ARIA labels, keyboard navigation, focus management
- Responsive behavior
- Storybook stories with controls
- Goal: ship-quality code
- Trigger: "Build this", "Implement the design", Figma link

## Workflow

1. **Determine fidelity** — prototype or production?
2. **Check existing specs** — does a spec already exist? Don't rebuild from scratch.
3. **Read cheat sheets** — MANDATORY before writing any component or layout code
4. **If Figma link provided** — fetch design context and screenshot via Figma MCP first
5. **Component discovery** — check `.agent/assets/components-index.json` for existing components
6. **Build** — use PLUS components, tokens, and patterns. No generic Bootstrap.
7. **Validate** — run in Storybook (finalization) or dev server (prototyping)

## Rules

- Never hallucinate component names or props — check the cheat sheet and source
- Never hardcode colors/spacing — use tokens
- Never skip component source reading for unfamiliar components
- Confirm plan before large edits
