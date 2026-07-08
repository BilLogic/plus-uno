# UNO Bot — Skill Library (v2 — Agentic Architecture)

> ⚠️ **Draft.** This is scaffolding for the UNO Bot's skill library, drafted inside the plus-uno repo for convenience. The eventual home is the bot's own repo (TBD — see Open Questions in the plan file at `~/.claude/plans/piped-riding-melody.md`). When that decision lands, this directory moves wholesale.

## What This Is

The bot's skill library — content the v2 **agentic** Claude bot loads at runtime. Skills follow the [Anthropic Agent Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) pattern (one `SKILL.md` per skill, optional `references/` and `scripts/` alongside, progressive disclosure handled by the runtime).

**v2 architecture in one line:** the agent loads `AGENTS.md` + all SKILL.md content as its system prompt, has the three side-effect-bearing skills exposed as *tools* (implement, marketplace_add, marketplace_edit) plus one read-only tool (marketplace_search), and uses `uno-qa` content as its default conversational mode when no tool call is needed.

## Directory Structure

```
bot-skills/
├── README.md                       (this file)
├── AGENTS.md                       (shared system prompt — voice, mrkdwn, emoji reactions, tool-use protocol)
├── pipedream-workflow.md           (v1 architecture sketch — kept for reference; v2 platform TBD in Week 1)
├── pipedream-snippets.md           (v1 paste-ready code — likely archived after v2 platform decision)
├── setup-guide.md                  (v1 setup checklist — will be rewritten for v2 platform)
├── bot.config.example.json         (TODO: Plus-specific config schema)
├── lib/
│   └── skill-loader.js             (Node module: parses SKILL.md, strips meta, conditional refs — still used by scripts/implement-figma-changes.js)
├── uno-implement/                  (kept from v1: exposed as a tool to the v2 agent; deterministic invocation + confirmation gate)
│   ├── SKILL.md
│   └── references/
│       └── new-component-scaffolding.md  (auto-loaded when isNewComponent === true)
├── uno-qa/                         (renamed from uno-assist: broadened Q&A — DS facts + project status)
│   └── SKILL.md
├── uno-marketplace/                (NEW in v2: search/list (read-only) + add/edit (with confirmation))
│   └── SKILL.md
└── uno-critique/                   (DEFERRED in v2: parking-lot doc, not wired into the agent)
    └── SKILL.md
```

## Current Skill Roster (v2)

| Skill | v2 status | Invoked how | Side effects |
|-------|-----------|-------------|--------------|
| `uno-implement` | **Tool** — deterministic invocation with confirmation gate | Agent calls `implement(component, ...)` when user clearly wants to fire the GitHub Action | Opens a real draft PR via `figma-implement.yml` |
| `uno-qa` | **Default conversational mode** — no tool call needed | Agent answers directly using loaded docs when the user has a question | None — pure conversation |
| `uno-marketplace` | **Three tools** (search/list, add, edit) — confirmation gates on add/edit | Agent calls `marketplace_search`, `marketplace_add`, or `marketplace_edit` based on intent | search: none. add/edit: opens a draft PR editing `prototypes-data.js` |
| `uno-critique` | **Deferred** (parking-lot doc) | Not wired. Q&A handles informal evaluation. | n/a |

### Why this changed from v1

v1 had a deterministic router → switch → 1-of-3-skills pattern. Designers reported it was too rigid: they wanted to send freeform prompts (multi-intent, Q&A, exploratory) and have the bot figure out what to do. The v2 pivot replaces the router with an agentic Claude that has skills-as-tools. See `~/.claude/plans/piped-riding-melody.md` for the full architectural plan.

## How to Add a Skill (v2)

1. Decide if your skill is **a tool** (the agent invokes a specific operation with parameters; usually has side effects) or **default conversational content** (the agent uses it to inform its replies, no tool call).
2. Create `bot-skills/{skill-name}/`.
3. Write `SKILL.md` with YAML frontmatter (`name`, `description`, `trigger_types`, `model_default`, `status`) plus markdown body.
4. Keep `SKILL.md` under ~500 lines per [Anthropic best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices). If it grows past that, split into `references/`.
5. If it's a tool: define the formal tool schema in `bot-skills/tool-definitions.json` (TODO — Week 2 deliverable).
6. Add a row to the **Current Skill Roster** table above.
7. Update `AGENTS.md`'s "Tool use protocol" section if the tool is side-effect-bearing.

## Trigger Types (v2)

In v2 there's no router — everything flows through the agentic Claude call. The `trigger_types` field in SKILL.md frontmatter is now metadata describing *how* the skill gets used, not how the orchestration layer routes to it:

| Trigger type | Meaning |
|--------------|---------|
| `agentic_default` | Used as default conversational content. Loaded into system prompt; agent uses it when no tool is needed. Currently: `uno-qa`. |
| `agentic_tool` | Exposed as a tool the agent can invoke. Currently: `uno-marketplace` (3 ops), `uno-implement`. |
| `github_dispatch` | Still applies for `uno-implement` — when the agent invokes the implement tool, the actual work happens via `repository_dispatch` to `figma-implement.yml`. |

> **Note on what polling is *not*.** The Figma library poller (`scripts/poll-figma-library.js` on the `figma-library-poll.yml` schedule) does NOT directly trigger any skill or tool. It creates a Notion PRD and posts to `#figma-sync`. The designer reads the PRD, then asks the bot to implement, which the agent handles via the implement tool. Polling is upstream of the bot, not a trigger for it.

## The polling-to-implement loop (unchanged from v1)

The whole pipeline outside the bot is unchanged in v2:

1. Poll detects a Figma publish (`figma-library-poll.yml`, every 15 min)
2. Creates a **Notion PRD** in the "DS Component PRDs" database
3. Posts to `#figma-sync` with a link to the PRD
4. Designer reviews the Notion PRD, adds implementation notes
5. Designer asks the bot to implement (freeform — "implement Badge", "go ahead with the Badge change", "implement the latest"... agent recognizes intent)
6. Agent invokes the `implement` tool with confirmation gate → `repository_dispatch` → `figma-implement.yml` → Claude → draft PR
7. Slack notification with PR link

**The change in v2 vs v1:** step 5 is more flexible. v1 required the exact keyword `implement <component>`. v2's agent understands many phrasings. The underlying execution (steps 6-7) is identical.

## Phase-2 Generalization Disciplines

These rules cost nothing during the Plus-first build and make phase-2 (the case-study/article work) a content-extraction rather than a refactor:

1. Plus-specific **content** (terminology, forbidden patterns, tone notes) lives in dedicated files referenced from skills — never inline in `SKILL.md`.
2. Plus-specific **paths and IDs** (Slack workspace, GitHub repo, Figma file key, channel names like `#figma-sync`) live in `bot.config.json` or env vars — never in source.
3. Plus-flavored prose carries a `<!-- Plus-specific -->` comment so phase-2 grep is trivial.

## Related Artifacts

- **Plan:** `~/.claude/plans/piped-riding-melody.md` (v2 plan: agentic architecture + 3-week schedule)
- **v1 architecture (deprecated but reference-worthy):** `bot-skills/pipedream-workflow.md`, `bot-skills/pipedream-snippets.md`
- **Platform research (Week 1 deliverable):** `docs/research/cloud-hosting-options.md` (TBD)
- **User-flow friction audit (Week 1):** `docs/research/user-flow-friction-audit.md` (TBD)
- **Flowcharts (Week 1):** `docs/flowcharts/*.md` (TBD)
- **Pattern reference:** `.agent/skills/` in this repo — the in-IDE agent's skill library, same SKILL.md pattern
