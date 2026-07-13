# uno-bot — the Slack embodiment of uno

A Cloudflare Worker that puts **uno** (the PLUS design agent) in Slack as `@uno-bot`: it receives Slack events, runs an agentic tool-use loop, answers grounded questions across Notion / the blueprint / GitHub / Slack, and stages consequential actions (file a PRD, trigger a build, send an email) behind a ✅ confirmation gate. Side-effects execute via GitHub Actions; per-thread state lives in Durable Objects.

**Status:** live — serving Slack since June 2026 (Pipedream→Worker cutover, ADR-014). Confirm the running build with `GET /health` → `uno-bot ok <BUILD>`.

## How the brain works

The Worker code is only the *body*. The *brain* — guidance, persona, skills — is fetched from GitHub Raw at runtime (20 files, `src/agent/skills.ts` `SKILL_PATHS`):

1. `AGENTS.md` — the constitution (repo root)
2. `agents/uno-bot/AGENT.md` — this embodiment's persona delta
3. The six skills, each as `references/method.md` + `bot.md`
4. Six `docs/conventions/` files: terminology, notion, figma-workspace, slack, supabase, writing-style

So **pushing guidance to `main` reprograms the bot within ~5 minutes** (KV-cached, last-known-good fallback, degradation alerts to `#uno-bot`) — no deploy needed. A **`wrangler deploy` is required** only for changes to the Worker *code*, including `SKILL_PATHS` itself. Note the conventions list is hardcoded, not a glob — a new conventions doc needs a `SKILL_PATHS` entry + deploy to load.

## Model providers — two lanes, one switch

`MODEL_PROVIDER` in `wrangler.toml` selects the loop that runs every turn (`src/agent/run-agent.ts` dispatches):

| | `anthropic` | `gemini` (**currently active**, 2026-07-10) |
|---|---|---|
| Model | `sonnet` for every real ask (adaptive thinking); "think hard" → `opus`; proposal confirm/cancel → `haiku` | `GEMINI_MODEL` (`gemini-3.5-flash`) via `src/agent/gemini-agent.ts` |
| Extra tools | server-side `web_search`, `advisor` (opus consult), `delegate` (≤3 parallel haiku subagents) | none — local tools only |
| Hosted MCP reads (Notion / Supabase / GitHub / Slack) | attached | **not available** |
| Auth | `ANTHROPIC_API_KEY` | `GEMINI_API_KEY` (AI Studio) **or** `GEMINI_SA_EMAIL` + `GEMINI_SA_PRIVATE_KEY` (Vertex) |

Both lanes share the same local tool roster, gate protocol, iteration cap (16) and output-token cap (16384). Smoke-test the Gemini path with `GET /debug/gemini`, MCP health with `GET /debug/mcp`.

## What it can / partially can / can't do

**Can (reads are free; Slack messaging is native):** answer grounded questions — Roadmap card status (`roadmap_query`), product behavior from the blueprint (`blueprint_search`), DS/component/repo facts (`github_read` / GitHub MCP), Slack search + thread reads, any linked doc (`source_read`), access-request routing via the Third Party Applications directory (`notion_search` scope `apps` — names the Application Admin to ask + pre-fills the request; the grant stays human) — and post/react in Slack as itself.

**Can, behind the ✅ gate (proposal card, 60-min expiry, requester-only confirm):** file a PRD or intake card (`notion_create`), update/append to a card (`notion_update`), archive a card (`notion_archive`), trigger a DS component build (`component_implement` → `figma-implement.yml`), scaffold a prototype from a Figma frame (`prototype_scaffold` → `figma-implement-design.yml`), post a share-out (`shareout_post`), send outward email (`email_send`). Confirmed implement/scaffold dispatches also carry the **full triggering-thread transcript** (names resolved, last ~50 messages / ~10k chars, truncation noted) in the `client_payload` (`thread_transcript`), so the Actions runner sees the whole discussion — the bot itself still never edits repos.

**Quality loop, pre-send:** substantive text drafts (≥1500 chars — deliverable-shaped output, not ordinary replies) get ONE cheap judge call against a condensed D1–D9 rubric (`src/agent/draft-judge.ts`) and are revised once if flagged; short replies skip it, and any judge error/timeout ships the original draft (fail open). Verdicts land in the telemetry stream as `[uno-bot] draft-judge …` lines.

