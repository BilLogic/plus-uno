export interface Env {
  SLACK_SIGNING_SECRET: string;
  SLACK_BOT_TOKEN: string;
  ANTHROPIC_API_KEY: string;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
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
  // --- Notion hosted-MCP (READS only) — grounding via mcp.notion.com ---------
  // OAuth app credentials (client id is a [vars] entry; the secret is a wrangler
  // secret). Unset → the Notion MCP stays off and the bot falls back to the REST
  // notion_* read tools. Writes are NEVER exposed via MCP (they'd bypass the ✅
  // gate) — notion_create/update/archive stay as the bot's own gated tools.
  NOTION_OAUTH_CLIENT_ID?: string;
  NOTION_OAUTH_CLIENT_SECRET?: string;
  // Must exactly match the redirect entered in the Notion OAuth app, e.g.
  // https://uno-bot.bryanhuang628.workers.dev/oauth/notion/callback
  NOTION_OAUTH_REDIRECT_URI?: string;
  // KV namespace holding the exchanged Notion access token (+ refresh token if
  // Notion issues a rotating one). Bound in wrangler.toml.
  NOTION_OAUTH_KV?: KVNamespace;
}
