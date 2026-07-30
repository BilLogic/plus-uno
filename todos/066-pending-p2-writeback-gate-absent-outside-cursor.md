---
status: pending
priority: p2
issue_id: 066
tags: [code-review, hooks, portability]
dependencies: [064]
---

# The Figma write-back gate only exists in Cursor

`.cursor/hooks.json` wires TWO gates (intake + `require-ds-writeback.sh`); `.claude/settings.json` and `.codex/hooks.json` wire only intake. So AGENTS.md rule 18 ("when active-writeback-gate.json exists, follow it") never activates in Claude Code or Codex — a Figma write-back driven from Claude Code skips the DS gate and its validate/audit handshake entirely. Same portability class as the intake fix, one gate behind.

## Proposed Solutions
1. Mirror the writeback hook into .claude/settings.json (and .codex) the way claude-code-run.mjs mirrors intake — likely needs a small claude-code adapter for `require-ds-writeback.sh`'s stdin shape. Small-medium; Cynthia's subsystem.
2. Interim: AGENTS.md rule 18 gains "in a runtime without the write-back hook, run validate:figma-writeback + audit:figma-writeback manually before writeback:audit-passed" — the manual-path pattern again. Small.
