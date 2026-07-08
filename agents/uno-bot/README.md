# UNO Bot v2 — Cloudflare Worker

Runtime for the agentic UNO Bot. Receives Slack events, runs an agentic Claude
loop with tool use, dispatches GitHub Actions for side-effects, and stores
per-thread conversation state in a Durable Object.

Companion content lives in `../../skills/*/bot.md` + `docs/conventions/` (skill markdown loaded into the
agent's system prompt at runtime).

## Status

Week 2 scaffold. Not yet wired to Slack/Anthropic/GitHub — see the todo list
in `~/.claude/plans/piped-riding-melody.md`.

## Local dev

```bash
npm install
npx wrangler login                # one-time
cp .dev.vars.example .dev.vars    # then fill in secrets (file is .gitignored)
npm run dev                       # wrangler dev on http://localhost:8787
```

Health check:

```bash
curl http://localhost:8787/health
```

## Secrets (production)

Set via `wrangler secret put <NAME>`:

| Name | Purpose |
|------|---------|
| `SLACK_SIGNING_SECRET` | Verify incoming Slack request signatures |
| `SLACK_BOT_TOKEN` | `xoxb-…` for `chat.postMessage`, `reactions.add`, `conversations.replies` |
| `ANTHROPIC_API_KEY` | Anthropic SDK auth |
| `GITHUB_TOKEN` | PAT with `repo:dispatch` for firing `repository_dispatch` events |

## Plain vars

Set in `wrangler.toml` `[vars]`:

| Name | Purpose |
|------|---------|
| `GITHUB_REPO` | `owner/repo` target for `repository_dispatch` |
| `SKILLS_BASE_URL` | GitHub Raw base URL for fetching `SKILL.md` files at runtime |

## Routes

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/slack/events` | Slack Events API + interactivity payloads |
| `GET`  | `/health`       | Liveness probe |

## Layout

```
uno-bot/
├── wrangler.toml         Worker + Durable Object config
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          Top-level fetch handler / route dispatch
│   ├── types.ts          Env interface
│   └── thread-state.ts   Durable Object (stub for now)
└── README.md
```
