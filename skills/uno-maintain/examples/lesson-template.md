<!-- Template for docs/knowledge/lessons/YYYY-MM-DD-slug.md (method.md §7). Fill and file; then update docs/knowledge/INDEX.md. -->
---
title: "What was learned, one specific line"
date: YYYY-MM-DD
tags: [tag1, tag2]
rule_candidate: false # true if this should become a standing rule (rule adoption = changelog line + Tier-2 proposal)
---

# {Title}

## Problem

What went wrong or surprised us — exact error message / visual symptom / wrong assumption.

## Root cause

Why — traced to the specific file, config, or convention gap.

## Fix

What resolved it. Include the load-bearing snippet or file paths, not prose alone.

## Prevention

How future sessions avoid it: a convention line, checklist item, or rubric check. If it warrants a standing rule, set `rule_candidate: true` and propose via the Tier-2 gate.

## Files touched

| File | Change |
|---|---|
| `path/to/file` | what changed |
