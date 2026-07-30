---
status: complete
priority: p2
issue_id: 065
tags: [code-review, hooks, reliability]
dependencies: []
---

# Cursor's failClosed intake hook can block every prompt in the workspace

`.cursor/hooks.json:8` sets `failClosed: true` on `require-prd-for-prototype.sh`, which runs on EVERY beforeSubmitPrompt (intent detection lives inside node). The wrapper is `set -euo pipefail; exec node …` with no node-availability guard — GUI-launched Cursor without an nvm PATH exits 127 → every prompt blocked, including "hello". Any syntax error in the 10 .mjs files does the same (`run.mjs:510-514` converts engine exceptions to continue:false). The Claude Code adapter deliberately fails open (`claude-code-run.mjs:579-583`); Cursor inverts the philosophy.

## Proposed Solutions
1. `command -v node >/dev/null || exit 0` in both .sh wrappers + drop `failClosed` (the gate is advisory context, not a security boundary). Small. Cynthia's subsystem — coordinate.
