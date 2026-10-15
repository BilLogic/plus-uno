---
embodiment: all
disclosure: reference
summary: THE standing-automation registry — every cron, scheduled Worker job, webhook and PR gate, with its trigger, owner and a link to its home.
---

# Automations Registry

<!-- canonical per ADR-017 (docs/adr/) · disclosed reference: the Worker reads it through read_reference as `docs/engineering/operations`, the IDE opens it on demand · distilled 2026-07-07 from 📓 playbook §6, now superseded · applied by uno-maintain. -->

THE standing-automation registry. An automation absent from the table below is undocumented by definition.

## Rules

- **A row is name · trigger · owner · link.** The link is the automation's home: its scheduled-action doc (read through `read_reference` by that name), its workflow, or its code. The home holds everything else — what it does, its agent, where it runs and who pays.
- **Every automation that judges names its agent in its home.** One that asks a model to judge with no agent named is unowned by definition. A deterministic automation — scripts, REST, diffs, an embedding call — names none, and its Owner answers for it.
- **An automation invokes a skill's method; it never embeds its own copy of the logic.** Migrate opportunistically as each is next touched.
- **Every automation is a loop, and declares its loop mechanics.** Stop condition, caps and trigger cadence go in its home (its job code or its workflow file); the procedure itself stays in the skill's method. Portable by construction: any model can execute the written loop. *(rule added 2026-07-16)*
- **Every automation names where it runs and who pays.** A Worker job runs on the CF Worker, and its model calls are Gemini on Vertex, billed to GCP `hcii-plus` through the uno-bot service account (ADR-018). A GitHub Actions workflow runs scripts and calls no model. Every model in scheduled automation is Gemini, routed by the Worker's tier table (ADR-028). *(rule added 2026-07-16)*

**The Worker's scheduled runs.** Two wrangler crons (`agents/uno-bot/wrangler.toml` `[triggers]`) start two runs each weekday: the **end-of-day run** at 06:00 ET and the **morning run** at 09:00 ET, both Monday to Friday. The end-of-day run is dated to the workday before it; Monday's is dated Friday and reads from where Friday's run left off, so it covers Friday and the weekend. The handler only enqueues; the AgentRunner runs one job per alarm. `agents/uno-bot/src/scheduled/runs.ts` plans which job kinds each run holds, and `src/scheduled/jobs.ts` pairs each kind with its body. Every kind but `noop` (which proves the path and is planned in no run) is named in a row below. A family whose posts people reply to has its own doc in `agents/uno-bot/scheduled-actions/`; the rest have a row alone. Rehearse a run with `GET /debug/sweep?dry_run=1`; it writes nothing.

**GitHub intake transport** (labels, dedupe, caps, injection rule) for an automation that files issues: `scripts/prompts/references/headless-intake.md`.

<!-- ide-only -->
**Operate:** spot-run any workflow with `gh workflow run <file>`; outcomes land in the Actions job summary (`gh run list` / `gh run view <id>`). Cron triggers fire only from `main` — a workflow is inert until merged.

**Supply chain:** third-party actions are pinned to commit SHAs (`uses: owner/repo@<sha> # vN`). To bump: resolve the new tag (`gh api repos/<owner>/<repo>/commits/<tag> --jq .sha`), update the SHA + comment everywhere it appears, then one green dispatch run before trusting crons.
<!-- /ide-only -->

