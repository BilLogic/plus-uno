<!-- ~200 tokens | Load for: connecting .agent/ to platform-specific instruction files -->

# Platform Integration Guide

This `.agent/` system is agent-agnostic. Each coding agent platform has its own entry-point file that should route into `.agent/SKILL.md`.

## Platform Setup

### Claude Code
Add to `CLAUDE.md` at project root:
```
When working on design system tasks, read .agent/SKILL.md for all routing, modes, and guardrails.
```

### Cursor
Add to `.cursorrules` at project root:
```
For design system work, follow the instructions in .agent/SKILL.md.
```

### Windsurf
Add to `.windsurfrules` at project root:
```
For design system work, follow the instructions in .agent/SKILL.md.
```

### Other Agents
Point the agent's project-level instruction file to `.agent/SKILL.md` as the canonical entry point. No platform-specific logic lives inside `.agent/` — all routing, modes, and references are portable.

## What NOT to Duplicate
- Do not copy guardrails or rules into platform files. They live in SKILL.md.
- Do not add platform-specific behavior inside `.agent/`. Keep it agent-agnostic.
- Platform files should be a one-liner pointer, not a second source of truth.
