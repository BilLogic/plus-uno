---
status: pending
priority: p2
issue_id: 042
tags: [code-review, hooks, fsm, architecture]
dependencies: []
---

# Intake FSM state lifecycle: singleton question file, no TTL, cleanup wired in one runtime of three

Four interlocking defects (architecture review, file:line verified):

1. `active-intake-question.json` is one fixed path (`intake-question.mjs:10`) while sessions are per-conversation — two concurrent conversations clobber each other; `clearSession` for conversation A deletes B's live question (`storage.mjs:84`).
2. No TTL: `updatedAt` is written (`storage.mjs:74`) and read by nothing. An abandoned Cursor session stays active forever; days later an unrelated prompt in that conversation is consumed as a reflection answer (`engine.mjs:196-197` + `isNonEmptyText`).
3. `.claude/settings.json` and `.codex/hooks.json` wire no SessionEnd — a dead Claude Code session orphans both state and question file; SKILL.md says the JSON's presence means hook-gated, so the NEXT session renders a stale question nothing can advance.
4. PLAUSIBLE double-advance: typed answer fires UserPromptSubmit (consumed) AND the AskUserQuestion PostToolUse (advances again) — needs a same-answer dedup in the session file.

## Proposed Solutions
1. Key the question file by conversationId (already in the payload) + SKILL.md treats conversationId mismatch or stale updatedAt as the manual path + loadSession ignores sessions older than 24h + SessionEnd hook in .claude/settings.json + answer dedup. Medium, all in the FSM's own files. Coordinate with Cynthia — her subsystem.
