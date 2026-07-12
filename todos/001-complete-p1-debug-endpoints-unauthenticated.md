---
status: pending
priority: p1
issue_id: 001
tags: [code-review, security]
dependencies: []
created: 2026-07-12
source: ce-review round 2026-07-12 (uno-bot src + harness)
---

# Unauthenticated /debug/gemini and /debug/mcp on a public Worker URL

## Problem
`GET /debug/gemini` fires a real Gemini generation per hit and `GET /debug/mcp` runs credentialed MCP handshakes against Notion/GitHub/Supabase/Slack (returning server names + 300-char upstream error snippets) — both with zero auth on the public workers.dev URL (src/index.ts:22-39, src/debug/mcp-health.ts). Anyone who finds the URL can burn model quota/spend (this team already exhausted one provider's budget once) and enumerate wired backends.

## Proposed solutions
1. (Recommended) Require a shared secret: `wrangler secret put DEBUG_TOKEN`; constant-time compare against an `x-debug-token` header on both routes; 404 otherwise. Effort: Small.
2. Strip live-generation from /debug/gemini in prod; return a static "configured" boolean. Effort: Small, loses diagnostics.
3. Cloudflare Access in front of /debug/*. Effort: Medium (dashboard config, not code).

## Acceptance
- [ ] Unauthenticated GET /debug/gemini and /debug/mcp return 404/401 and trigger no model call or MCP handshake.
- [ ] Cron-invoked mcp-health probe still works (internal call, not via HTTP route).
