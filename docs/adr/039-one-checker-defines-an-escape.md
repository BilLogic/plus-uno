---
embodiment: ide
summary: One deterministic checker, check:ds-usage, defines an escape from the design system; the hook, CI, the prototype exit, ds-lens and the usage eval all call it, and AI review advises while the checker blocks
status: active
verified: 2026-11-06 (#1990)
---

# ADR-039: One checker defines an escape (2026-11-06)

**Decision.** An **escape** (GLOSSARY § Harness) is whatever `npm run check:ds-usage` reports, and nothing else does. Every surface that judges design-system usage calls it rather than keeping its own definition. When this landed, `check:harness` and the two skill scripts (`validate-prototype.sh`, `run-review-checks.sh`) called it; the post-edit hook, the uno-prototype exit, the ds-lens reviewer and the design-system usage eval join it as they are built, on the same rule. Its rules are stable IDs (`ds/no-unknown-prop`…), documented one per section in `docs/engineering/ds-usage-rules.md`, and it reads the generated manifests (`design-system/agent-views/components.json`, `tokens.json`), not component source.

**Why.** Before it, the same question had four answers: grep blocks in `skills/uno-prototype/scripts/validate-prototype.sh` and `skills/uno-review/scripts/run-review-checks.sh`, prose rules ds-lens applied by reading, and the eval rubric. They disagreed (a deep import was a warning in one and a failure in the other), none could say what to write instead, and an eval score could not be compared with a review verdict because they counted different things. One deterministic definition makes a hook finding, a CI failure, a review note and an eval number the same unit.

**AI review advises; deterministic checks block.** ds-lens may still flag what a rule cannot see (a component used against its intent), but only `check:ds-usage` fails a build or a prototype exit on usage. A new kind of escape becomes a rule with a fixture before anything blocks on it.

**Debt.** Consumer code already held 1,742 fail-level escapes when this landed. They sit in `scripts/baselines/ds-usage.json`, a per-file count that only falls; a file a change touches is held to zero whenever the checker runs on changed files or named paths, and `--all` (the CI mode) holds every file to its count.

**Alternatives.** A third-party linter (ESLint plus plugins) would mean new packages and a config that restates the manifests; the manifests are already the source of truth, so the checker reads them directly. Keeping the shell greps beside the checker would leave two definitions to drift.

— uno (agent), Nov 2026, recording the decision Bill approved in spec #1989
