<!-- Shared core, loaded by both faces (SKILL.md + bot.md). Runtime-neutral: no IDE tool names, no Slack mechanics; where a role is named (writers/*, auditor) the faces own HOW it's dispatched. -->
<!-- Source flows: Flow 4 (intake & proposal) + Flow 5 (review & approval), PLUS UNO Workflow board. -->

# uno-maintain — method

Keep the harness itself current. One pass per issue: **capture → route → draft → human gate → tier → apply or propose.** Separation of powers is the design: humans observe and *decide*, the agent drafts and *executes*, the bot packages and *routes*. No step self-approves.

## 1 · Intake — normalize the observation

Every intake is one of four **trigger types** — improvement (could be better) · inaccuracy (says something wrong) · inconsistency (two sources disagree) · bug (behaves wrongly) — routed to one of **11 targets across 3 estates**:

| Estate | Target | Fix action |
|---|---|---|
| Codebase | product context / stories | fix `docs/context/product/*` + `terminology.md` |
| Codebase | harness doc stale / wrong | fix `docs/context/*` (non-product) + `docs/conventions/*` — repo-canonical, ADR-017 |
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

**Record:** an intake lives as a **Roadmap DB card** — `Product Pillar: Universal`, lifecycle in the `Intake Status` property (card mechanics: `docs/conventions/notion.md`). Every intake names its **evidence** (file / frame / message link) in the card body and a **suggested tier**. Separate from Decisions DB **Evidence** (URL property on durable design/product decisions).

**Headless surrogate:** scheduled sweeps run without Notion access and file
their intakes as GitHub issues labeled `harness-intake` (transport contract:
`scripts/prompts/references/headless-intake.md`). That queue feeds THIS
pipeline: every maintain session's intake step starts by draining it — triage
each open `harness-intake` issue into a Roadmap card (or straight into §2–§4
when acted on immediately), then close the issue as incorporated. An
unwatched surrogate queue silently defeats every sweep that files into it.

**Cross-estate inconsistencies are a known open area.** When two estates disagree, decide which side is believed wrong (DS precedence: uno-storybook > BS4 Foundation library > Figma spec pages), route there, and **flag the intake as cross-estate** — don't improvise a routing convention.

## 2 · Draft first, judge second

Draft the concrete fix on every path *before* worth is judged. Drafting is cheap; it buys the human a concrete evaluation instead of a speculative one. Never reorder these steps.

## 3 · The human gate — "worth incorporating?"

Answered by the **spotter** (fallback: the designated maintainer) — never by the agent. Present the drafted fix with a **three-line brief: impact / effort / risk**.

- **No** → end: no change needed. Discard the draft; keep the intake card trail.
- **Yes** → tier it (§4).

## 4 · Tier classification

- **Tier 1 — trivial. The whitelist is absolute:** typos · broken links · stale dates · pure formatting — nothing else. Tier 1 may **never** touch skill definitions, the persona, DS components, or requirements, no matter how small the diff. Apply directly — no PR/PRD, no verdict — and log one line to `docs/evals/runs/digest.jsonl` as `{"ts": "<ISO-8601>", "target": "<file-or-artifact>", "change": "<one line>"}` (the row shape is a contract: the weekly digest automation windows on `ts` and prints `target`/`change`; a row missing `ts` is silently undated and falls out of every digest). The weekly digest posts from it to the design channel (`docs/conventions/slack.md`); the monthly retro reviews the digest.
- **Tier 2 — substantive:** everything else → the pipeline in §5.

## 5 · Tier 2 — PR + PRD → verdict → apply log

1. **Pair, never one alone.** Open the PR *and* pair it with a PRD carrying the rationale — reviewers see *why*, not just *what*. A lone PR or lone PRD never ships.
2. **Review post** to the design review channel (`docs/conventions/slack.md`): self-sufficient — one-line summary, PR + PRD links, suggested reviewers. Assume the reviewer never opens the PR.
3. **Verdict** from a routed reviewer, machine-parseable per `docs/conventions/slack.md` gate 2 (approve / request-changes / reject — the emoji vocabulary lives there, not here). **Persona and DS-component changes need two approvals.** No verdict in 2 working days → re-ping the suggested reviewers once; 4 working days → escalate to the design lead. **Never auto-merge on silence.**
4. **Execute on approve only.** Merge the PR / apply the update, then write one **apply-log row** (target · verdict link · timestamp) to `docs/evals/runs/apply-log.jsonl` — interim store until the Notion Eval Runs DB exists. Non-code applies have no merge log — this row is what makes the audit measurable.
5. **🔁** → revise and re-enter at drafting (§2); each round gets a fresh, complete post. **❌** → record why in the thread so the idea isn't silently re-raised.

## 6 · Standing intake paths

- **Handoff rails propagation (from uno-publish):** arrives **pre-authorized** — the designer-confirmed handoff plus its three sign-offs replace the worth-incorporating gate and the verdict. Execute the paired PRD + blueprint write per `docs/conventions/supabase.md` and write the apply-log row citing the handoff thread. This is the only intake that skips §3/§5.

- **Conventions are repo-canonical** (decision 2026-07-07, ADR-017): `docs/conventions/` wins every conflict. A legacy Notion playbook page that contradicts a conventions file is the stale artifact — file an intake to banner it as superseded (the faces route the Notion write); never "re-sync" the repo to match it, never fix the drift silently.
- **Standing sweeps:** named in `docs/conventions/automations.md` — shipped watchdog · weekly Tier-1 digest · Figma hygiene · conventions integrity (agents↔docs cross-references both ways, header canonicality, path rot) · Notion comment sweep. Each sweep files one intake per finding into this same pipeline.
- **Post-ship reconciliation:** every shipped handoff triggers a reconcile of DS + harness against built reality — routine, not exceptional. The check set, per shipped card:
  - `design-system/` stories/MDX reflect the shipped surface where they reference it;
  - harness docs (`docs/context/*`, conventions, skill references) don't describe pre-ship behavior as current;
  - deployment/marketplace references (per uno-publish's references) still point at live URLs.
  The weekly shipped-watchdog automation runs exactly this set headlessly (`scripts/prompts/uno-shipped-watchdog/SKILL.md`); grow the set here, never in the adapter.

## 7 · Knowledge capture

After significant work — a non-trivial fix, a gotcha, a decision worth preserving:

1. File a lesson at `docs/knowledge/lessons/YYYY-MM-DD-slug.md` — frontmatter (`title` · `date` · `tags` · `rule_candidate`) + problem / root cause / fix / prevention.
2. Update `docs/knowledge/INDEX.md`.
3. If a standing rule changes: one line in `docs/knowledge/changelog.md`. Proposing the AGENTS.md / persona edit itself is Tier 2 — the gate in §5 applies.

Lessons live under `docs/knowledge/` — never `docs/solutions/` (reserved for other tools). A learning that survives only in the chat transcript is a capture failure.
