---
name: design-consulting
description: >
  Early structure-first concepting, wireframes, and design exploration.
  Use for "Brainstorm", "Plan", "What do you think...", "Show me options", "Compare approaches".
  Covers both Consulting mode (structure) and Iteration mode (variations).
---

# Design Consulting

Help users explore design direction — from early structure to multi-variant comparison.

## Prerequisites

- `docs/design-system/modes/consulting.md` — structure-first concepting workflow
- `docs/design-system/modes/iteration.md` — generating 3-5 variations with tradeoffs
- `docs/design-system/components.md` — what components exist to work with
- `.agent/assets/PLUS_LAYOUT_CHEAT_SHEET.md` — official page structural formulas

## Two Sub-Modes

### Consulting (Structure First)
- Focus on layout, information architecture, and content hierarchy
- Use Stitch MCP for wireframe generation when available
- Output structure decisions, not styled implementations
- **Gate**: Present structure plan, get approval before moving to implementation

### Iteration (Styled Variations)
- Generate 3-5 variations of the approved structure
- Each variation should have clear tradeoffs documented
- Use PLUS components and tokens for all variations
- **Gate**: User selects preferred variation before finalizing

## Workflow

1. Clarify scope — what area? what fidelity? structure only or styled?
2. Check existing specs — does a relevant spec already exist in `design-system/src/specs/`?
3. If consulting: propose structure using context levels (Element → Card → Section → Page)
4. If iterating: generate variations with documented tradeoffs
5. Present for approval before any implementation
