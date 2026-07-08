// Notion hosted-MCP read-only connector (Path B).
//
// The Worker's Anthropic API call gains Notion `search`/`fetch` via the MCP
// connector so grounding reads route through the hosted server (mcp.notion.com)
// instead of bespoke REST code.
//
// WRITES NEVER GO HERE. MCP tools execute server-side, inside the model's turn,
// with no interception point — so exposing a Notion *write* tool through the
// connector would bypass the proposal gate entirely. The allowlist below keeps
// the connector read-only; `create_prd` / `delete_prd` stay as our own custom
// tools, still intercepted and still ✅-gated. This is "MCP the reads, keep the
// gate on the writes" made concrete.
//
// ⚠️ VERIFY BEFORE THE FIRST LIVE CALL: confirm these are the exact read-tool
// names exposed by the hosted Notion MCP, and that NO write tool
// (create-pages, update-page, move-pages, create-comment, create-database,
// update-database, …) is reachable. `default_config.enabled = false` denies
// everything not explicitly allow-listed, so a write tool is safe *by default* —
// but never move a write tool into `configs`. A write tool allow-listed here is
// an ungated write to the real Notion workspace.

import type { Env } from "../types";

/** Beta flag for the Messages API MCP connector (current shape). */
export const MCP_BETA = "mcp-client-2025-11-20" as const;

/** Read-only Notion MCP tools the bot may call autonomously (no gate needed). */
export const NOTION_MCP_READ_TOOLS = ["search", "fetch"] as const;

export interface McpConnector {
  mcpServers: Array<{
    type: "url";
    name: string;
    url: string;
    authorization_token: string;
  }>;
  // One `mcp_toolset` per server, spread into the `tools` array alongside our
  // own TOOLS. `default_config.enabled = false` is the gate-preserving default.
  mcpToolsets: Array<{
    type: "mcp_toolset";
    mcp_server_name: string;
    default_config: { enabled: false };
    configs: Array<{ name: string; enabled: boolean }>;
  }>;
}

/**
 * Build the connector config — but only when BOTH the URL and the OAuth token
 * are set. Unconfigured → `null` → the agent loop runs exactly as before, with
 * no MCP attached. So this ships INERT and is safe to merge before the token is
 * provisioned; one secret + one var flips it on.
 */
export function buildNotionMcp(env: Env): McpConnector | null {
  const url = env.NOTION_MCP_URL?.trim();
  const token = env.NOTION_MCP_TOKEN?.trim();
  if (!url || !token) return null;
  return {
    mcpServers: [
      { type: "url", name: "notion", url, authorization_token: token },
    ],
    mcpToolsets: [
      {
        type: "mcp_toolset",
        mcp_server_name: "notion",
        default_config: { enabled: false }, // deny-all — the gate lives here
        configs: NOTION_MCP_READ_TOOLS.map((name) => ({ name, enabled: true })),
      },
    ],
  };
}
