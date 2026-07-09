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

export const MCP_BETA = "mcp-client-2025-04-04";
const NOTION_MCP_URL = "https://mcp.notion.com/mcp";

// READ tools only. VERIFY these names against the live mcp.notion.com tool list
// (they must match exactly; unknown names are simply ignored, but a stray WRITE
// name here would defeat the gate — keep this list reads-only).
export const NOTION_MCP_READ_TOOLS = [
  "search",
  "fetch",
  "notion-get-self",
  "notion-get-user",
  "notion-get-users",
  "notion-get-comments",
  "notion-retrieve-a-page",
  "notion-retrieve-a-database",
  "notion-retrieve-a-data-source",
  "notion-query-data-source",
  "notion-get-block-children",
  "notion-retrieve-page-property",
];

// The Anthropic MCP-connector server entry. `any` because the beta type may lag
// the installed SDK version — see PROVISIONAL note above.
type McpServer = Record<string, unknown>;

/**
 * Returns the mcp_servers array for the Anthropic call — [] when the Notion
 * OAuth token isn't set up yet, so the agent loop is unchanged until then.
 */
export async function notionMcpServers(env: Env): Promise<McpServer[]> {
  const token = await getNotionAccessToken(env);
  if (!token) return [];
  return [
    {
      type: "url",
      url: NOTION_MCP_URL,
      name: "notion",
      authorization_token: token,
      tool_configuration: {
        enabled: true,
        allowed_tools: NOTION_MCP_READ_TOOLS,
      },
    },
  ];
}
