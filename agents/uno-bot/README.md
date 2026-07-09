# uno-bot — Cloudflare Worker

Runtime for the agentic uno-bot: receives Slack events, runs an agentic Claude loop with tool use, dispatches GitHub Actions for side-effects, and stores per-thread state in a Durable Object. Guidance is fetched at runtime — the constitution (`AGENTS.md`), this embodiment's persona (`AGENT.md`), the six `skills/*/bot.md` + `references/method.md`, and `docs/conventions/*` — so pushing to `main` updates the bot's brain without a code change; a **`wrangler deploy` is still required** to pick up changes to the Worker *code* (incl. `SKILL_PATHS`).

**Status:** live — serving Slack since June 2026 (Pipedream→Worker cutover, ADR-014). Confirm the running build with `GET /health` → `uno-bot ok <BUILD>`.

## Layout

```
uno-bot/
├── AGENT.md              Persona delta (constitution is repo-root AGENTS.md)
├── tool-definitions.json Tool schemas (source of truth; imported by src/agent/tool-definitions.ts)
├── wrangler.toml         Worker + Durable Object + vars/secrets config
├── package.json / tsconfig.json / .dev.vars.example
└── src/
    ├── index.ts          Fetch handler / route dispatch (ack in <3s, then waitUntil)
    ├── agent/            Claude loop · SKILL_PATHS prompt assembly · preflight · model tiering
    ├── slack/            Events · proposal gate · signature verify · Web-API wrappers
    ├── tools/            Tool implementations (dispatcher + tools) — see tool-definitions.json
    ├── integrations/     Notion · Figma · blueprint (Supabase) · gmail · ds-components
    └── thread-state.ts   Durable Object (per-thread history + pending proposals)
```

Regression prompts for the bot live in the eval loop: `docs/evals/scenarios/uno-bot.md`.

## Local dev

```bash
npm install
npx wrangler login                # one-time
cp .dev.vars.example .dev.vars    # fill in secrets (gitignored)
npm run dev                       # wrangler dev on http://localhost:8787
curl http://localhost:8787/health
```

## Config

**Plain vars** (`wrangler.toml` `[vars]`): `GITHUB_REPO` (dispatch target) · `SKILLS_BASE_URL` (GitHub Raw base for runtime skill fetch) · the Notion DB ids + `SUPABASE_URL` + `PLUS_DESIGN_CHANNEL_ID`.

**Secrets** (`wrangler secret put <NAME>`, persist across redeploys):

| Name | Purpose |
|------|---------|
| `SLACK_SIGNING_SECRET` | Verify incoming Slack request signatures |
| `SLACK_BOT_TOKEN` | `xoxb-…` for `chat.postMessage`, `reactions.add`, `conversations.replies` |
| `ANTHROPIC_API_KEY` | Anthropic SDK auth |
| `GITHUB_TOKEN` | PAT with `repo:dispatch` for firing `repository_dispatch` |
| `NOTION_API_KEY` | Notion integration token (`create_prd`) |
| `FIGMA_ACCESS_TOKEN` | Figma read token — enables the `implement_design` proposal screenshot |
| `SUPABASE_ANON_KEY` | read-only blueprint key (`blueprint_search`) |
| `GMAIL_*` | OAuth for `send_email` (sender, client id/secret, refresh token) |

## Deploy

```bash
cd agents/uno-bot
npx wrangler login       # if not already authenticated to the Cloudflare account
npx wrangler deploy      # ships ALL of src/ on the current branch
curl https://<worker-url>/health   # expect: uno-bot ok <BUILD>
```

`wrangler deploy` ships the whole `src/` of the current branch — confirm the branch's Worker code is production-ready first. The Worker fetches skills from `SKILLS_BASE_URL` (raw `main`, repo root) per isolate, so a fresh deploy also picks up the latest pushed guidance.

## Smoke test

- **Bot behavior:** fire a few of the R1–R12 prompts in `docs/evals/scenarios/uno-bot.md` at @uno-bot — the confidence-line + routing + gate behaviors confirm the current build is live.
- **`implement_design` (manual, no Slack):** GitHub Actions → "Implement Design (Prototype)" → Run workflow from `main`, `figma_url` = a single **screen frame** (renders < 8000px), `slug` = `test-prototype`. Expect a draft PR with `playground/test-prototype/` + a root `dev:test-prototype` script; `npm install && npm run dev:test-prototype` boots it.

## Gotchas

- **`repository_dispatch` + default branch:** the `implement*` workflows only fire when they exist on `main`, or a confirmed proposal silently no-ops.
- **Oversized Figma frames:** whole-board nodes blow past Figma's render limit + Anthropic's 8000px image cap; the script falls back (smaller scale → design-properties only). Point at a single screen frame for visual parity.
- **Notion PRD access:** the PRD page must be shared with the Notion integration, else codegen proceeds without PRD context (graceful, lower fidelity).
- **Slug collisions:** the scaffold refuses to overwrite an existing `playground/{slug}/` (Action fails, Slack gets ❌). Pick a fresh slug.
- **Cost:** each `implement_design` run is one large multimodal Claude call (~$0.30–0.80).
