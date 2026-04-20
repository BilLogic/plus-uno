# Solutions (Compound Loop)

Each file documents a problem encountered, its root cause, the solution applied, and prevention measures. This is how agent knowledge compounds across sessions.

## How It Works

```
Agent uses docs → does work → learns something →
  /po:compound → writes solution doc → updates AGENTS.md or conventions →
    next agent session benefits
```

## Template

```markdown
---
title: "Description of what was solved"
category: ui-bugs | integration-issues | agent-infrastructure | token-issues
date: YYYY-MM-DD
tags: [relevant, tags]
symptom: "What the user/agent saw"
root_cause: "Why it happened"
---

# Title

## Problem
What went wrong.

## Solution
How it was fixed (with code examples if applicable).

## Prevention
How to avoid this in the future.

## Files Modified
| File | Change |
|------|--------|
| path/to/file | What changed |
```

## Categories

- `ui-bugs/` — visual issues, layout problems, component misuse
- `integration-issues/` — data model mismatches, API incompatibilities, tool conflicts
- `agent-infrastructure/` — agent doc issues, skill problems, missing context
- `token-issues/` — token sync failures, value mismatches, generated file problems

## Rules

- After non-trivial fixes or discoveries, add a solution doc
- Periodically extract patterns from solutions into `AGENTS.md` forbidden patterns and `docs/project/conventions.md` gotchas
- Use `/po:compound` skill to create solution docs interactively
