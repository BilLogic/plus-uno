---
status: pending
priority: p2
issue_id: 039
tags: [code-review, harness, consistency]
dependencies: []
---

# The AGENTS.md rule renumbering orphaned every numbered citation

The forbidden-patterns restructure (universal 1-5, ide-only 6-18) renumbered rules; PR #83 added 17-18 on the old scheme. Files citing rules by number now point at the wrong rules:

- `skills/uno-review/references/catch-patterns.md:15,23,31,39,47,55` — FP-1/FP-2/FP-6/FP-10/FP-15 all wrong. Line 5 declares these mappings are live routing ("the rule lives there, not here").
- `agents/reviewers/ds-lens.md:25` — "patterns 1-6, 9-11, 15" coherent only under old numbering.
- `skills/uno-prototype/references/figma-registry-mandatory-load.md:50` — "#17" now = intake rule, should be #9/#10.
- `skills/uno-prototype/references/figma-mcp-guide.md:78` — "#8" no current match.
- `scripts/prompts/uno-implement-design/SKILL.md:184` — "rule 2.1" exists nowhere (bot-v1-era).

## Proposed Solutions
1. Re-map every citation to the new numbers. Small, mechanical.
2. Better: cite by rule NAME ("the tokens-over-literals rule") not number — renumber-proof. Small-medium.
3. Either way: add a validate-doc-links.sh pass that greps `FP-\d+|pattern #?\d+|rule \d+` and checks the target exists — this class is invisible to the current guard.
