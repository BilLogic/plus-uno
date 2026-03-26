<!-- Load for: deciding whether a solution doc should propagate to broader docs -->

# Pattern Escalation Rules

After writing a solution doc, check if the learning should update broader docs:

**Always show proposed changes and wait for user approval before modifying instruction files.**

| If... | Then propose update to... |
|-------|--------------------------|
| New forbidden pattern | `AGENTS.md` forbidden patterns section |
| New gotcha | `docs/project/conventions.md` gotchas table |
| Terminology confusion | `docs/foundations/terminology.md` |
| Component API surprise | `.agent/assets/PLUS_CHEAT_SHEET.md` |
