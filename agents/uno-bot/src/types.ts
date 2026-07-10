export interface Env {
  SLACK_SIGNING_SECRET: string;
  SLACK_BOT_TOKEN: string;
  ANTHROPIC_API_KEY: string;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
  // Turn on the GitHub hosted-MCP read path (api.githubcopilot.com, read-only
  // repos toolset, PAT bearer). "true" → attach it; anything else → stay on the
  // bespoke github_read tool. Kept off until verified live. See agent/mcp.ts.
  GITHUB_MCP_ENABLED?: string;
  SKILLS_BASE_URL: string;
  FIGMA_ACCESS_TOKEN: string;
  NOTION_API_KEY: string;
  NOTION_ROADMAP_DB_ID: string;
  NOTION_TEAM_DB_ID: string;
  // #plus-design — reviewable artifacts (PRs, new PRDs) are announced here for
  // team REVIEW (D5). Optional — unset → no review fan-out.
  PLUS_DESIGN_CHANNEL_ID?: string;
  // #plus-design-feedback — shareout_post posts feedback bundles here (distinct
  // from the reviews channel above). Optional — unset → shareout_post falls back
  // to the origin thread.
  PLUS_DESIGN_FEEDBACK_CHANNEL_ID?: string;
  // Gmail send (D6 connector). All optional — when unset, send_email fails
  // gracefully with a "not configured" error instead of sending.
  GMAIL_SENDER?: string;
  GMAIL_CLIENT_ID?: string;
  GMAIL_CLIENT_SECRET?: string;
  GMAIL_REFRESH_TOKEN?: string;
  // uno-blueprint Supabase (D8 grounding). Read-only. When unset, blueprint_search
  // reports "not configured" so the bot falls back to cited docs instead of
  // fabricating.
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  THREAD_STATE: DurableObjectNamespace;
  // Per-thread agent-run executor: DO alarms escape the waitUntil() 30s
  // wall-clock cancellation that silently killed long agent runs (👀-then-
  // silence, 2026-07-09). See agent-runner.ts.
  AGENT_RUNNER: DurableObjectNamespace;
  // Harness resilience: stores the last fully-successful system-prompt assembly
  // (all 20+ SKILL_PATHS files fetched clean) + the alert-throttle timestamp.
  // Unset → behavior degrades to pre-KV (partial harness on fetch failures, no
  // Slack alert). See agent/skills.ts.
  HARNESS_KV?: KVNamespace;
  // --- Notion hosted-MCP (READS only) — grounding via mcp.notion.com ---------
  // mcp.notion.com is its own OAuth 2.1 server (PKCE + dynamic client
  // registration) — no manual Notion OAuth app and no client secret are needed;
  // the Worker self-registers a public client. Only the redirect URI + KV are
  // required. Unset → the Notion MCP stays off and the bot falls back to the REST
  // notion_* read tools. Writes are NEVER exposed via MCP (they'd bypass the ✅
  // gate) — notion_create/update/archive stay as the bot's own gated tools.
  //
  // The registered client + issued token both live in NOTION_OAUTH_KV.
  NOTION_OAUTH_REDIRECT_URI?: string;
  NOTION_OAUTH_KV?: KVNamespace;

  // --- Supabase hosted-MCP (READS only) — uno-blueprint grounding ------------
  // Personal Access Token (static bearer). The Supabase MCP URL is pinned to
  // read_only=true server-side, so this stays a read path even though the token
  // itself may be broad. Unset → the Supabase MCP server is not attached. NEVER
  // add a Supabase write key here (blueprint writes route to the IDE).
  SUPABASE_MCP_TOKEN?: string;

  // NOTE: Figma has NO hosted-MCP path for the bot — mcp.figma.com is a closed
  // catalog (Claude Code / Cursor / VS Code only; a custom Worker 403s), and the
  // local MCP needs the desktop app. So there are no FIGMA_OAUTH_* vars. The bot
  // surfaces Figma context from Notion + routes real Figma work to the IDE.
  // (FIGMA_ACCESS_TOKEN above still powers implement_design's screenshot fetch.)

  // --- Slack hosted-MCP (read + WRITE) — mcp.slack.com -----------------------
  // Slack has NO dynamic registration → a STATIC pre-registered client is used
  // (client_id is a non-secret [vars] entry, client_secret is a wrangler secret).
  // The issued user token lives in SLACK_OAUTH_KV. Unset → the Slack MCP stays
  // off. Slack is the ONE service attached enable-all (writes intentional).
  SLACK_MCP_CLIENT_ID?: string;
  SLACK_MCP_CLIENT_SECRET?: string;
  SLACK_OAUTH_REDIRECT_URI?: string;
  SLACK_OAUTH_KV?: KVNamespace;
}
