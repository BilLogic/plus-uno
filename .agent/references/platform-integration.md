<!-- ~200 tokens | Load for: connecting .agent/ to platform-specific instruction files -->

# Platform Integration Guide

This `.agent/` system is agent-agnostic. Each coding agent platform has its own entry-point file that routes into `.agent/SKILL.md` (mode routing and guardrails), with `.agent/AGENT.md` available as supporting context (identity, skills, grounding rules).

## Current Platform Files

| Platform | File | Status |
|----------|------|--------|
| Cursor (primary) | `.cursor/rules/plus-agent.mdc` | Always-apply rule |
| Cursor (legacy fallback) | `cursorrules.md` | Root-level pointer |
| Claude Code | `CLAUDE.md` | Root-level pointer |
| Windsurf | `.windsurfrules` | Root-level pointer |

All platform files point to `.agent/SKILL.md` as the primary entry point. `.agent/AGENT.md` is referenced as supporting context for identity and grounding rules.

## Adding a New Platform

Point the agent's project-level instruction file to `.agent/SKILL.md` as the canonical entry point. Include these three directives:

1. Read `.agent/SKILL.md` for mode routing, guardrails, and all operational behavior.
2. Refer to `.agent/AGENT.md` for identity, skills, and grounding rules as needed.
3. Do not proceed without determining the correct Mode.

No platform-specific logic lives inside `.agent/` — all routing, modes, and references are portable.

## Cursor-Specific Notes

The `.cursor/` directory is gitignored except for `.cursor/rules/`, which is committed and shared with the team. The `cursorrules.md` file at the project root serves as a legacy fallback for environments that do not read `.cursor/rules/`.

## What NOT to Duplicate
- Do not copy guardrails or rules into platform files. They live in SKILL.md.
- Do not add platform-specific behavior inside `.agent/`. Keep it agent-agnostic.
- Platform files should be a one-liner pointer, not a second source of truth.
