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

## Protocol

1. Extract design via Figma MCP tools
2. Map to PLUS terminology and context level
3. Propose component composition
4. **WAIT for confirmation before coding**
5. Implement with React + React-Bootstrap
6. Verify in Storybook

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

## Implementation Checklist

- [ ] Use React + React-Bootstrap components
- [ ] Apply PLUS design tokens (no hardcoded values)
- [ ] Follow context level patterns
- [ ] Create Storybook story if new component
- [ ] Verify in Storybook before completing

## References

- [Context Levels](../foundations/context-levels.md)
- [Terminology](../foundations/terminology.md)
- [Tech Stack](../foundations/tech-stack.md)
