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
  // DS Component PRDs database (feature PRDs → Roadmap; DS-component PRDs → here).
  // Optional — when unset, create_prd(prd_type:"ds-component") falls back to the
  // Roadmap board and logs a note.
  NOTION_DS_COMPONENT_DB_ID?: string;
  // Channel that reviewable artifacts (PRs, new PRDs) are announced to for team
  // review (D5 communication routing). Optional — when unset, no fan-out happens
  // and replies stay in-thread.
  PLUS_DESIGN_CHANNEL_ID?: string;
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
  // Notion hosted-MCP connector (Path B — read-only grounding via the MCP
  // connector on the Anthropic API call). BOTH must be set for the connector to
  // attach; unset → the loop runs without MCP (inert). The token is an OAuth
  // bearer for mcp.notion.com (NOT the ntn_ REST integration key — that stays
  // NOTION_API_KEY for the gated write tools). See src/agent/mcp.ts.
  NOTION_MCP_URL?: string;
  NOTION_MCP_TOKEN?: string;
  THREAD_STATE: DurableObjectNamespace;
}
