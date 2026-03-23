---
name: po-compound
description: >
  Document a solution or learning from work just completed. Creates a searchable
  solution doc in docs/solutions/ and updates agent-context docs if patterns emerge.
user-invocable: true
argument-hint: [brief-description]
---

# Compound Learning

Capture what was learned during recent work so future agent sessions benefit.

## When to Use

- After fixing a non-trivial bug
- After discovering a gotcha or unintuitive behavior
- After a design decision that others should know about
- After any work where you learned something not obvious from the code

## Steps

### 1. Summarize

What was done? What broke? What was the root cause? What was the fix?

### 2. Create Solution Doc

Write to `docs/solutions/{category}/` using this template:

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

### 3. Check for Pattern Escalation

Ask: Should this learning update broader docs?

| If... | Then update... |
|-------|---------------|
| New forbidden pattern discovered | `AGENTS.md` forbidden patterns section |
| New gotcha found | `docs/project/conventions.md` gotchas table |
| New terminology confusion | `docs/foundations/terminology.md` |
| Component API surprise | `.agent/assets/PLUS_CHEAT_SHEET.md` |

### 4. Update if Warranted

Make the update, citing the solution doc as the source.
