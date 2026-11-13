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
- `lessons/2026-08-25-storybook-vitest-setup-import-race.md` → `docs/engineering/coding.md` § Known gotchas — a setup-file import failure with a bogus `SyntaxError` is a mid-run Vite re-optimize; pin the dependency in `optimizeDeps.include`.
- `preferences.md` → `docs/engineering/setup.md` § Prototype conventions — the pinned Font Awesome jsdelivr URL. Its other six entries were already AGENTS.md hard rules or ADRs 002/003/004/009, and the capitalization rule already lived in `design-system/guidelines/foundations/content/voice-and-tone.md` § Capitalization.

**Converted to ADRs**

- `lessons/2026-08-06-slack-app-token-and-cli-setup.md` → ADR-024, Slack app configuration is a one-way door.
- `research/2026-05-20-cloud-hosting-options.md` → ADR-014's **Why**, which had said "rationale not recorded in-repo" while the rationale sat unread in this folder.

**Deleted**

`ideations.md` · `lessons/ds-compliance.md` · `lessons/integration.md` ·
`lessons/agent-patterns.md` · `lessons/2026-07-16-claude-vertex-cron-first-run.md`
— every entry either shipped, was superseded by ADR-013/016's harness rewrite, or
was a postmortem whose fix is now permanent in code. The old `changelog.md` and
`INDEX.md` contents went with them; both files were repurposed rather than deleted
because the folder needs a contract and a ledger.

**Archived** — moved to `archive/`, which is itself a disposition

`archive/2026-04-19-harness-audit.md` — its own closing note asks that it not be
deleted and prescribes a counter-lesson instead; that instruction is honored. It
is archived rather than kept live because all three things it audits (`.agent/skills/`,
`docs/rubrics/`, `hd-config.md`) are absent from the repo, so every finding resolves
to nothing.

`archive/2026-05-20-user-flow-friction-audit.md` — an authored deliverable with a
named author and audience, not accumulated sediment. Its three high-leverage fixes
shipped in v2; it produced no standing rule and no decision needing an ADR, so it is
kept as a record rather than promoted.

**Enforced by** `npm run check:knowledge-disposition` (`scripts/check-knowledge-disposition.mjs`).

## 2026-10-14 — the history cleanup

The archive rule changed: `archive/` holds a superseded doc only while something
live cites it as its decision trail. Nothing did, so all 32 archived files were
deleted — `bot-v1`, `mode-era`, `uno-compound`, `uno-review`,
`figma-vendor-notes`, the agent persona, the v2 Figma sync workflow, and both
audits above. The harness audit's request to be kept is overruled by that rule;
its P2 finding survives as the quote that opens this ledger. Git keeps every
file. `archive/eval-runs/`, archived the same week, stays: `docs/evals/` and
the blueprint integration cite it.

## 2026-11-05 — the old component language is a hard ban

`check:ads-language` stopped being a ratchet: its baseline record is deleted and
every rule allows zero. The last rows cleared at the source — `size` props now
take pixel values or `spacing` (Table, Object, LoadingGif, StatusIndicators,
UserAvatar, TrainingProgressCard, the tutor-revamp kit), the screen overlay is
the Blanket everywhere it was called a scrim, and the stale Rovo and surface
container wording is gone. One named carve-out remains: the two token files that
define `--color-scrim` may keep the word until token removal is decided.

## 2026-11-12 — Figma Core clipping and layout audit

The audit of Figma Core's docs pages (clipping, section hugging, absolute layout, unbound spacing, hand-built blocks) landed with the fix runs. Its one durable lesson, how to run a bulk Figma fix safely (node-count guard, saved before and after shots, per-minute limit), went to `design-system/guidelines/figma/mcp-guide.md` § Bulk fix runs. The findings file stays only as the receipt; the next sweep deletes it.

## 2026-11-13 — existing DS decisions in the ADR trail

The harness round records the merged Panel, Radius and drag decisions in ADR-044 through ADR-046. ADR-036 points to the Bootstrap removal; ADR-038 marks its historical pattern and radius names as corrected. No component behavior or ruling changes.

## 2026-11-13 — routing and authoring conventions

The animation load points to the generated event-to-token library, and rule 5 names the drag exception recorded in ADR-046. Setup owns the fresh-origin/main branch rule. Page documentation and the illustration kit carry the existing soft skeleton-bar convention; the component overview drops the vendor-name map.
