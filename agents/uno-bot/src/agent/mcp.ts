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
import { getSlackAccessToken } from "../oauth/slack";

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

// ─── Supabase (Personal Access Token bearer; read_only enforced by the URL) ──
// The URL pins read_only=true + a specific project_ref + a fixed feature set, so
// the server itself REFUSES writes (execute_sql is SELECT-only under read_only).
// Still, we allowlist an explicit READ toolset as defense-in-depth. No write key
// is ever configured — blueprint writes route to the IDE.
const SUPABASE_SERVER = "supabase";
const SUPABASE_URL =
  "https://mcp.supabase.com/mcp?read_only=true&project_ref=osybxeojvsqcwxkgnalm&features=database,docs,debugging";
const SUPABASE_MCP_READ_TOOLS = [
  "list_tables",
  "list_extensions",
  "list_migrations",
  "execute_sql", // SELECT-only under read_only=true
  "search_docs",
  "get_advisors",
  "list_edge_functions",
];

// ─── Figma — intentionally NOT attached ──────────────────────────────────────
// Figma's hosted MCP (mcp.figma.com) is a CLOSED CATALOG: only Figma-approved
// client apps (Claude Code, Cursor, VS Code, Xcode, Codex) can connect — a custom
// Worker gets 403 at registration (verified live + confirmed in Figma's docs). The
// local/desktop MCP needs the Figma app running on the same machine (127.0.0.1),
// which a serverless Worker doesn't have. So the bot has NO Figma MCP. It surfaces
// Figma context from Notion (where the links live) and routes real Figma work to
// the IDE — where Claude Code IS a catalog client. (FIGMA_ACCESS_TOKEN is still
// used elsewhere for implement_design's screenshot fetch.)

// ─── Slack (OAuth 2.1 user token in KV; READ-ONLY allowlist) ──────────────────
// The Slack hosted MCP only supports USER-token OAuth, so every write through it
// posts AS THE CONSENTING HUMAN (it showed as "Bill Guo" live, 2026-07-10) — and
// the team decision is that everything visible from the bot must carry the
// uno-bot identity. So: MCP = reads only (where the user token is irreplaceable —
// Slack search APIs don't work with bot tokens at all); ALL writes (messages,
// reactions, canvases) go through the Worker's own SLACK_BOT_TOKEN paths
// (postMessage / addReaction / the slack_react tool), which post as uno-bot.
const SLACK_SERVER = "slack";
const SLACK_URL = "https://mcp.slack.com/mcp";
const SLACK_MCP_READ_TOOLS = [
  "slack_search_public",
  "slack_search_public_and_private",
  "slack_search_channels",
  "slack_search_users",
  "slack_search_emojis",
  "slack_read_channel",
  "slack_read_thread",
  "slack_read_canvas",
  "slack_read_file",
  "slack_read_user_profile",
  "slack_get_reactions",
  "slack_list_channel_members",
];

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

  // Supabase — active when SUPABASE_MCP_TOKEN is set. read_only URL + a READ
  // allowlist (defense-in-depth). Static PAT bearer, no OAuth flow.
  if (env.SUPABASE_MCP_TOKEN) {
    servers.push({
      type: "url",
      url: SUPABASE_URL,
      name: SUPABASE_SERVER,
      authorization_token: env.SUPABASE_MCP_TOKEN,
    });
    const configs: Record<string, { enabled: true }> = {};
    for (const t of SUPABASE_MCP_READ_TOOLS) configs[t] = { enabled: true };
    toolsets.push({
      type: "mcp_toolset",
      mcp_server_name: SUPABASE_SERVER,
      default_config: { enabled: false }, // allowlist: everything off, then read tools on
      configs,
    });
  }

  // Figma — deliberately absent (see the note above): closed catalog + no desktop.

  // Slack — active once the one-time OAuth consent has stored a user token in KV.
  // READ allowlist only: MCP writes would post as the consenting human, not as
  // uno-bot (user tokens are the only auth the Slack MCP supports) — see the
  // note above. Writes stay on the Worker's bot-token paths.
  const slackToken = await getSlackAccessToken(env);
  if (slackToken) {
    servers.push({ type: "url", url: SLACK_URL, name: SLACK_SERVER, authorization_token: slackToken });
    const configs: Record<string, { enabled: true }> = {};
    for (const t of SLACK_MCP_READ_TOOLS) configs[t] = { enabled: true };
    toolsets.push({
      type: "mcp_toolset",
      mcp_server_name: SLACK_SERVER,
      default_config: { enabled: false }, // allowlist: everything off, then read tools on
      configs,
    });
  }

  return { servers, toolsets };
}
