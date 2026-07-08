# uno-bot Tool Surface — the canonical registry (v4: touchpoint-grounded)

- **Status:** in progress — `tool-definitions.json` rewritten to v4 on `feat/uno-bot-tools-v4`; TS bodies + wiring are the compile-in-the-loop step (needs Bill's `tsc`). Merge **after** the pending `wrangler deploy` of the current harness is confirmed healthy.
- **Date:** 2026-07-08
- **Owner:** Bill
- **Supersedes:** the v3 task-tool draft and the ad-hoc 13-tool registry.
- **Derived from:** three parallel audits (per-skill capability extraction · current `tool-definitions.json`/`src` inventory · conventions/write-surface allowlist).

## 1. The organizing idea — tools are touchpoint primitives; knowledge lives in skills

The Worker's tools are **thin primitives grounded in the external system they touch**, not task-specific verbs. The domain knowledge (how to write a good PRD, which pillar, the marketplace schema, mrkdwn formatting) lives in the **conventions the bot already loads** and the **workflow skills** — not frozen into tool code.

**The load-bearing split — mechanical vs editorial:**

| Half | Lives in | Examples |
|---|---|---|
| **Mechanical** (hard, in-code, never trusted to a prompt) | the tool | the write-surface allowlist check · Notion exact-match-select validation (silent auto-create footgun) · the archive parent-DB guard · the Slack signature check |
| **Editorial** (changes often, versioned as docs) | conventions + skills | PRD body shape · which pillar to tag · project-hub section order · marketplace schema · shareout template |

This is safe **only because** three things hold together: (a) mechanical guards stay hard in-tool, (b) the conventions are tight and always loaded into the bot's context, and (c) the ✅ gate is a human backstop on every write. If any of the three weakens, generic writes get risky — that's the standing assumption.

## 2. Naming convention — `<domain>_<verb>`

Domain first (the estate/deliverable, never the backend), verb from a controlled vocabulary. Sorts the registry into touchpoint families; makes gate policy legible from the name.

- **read** verbs: `search`, `read` · **write** verbs: `create`, `update`, `archive`, `implement`, `scaffold`, `post`, `send` · **control**: `resolve`
- snake_case; no bare verbs; the domain is the *thing* (`notion_create`, not `notion_write_page`).

## 3. The registry — 13 tools

`tool-definitions.json` is the single source of truth. Each entry carries `name` + `description` + `input_schema`; the TS layer derives routing (gate/read split, fan-out) from an `access` flag rather than hand-synced lists (see §6).

### Reads — 5 · ungated · execute inline

| Tool | Touchpoint | Inputs | Absorbs / notes |
|---|---|---|---|
| `notion_search` | Notion | `query`, `scope?` | ⭐ NEW — find by keyword when there's no URL. Absorbs `find_experts` (scope:team) + `marketplace_search` (scope:marketplace). |
| `source_read` | any URL | `url` | rename of `read_source` — fetch a pasted link (Notion/Figma/GitHub/web). |
| `blueprint_search` | Supabase | `query` | unchanged — product source of truth. |
| `github_read` | GitHub | `path`, `list?`, `ref?` | ⭐ NEW/promote — read a repo file or list a dir (DS-component existence, rule docs). Promotes `ds-components.ts` plumbing. |
| `slack_thread_read` | Slack | `link` | ⭐ NEW — read a linked thread (sign-offs, verdicts, source discussions). |

### Writes — 7 · gated behind ✅

| Tool | Touchpoint | Inputs | Absorbs / notes |
|---|---|---|---|
| `notion_create` | Notion | `surface`, `title`, `summary?`, `sections?`, `acceptance_criteria?`, `properties?`, `source_url?` | ⭐ generic CRUD-create. `surface ∈ {prd, ds-component-prd, intake, research, marketplace}`. Absorbs `create_prd`, `marketplace_add`, + the intake/findings writes. |
| `notion_update` | Notion | `page_url`, `properties?`, `append?` | ⭐ generic CRUD-update. Property changes (roadmap status, marketplace edit) + narrative append (decision log, findings). Absorbs `roadmap_update`, `marketplace_edit`, `decision_append`, `findings` appends. |
| `notion_archive` | Notion | `page_url` | rename of `delete_prd`; keeps the hard parent-DB guard, now covers any allowlisted card. |
| `component_implement` | GitHub | `component`, `notion_prd_url?`, `notes?` | rename of `implement`. Kept as its own tool (not folded into a generic `github_dispatch`) because its PRD-required guard + distinct schema are real safety. |
| `prototype_scaffold` | GitHub | `figma_url`, `notion_prd_url?`, `slug?`, `notes?` | rename of `implement_design`. Same reasoning. |
| `shareout_post` | Slack | `summary`, `link?`, `reviewers?`, `deadline?` | rename of `share_for_feedback` **+ channel fix** → posts to **#plus-design-feedback** (`C074QG2V7DJ`), not #plus-design. Needs `PLUS_DESIGN_FEEDBACK_CHANNEL_ID`. |
| `email_send` | Gmail | `to`, `subject`, `body`, `cc?` | rename of `send_email`. |

### Control — 1

| Tool | Inputs | Notes |
|---|---|---|
| `proposal_resolve` | `decision`, `message_to_user?` | rename of `resolve_pending_proposal`. |

**Net vs today's 13:** same count, but 4 new capabilities (`notion_search`, `github_read`, `slack_thread_read`, generic Notion CRUD spanning 6 surfaces where there were 2), 2 obsolete removed (the marketplace GitHub stubs — marketplace is Notion now, reached via `notion_create/update(surface:marketplace)`), consistent domain-first naming, and domain logic moved out of tool code into conventions.

### Two considered refinements (vs the earlier sketch)

1. **GitHub writes stay two named tools, not one `github_dispatch`.** Collapsing `implement`/`implement_design` would lose `component_implement`'s "PRD required" guard and force a loose `{workflow, params}` schema. Two tools with rigid schemas is safer; revisit a generic dispatch only if a 3rd Action appears.
2. **No generic `slack_post`.** The only legit programmatic cross-channel post is the shareout; a "post anywhere" tool is a spam/blast-radius risk. In-thread replies are **runtime**, not a tool. So Slack = `slack_thread_read` (R) + `shareout_post` (W).

## 4. Scenario coverage

Every conversation class someone can open with @uno-bot → its tool chain:

| Utterance | Skill | Tool chain | Gate |
|---|---|---|---|
| "status of tutor-matching?" | Q&A | `blueprint_search` → `notion_search` | — |
| "what did we decide about onboarding?" | Q&A | `notion_search` → `source_read` | — |
| "who should I talk to about assessments?" | research | `notion_search(scope:team)` | — |
| "is there a study guide for X?" | research | `notion_search(scope:research)` | — |
| "turn this thread into takeaways" | synthesize | `slack_thread_read` → `blueprint_search` → `notion_create(research)` | ✅ |
| "draft a PRD from these findings" | synthesize | `blueprint_search` → `notion_create(prd)` | ✅ |
| "mark that PRD ready for design" | synthesize | `notion_update(properties)` | ✅ |
| "scrap that PRD" | synthesize | `notion_archive` | ✅ |
| "does the DS have a segmented control?" | prototype | `github_read(list)` | — |
| "implement the Button PRD" | prototype | `github_read(list)` → `component_implement` | ✅ |
| "build a prototype from this frame" | prototype | `source_read` → `prototype_scaffold` | ✅ |
| "review this frame [link]" | review | `source_read` + `github_read`(rules) + `blueprint_search` | — |
| "did dev/PM/stakeholder sign off?" | review/publish | `slack_thread_read` | — |
| "share the checkout prototype for feedback" | publish | `source_read`(bundle liveness) → `shareout_post` | ✅ |
| "close this feedback round" | publish | `slack_thread_read` → `notion_update(append)` | ✅ |
| "publish it to the marketplace" | publish | `notion_search(marketplace)` → `notion_create(marketplace)` | ✅ |
| "fix the stale link in the toolkit doc" | maintain | `source_read` → `notion_create(intake)` | ✅ |
| "email the summary to our SME" | publish | `email_send` | ✅ |
| "go ahead" / "cancel" | gate | `proposal_resolve` | requester-only |

## 5. Deliberately NOT Worker tools — routed to in-IDE agents

State in `AGENT.md` so the bot routes instead of refusing awkwardly: blueprint **writes** (`writers/blueprint`, paired-write discipline, IDE-side MCP) · Figma frame builds / spec-page & library updates (`writers/figma`) · Handoff Spec instantiation (`writers/notion`) · storybook rails propagation & multi-file harness PRs (uno-maintain) · lesson capture / apply-log / eval-run jsonl · analytics/raw-data queries · `run-review-checks.sh` greps.

## 6. Implementation plan (compile-in-the-loop with Bill's `tsc`)

`tool-definitions.json` (done) is the contract. The TS is coupled — renaming tools requires updating every routing site in one commit — so it compiles as a unit:

1. **Registry flags → derive, don't hand-sync.** Add `access: "read"|"write"|"control"` to each JSON entry; in `tool-definitions.ts` strip it from the model-facing `TOOLS` and export `TOOL_ACCESS`. Derive `SIDE_EFFECT_TOOLS` (`access==="write"`), the read-only routing, and the review fan-out set from it. Kills the current 6-way drift.
2. **`agent/types.ts`** — replace the `ToolName` union + `SIDE_EFFECT_TOOLS` literal with the v4 names (or derive).
3. **`tools/dispatcher.ts`** — switch on the v4 side-effect names → executors.
4. **`agent/run-agent.ts`** — `executeReadOnlyTool` routes the 5 reads.
5. **New/generalized integration functions** (`src/integrations/notion.ts`, `github.ts`, `slack`): `notionSearch(query, scope)`, `notionCreate(surface, …)` (generalize `createPrdCard`), `notionUpdate(pageUrl, properties, append)`, keep `archiveRoadmapCard` (widen to allowlisted parents), `githubRead(path, list, ref)` (promote `ds-components.ts`), `slackThreadRead(link)` (conversations.replies).
6. **Tool modules** renamed/added under `src/tools/`, one per v4 tool.
7. **Env** (`types.ts`, `wrangler.toml`): add `PLUS_DESIGN_FEEDBACK_CHANNEL_ID`; marketplace DB id + data-source id (already in `notion.md`).
8. **The six `bot.md` faces** name the new tools — update in the same commit.
9. **Regression:** rerun R1–R12 (`docs/evals/scenarios/uno-bot.md`); `npm run typecheck`; `wrangler dev`; deploy.

**Sequencing:** merge to `main` and deploy **after** the current harness build is confirmed live-healthy — never bundle a tool-surface change with the pending infra cutover, so a regression is isolable.

## 7. Per-touchpoint operating manuals (the "skills" behind the tools)

Each touchpoint = thin tools + a versioned operating manual the workflow skills load. These mostly exist already:

| Touchpoint | Operating manual | Tools it governs |
|---|---|---|
| Notion | `docs/conventions/notion.md` (write-surface allowlist, Roadmap rules, project-hub sections, mrkdwn quirks, template library) | `notion_*` |
| Figma | `docs/conventions/figma-workspace.md` + `skills/uno-prototype/references/figma-mcp-guide.md` | `source_read`(figma), `prototype_scaffold` |
| GitHub | `docs/conventions/automations.md` + DS cheat-sheets | `github_read`, `component_implement`, `prototype_scaffold` |
| Slack | `docs/conventions/slack.md` (mrkdwn, channels, threading, gates) | `slack_thread_read`, `shareout_post`, all replies |
| Supabase | `docs/conventions/supabase.md` | `blueprint_search` |
