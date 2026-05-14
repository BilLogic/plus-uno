# UNO Bot — Skill Library (Draft Scaffolding)

> ⚠️ **Draft.** This is scaffolding for the UNO Bot's skill library, drafted inside the plus-uno repo for convenience. The eventual home is the bot's own repo (TBD — see Open Questions in the plan file at `~/.claude/plans/piped-riding-melody.md`). When that decision lands, this directory moves wholesale.

## What This Is

The bot's skill library. Each subdirectory is one skill the bot can invoke. Skills follow the [Anthropic Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) pattern — one `SKILL.md` per skill, optional `references/` and `scripts/` alongside, progressive disclosure handled by the runtime.

## Directory Structure

```
bot-skills/
├── README.md                       (this file)
├── AGENTS.md                       (shared system prompt — all skills inherit)
├── pipedream-workflow.md           (architecture sketch — router + switch + per-skill branches)
├── bot.config.example.json         (TODO: Plus-specific config schema)
├── lib/
│   └── skill-loader.js             (Node module: parses SKILL.md, strips meta, conditional refs)
├── uno-implement/                  (migrated: covers both code + stories together)
│   ├── SKILL.md
│   └── references/
│       └── new-component-scaffolding.md  (auto-loaded when isNewComponent === true)
├── uno-critique/                   (draft: first new skill, Week 3)
│   └── SKILL.md
└── uno-assist/                     (draft: second new skill, Week 4)
    └── SKILL.md
```

## Current Skills

| Skill | Status | Trigger paths | Purpose |
|-------|--------|---------------|---------|
| `uno-implement` | Migration draft | `slack_keyword`, `github_dispatch` | Implements design-system changes (code + stories together) from a PRD or `implement <component>` keyword. Migrates `scripts/implement-figma-changes.js`. **Decision (2026-05-12):** code and stories ship together; splitting was considered and rejected. |
| `uno-critique` | Draft (Week 3 ship target) | `slack_keyword` | Severity-tiered, Plus-doc-cited feedback on a design artifact (Figma frame, prototype, marketplace ID, Notion doc, GitHub PR). Runs entirely in Pipedream (no git ops). |
| `uno-assist` | Draft (Week 4 ship target) | `slack_keyword` | Plus-specific Q&A grounded in `docs/context/` and `docs/knowledge/`. Progressive disclosure: preloads a knowledge map, fetches 1-3 docs on demand. Runs entirely in Pipedream (no git ops). |

Net-new skills (per plan):

- `uno-critique` — **drafted 2026-05-12**, ships Week 3 (satisfies §8 Definition of Done: 1 migrated + 1 new). See [uno-critique/SKILL.md](uno-critique/SKILL.md).
- `uno-assist` — **drafted 2026-05-12**, ships Week 4 (upside, not DoD-required). See [uno-assist/SKILL.md](uno-assist/SKILL.md).

Deferred from v1 (per plan assumptions challenges):

- `uno-figma-transform` (§2.4) — IDE-shaped work, not Slack-shaped
- Model parameter control (§2.5) — developer-ergonomics feature, not user feature

> **Note on §8 DoD math.** The source doc says "existing storybook + PRD skills plus one new skill" (implying 2 + 1 = 3). But because today's `implement-figma-changes.js` actually does both as one capability, the v1 set is `uno-implement` (covers both) + `uno-critique` (new) = 2 skills total. Still satisfies the intent of §8 — the migration is complete and one net-new capability ships.

## How to Add a Skill

1. Create `bot-skills/{skill-name}/`
2. Write `SKILL.md` with YAML frontmatter (`name`, `description`, `trigger_types`, optional `model_default`, optional `tone_override`) plus markdown body
3. Keep `SKILL.md` under ~500 lines per [Anthropic best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices). If it grows past that, split into `references/`.
4. Add a row to the **Current Skills** table above
5. Wire it into the Pipedream router (one new Switch case)

## Trigger Types

The same `SKILL.md` can be invoked from multiple trigger types. This is how we keep one skill library while supporting both conversational and automated workflows.

| Trigger type | Source | Payload shape | Used by |
|--------------|--------|---------------|---------|
| `slack_keyword` | Designer types a recognized keyword in `#figma-sync` (or another bot-listening channel). Pipedream filters every message and routes by keyword — this is NOT `@`-mention syntax. Can also be triggered by `@uno-bot ...` mentions in channels the bot is invited to | `{ message_text, channel, thread_ts, user }` | All user-facing skills |
| `github_dispatch` | `repository_dispatch` event with `event_type: implement-figma-changes` — dispatched today from `figma-library-poll.yml` (when the user later asks via Slack) or in the future from manual GitHub-UI workflow runs | `{ component, trigger_source, user_id, channel, thread_ts, spec_text, notion_prd_id }` | `uno-implement` only |

> **Note on what `polling_cron` is *not*.** The Figma library poller (`scripts/poll-figma-library.js` on the `figma-library-poll.yml` schedule) does NOT directly trigger any skill in the bot. It creates a Notion PRD and posts to `#figma-sync`. The designer reads the PRD, then types `implement <component>` in Slack, which routes through the bot via `slack_keyword`. Polling is upstream of the bot, not a trigger for it.

The polling-to-implement loop (existing flow, see [docs/figma-sync-workflow.md](../docs/figma-sync-workflow.md) for the authoritative version):

1. Poll detects a Figma publish
2. Creates a **Notion PRD** in the "DS Component PRDs" database, status `Draft`
3. Posts to `#figma-sync` with a link to the PRD
4. Designer reviews the Notion PRD, adds implementation notes / refines acceptance criteria
5. Designer types `implement <component>` as a plain Slack message in `#figma-sync` (no slash — Pipedream filters for the keyword)
6. Pipedream → `repository_dispatch` → GitHub Actions → `uno-implement` skill (post-cutover) → Claude → commits to a new `ds-review/{component}-{date}` branch → draft PR
7. Slack notification with PR link

**Designer UX is unchanged from today** through the cutover. The only thing changing under the hood: the AI-implementation logic moves from being inline in `scripts/implement-figma-changes.js` into the `uno-implement` SKILL.md so it can be shared with Slack-direct invocations of the same skill.

## Phase-2 Generalization Disciplines

These rules cost nothing during the Plus-first build and make phase-2 (§4.3) generalization a content-extraction rather than a refactor:

1. Plus-specific **content** (terminology, forbidden patterns, tone notes) lives in dedicated files referenced from skills — never inline in `SKILL.md`.
2. Plus-specific **paths and IDs** (Slack workspace, GitHub repo, Figma file key, channel names like `#figma-sync`) live in `bot.config.json` or env vars — never in source.
3. Plus-flavored prose carries a `<!-- Plus-specific -->` comment so phase-2 grep is trivial.

## Related Artifacts

- **Plan:** `~/.claude/plans/piped-riding-melody.md` (full sequence, assumptions, verification)
- **§4.1 Architecture comparison:** Notion-pastable markdown from prior conversation
- **§4.2 Pipedream routing feasibility:** Notion-pastable markdown from prior conversation
- **§4.3 Generalization (deferred to phase 2):** outline produced; not in v1 scope
- **Pattern reference:** `.agent/skills/` in this repo — the in-IDE agent's skill library, same `SKILL.md` pattern this bot library is modeled on
