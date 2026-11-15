# Codex CLI adapter

Wires the uno-prototype intake runner (`.cursor/hooks/uno-prototype/`) into Codex,
mirroring `.claude/settings.json`. Cursor, Claude Code, and Codex share one
input adapter (`.cursor/hooks/uno-prototype/run.mjs`) backed by the declarative
step list (`.cursor/hooks/uno-prototype/intake-steps.json`) and a per-session
brief card under `.cursor/hooks/briefings/`.

| Hook event | Script | Role |
|---|---|---|
| `UserPromptSubmit` | `.cursor/hooks/uno-prototype/run.mjs` | Reads the session's brief card and injects the current step (first empty field) |

## Verification status

**Config-wired; verify on first Codex CLI session.** Start `/uno-prototype` and
confirm the intake asks `prd_check` first; if it does not, compare the hook
event payload against what `run.mjs` expects and file a `uno-maintain` intake
with the diff. The skill's manual intake path
(`skills/uno-prototype/references/intake.md`) covers you either way.
