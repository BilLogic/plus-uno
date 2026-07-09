# uno-bot: SDK upgrade + Notion MCP connector (Path B)

- **Status:** ⏸️ **SHELVED (2026-07-08)** — after verifying the auth mechanics, the hosted-MCP-for-reads path is a net negative for a headless Worker (see § Token-lifecycle finding). Phase 1 scaffolding (`mcp.ts`, SDK bump, `types.ts`/`wrangler.toml` docs) stays on `feat/uno-bot-sdk-mcp` **inert** — harmless, off until secrets are set — but we are **not** provisioning `NOTION_MCP_TOKEN` and **not** migrating `run-agent.ts`. Recommendation: keep Notion reads on the existing REST path.
- **Date:** 2026-07-08
- **Owner:** Bill
- **Original why:** route Notion **grounding reads** through the hosted MCP connector (`mcp.notion.com`) while keeping **writes** behind the proposal gate. Requires bumping the Worker's Anthropic SDK 0.32.1 → 0.110.0 (0.32 predates the MCP connector entirely).

## Token-lifecycle finding (why this is shelved)

Verified against [Anthropic's MCP connector docs](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector) and [Notion's hosted MCP docs](https://developers.notion.com/guides/mcp/get-started-with-mcp):

- **Anthropic doesn't run the OAuth flow.** `mcp_servers[].authorization_token` expects an OAuth **access token you obtain and refresh yourself**: *"API consumers are expected to handle the OAuth flow and obtain the access token prior to making the API call, and to refresh the token as needed."*
- **Notion's hosted MCP is built for interactive clients** (Cursor, Claude Desktop) — user-scoped OAuth, *"may not be suitable for fully automated workflows or cloud-based coding agents that run without human interaction."*
- **uno-bot is exactly that headless agent.** The inspector-minted token is user-scoped and can expire; the Worker has no refresh plumbing → reads silently break until a human re-runs the OAuth flow by hand.

**The trade this exposes:** Path B would swap a working, **never-expiring** `ntn_` REST integration key for an **expiring OAuth token that needs refresh code**, purely to delete ~100 lines of stable REST read code. For a headless Worker that's a downgrade. The proposal gate is preserved either way (writes are always our own custom gated tools, never MCP).

**Two-Claudes clarification.** MCP connectors fit *interactive* Claude (Bill's Claude Desktop / Claude Code, where he authorizes in-browser) — Notion/Slack/Cloudflare over MCP there is correct. The **Worker** calls the Claude **API** headlessly and should stay REST-simple.

**Decision → keep REST for both reads and writes:**

| Concern | Path | Auth |
|---|---|---|
| Notion reads (grounding) | existing bot REST read code | `ntn_` key — workspace-scoped, non-expiring |
| Notion writes (`create_prd`/`delete_prd`) | own custom tools, behind the ✅ gate | same `ntn_` key |
| Model turn | Claude API | `ANTHROPIC_API_KEY` |

If we ever want MCP reads on the Worker, revisit only after either (a) building OAuth client_id/secret/refresh handling into the Worker (a real feature — the "New connection" redirect-URI dialog becomes relevant then, callback = a Worker route), or (b) self-hosting `notion-mcp-server` with static bearer auth. Neither earns its keep today.

## Superseded plan below (kept for the record)

## The safety invariant (non-negotiable)

MCP tools execute **server-side, inside the model's turn** — there is no interception point, so the proposal gate cannot see them. Therefore:
- The Notion MCP connector is **read-only**: `default_config.enabled = false` + a `configs` allowlist of `search`/`fetch` only (`src/agent/mcp.ts`).
- **No Notion write tool is ever allow-listed.** `create_prd`/`delete_prd` stay as our own gated custom tools.
- Get the allowlist wrong (a write tool allow-listed) = an ungated write to the real Notion workspace. Verify tool names against the live hosted server before the first real call.

## Phase 1 — staged on this branch (safe, inert)

Done, and safe to review/merge because the connector is off until secrets are set:
- `package.json`: `@anthropic-ai/sdk` `^0.32.0` → `^0.110.0`.
- `src/types.ts`: `Env` gains `NOTION_MCP_URL?` + `NOTION_MCP_TOKEN?`.
- `src/agent/mcp.ts` (new): `buildNotionMcp(env)` → read-only connector config or `null` when unconfigured; `MCP_BETA`, `NOTION_MCP_READ_TOOLS`.
- `wrangler.toml`: commented `NOTION_MCP_URL` var + `NOTION_MCP_TOKEN` secret doc; clarifies `NOTION_API_KEY` (ntn_, gated writes) vs `NOTION_MCP_TOKEN` (OAuth, reads).
- `docs/conventions/notion.md`: reads-via-MCP / writes-gated access-paths note.

## Phase 2 — the compile-in-the-loop step (`run-agent.ts` + `skills.ts`, with Bill's tsc)

Because 0.110's beta types can't be verified headless, do this against a live `npm install` + `npx tsc`:

1. **Install & baseline:** `cd agents/uno-bot && npm install` (pins 0.110.0 in the lockfile) → `npm run typecheck`. Fix any non-MCP fallout first (0.32→0.110 is a big jump; expect a few type renames — the compiler names each one).
2. **Switch the two API calls** in `run-agent.ts` from `client.messages.create(...)` → `client.beta.messages.create(...)`, adding `betas: [MCP_BETA]` and spreading the connector when configured:
   ```ts
   const mcp = buildNotionMcp(env);
   const response = await client.beta.messages.create({
     model, max_tokens: MAX_TOKENS,
     system: systemBlocks,
     tools: [...(TOOLS as any), ...(mcp?.mcpToolsets ?? [])],
     ...(mcp ? { mcp_servers: mcp.mcpServers } : {}),
     betas: [MCP_BETA],
     messages,
   });
   ```
   (Same at the tool_choice:"none" fallback call.)
3. **Move the content-block type guards to the beta namespace** — the compiler drives this: `Anthropic.ContentBlock` → `Anthropic.Beta.BetaContentBlock`, `Anthropic.ToolUseBlock` → `Anthropic.Beta.BetaToolUseBlock`, `Anthropic.TextBlock` → `Anthropic.Beta.BetaTextBlock`, `Anthropic.MessageParam` → `Anthropic.Beta.BetaMessageParam`, `Anthropic.ToolResultBlockParam` → `Anthropic.Beta.BetaToolResultBlockParam`, `Anthropic.TextBlockParam` → `Anthropic.Beta.BetaTextBlockParam`, and `skills.ts` `SystemBlock`/tool-definitions accordingly. The `tool_choice: {type:"none"}` cast likely becomes unnecessary (0.110 types it).
4. **`mcp_tool_use` / `mcp_tool_result` need no handling** — they resolve server-side and never surface as interceptable `tool_use`, so the existing `toolUses.filter(b => b.type === "tool_use")` naturally excludes them and the gate is untouched. (Optional: log them for observability.)
5. **Typecheck green**, then `wrangler dev`, then deploy.

## Provisioning (Bill)

- Mint the **Notion MCP OAuth token** (`mcp.notion.com`, your account) → `wrangler secret put NOTION_MCP_TOKEN`; uncomment `NOTION_MCP_URL` in `wrangler.toml`.
- **Rotate** the `ntn_` REST key that was pasted in chat (it's compromised) → `wrangler secret put NOTION_API_KEY` with the fresh value (still needed for the gated write tools).
- **Verify the allowlist**: confirm `search`/`fetch` are the real hosted read-tool names and no write tool is reachable, before the first live call.

## Live test (the "done" gate — R_2026_04_21_live_testing)

- `wrangler deploy` → `GET /health` shows the new BUILD.
- Ask @uno-bot a Notion-grounded question ("what's on the Roadmap for X") → confirm it answers via MCP `search`/`fetch` with citations, and the reply carries the confidence line.
- Confirm a write still gates: "create a PRD for X" → ⚠️ proposal card, no autonomous write.
- Run the R1–R12 regression set (`docs/evals/scenarios/uno-bot.md`).

## Sequencing note

The pending **`wrangler deploy` of the current harness** (six skills, roster, fixed prompt assembly) is independent of this and higher priority — the live bot is still the stale pre-merge build. This branch can proceed in parallel but should merge *after* the harness deploy is confirmed healthy, so a Notion-MCP regression is isolable from the harness cutover.
