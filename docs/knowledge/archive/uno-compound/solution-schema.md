<!-- Load for: creating solution docs, YAML frontmatter format, category selection, file location -->

# Solution Doc Schema

## When to Compound

Create a solution doc after:

- Fixing a non-trivial bug (especially one that took multiple attempts)
- Discovering a gotcha or unintuitive behavior in the DS, tooling, or build system
- Making a design decision that affects future work
- Learning something not obvious from the code alone

Do NOT create a solution doc for:

- Routine changes (updating text, adding a straightforward component)
- Issues already documented in `docs/context/conventions/coding.md`

## What Makes a Good Solution Doc

1. **Specific** — describes the exact problem and exact fix, not vague advice
2. **Searchable** — title and tags make it findable by future agents
3. **Actionable** — includes code examples or file paths, not just prose
4. **Preventive** — explains how to avoid the issue, not just how to fix it

## YAML Frontmatter Schema

```yaml
---
title: "Short description of what was solved"       # Required — string
category: ui-bugs                                    # Required — enum (see list below)
date: 2026-03-23                                     # Required — YYYY-MM-DD
tags: [vite, scss, token-resolution]                 # Required — string[]
modules: [design-system, playground]                 # Optional — string[] (affected areas)
severity: high                                       # Optional — low | medium | high
symptom: "What the user or agent observed"           # Optional — string
root_cause: "Why it happened"                        # Optional — string
---
```

## Categories

| Category | Use when... |
|----------|-------------|
| `build-errors` | Vite, Storybook, or npm build failures |
| `test-failures` | Unit or integration test issues |
| `runtime-errors` | JS errors in the browser console |
| `performance-issues` | Slow renders, large bundles, memory leaks |
| `database-issues` | Data layer problems (if applicable) |
| `security-issues` | Auth, XSS, dependency vulnerabilities |
| `ui-bugs` | Visual regressions, layout breaks, wrong tokens |
| `integration-issues` | Figma MCP, Stitch MCP, API mismatches |
| `logic-errors` | Incorrect behavior, wrong state management |

## File Location

Solution docs go in `docs/knowledge/lessons/{category}/` using kebab-case filenames:

```
docs/knowledge/lessons/ui-bugs/2026-03-23-badge-color-token-mismatch.md
docs/knowledge/lessons/build-errors/2026-03-20-vite-scss-deprecation-warning.md
```
