---
name: building
description: Builds new PLUS components or prototypes from designs. Use when the user asks to "build", "create", "implement", "prototype", "mock up", or provides a Figma link/sketch. strictly adheres to the design system.
---

# Building

Create production-ready components or high-fidelity prototypes.

## When to Use

- **Builds:** User provides a hi-fi Figma link for a new design.
- **Prototypes:** User provides a sketch, screenshot, loose description, or asks to "prototype" something.
- **New Patterns:** Creating a pattern that doesn't exist in the codebase.

## Core Principle: No "Cheating"

**All** output, whether a "prototype" or a "production build," must be **high-fidelity** and **strictly adhere to the design system**.

1. **Design tokens only** — No hardcoded colors, spacing, or typography. Use `var(--color-*)`, `var(--size-*)`.
2. **PLUS components** — Use components from `packages/plus-ds/src/components/` (and specs). Do **not** use raw React-Bootstrap or HTML when a PLUS equivalent exists.
3. **Real Implementation** — No placeholders. If replicating a page, use the actual components that page uses (e.g., use `AdminDateRangeFilter` for admin filters, not a generic dropdown).

## Workflows

**All builds** output to `playground/prototyping/{user}/{project}/` to create interactive prototypes for designer testing. Valid code is required, but the goal is interaction, not shipping library code.

### 1. Build from Figma (Hi-Fi)
**Input:** High-fidelity Figma design.
**Output:** `playground/prototyping/{user}/{project}/`

**Protocol:**
1. Run Figma MCP (`get_code`, `get_image`).
2. Map to PLUS context level/components.
3. Implement with React + React-Bootstrap (PLUS components where they exist).
4. Verify in Storybook/Local Dev.

### 2. Build from Sketch/Idea (Lo-Fi)
**Input:** Sketches, screenshots, wireframes, verbal descriptions.
**Output:** `playground/prototyping/{user}/{project}/`

**Modes:**

| Mode | When to use | What to say/provide |
|------|-------------|---------------------|
| **0→hi-fi** | Single screen. | "I have a sketch..." or "Imagine a dashboard..." |
| **Flow** | Multiple screens. | "Click through login -> dashboard" |
| **Remix** | Modify existing. | "Take this prototype and change X" |

**Protocol:**
1. Identify Mode (0→hi-fi, Flow, Remix).
2. Clarify requirements.
3. Implement with React + React-Bootstrap (PLUS components where they exist).
4. Output to `playground/prototyping/`.

## Prototyping Mode Checks

**0→hi-fi checks:**
- Which PLUS context? (Admin, Login, etc.)
- Matching an existing page/spec? (Reuse those specific components!)
- Primary action/content blocks?

**Flow checks:**
- Exact sequence?
- Real routing or placeholder nav?
- User state simulation?

**Remix checks:**
- Target folder/URL?
- Precise change?
- New folder or overwrite?

## Technical Guidelines (CRITICAL)

### Card Styling
When creating chart/data cards (especially in Admin contexts):
- **Background:** `var(--color-surface-container-lowest, #ffffff)` (NOT `surface-container-low`)
- **Radius:** `var(--card-radius-sm, 12px)`
- **Padding:** `var(--card-pad-y-lg, 24px) var(--card-pad-x-lg, 24px)`
- **Shadow:** `0px 1px 2px rgba(0, 0, 0, 0.05)`

### Table Styling
- **Background:** `transparent !important` (override Bootstrap).
- **No Borders:** `border: none`.
- **Headers:** `font-weight: 700`.
- **Reference:** `packages/plus-ds/src/specs/Admin/Student Admin/Tables/StudentsTable/StudentsTable.scss`

### Breakpoint Testing
For full page layouts, wrap stories in `ResponsiveFrame`:
```jsx
// .stories.jsx
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
// ... decorators: [(Story, c) => <ResponsiveFrame breakpoint={c.args.breakpoint}><Story/></ResponsiveFrame>]
```

## Confirmation Template

Before coding, confirm the plan:

```
I will [build/prototype] a **[Component/Page]** using:

Mode: [Production Build / 0→hi-fi / Flow / Remix]
Input: [Figma Link / Sketch / Description]
Output Location: [path]

Components:
- `[Component]` from `packages/plus-ds/...`

Tokens:
- `--[token-name]`

Strict Adherence Check:
- [ ] Tokens Only
- [ ] PLUS Components
- [ ] No hardcoded styles
```

## References

- [Context Levels](../../develop/foundations/context-levels.md)
- [Terminology](../../develop/foundations/terminology.md)
- [Tech Stack](../../develop/foundations/tech-stack.md)
- [Tokens](../../packages/plus-ds/guidelines/design-tokens/colors.md) (and others in `packages/plus-ds/guidelines/design-tokens/`)