| Automation | Trigger | Owner | Link |
|---|---|---|---|
| Figma library poll | end-of-day run: `figma-library-poll`, then `figma-snapshot-refresh`; posts nothing | Bill | [`src/figma-poll.ts`](../../agents/uno-bot/src/figma-poll.ts) |
| Dev Mode links for merged PRs | morning run: `figma-dev-links-post` — the PRs merged into main since the last card that changed `design-system/src/components/`, one card on `sweep-post`'s #plus-design message | Bill | [`src/figma-links/`](../../agents/uno-bot/src/figma-links/) |
| Figma snapshot refresh | each publish (the end-of-day `figma-snapshot-refresh` job's `repository_dispatch`) or `workflow_dispatch` | Bill | [`figma-snapshot-refresh.yml`](../../.github/workflows/figma-snapshot-refresh.yml) |
| Figma notifications | each comment or change on a subscribed team's file, at `POST /figma/events` | Bill | [`src/figma-notify/`](../../agents/uno-bot/src/figma-notify/) |
| Figma notification subscriptions | on demand (`workflow_dispatch` from `main`; `create` waits for the `uno-bot-production` reviewer) | Bill | [`figma-subscriptions.yml`](../../.github/workflows/figma-subscriptions.yml) |
| Figma backstop | end-of-day run: three `figma-backstop` jobs | Bill | [`src/figma-notify/backstop.ts`](../../agents/uno-bot/src/figma-notify/backstop.ts) |
| End-of-day sweep | end-of-day run: `sweep-channel` (one per `SWEEP_CHANNELS` entry), `sweep-group-dms`, `sweep-dms`, `sweep-notes`, `sweep-cards`; morning run: `sweep-post`, after every job that hands it a section, spawns one `sweep-post:<place>` job a place — one message a place; `figma-drift-post`; both runs: `figma-drift-recheck` | Bill | [`sweep`](../../agents/uno-bot/scheduled-actions/sweep/ACTION.md) |
| Figma comments | end-of-day run: `sweep-figma-comments`; morning run: `sweep-figma-post`; an @uno ask, at `POST /figma/events` | Bill | [`figma-comments`](../../agents/uno-bot/scheduled-actions/figma-comments/ACTION.md) |
| Follow-through | end-of-day run: `card-follow-through`; morning run: `commitment-nudge` | Bill | [`follow-through`](../../agents/uno-bot/scheduled-actions/follow-through/ACTION.md) |
| Blueprint upkeep | end-of-day run: `blueprint-shipped`, `blueprint-draft`; morning run: `blueprint-revision-post`, `blueprint-revision-thread` | Bill | [`blueprint-upkeep`](../../agents/uno-bot/scheduled-actions/blueprint-upkeep/ACTION.md) |
| DS precedence check | Monday's end-of-day run: `ds-precedence-check`; morning run: `ds-precedence-post` | Bill | [`ds-precedence`](../../agents/uno-bot/scheduled-actions/ds-precedence/ACTION.md) |
| DM watch | per person who switched it on — end-of-day run: `dm-promise-read`; morning run: `dm-promise-nudge` | Bill | [`dm-watch`](../../agents/uno-bot/scheduled-actions/dm-watch/ACTION.md) |
| DM Capture | per person who switched it on — end-of-day run: `dm-capture-read`; morning run: `dm-capture-post` | Bill | [`sweep`](../../agents/uno-bot/scheduled-actions/sweep/ACTION.md) § Capture |
| Usage record upkeep | end-of-day run: `usage-classify`, `ask-resolution`, `proposal-expiry`; morning run: `team-roles-sync`; both runs: `usage-text-purge` | Bill | [`agents/uno-bot/README.md`](../../agents/uno-bot/README.md) (usage record) |
| Figma tidy-up | Monday's morning run: `figma-tidy-read` jobs, then `figma-tidy-post` | Bill | [`src/figma-tidy/`](../../agents/uno-bot/src/figma-tidy/) |
| Blueprint embeddings refresh | nightly cron (07:00 UTC) | Bill | [`uno-bot-embed-blueprint.yml`](../../.github/workflows/uno-bot-embed-blueprint.yml) |
| Harness gate | every `pull_request` + on demand | Bill | [`check-harness.yml`](../../.github/workflows/check-harness.yml) → [`scripts/check-harness.mjs`](../../scripts/check-harness.mjs) |
| uno-bot Worker checks | every `pull_request` + on demand | Bill | [`uno-bot-checks.yml`](../../.github/workflows/uno-bot-checks.yml) |
| Storybook gate | every `pull_request` + on demand | Bill | [`storybook-gate.yml`](../../.github/workflows/storybook-gate.yml) |
| Design QA trigger (planned, unbuilt) | Roadmap card → `Dev Status: Ready for QA (RTT)`; needs a daily status poll and a `Design QA` status column first | — | [`agents/reviewers/design-qa.md`](../../agents/reviewers/design-qa.md) |
| Notion comment sweep (planned, unbuilt) | each flow run touching a page + monthly | — | [`skills/uno-maintain/SKILL.md`](../../skills/uno-maintain/SKILL.md) |
