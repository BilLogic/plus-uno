---
status: pending
priority: p3
issue_id: 037
tags: [harness, portability, hooks]
dependencies: []
---

# Antigravity intake adapter — possible, but needs a different mount point

Windsurf dropped per Bill (2026-07-31). Scope is Cursor · Claude Code · Codex, with Antigravity as the open question.

## What was verified (2026-07-31, antigravity.google/docs/hooks)

Antigravity **does** have hooks — five events: `PreToolUse`, `PostToolUse`, `PreInvocation`, `PostInvocation`, `Stop`. Config is `hooks.json` in `.agents/` (workspace) or `~/.gemini/config/` (user). Hooks read JSON on stdin, return JSON on stdout with a `decision` of `allow`/`deny`.

**There is no `UserPromptSubmit` equivalent.** That is why the existing adapters cannot be copied: `.claude/settings.json` and `.codex/hooks.json` both mount on prompt submission, which Antigravity does not expose.

## The likely path

`PreInvocation` fires before the model is called and is documented for injecting system instructions — functionally the closest mount point. But the input shape differs: Antigravity passes `conversationId`, `workspacePaths`, `transcriptPath`, `artifactDirectoryPath` — a transcript FILE, not the prompt string that `claude-code-run.mjs` expects. An adapter would need to read the latest user message out of the transcript before handing it to the FSM.

So: buildable, roughly one new adapter script (not a config copy), and it needs someone with Antigravity installed to verify the transcript format and that `PreInvocation` fires early enough to gate.

## Until then

Antigravity runs the manual intake path (`skills/uno-prototype/SKILL.md` § Intake mode) — same eight steps, same order, same brief card, no automation.

## Work Log
- 2026-07-30: Created; hooks existence known, config format unverified.
- 2026-07-31: Verified against Antigravity's own docs. Corrected the earlier "couldn't verify" to a specific finding: hooks exist, no prompt-submit event, `PreInvocation` is the candidate, adapter needs a transcript reader.
