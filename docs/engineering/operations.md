---
embodiment: all
summary: THE standing-automation registry
---

# Automations Registry

<!-- canonical per ADR-017 (docs/adr/) · Tier 2 (on demand) · distilled 2026-07-07 from 📓 playbook §6, now superseded · applied by uno-maintain. -->

THE standing-automation registry. An automation absent from the table below is undocumented by definition.

## Rules

- **Every automation names its agent.** An automation without one is unowned by definition.
- **An automation invokes a skill's method; it never embeds its own copy of the logic.** Migrate opportunistically as each is next touched.
- **Every automation is a loop, and declares its loop mechanics.** Stop condition and issue caps go in its prompt adapter (`scripts/prompts/<name>/SKILL.md`); trigger cadence and the hard turn cap go in its workflow file. The procedure itself stays in the skill's method. Portable by construction: any model can execute the written loop, and harness loop primitives are optional accelerators. Pre-rule adapters (uno-implement, uno-implement-design) migrate as each is next touched. *(rule added 2026-07-16)*
- **Every automation names where it runs and who pays.** Scheduled sweeps run as GitHub Actions cron → the claude-vertex composite action (`.github/actions/claude-vertex`) → Claude-on-Vertex, billed to the `hcii-plus` GCP project via the uno-bot service account (ADR-018 — the `GEMINI_SA_*` secret names are that same account, so rotating "the Gemini secrets" rotates every Claude cron too). Never a personal Anthropic seat. Model routed by difficulty per the bot's tier table: sonnet default · opus for reconciliation-grade judgment · haiku candidate for trivia. *(rule added 2026-07-16)*

**Sweep intake transport** (labels, dedupe, caps, injection rule): `scripts/prompts/references/headless-intake.md` — one copy; every adapter points at it.

<!-- ide-only -->
**Operate:** spot-run any workflow with `gh workflow run <file>`; outcomes land in the Actions job summary (`gh run list` / `gh run view <id>`). Cron triggers fire only from `main` — a workflow is inert until merged.

**Supply chain:** third-party actions are pinned to commit SHAs (`uses: owner/repo@<sha> # vN`), the Claude Code CLI to an exact npm version (claude-vertex action). To bump: resolve the new tag (`gh api repos/<owner>/<repo>/commits/<tag> --jq .sha`), update the SHA + comment everywhere it appears, then one green dispatch run before trusting crons.
<!-- /ide-only -->

