// Hosted-MCP attachments for the agent loop — READS ONLY.
//
// Attaching a remote MCP server makes its tools run INLINE, server-side, during
// the Anthropic turn (never returned to the Worker as tool_use). That's fine for
// reads, but any WRITE tool exposed here would bypass the ✅ proposal gate. So
// every toolset below is read-only — either an explicit read allowlist, or a URL
// the server itself scopes to read-only. Writes stay the bot's own gated tools.
// NEVER add a write/create/update/delete/archive tool to any allowlist here.
//
// Each service is GUARDED — omitted until its credential/flag is present — so the
// rollout is incremental and the non-MCP path is byte-for-byte unchanged until a
// service is deliberately turned on.
//
// Beta shape: current mcp-client-2025-11-20 (verified against Anthropic docs).
// mcp_servers entries carry only type/url/name/authorization_token; tool
// allowlisting lives in an mcp_toolset in the top-level `tools` array. Passed as
// raw body + `anthropic-beta` header because the installed SDK (0.32.x) predates
// these beta params. The API requires exactly one toolset per server, so
// buildMcp() returns servers + toolsets together.

import type { Env } from "../types";
import { getNotionAccessToken } from "../oauth/notion";

export const MCP_BETA = "mcp-client-2025-11-20";

// Beta connector shapes as raw records (SDK 0.32.x predates the typed params).
type McpServer = Record<string, unknown>;
type McpToolset = Record<string, unknown>;

// ─── Notion (OAuth 2.1 token in KV; explicit read allowlist) ─────────────────
const NOTION_SERVER = "notion";
const NOTION_URL = "https://mcp.notion.com/mcp";
// AUTHORITATIVE hosted mcp.notion.com read tool names (confirmed against the live
// connector registry — `notion-`-prefixed, not bare `search`/`fetch`, not the
// raw-REST `notion-retrieve-a-*`). Zero write tools.
export const NOTION_MCP_READ_TOOLS = [
  "notion-search",
  "notion-fetch",
  "notion-get-users",
  "notion-get-teams",
  "notion-get-comments",
  "notion-query-data-sources",
  "notion-query-database-view",
  "notion-query-meeting-notes",
  "notion-get-async-task",
  "notion-download-attachment",
];

// ─── GitHub (PAT bearer; read-only enforced by the URL) ──────────────────────
// The `/x/repos/readonly` path scopes the server to the repos toolset in
// read-only mode SERVER-SIDE, so every exposed tool is a read — no allowlist
// needed (enable-all is safe). Reuses the existing GITHUB_TOKEN PAT (GitHub's MCP
// accepts a PAT bearer, unlike Notion). Replaces the bespoke github_read tool
// once verified live. Gated behind GITHUB_MCP_ENABLED so it stays inert (and the
// working github_read path is untouched) until deliberately switched on.
const GITHUB_SERVER = "github";
const GITHUB_URL = "https://api.githubcopilot.com/mcp/x/repos/readonly";

/**
 * Build the MCP servers + their paired toolsets for the Anthropic call. Returns
 * empty arrays when nothing is configured, so the agent loop is unchanged until a
 * service is turned on.
 */
export async function buildMcp(env: Env): Promise<{ servers: McpServer[]; toolsets: McpToolset[] }> {
  const servers: McpServer[] = [];
  const toolsets: McpToolset[] = [];

  // Notion — active once the one-time OAuth consent has stored a token in KV.
  const notionToken = await getNotionAccessToken(env);
  if (notionToken) {
    servers.push({ type: "url", url: NOTION_URL, name: NOTION_SERVER, authorization_token: notionToken });
    const configs: Record<string, { enabled: true }> = {};
    for (const t of NOTION_MCP_READ_TOOLS) configs[t] = { enabled: true };
    toolsets.push({
      type: "mcp_toolset",
      mcp_server_name: NOTION_SERVER,
      default_config: { enabled: false }, // allowlist: everything off, then read tools on
      configs,
    });
  }

  // GitHub — inert until GITHUB_MCP_ENABLED === "true" (keeps github_read as the
  // live path until this is verified). Read-only is guaranteed by the URL.
  if (env.GITHUB_TOKEN && env.GITHUB_MCP_ENABLED === "true") {
    servers.push({ type: "url", url: GITHUB_URL, name: GITHUB_SERVER, authorization_token: env.GITHUB_TOKEN });
    toolsets.push({ type: "mcp_toolset", mcp_server_name: GITHUB_SERVER }); // enable-all (URL is readonly)
  }

  return { servers, toolsets };
}
