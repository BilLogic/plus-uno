---
status: complete
priority: p2
issue_id: 064
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

## Work Log (2026-07-30, partial fix)
Done: SESSION_TTL_MS=24h in loadSession (stale sessions cleared, not resumed); SessionEnd hook added to .claude/settings.json; SKILL.md tells agents to ignore a stale/mismatched active-intake-question.json and take the manual path. Remaining for Cynthia: conversationId-keyed question file (the singleton clobber), answer dedup for the typed-vs-tapped double-advance.

## Work Log (2026-07-31 — closed)
Both remaining items fixed and probed, per Bill's "we definitely want them working for all agents":
- clearIntakeQuestion(conversationId) reads the payload's owner and refuses to delete another conversation's live question. Fixes the two-tabs / Cursor+Claude-Code clobber.
- Answer dedup in handleActiveSession, matched on text + 5s recency (NOT step id — by the time the duplicate lands the step has advanced, which is why the first attempt failed the probe). Verified: duplicate ignored, new answer still advances.
Status → complete.