**Partially — Figma:** no Figma MCP for the Worker (closed catalog; only approved apps like Claude Code/Cursor connect). A pasted frame link (with `node-id`) arrives with a rendered screenshot the model can *see*, plus structure/text layers over REST (`source_read`) — so qualitative review works. Variables, tokens, and computed values (exact spacing, contrast ratios) stay IDE-only. The bot never writes to Figma; `FIGMA_ACCESS_TOKEN` only powers the proposal-card screenshot.

**Can't:** edit repo files, run shell/`npm`/`git`, or spawn IDE subagents — it's a Worker, not an IDE agent. It routes that work to Claude Code/Cursor via ready-to-paste handoff prompts. Blueprint and marketplace-catalog writes are deliberately not bot tools (they run in-IDE via `writers/blueprint` / `writers/notion`).

The full behavioral contract (voice, grounding rules, gate protocol, Slack etiquette) is [`AGENT.md`](AGENT.md) — fetched into the system prompt at runtime.

## Layout

```
uno-bot/
├── AGENT.md              Persona delta (constitution is repo-root AGENTS.md)
├── tool-definitions.json Local tool schemas (source of truth; re-exported by src/agent/tool-definitions.ts)
├── wrangler.toml         Worker + Durable Objects + KV + vars/secrets config (+ free-tier constraints)
├── package.json / tsconfig.json / .dev.vars.example
└── src/
    ├── index.ts          Fetch handler / routes: /health · /debug/mcp · /debug/gemini ·
    │                     /slack/events · /oauth/{notion,slack}/{start,callback} · cron (MCP watchdog)
    ├── agent/            The loops: run-agent.ts (Anthropic + dispatch) · gemini-agent.ts (Gemini) ·
    │                     skills.ts (SKILL_PATHS prompt assembly) · preflight · mcp.ts · tool schemas
    ├── gemini/           Gemini auth (API key / Vertex SA) + REST client
    ├── slack/            Events · proposal gate · signature verify · mrkdwn · Web-API wrappers
    ├── tools/            Local tool implementations (dispatcher + one file per tool family)
    ├── integrations/     notion · figma · blueprint (Supabase) · github · gmail · ds-components
    ├── oauth/            Hosted-MCP OAuth flows (Notion dynamic client, Slack static client)
    ├── debug/            mcp-health.ts (cron-probed watchdog)
    ├── thread-state.ts   Durable Object: per-thread history + pending proposals (60-min TTL)
    ├── agent-runner.ts   Durable Object: runs the agent turn in an alarm — outlives the ~30s
    │                     waitUntil() cancellation window that killed long runs
    └── version.ts        BUILD string returned by /health
```

Regression tests: the **UNO-Bot Test Plan** in Notion (13 `TC-*` cases run one-per-thread in `#uno-bot-sandbox`, hand- or judge-scored 0–3; latest round 2026-07-11 averaged 2.48). Legacy R1–R12 prompts remain in `docs/evals/scenarios/uno-bot.md`.

## Local dev

```bash
npm install
npx wrangler login                # one-time
cp .dev.vars.example .dev.vars    # fill in secrets (gitignored; example lists them all)
npm run dev                       # wrangler dev on http://localhost:8787
curl http://localhost:8787/health
```

## Config

**Plain vars** (`wrangler.toml` `[vars]` — commented inline there): `GITHUB_REPO` + `SKILLS_BASE_URL` (both must point at the harness repo, `BilLogic/plus-uno`) · `MODEL_PROVIDER` + `GEMINI_PROJECT_ID` / `GEMINI_REGION` / `GEMINI_MODEL` · `GITHUB_MCP_ENABLED` · Notion DB ids · `SUPABASE_URL` · Slack channel ids (`PLUS_DESIGN_CHANNEL_ID`, `PLUS_DESIGN_FEEDBACK_CHANNEL_ID`) · `SLACK_SEARCH_PRIVATE_ALLOWLIST` (the privacy firewall) · MCP OAuth ids/redirects.

