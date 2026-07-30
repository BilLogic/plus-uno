---
status: pending
priority: p3
issue_id: 037
tags: [harness, portability, hooks]
dependencies: []
---

# Wire the uno-prototype intake FSM for Antigravity (and Windsurf if possible)

## Problem Statement

The intake FSM has adapters for Cursor, Claude Code, and Codex (`.codex/hooks.json`, added 2026-07-30, unverified live). Antigravity 2.0 shipped a hooks system at Google I/O 2026 (nine lifecycle points, JSON config, PreToolUse/PostInvocation/Stop named in the launch blog) — an adapter is feasible, but its config format and whether it has a UserPromptSubmit-equivalent were not verifiable enough to ship without testing. Windsurf's hook story is unconfirmed. Until adapters land, both run the skill's manual intake path — same steps, no automation.

## Proposed Solutions

1. Someone with Antigravity installed reads its hooks docs (antigravity.google/docs), maps UserPromptSubmit + PostToolUse:AskUserQuestion equivalents onto `claude-code-run.mjs` / `claude-code-answer.mjs`, adds the config file, live-tests `prototype this`. Small if the events map; the scripts are runtime-neutral.
2. Same investigation for Windsurf.

## Acceptance Criteria

- [ ] Antigravity session running `prototype this` gets `prd_check` from the hook
- [ ] Or: a dated note recording why its hook surface cannot drive the FSM

## Work Log

- 2026-07-30: Created after verifying Codex hook compat (same events/stdin as Claude Code — wired) and Antigravity hooks existence (config format unverified).