| Automation | Trigger | Skill / method it runs | Agent | Implementation | Runs on · billed to | Owner | Status |
|---|---|---|---|---|---|---|---|
| Figma library sync | Worker cron `*/15 13-23 * * 1-5` (restored 2026-07-16; was GitHub Actions until 2026-07-09) | uno-synthesize (DS-component PRD creation) | uno-bot | `agents/uno-bot/src/figma-poll.ts` (scheduled handler; snapshot in KV; PRD via `notion_create` "prd" surface; card → `#uno-bot`). Manual: `GET /debug/figma-poll`. Legacy script kept: `scripts/poll-figma-library.js` (`npm run figma:poll`) | CF Worker cron · no model call — deterministic Figma REST diff → Notion PRD → Slack card | Bill | ✅ live (on deploy) |
| Implement component | `repository_dispatch` from uno-bot confirm | uno-prototype (codegen) | uno-bot proposes; Actions executes | `figma-implement.yml` → `scripts/implement-figma-changes.js` + `scripts/prompts/uno-implement` + machine-check post-step (method §5.1; results in the draft PR) | GHA · Anthropic API key (`ANTHROPIC_API_KEY`) | Bill | ✅ live |
| Implement design | `repository_dispatch` from uno-bot confirm | uno-prototype (design → prototypes scaffold) | uno-bot proposes; Actions executes | `figma-implement-design.yml` + `scripts/prompts/uno-implement-design` + machine-check post-step (method §5.1; results in the draft PR) | GHA · Anthropic API key (`ANTHROPIC_API_KEY`) | Bill | ✅ live |
| Marketplace add/edit | — | uno-publish (registration) | — | ❌ **not built.** The two stub workflows (`marketplace-add.yml` / `marketplace-edit.yml`) were deleted in #158 — they logged a payload and posted a construction notice, and nothing dispatched them. No Worker tool exists. The open product question — repo data file (`src/pages/PrototypeMarket/prototypes-data.js`) versus the Notion database when they disagree — is tracked in #173 and must be answered before this is built | (planned) | — | planned |
| Design QA trigger | Roadmap card → `Dev Status: Ready for QA (RTT)` | uno-review (Design QA checklist) | reviewers/design-qa | ❌ not built — no Notion webhook exists, so this becomes a daily status-poll cron on the sweep pattern below; still needs the `Design QA` status column (manual Notion setup) first | (planned) GHA cron → claude-vertex (sonnet) · GCP `hcii-plus` | — | planned |
| Shipped watchdog | weekly cron (Wed 09:00 UTC) | uno-maintain (post-ship reconciliation, method §6) | reviewers/auditor | `shipped-watchdog.yml` → `scripts/prompts/uno-shipped-watchdog/SKILL.md` (intake transport: shared ref above) | GHA cron → claude-vertex (**opus** — judgment-heavy) · GCP `hcii-plus` | Bill | ✅ live (first dispatch run green 2026-07-16) |
| Weekly Tier-1 digest | weekly cron (Mon 09:00 UTC) | uno-maintain (Tier-1 digest, method §4) | reviewers/auditor composes → posted via the uno-bot Slack token to #plus-design | `weekly-tier1-digest.yml` → `scripts/prompts/uno-tier1-digest/SKILL.md` — reads `docs/evals/runs/digest.jsonl` (row shape: method §4), empty week posts nothing, sentinel-verified | GHA cron → claude-vertex (sonnet) · GCP `hcii-plus` | Bill | ✅ live (first dispatch run green 2026-07-16; posts sentinel-verified) |
| Figma hygiene sweep | monthly | uno-maintain (hygiene checklist in `figma-workspace.md`) | reviewers/auditor | ❌ not built — follow the integrity-sweep pattern; needs Figma API access in the runner | (planned) GHA cron → claude-vertex · GCP `hcii-plus` | — | planned |
| Blueprint embeddings refresh | nightly cron (07:00 UTC) | uno-bot (semantic search freshness) | — | `uno-bot-embed-blueprint.yml` | GHA cron → Worker `/debug` route | Bill | ✅ live |
| uno-bot evals (weekly drift check) | weekly cron (Mon 08:00 UTC) + on-demand `workflow_dispatch` | uno-bot (R/P regression cases vs live Worker) | LLM judge (Gemini on Vertex) | `uno-bot-evals.yml` → `agents/uno-bot/scripts/run-evals.mjs` | GHA cron → live Worker + Vertex judge · GCP `hcii-plus` | Bill | ✅ live |
| Harness gate | **every `pull_request`** + on demand | the deterministic guards, composed | — | `check-harness.yml` → `npm run check:harness` → `scripts/check-harness.mjs` (composition and the reason for each member live there; `--list` prints them). ~20s, no `npm ci` — every member is dependency-free | GHA · no model call — deterministic scripts only | Bill | ✅ live (#155; the repo's first `pull_request` trigger) |
| Storybook gate | **every `pull_request`** + on demand | the Storybook browser suite — 383 stories rendered in headless chromium, axe over each | — | `storybook-gate.yml` → `npm run check:storybook` → `scripts/check-storybook.mjs` (why it is a peer workflow of the harness gate rather than a member: `EXCLUDED` there). Play/render failures block; a11y is a **ratchet** against `docs/evals/a11y-baseline.json` | GHA · no model call — Playwright + axe | Bill | ✅ live (#169; baseline 146 stories / 15 rules, 2026-08-26) |
| Conventions integrity sweep | monthly cron (1st, 09:00 UTC) | uno-maintain (integrity checklist: `staleness-sweep.md`) | reviewers/auditor | `harness-integrity-sweep.yml` → `scripts/prompts/uno-integrity-sweep/SKILL.md` (intake transport: shared ref above) | GHA cron → claude-vertex (sonnet) · GCP `hcii-plus` | Bill | ✅ live (first dispatch run green 2026-07-16 — filed intakes #71/#72); the pilot for the sweep pattern |
| Notion comment sweep | each flow run touching a page + monthly | uno-maintain (unresolved threads → incorporate or intake) | writers/notion | ❌ not built — follow the integrity-sweep pattern (Notion via `NOTION_API_KEY`) | (planned) GHA cron → claude-vertex · GCP `hcii-plus` | — | planned |
| Eval run logging | every flow exit | rubric scoring → run entry | reviewers/rubric-applier | interim: `docs/evals/runs/*.jsonl`; target: Notion Eval Runs DB | in-session (whatever harness ran the flow) | — | planned |