**Bindings:** Durable Objects `THREAD_STATE` + `AGENT_RUNNER`; KV `HARNESS_KV` (harness cache/fallback), `NOTION_OAUTH_KV`, `SLACK_OAUTH_KV`.

**Secrets** (`wrangler secret put <NAME>`, persist across redeploys):

| Name | Purpose |
|------|---------|
| `SLACK_SIGNING_SECRET` | Verify incoming Slack request signatures |
| `SLACK_BOT_TOKEN` | `xoxb-…` for `chat.postMessage`, `reactions.add`, `conversations.replies` |
| `SLACK_MCP_CLIENT_SECRET` | Secret for the static Slack MCP OAuth client |
| `ANTHROPIC_API_KEY` | Anthropic lane auth |
| `GEMINI_API_KEY` *or* `GEMINI_SA_EMAIL` + `GEMINI_SA_PRIVATE_KEY` | Gemini lane auth (API key wins if both set) |
| `GITHUB_TOKEN` | PAT for `repository_dispatch` + GitHub MCP reads |
| `NOTION_API_KEY` | Notion integration token (`notion_create` / `notion_update` / `notion_archive`) |
| `FIGMA_ACCESS_TOKEN` | Figma read token — the `prototype_scaffold` proposal screenshot |
| `SUPABASE_ANON_KEY` | read-only blueprint key (`blueprint_search`) |
| `SUPABASE_MCP_TOKEN` | hosted Supabase MCP (read-only pinned) |
| `GMAIL_*` | OAuth for `email_send` (sender, client id/secret, refresh token) |

**Free-tier constraints are deliberate** (50 subrequests/invocation, ~10ms CPU) — see the annotated block at the top of `wrangler.toml`; the AgentRunner processes exactly one job per alarm firing for this reason.

## Deploy

```bash
cd agents/uno-bot
npx wrangler login       # if not already authenticated to the Cloudflare account
npx wrangler deploy      # ships ALL of src/ on the current branch
curl https://<worker-url>/health   # expect: uno-bot ok <BUILD>
```

`wrangler deploy` ships the whole `src/` of the current branch — confirm the branch's Worker code is production-ready first. The Worker fetches skills from `SKILLS_BASE_URL` (raw `main`, repo root), so a fresh deploy also picks up the latest pushed guidance.

## Smoke test

- **Bot behavior:** run the Test Plan's smoke trio in `#uno-bot-sandbox` — the injection case (gate + safety), the Goal-Setting retrieval case (grounding + citations), and the bare hi-fi ask (clarify-before-build). Cancel any staged proposals afterward; one case per thread.
- **Provider + MCP health:** `GET /debug/gemini` (live Gemini round-trip), `GET /debug/mcp` (attached MCP servers; also cron-probed every 15 min with alerts to `#uno-bot`).
- **`prototype_scaffold` (manual, no Slack):** GitHub Actions → "Implement Design (Prototype)" → Run workflow from `main`, `figma_url` = a single **screen frame** (renders < 8000px), `slug` = `test-prototype`. Expect a draft PR with `playground/test-prototype/` + a root `dev:test-prototype` script; `npm install && npm run dev:test-prototype` boots it.

## Gotchas

- **`repository_dispatch` + default branch:** the implement workflows (`figma-implement.yml`, `figma-implement-design.yml`) only fire when they exist on `main`, or a confirmed proposal silently no-ops.
- **Provider drift:** capabilities differ by lane (see the table above) — if the bot stops using `delegate`/`web_search` or hosted-MCP reads, check `MODEL_PROVIDER` before debugging anything else.
- **Oversized Figma frames:** whole-board nodes blow past Figma's render limit + the 8000px image cap; the script falls back (smaller scale → design-properties only). Point at a single screen frame for visual parity.
- **Notion PRD access:** the PRD page must be shared with the Notion integration, else codegen proceeds without PRD context (graceful, lower fidelity).
- **Slug collisions:** the scaffold refuses to overwrite an existing `playground/{slug}/` (Action fails, Slack gets ❌). Pick a fresh slug.
- **Cost:** each `prototype_scaffold` run is one large multimodal LLM call (~$0.30–0.80).
