---
name: maintaining
description: Updates, fixes, and syncs existing PLUS components with Figma designs. Use when the user asks to "update", "fix", "modify", "sync", "refactor", "this doesn't match Figma", or needs to improve existing code.
---

# Maintaining

Keep codebase in sync with Figma designs.

## When to Use

- Fixing bugs in existing components
- Syncing code with updated Figma designs
- Refactoring for better patterns
- Resolving inconsistencies between code and design

For creating **new** patterns, use [building](../building/SKILL.md) instead.

## Protocol

1. Identify affected files
2. If Figma provided: Compare codebase vs design
3. List specific changes in PLUS terminology
4. **WAIT for confirmation before editing**
5. Apply changes
6. Verify in Storybook

## Confirmation Template

Before editing code, describe the changes:

```
I'll update **[Component/File]** with these changes:

Current State:
- [describe what exists]

Proposed Changes:
- [specific change 1]
- [specific change 2]

Files to modify:
- `[file path 1]`
- `[file path 2]`

Do you want me to proceed?
```

## Figma Comparison

When syncing with Figma:

1. Use MCP to get current design
2. Compare against existing implementation
3. Document differences:
   - Color mismatches
   - Spacing differences
   - Missing/extra elements
   - Prop value changes

## Verification

After making changes:

1. Run Storybook: `npm run storybook`
2. Navigate to the modified component
3. Verify visual appearance matches Figma
4. Check all variants/states

## References

- [Context Levels](../../develop/foundations/context-levels.md)
- [Terminology](../../develop/foundations/terminology.md)
- [Tech Stack](../../develop/foundations/tech-stack.md)
