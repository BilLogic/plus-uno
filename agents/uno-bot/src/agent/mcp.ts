// Notion hosted-MCP attachment for the agent loop — READS ONLY.
//
// Attaching a remote MCP server makes its tools run INLINE, server-side, during
// the Anthropic turn (never returned to the Worker as tool_use). That's fine for
// reads, but it means any WRITE tool exposed here would bypass the ✅ proposal
// gate entirely. So `allowed_tools` below is an allowlist of Notion's READ tools
// ONLY. Notion writes stay as the bot's own gated tools (notion_create/update/
// archive). Never add a write/create/update/delete/archive tool to this list.
//
// PROVISIONAL: the mcp_servers param + `MCP_BETA` header are an Anthropic beta
// whose exact shape evolves. Verify against current Anthropic docs and run
// `npm run typecheck` before deploy. When no token is stored, notionMcpServers()
// returns [] and the call is unchanged — so this is inert until you finish the
// one-time OAuth consent.

import type { Env } from "../types";
import { getNotionAccessToken } from "../oauth/notion";

// Current MCP-connector beta (verified against Anthropic docs 2026-07). The old
// `mcp-client-2025-04-04` is DEPRECATED: in the current version tool config moved
// out of the mcp_servers entry into an `mcp_toolset` in the top-level `tools`
// array (allowlist = default_config.enabled:false + per-tool configs). See
// notionMcpServers() (server entry) and notionMcpToolsets() (the toolset).
export const MCP_BETA = "mcp-client-2025-11-20";
const NOTION_MCP_SERVER_NAME = "notion";
const NOTION_MCP_URL = "https://mcp.notion.com/mcp";

// READ tools only. These are the AUTHORITATIVE tool names the hosted
// mcp.notion.com server exposes (confirmed against the live connector tool
// registry — names are `notion-`-prefixed, NOT bare `search`/`fetch`, and NOT
// the raw-REST `notion-retrieve-a-*` names). Unknown names are ignored by the
// API (a backend warning, no error), but a stray WRITE name here would bypass
// the ✅ proposal gate — keep this list reads-only.
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

// Beta connector shapes. `Record<string, unknown>` because the installed SDK
// (0.32.x) predates these beta params — they're passed through as raw body.
type McpServer = Record<string, unknown>;
type McpToolset = Record<string, unknown>;

/**
 * Returns the mcp_servers array for the Anthropic call — [] when the Notion
 * OAuth token isn't set up yet, so the agent loop is unchanged until then.
 * The tool allowlist lives in notionMcpToolsets(), not here (current beta).
 */
export async function notionMcpServers(env: Env): Promise<McpServer[]> {
  const token = await getNotionAccessToken(env);
  if (!token) return [];
  return [
    {
      type: "url",
      url: NOTION_MCP_URL,
      name: NOTION_MCP_SERVER_NAME,
      authorization_token: token,
    },
  ];
}

/**
 * The `mcp_toolset` entries to append to the top-level `tools` array. Uses the
 * allowlist pattern: default all tools OFF, then enable only the read tools.
 * Every server in mcp_servers must be referenced by exactly one toolset, so this
 * must be included whenever notionMcpServers() returns a non-empty array.
 */
export function notionMcpToolsets(): McpToolset[] {
  const configs: Record<string, { enabled: true }> = {};
  for (const tool of NOTION_MCP_READ_TOOLS) configs[tool] = { enabled: true };
  return [
    {
      type: "mcp_toolset",
      mcp_server_name: NOTION_MCP_SERVER_NAME,
      default_config: { enabled: false },
      configs,
    },
  ];
}
