---
name: building
description: Builds new PLUS components from hi-fi Figma designs. Use when the user provides a Figma link for a new design, asks to "build", "create", "implement" something new, or needs to translate a finalized Figma design into production code.
---

# Building

Create new production-ready components from Figma.

## When to Use

- User provides a Figma link for a **new** design
- Creating a pattern that doesn't exist in the codebase
- Translating finalized designs to production code

For updating **existing** code, use [maintaining](../maintaining/SKILL.md) instead.

## Baseline (every build)

**No exceptions.** Every build must satisfy:

1. **Design tokens only** — No hardcoded colors, spacing, or typography. Use `var(--color-*)`, `var(--size-*)`, etc. See `develop/foundations/colors.md`, `typography.md`, `layout.md`.
2. **Hi-fi output** — Builds are production-ready: PLUS components, real styling. No low-fi or placeholder styling.
3. **PLUS components where they exist** — Use components from `packages/plus-ds/src/components/` (and specs). Do **not** use raw React-Bootstrap or React components (e.g. `Modal`, `Button`, `Alert`) when a PLUS equivalent exists. Check `develop/reference/component-index.md` and `packages/plus-ds/src/components/index.js`.
4. **When replicating a page: use the same components as the real page** — If you are replicating an existing page (from Figma, a spec, or the app), **always** check how that page implements each area (filters, table, top bar, forms, etc.) and which components or specs it uses; then **use those same components from the repo**. Do **not** substitute native HTML (e.g. `<select>`, `<input>`) or raw Bootstrap utility classes (e.g. `form-select`, `form-control`) as a shortcut. Look in `packages/plus-ds/src/specs/` for page-level specs that already implement the pattern (e.g. AdminDateRangeFilter for admin filters).

## Protocol

1. When the build is for a prototype (output in playground/prototyping/), load playground/prototyping/README.md first and follow its modes, baseline, and “How the agent can help (per mode)” before proposing the plan.
2. **When user provides a Figma link**: Run Figma MCP first—**get design context** (e.g. `get_code`) and **get screenshot** (e.g. `get_image`); use **get metadata** (e.g. `get_file_content`) as needed. Do not skip this step.
3. Map to PLUS terminology and context level
4. **Load context** as needed: `develop/foundations/colors.md`, `typography.md`, `layout.md`
5. Propose component composition
6. **WAIT for confirmation before coding**
7. Implement with React + React-Bootstrap (PLUS components where they exist)
8. Verify in Storybook

## Confirmation Template

Before writing code, describe the plan:

```
I'll create a **[Component Name]** at the **[Context Level]** level using:

Components:
- `[Component]` from `packages/plus-ds/src/components`

Props:
- `style="[value]"`
- `size="[value]"`

Tokens:
- `--[token-name]`

Location: `[file path]`

Does this match your expectation?
```

## Figma MCP Tools

| Tool | Purpose |
|------|---------|
| `get_image` | Capture visual design |
| `get_code` | Extract generated code/specs |
| `get_file_content` | Get Figma file metadata |

## Coding guidelines

- Use PLUS token CSS variables (no hardcoded colors, spacing, or typography).
- **Use PLUS components from the repo** (e.g. Modal, Button, Alert from `packages/plus-ds/src/components/`). Do not use raw React-Bootstrap or React components when a PLUS version exists.
- **When replicating a page:** Check how the real page (spec or Figma) implements each UI area and use the same components/specs from the repo (e.g. filters → AdminDateRangeFilter/Dropdown, not native `<select>`). Never drop in native form elements or Bootstrap utility classes as a shortcut.
- Prefer existing components and specs over custom HTML.

## Implementation Checklist

- [ ] Use PLUS components where they exist (check `develop/reference/component-index.md`, `packages/plus-ds/src/components/index.js`)
- [ ] Apply PLUS design tokens (no hardcoded values); see `develop/foundations/colors.md`, `typography.md`, `layout.md`
- [ ] When replicating a page: use same components/specs as real page (`packages/plus-ds/src/specs/`)
- [ ] Follow context level patterns
- [ ] Create Storybook story if new component
- [ ] Verify in Storybook before completing

## References

- [Context Levels](../foundations/context-levels.md)
- [Terminology](../foundations/terminology.md)
- [Tech Stack](../foundations/tech-stack.md)
- [Tokens](../foundations/tokens.md)
- Component index: `develop/reference/component-index.md` — Master list of PLUS components and specs. Page-level specs: `packages/plus-ds/src/specs/`.