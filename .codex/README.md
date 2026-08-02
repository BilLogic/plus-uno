# Codex CLI adapter

Wires the uno-prototype intake FSM (`.cursor/hooks/uno-prototype/`) into Codex,
mirroring `.claude/settings.json`. Codex's hook lifecycle shares Claude Code's
event names and stdin JSON shape, so the same scripts back both runtimes —
`hooks.json` here is the only Codex-specific piece. Caveat: the mirror is not
complete — Codex has no SessionEnd hook wired (`.claude/settings.json` has one),
so intake state is released by the 24h TTL instead of on session end.

**One-time user opt-in** (hooks are off by default in Codex): add to
`~/.codex/config.toml`

```toml
[features]
codex_hooks = true
```

**Status: wired, not yet live-verified** — nobody on the team has run a Codex
session against it. First Codex user: run `prototype this` on any PRD and
confirm the intake asks `prd_check` first; if it does not, compare the hook
event payload against what `claude-code-run.mjs` expects and file a
uno-maintain intake with the diff. The skill's manual intake path
(`skills/uno-prototype/SKILL.md` § Intake mode) covers you either way.
