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
  // Research & notes database — notion_create(surface:"research") files findings
  // / study guides here. Optional — unset → that surface reports "not configured".
  NOTION_RESEARCH_DB_ID?: string;
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
}
