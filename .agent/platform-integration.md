<!-- ~200 tokens | Load for: connecting .agent/ to platform-specific instruction files -->

# Platform Integration Guide

The plus-uno project uses `AGENTS.md` at the project root as the canonical cross-agent entry point. All platform-specific files point to `AGENTS.md`. Design system routing and guardrails live in `.agent/SKILL.md`, referenced from `AGENTS.md`.

## Current Platform Files

| Platform | File | Points To |
|----------|------|-----------|
| Claude Code | `CLAUDE.md` | `@AGENTS.md` (import syntax) |
| Cursor | `.cursor/rules/plus-agent.mdc` | `AGENTS.md` |
| Windsurf (modern) | `.windsurf/rules/agent.md` | `AGENTS.md` |
| Windsurf (legacy) | `.windsurfrules` | `AGENTS.md` |
| GitHub Copilot | `.github/copilot-instructions.md` | `AGENTS.md` |

## Architecture

```
AGENTS.md (Tier 1 — identity, conventions, principles, forbidden patterns, skills table)
    ↓ "See" references (lazy-loaded)
docs/context/* and docs/knowledge/INDEX.md (Tier 1 context files)

.agent/SKILL.md (skill router — 6 skills, Tier 2 loading declarations, routing logic)
    ↓ skill invocation
.agent/skills/*/SKILL.md → references/ (Tier 2 on-demand context)

.agent/AGENT.md (pipeline orchestration, compaction protocol, handoff format)
    ↓ ephemeral bridge
.agent/handoffs/ (Tier 3 — gitignored, session-only)
```

## Adding a New Platform

Point the agent's project-level instruction file to `AGENTS.md` as the canonical entry point. One-liner pointer is sufficient — all context is in AGENTS.md.

## What NOT to Duplicate

- Do not copy forbidden patterns or rules into platform files. They live in AGENTS.md.
- Do not copy mode routing into platform files. It lives in .agent/SKILL.md.
- Do not add platform-specific behavior inside `.agent/`. Keep it agent-agnostic.
- Platform files should be a one-liner pointer, not a second source of truth.
