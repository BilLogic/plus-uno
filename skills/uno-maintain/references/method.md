<!-- Shared core, loaded by both faces (SKILL.md + bot.md). Runtime-neutral: no tools, no agent names — each face adds its own execution. -->
<!-- Source flows: Flow 4 (intake & proposal) + Flow 5 (review & approval), PLUS UNO Workflow board. -->

# uno-maintain — method

Keep the harness itself current. One pass per issue: **capture → route → draft → human gate → tier → apply or propose.** Separation of powers is the design: humans observe and *decide*, the agent drafts and *executes*, the bot packages and *routes*. No step self-approves.

## 1 · Intake — normalize the observation

Every intake is one of four **trigger types** — improvement (could be better) · inaccuracy (says something wrong) · inconsistency (two sources disagree) · bug (behaves wrongly) — routed to one of **10 targets across 3 estates**:

| Estate | Target | Fix action |
|---|---|---|
| Codebase | product context / stories | fix `docs/context/product/*` + `terminology.md` |
| Codebase | a skill isn't useful | refine the skill (`skills/*` — both faces if shared) |
| Codebase | UNO off-role / personality | tune persona / instructions (AGENTS.md, embodiment deltas) |
| Codebase | Storybook inconsistent / bug | fix the design system (`design-system/src/**`) |
| Codebase | uno-bot misbehaving | fix uno-bot (`agents/uno-bot/**`, bot faces) |
| Figma | spec out of date | update the Figma spec pages |
| Figma | components out of date | update the Figma component library |
| Notion | requirement / story changed | update PRD **+ blueprint together** — paired, never one alone |
| Notion | behavior / spec wrong | correct the doc **+ flag its owner** — fixing the artifact alone isn't enough |
| Notion | doc stale or missing | author / refresh the doc |

The taxonomy is the harness map — when a new component joins the harness, this table must grow.

**Record:** an intake lives as a **Roadmap DB card** — `Product Pillar: Universal`, lifecycle in the `Intake Status` property (card mechanics: `docs/conventions/notion.md`). Every intake names its **evidence** (file / frame / message link) and a **suggested tier**.

**Cross-estate inconsistencies are a known open area.** When two estates disagree, decide which side is believed wrong (DS precedence: uno-storybook > BS4 Foundation library > Figma spec pages), route there, and **flag the intake as cross-estate** — don't improvise a routing convention.

## 2 · Draft first, judge second

Draft the concrete fix on every path *before* worth is judged. Drafting is cheap; it buys the human a concrete evaluation instead of a speculative one. Never reorder these steps.

## 3 · The human gate — "worth incorporating?"

Answered by the **spotter** (fallback: the designated maintainer) — never by the agent. Present the drafted fix with a **three-line brief: impact / effort / risk**.

- **No** → end: no change needed. Discard the draft; keep the intake card trail.
- **Yes** → tier it (§4).

## 4 · Tier classification

- **Tier 1 — trivial. The whitelist is absolute:** typos · broken links · stale dates · pure formatting — nothing else. Tier 1 may **never** touch skill definitions, the persona, DS components, or requirements, no matter how small the diff. Apply directly — no PR/PRD, no verdict — and log **one line to the weekly digest** in `#plus-design`; the monthly retro reviews the digest.
- **Tier 2 — substantive:** everything else → the pipeline in §5.

## 5 · Tier 2 — PR + PRD → verdict → apply log

1. **Pair, never one alone.** Open the PR *and* pair it with a PRD carrying the rationale — reviewers see *why*, not just *what*. A lone PR or lone PRD never ships.
2. **Review post** to `#plus-design`: self-sufficient — one-line summary, PR + PRD links, suggested reviewers. Assume the reviewer never opens the PR.
3. **Verdict** (machine-parseable — `docs/conventions/slack.md`, gate 2): ✅ approve · 🔁 request changes · ❌ reject, from a routed reviewer. **Persona and DS-component changes need two approvals.** No verdict in 2 working days → re-ping the suggested reviewers once; 4 working days → escalate to the design lead. **Never auto-merge on silence.**
4. **Execute on approve only.** Merge the PR / apply the update, then write one **apply-log row**: target · verdict link · timestamp. Non-code applies have no merge log — this row is what makes the audit measurable.
5. **🔁** → revise and re-enter at drafting (§2); each round gets a fresh, complete post. **❌** → record why in the thread so the idea isn't silently re-raised.

## 6 · Standing intake paths

- **Mirror vs source:** when a live read contradicts a mirrored convention file, **prefer the live source now** and file an intake to re-sync the mirror (update the body *and* its `synced:` date). Never enforce a stale mirror; never fix the drift silently.
- **Standing sweeps:** named in `docs/conventions/automations.md` — shipped watchdog · weekly Tier-1 digest · Figma hygiene · conventions staleness (`synced:` vs source `last_edited_time`, plus agents↔docs cross-references both ways) · Notion comment sweep. Each sweep files one intake per finding into this same pipeline.
- **Post-ship reconciliation:** every shipped handoff triggers a reconcile of DS + harness against built reality — routine, not exceptional.

## 7 · Knowledge capture

After significant work — a non-trivial fix, a gotcha, a decision worth preserving:

1. File a lesson at `docs/knowledge/lessons/YYYY-MM-DD-slug.md` — frontmatter (`title` · `date` · `tags` · `rule_candidate`) + problem / root cause / fix / prevention.
2. Update `docs/knowledge/INDEX.md`.
3. If a standing rule changes: one line in `docs/knowledge/changelog.md`. Proposing the AGENTS.md / persona edit itself is Tier 2 — the gate in §5 applies.

Lessons live under `docs/knowledge/` — never `docs/solutions/` (reserved for other tools). A learning that survives only in the chat transcript is a capture failure.
