# uno-bot MCP Read Migration — hosted-MCP reads across all services

Generalize the Notion hosted-MCP read attachment (already built) into an N-server pattern so the Worker's bespoke REST **read** tools are replaced by hosted-MCP reads where a service offers a reliable, statically-authable remote MCP — while every **write/action** tool stays a gated bot tool. Notion is the done template; this plan sequences GitHub, Figma, Slack, and Supabase behind it.

- **Status:** PLAN ONLY — nothing implemented. Written on `feat/uno-bot-notion-mcp-and-surface-cleanup`, not committed.
- **Date:** 2026-07-08
- **Owner:** Bill
- **Supersedes:** nothing. Extends `docs/plans/2026-07-08-002-uno-bot-sdk-mcp-connector.md` (the connector plumbing) and `-003-uno-bot-tool-surface.md` (the v4 tool registry). Governed by `docs/conventions/notion.md` ("reads → MCP; writes → gated bot tools").
- **Derived from:** current `agents/uno-bot/src` inventory + live-MCP research (GitHub / Figma / Slack / Supabase remote servers, Jul 2026).

## 0. The governing rule (do not weaken)

From `docs/conventions/notion.md`: **reads → hosted MCP** (attached read-only via an `allowed_tools` whitelist); **writes → the bot's own gated tools**. The reason is mechanical, not stylistic: an MCP tool attached to the Anthropic call runs **inline, server-side, during the turn** — it never returns to the Worker as a `tool_use` block, so it **bypasses the ✅ proposal gate** entirely. A write tool in any allowlist would therefore mutate state with no human backstop. So:

> ⚠️ **ABSOLUTE:** no write/create/update/delete/archive/mutate tool ever enters any MCP `allowed_tools`. Writes remain `notion_create/update/archive`, `component_implement`, `prototype_scaffold`, `shareout_post`, `email_send` — the bot's gated tools, unchanged by this plan.

Each attached server is **guarded**: `buildMcpServers(env)` emits an entry only when that server's token/config is present, so the migration is incremental and every step is inert (loop unchanged) until its credential is set. This is exactly today's `notionMcpServers()` behavior (returns `[]` with no token), generalized.

## 1. Per-service research — what actually exists (Jul 2026)

The table is the load-bearing result. "Verdict" is what this plan recommends; §9 lists the two decisions only Bill can make.

| Service | Hosted remote MCP | Auth that fits the Worker | Read-only `allowed_tools` (real names, writes excluded) | Replaces bot read tool | Verdict |
|---|---|---|---|---|---|
| **Notion** | `https://mcp.notion.com/mcp` | OAuth (KV-stored token) — **done** | the existing `NOTION_MCP_READ_TOOLS` list in `mcp.ts` (`search`, `fetch`, `notion-retrieve-*`, `notion-query-data-source`, …) | `notion_search` + Notion branch of `source_read` (kept as fallback, see §6) | **DONE — template** |
| **GitHub** | `https://api.githubcopilot.com/mcp/` (+ `/x/<toolset>` + `/readonly` URL variants) | **static PAT** — reuse `GITHUB_TOKEN` via `Authorization: Bearer` (scope caveat below) | `get_file_contents` (file read **and** dir listing — the whole of `github_read`); optional grounding adds `search_code`, `list_commits`, `get_commit`, `list_branches` | `github_read` | **MIGRATE** — the one clean cutover |
| **Figma** | `https://mcp.figma.com/mcp` | **OAuth only**; PAT unsupported, and the `mcp:connect` scope is gated to allow-listed clients (waitlist) | n/a (no reachable read surface without gated OAuth) | (Figma branch of `source_read`) | **KEEP REST** — no statically-authable hosted MCP |
| **Slack** | `https://mcp.slack.com/mcp` | needs a **`xoxp-` user token via a new OAuth (2.0 + PKCE)** flow **and** "MCP server access" enabled on the Slack app — the existing `xoxb-` **bot** token does **not** work | (if ever migrated) `slack_read_thread`, `slack_read_channel`, `slack_search_public`, `slack_read_user_profile` — write tools like `slack_send_message`/`slack_schedule_message`/canvas excluded | `slack_thread_read` | **KEEP REST** now; optional OAuth later (§9) |
| **Supabase** | `https://mcp.supabase.com/mcp?project_ref=osybxeojvsqcwxkgnalm&read_only=true&features=database,docs,debugging` | **static PAT** — new secret `SUPABASE_MCP_TOKEN`, project-scoped read-only | `list_tables`, `list_extensions`, `list_migrations`, `get_advisors`, `get_logs`, `search_docs`, `generate_typescript_types` — **`execute_sql`, `apply_migration`, `deploy_edge_function`, and all branch ops excluded per policy** | **does NOT replace `blueprint_search`** (see below) | **KEEP `blueprint_search` REST**; attach Supabase MCP only as complementary schema/advisor/docs grounding (optional) |

