---
name: uno-compound
description: >
  Document a solution or learning from work just completed. Creates a searchable
  solution doc in docs/knowledge/lessons/. Use when the user says "document this",
  "write it up", "save this learning", "compound", or after fixing a non-trivial
  bug, discovering a gotcha, or making a design decision worth preserving.
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

## Auto-Suggest

Proactively suggest this skill when:
- The conversation involved debugging or fixing an error
- The user discovered a gotcha or unintuitive behavior
- Significant code changes were made (3+ files modified)
- The session is ending after non-trivial work
- `/uno:review` found violations that were then fixed (the fix is worth documenting)

Suggest once at the end of a work session — do not interrupt mid-task.

## Steps

### 1. Summarize

What was done? What broke? What was the root cause? What was the fix?

### 2. Create Solution Doc

Write to `docs/knowledge/lessons/{category}/` using the template in `examples/solution-doc-template.md`. Categories: `ui-bugs`, `integration-issues`, `agent-infrastructure`, `token-issues`.

For the full schema and field descriptions, see `references/solution-schema.md`.

### 3. Check for Pattern Escalation

Ask: Should this learning update broader docs? See `references/escalation-rules.md` for the full decision table.

### 4. Update if Warranted (Requires Approval)

**GATE:** Show the proposed change to the user and wait for explicit approval before modifying any agent instruction file. These files govern agent behavior across all future sessions on all platforms — changes must be intentional.

If approved, make the update and cite the solution doc as the source.

## Next Step

This is the terminal skill in the pipeline. No further skill follows.
Optionally suggest committing the solution doc and any updated instruction files.
