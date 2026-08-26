<!-- Tier 2 (on demand) — the rule-adoption ledger for this folder. Append; do not rewrite history. -->
# Disposition ledger

One line per note that became a rule, an ADR, or an archive entry. The
2026-04-19 harness audit's own P2 finding was that no such trail existed —
"the knowledge layer captures lessons well, but there is no visible
lesson-to-rule adoption trail" — so promotions happened invisibly or not at all.
This is that trail. The contract it serves is `INDEX.md`.

## 2026-08-26 — the knowledge sweep (#172)

15 live files reached a disposition; `archive/` (30 files) was ruled out of
scope and left untouched. Four promotions, two conversions, nine deletions.

**Promoted to rules**

- `lessons/ui-patterns.md` → `docs/engineering/coding.md` § Known gotchas — one Router provider per tree, and how a shell mounted under a prefixed route finds its content.
- `lessons/2026-07-10-harness-consistency-sweep.md` → `docs/engineering/coding.md` § Renames — a rename is finished when `validate-doc-links.sh` passes.
- `lessons/2026-08-25-storybook-vitest-setup-import-race.md` → `docs/engineering/coding.md` § Known gotchas — a setup-file import failure with a bogus `SyntaxError` is a mid-run Vite re-optimise; pin the dependency in `optimizeDeps.include`.
- `preferences.md` → `docs/engineering/setup.md` § Prototype conventions — the pinned Font Awesome jsdelivr URL. Its other six entries were already AGENTS.md hard rules or ADRs 002/003/004/009, and the capitalization rule already lived in `design-system/guidelines/foundations/content/voice-and-tone.md` § Capitalization.

**Converted to ADRs**

- `lessons/2026-08-06-slack-app-token-and-cli-setup.md` → ADR-024, Slack app configuration is a one-way door.
- `research/2026-05-20-cloud-hosting-options.md` → ADR-014's **Why**, which had said "rationale not recorded in-repo" while the rationale sat unread in this folder.

**Deleted**

`ideations.md` · `lessons/ds-compliance.md` · `lessons/integration.md` ·
`lessons/agent-patterns.md` · `lessons/2026-04-19-harness-audit.md` ·
`lessons/2026-07-16-claude-vertex-cron-first-run.md` ·
`research/2026-05-20-user-flow-friction-audit.md` — every entry either shipped,
was superseded by ADR-013/016's harness rewrite, or was a postmortem whose fix
is now permanent in code. The old `changelog.md` and `INDEX.md` contents went
with them; both files were repurposed rather than deleted because the folder
needs a contract and a ledger.

**Enforced by** `npm run check:knowledge-disposition` (`scripts/check-knowledge-disposition.mjs`).
