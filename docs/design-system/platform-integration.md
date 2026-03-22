<!-- ~200 tokens | Load for: connecting .agent/ to platform-specific instruction files -->

# Platform Integration Guide

The plus-one project uses `AGENTS.md` at the project root as the canonical cross-agent entry point. All platform-specific files point to `AGENTS.md`. Design system routing and guardrails live in `.agent/SKILL.md`, referenced from `AGENTS.md`.

## Current Platform Files

| Platform | File | Points To |
|----------|------|-----------|
| Claude Code | `CLAUDE.md` | `@AGENTS.md` (import syntax) |
| Cursor (native rules) | `.cursor/rules/plus-agent.mdc` | `AGENTS.md` |
| Cursor (legacy) | `cursorrules.md` | `AGENTS.md` |
| Windsurf | `.windsurfrules` | `AGENTS.md` |

## Architecture

```
AGENTS.md (cross-agent entry point — product context, forbidden patterns, skills, commands)
    ↓
.agent/SKILL.md (design system routing — 6 modes, component discovery, critical rules)
    ↓
.agent/AGENT.md (identity, skills table, grounding rules, foundations)
    ↓
docs/design-system/* and .agent/assets/* (progressive loading)
```

## Adding a New Platform

Point the agent's project-level instruction file to `AGENTS.md` as the canonical entry point. One-liner pointer is sufficient — all context is in AGENTS.md.

## What NOT to Duplicate

- Do not copy forbidden patterns or rules into platform files. They live in AGENTS.md.
- Do not copy mode routing into platform files. It lives in .agent/SKILL.md.
- Do not add platform-specific behavior inside `.agent/`. Keep it agent-agnostic.
- Platform files should be a one-liner pointer, not a second source of truth.