Sources: [GitHub remote-server docs](https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md) · [GitHub MCP setup](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp-in-your-ide/set-up-the-github-mcp-server) · [Supabase MCP docs](https://supabase.com/docs/guides/ai-tools/mcp) · [Figma PAT-auth forum thread](https://forum.figma.com/ask-the-community-7/support-for-pat-personal-access-token-based-auth-in-figma-remote-mcp-47465) · [Slack MCP overview](https://docs.slack.dev/ai/slack-mcp-server/).

### Two findings that shape the whole plan

1. **The Anthropic MCP-connector entry accepts `url` + `authorization_token` only — no custom request headers.** *(Corrected 2026-07-09: the current `mcp-client-2025-11-20` beta drops the old `tool_configuration` block from the `mcp_servers` entry — tool allowlisting now lives in a separate `mcp_toolset` in the top-level `tools` array, `default_config.enabled:false` + per-tool `configs`. Verified against Anthropic's docs; the committed `mcp.ts` uses this shape.)* Because no custom headers are possible, GitHub's read-only mode (normally the `X-MCP-Readonly`/`X-MCP-Toolsets` headers) and Supabase's read scoping **must be encoded in the URL**: GitHub → `…/mcp/x/repos/readonly`; Supabase → `?read_only=true&project_ref=…&features=…`. This gives defense-in-depth: even a mis-added write tool name can't mutate, because the *server* is in read-only mode.

2. **Supabase read-only MCP with `execute_sql` excluded cannot query rows.** `blueprint_search` runs a bespoke `search_blueprint(q)` RPC (single-subrequest) with a multi-table `ilike` fallback and domain-specific **layer/step actor attribution** (`src/integrations/blueprint.ts`). None of the allowlisted read tools (`list_tables`, `get_advisors`, `search_docs`, …) can return blueprint *data* — that needs `execute_sql`, which policy excludes. Reproducing it via `execute_sql` would also mean the model authoring the attribution join SQL each turn, losing the mechanical guarantee. **Therefore `blueprint_search` stays a REST tool.** This is the single most important open question (§9): keep it REST (recommended), or allowlist `execute_sql` *only* under server-enforced `read_only=true` to retire it.

**Net:** the only real read migration this plan executes is **GitHub → hosted MCP**. Notion is done; Figma, Slack, and the Supabase blueprint read all keep their REST tools for concrete, documented reasons. That is the honest scope — the value is (a) generalizing the attachment so future services are one guard away, and (b) retiring `github_read`'s bespoke code.

## 2. Generalized `mcp.ts` — `notionMcpServers()` → `buildMcpServers(env)`

Refactor the single-purpose function into an array-builder that concatenates one guarded entry per service. Each guard mirrors today's Notion guard (`getNotionAccessToken` → `[]` when absent), so servers switch on independently as their credentials land.

> **Superseded by the shipped code.** The sketch below predates the beta-shape correction and the actual `buildMcp(env)` implementation (committed). It used the deprecated `mcp-client-2025-04-04` `tool_configuration` shape; the shipped version uses `mcp-client-2025-11-20` (servers carry only `url`+`authorization_token`; allowlisting via `mcp_toolset` in `tools[]`) and returns paired `{servers, toolsets}`. Kept here for the per-service *reasoning*, not the exact API shape.

```ts
// agents/uno-bot/src/agent/mcp.ts  (SHAPE SKETCH — SUPERSEDED, see note above)
export const MCP_BETA = "mcp-client-2025-04-04";
type McpServer = Record<string, unknown>; // beta type may lag the SDK

// One read-only server descriptor. `allowed_tools` MUST be reads only.
function urlServer(name: string, url: string, token: string, allowed: string[]): McpServer {
  return {
    type: "url",
    url,
    name,
    authorization_token: token,
    tool_configuration: { enabled: true, allowed_tools: allowed },
  };
}

// Each builder returns [] until its credential/config is present → inert & incremental.
async function notionServer(env: Env): Promise<McpServer[]> {
  const token = await getNotionAccessToken(env);            // OAuth (done)
  return token ? [urlServer("notion", NOTION_MCP_URL, token, NOTION_MCP_READ_TOOLS)] : [];
}
function githubServer(env: Env): McpServer[] {
  if (!env.GITHUB_TOKEN) return [];                          // reuse existing PAT
  const url = "https://api.githubcopilot.com/mcp/x/repos/readonly"; // read-only in the URL
  return [urlServer("github", url, env.GITHUB_TOKEN, GITHUB_MCP_READ_TOOLS)];
}
function supabaseServer(env: Env): McpServer[] {             // OPTIONAL — see §1/§9
  if (!env.SUPABASE_MCP_TOKEN) return [];                    // new project-scoped read-only PAT
  const ref = "osybxeojvsqcwxkgnalm";
  const url = `https://mcp.supabase.com/mcp?project_ref=${ref}&read_only=true&features=database,docs,debugging`;
  return [urlServer("supabase", url, env.SUPABASE_MCP_TOKEN, SUPABASE_MCP_READ_TOOLS)];
}
// Figma & Slack: intentionally absent — no statically-authable hosted read MCP (§1).

export async function buildMcpServers(env: Env): Promise<McpServer[]> {
  return [
    ...(await notionServer(env)),
    ...githubServer(env),
    ...supabaseServer(env),
  ];
}
```

`run-agent.ts` changes by one line — `const mcpServers = await buildMcpServers(env);` — everything downstream (`mcpParams`/`mcpOpts`, the beta header, the "empty → unchanged loop" behavior) is unchanged. The read-tool name arrays (`GITHUB_MCP_READ_TOOLS`, `SUPABASE_MCP_READ_TOOLS`) live beside `NOTION_MCP_READ_TOOLS` with the same reads-only warning comment.

## 3. Auth wiring per service

| Service | Credential | Where it lives | Action needed |
|---|---|---|---|
| Notion | OAuth token in KV (`NOTION_OAUTH_KV`) | done | none — verify live first (§5) |
| GitHub | reuse `GITHUB_TOKEN` (PAT) as `Authorization: Bearer` | existing Cloudflare secret | **verify scope**: today's PAT is `repo:dispatch`-scoped for `dispatches`; MCP `get_file_contents` needs Contents:Read (classic `repo`, or fine-grained Contents: Read-only). If under-scoped it 403s — expand or issue a read PAT before cutover. No new secret name if the same token gains scope. |
| Supabase | new `SUPABASE_MCP_TOKEN` (PAT, project-scoped read-only to `osybxeojvsqcwxkgnalm`) | `wrangler secret put SUPABASE_MCP_TOKEN` | create the PAT; add to `Env` in `src/types.ts` and to the secrets list in `wrangler.toml`. **Never** place the value in this or any doc. Distinct from `SUPABASE_ANON_KEY` (which stays for `blueprint_search`). |
| Figma | — | — | none — REST path (`FIGMA_ACCESS_TOKEN`) unchanged |
| Slack | — | — | none now — REST path (`SLACK_BOT_TOKEN`) unchanged; a future `xoxp` OAuth would be a Notion-style flow (§9) |

## 4. Sequencing (each step behind its guard; deploy only after the harness is confirmed live-healthy, per -003 §6)

1. **Verify Notion MCP is live FIRST** — the gating precondition. One-time OAuth consent at `/oauth/notion/start` done; confirm a real query is served by `mcp.notion.com` (telemetry + a `search`/`fetch` round-trip). Do not start §2 refactor until this is green, so the generalization is validated against a known-good server.
2. **Refactor to `buildMcpServers(env)`** (§2) with only the Notion entry wired — pure refactor, behavior identical; `npm run typecheck` + `wrangler dev` + a Notion read regression.
3. **GitHub** — add `githubServer` guard + `GITHUB_MCP_READ_TOOLS`; confirm PAT scope; verify (§8); then delete `github_read` (§6).
4. **Figma** — **no-op**: document in `AGENT.md`/faces that Figma reads stay REST via `source_read` and why (OAuth-only, `mcp:connect` gated). No code change.
5. **Slack** — **no-op**: document that `slack_thread_read` stays REST (needs a new `xoxp` OAuth + app MCP enablement). No code change unless Bill opts into the OAuth (§9).
6. **Supabase** — decision-gated (§9). If "keep REST": no code change beyond an optional `supabaseServer` guard for complementary schema/advisor/docs grounding (does **not** touch `blueprint_search`). If "retire": separate follow-up plan to allowlist `execute_sql` under `read_only=true` and rebuild the attribution as a prompt/skill.

## 5. Deletion plan (keep REST as fallback until MCP verified live, then remove)

Per the convention, a REST read tool is retained as the graceful-degradation fallback **until its MCP equivalent is verified live**, then the model-facing tool + its bespoke code are deleted in one commit that also updates every doc that names it.

**GitHub (the only deletion this plan triggers), after §8 GitHub verification passes:**
- Delete `agents/uno-bot/src/tools/github-read.ts`.
- Delete `agents/uno-bot/src/integrations/github.ts` — it contains only `githubReadPath` + `GithubReadResult`; `repository_dispatch` lives self-contained in `src/tools/github-dispatch.ts`, and the fail-open DS preflight guard is separate (`src/integrations/ds-components.ts`), so the file goes entirely.
- `agents/uno-bot/src/agent/run-agent.ts` — remove the `executeGithubRead` import and the `if (name === "github_read")` branch in `executeReadOnlyTool`.
- `agents/uno-bot/src/agent/types.ts` — drop `"github_read"` from the `ToolName` union.
- `agents/uno-bot/tool-definitions.json` — remove the `github_read` entry (the JSON is the source of truth; `access` flags derive from it per -003 §6).
- `agents/uno-bot/AGENT.md` — rewrite the grounding bullets that name `github_read` (the "I do it" list and the two "DS / component / rule / repo facts → `github_read`" bullets) to point at the GitHub MCP read surface, keeping the "check the source before asserting, cite the path" rule.
- `skills/uno-prototype/bot.md` — the one face that names `github_read`; update the tool name.

**Notion:** no deletion — `notion_search` and the Notion branch of `source_read` are the documented read fallback for when the MCP token is absent (`notion.md` line 19: "the read fallback when the MCP token isn't set"). `source_read` also cannot be deleted regardless: it is multi-domain (Notion + Figma + GitHub-raw + generic web) and remains the Figma/web reader.

**Figma / Slack / Supabase-blueprint:** no deletion — no migration. `source_read` (Figma branch, referenced in `skills/uno-maintain|prototype|review/bot.md`), `slack_thread_read` (`skills/uno-publish/bot.md`), and `blueprint_search` (`skills/uno-synthesize/bot.md` + `AGENT.md`) all stay. Add a one-line note in `AGENT.md` explaining the split so a future maintainer doesn't "finish the migration" by accident.

## 6. Risks

- **Per-turn latency + token cost of N servers.** Every attached server injects its tool list into *every* Anthropic call (input tokens) and adds a connection round-trip. N servers multiply both. Mitigations: (a) keep `allowed_tools` minimal and use toolset-scoped URLs (`/x/repos/readonly`) so the injected tool list is small; (b) the guard already attaches a server only when configured; (c) **measure** the input-token delta per server via the existing telemetry line (`tokens_in=` in `run-agent.ts`) and set a soft cap on how many attach per request — if cost is high, consider intent-conditional attachment (attach GitHub MCP only when the message reads DS/repo-related) as a later optimization, not v1.
- **Beta-connector stability.** `mcp_servers` + the `anthropic-beta: mcp-client-2025-04-04` header is a provisional beta whose shape evolves. Keep the `as` casts and the "empty → unchanged loop" guard so any breakage degrades to no-MCP rather than erroring; `npm run typecheck` before every deploy; if the installed SDK exposes `client.beta.messages.create`, switch both call sites.
- **`allowed_tools` name-correctness is silent.** An unknown/renamed tool name is **ignored with no error** — the read simply never happens and the bot falls back to priors (a confidence regression, not a crash). Mitigation: verify each server's names against its live `tools/list` before deploy; add a CI/startup assertion that every allowlisted name is present on the server.
- **The ABSOLUTE write rule (§0).** No write tool in any allowlist, ever. For GitHub the `…/readonly` URL and for Supabase `read_only=true` add server-side enforcement so a mistake can't mutate — but the allowlist discipline is the primary control and must be reviewed on every change.
- **GitHub PAT scope.** Current token is dispatch-scoped; if it lacks Contents:Read, `get_file_contents` 403s at cutover. Verify/expand before deleting `github_read` (§5 order matters).
- **Copilot-hosted endpoint.** `api.githubcopilot.com` is GitHub's Copilot-hosted MCP; confirm org policy permits the Worker's PAT to use it.
- **Provisional SDK shape** — same standing caveat as the Notion attachment; carried forward.

## 7. Verification + rollback (per service)

**General.** Rollback pre-deletion is trivial: unset the credential (or drop the server from `buildMcpServers`) → the guard returns `[]` → the loop is unchanged and the REST tool still serves. Post-deletion rollback = revert the deletion commit. Verify each server by (a) `tools/list` returns the expected read names; (b) a known query is answered from MCP content with the MCP tool visible in telemetry; (c) a write is impossible (name not in allowlist **and** server read-only rejects).

- **Notion (done):** verify a `search`→`fetch` chain returns live workspace content; confirm no write tool is offered. Rollback: clear the KV token → REST reads resume.
- **GitHub:** `get_file_contents` on a known repo path returns file text; a dir path returns entries; `search_code` (if allowlisted) returns hits; confirm no `create_or_update_file`/`push_files`/`delete_file` present and the `/readonly` URL rejects writes. Rollback: remove `githubServer` from the builder (before deletion) or revert the deletion commit (after) — `github_read`/`githubReadPath` restore the prior path.
- **Figma / Slack:** nothing to verify (no change); confirm `source_read`(figma) and `slack_thread_read` still pass their existing regressions.
- **Supabase:** `blueprint_search` regression unchanged (still REST). If the optional `supabaseServer` is attached: verify `list_tables`/`search_docs` return, and that `execute_sql`/`apply_migration`/`deploy_edge_function`/branch ops are **absent** from `tools/list`. Rollback: unset `SUPABASE_MCP_TOKEN`.

Regression harness across all steps: rerun `docs/evals/scenarios/uno-bot.md` (R1–R12/R13), `npm run typecheck`, `wrangler dev`, then deploy — after the harness build is confirmed live-healthy, never bundled with an infra cutover (-003 §6).

## 8. What I need from the user

1. **The key decision — Supabase blueprint (§1 finding 2):** keep `blueprint_search` as the REST tool (**recommended** — preserves the bespoke `search_blueprint` RPC + layer/step attribution), **or** allowlist `execute_sql` under server-enforced `read_only=true` to retire it (accepting the model authors attribution SQL each turn)? This gates the whole Supabase step.
2. **`SUPABASE_MCP_TOKEN`:** create a Supabase **Personal Access Token**, project-scoped read-only to `osybxeojvsqcwxkgnalm`, and set it via `wrangler secret put SUPABASE_MCP_TOKEN`. Do not paste the value anywhere in the repo. (Only needed if you want the optional complementary Supabase read MCP; not needed if blueprint stays pure REST with no schema-grounding MCP.)
3. **GitHub scope:** confirm `GITHUB_TOKEN` has Contents:Read (or provide a read-scoped PAT), and that using the Copilot-hosted `api.githubcopilot.com/mcp` endpoint is acceptable under your org policy.
4. **Figma:** OK to keep Figma reads on REST `source_read` (no static-token hosted MCP exists)? If you want Figma-via-MCP later, join the Figma MCP catalog waitlist / provision `mcp:connect` OAuth.
5. **Slack:** OK to keep `slack_thread_read` on REST for now? Migrating it means a new Notion-style `xoxp` user-token OAuth flow **and** enabling "MCP server access" on the Slack app — a real lift for a small read surface; only worth it if you want a richer Slack read surface.
6. **Precondition:** confirm the Notion MCP is verified live (OAuth consent completed) — §5 step 1 gates everything else.

---

**Single most important open question:** With `execute_sql` excluded per policy, the Supabase read-only MCP cannot query blueprint rows — so does `blueprint_search` stay a REST tool (recommended, preserving the bespoke RPC + actor attribution), or do we admit `execute_sql` *only* under server-enforced `read_only=true` and rebuild the attribution logic as a prompt/skill in order to retire it?
