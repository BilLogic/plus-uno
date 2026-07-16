// Slack context threaded into every tool executor: where the run lives + who
// asked. (Moved here from tools/dispatcher.ts, 2026-07-12, so both the tool
// layer and the agent loop reference it without importing the dispatcher.)
export interface SlackContext {
  channel: string;
  threadTs: string;
  userMsgTs: string;
  requestedBy?: string;
  /** Notion PRD reference resolved at proposal time, forwarded to the GitHub
   *  implement/scaffold workflows so codegen gets PRD context. */
  notionPrdId?: string;
  notionPrdUrl?: string;
}

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
  /** Decisions DB under Design HQ — notion_create surface "decision" + search scope. */
  NOTION_DECISIONS_DB_ID?: string;
  // "Third Party Applications" DB — read-only directory (Application Name /
  // Application Admin / Power Users) that notion_search scope:"apps" queries
  // for access-request ROUTING (who to ask for access; the grant stays human).
  // Optional — unset → the apps scope reports "not configured".
  NOTION_APPS_DB_ID?: string;
  /** Tutor Help Center Content — notion_search scope "help_tutors". */
  NOTION_HELP_TUTORS_DB_ID?: string;
  /** Teacher Help Center Articles — notion_search scope "help_teachers". */
  NOTION_HELP_TEACHERS_DB_ID?: string;
  /** Prototype Marketplace — notion_search scope "marketplace". */
  NOTION_MARKETPLACE_DB_ID?: string;
  /** Design Running Notes — notion_search scope "running_notes". */
  NOTION_RUNNING_NOTES_DB_ID?: string;
  /** News (Content HQ) — notion_search scope "news". */
  NOTION_NEWS_DB_ID?: string;
  /** Success Stories — notion_search scope "success_stories". */
  NOTION_SUCCESS_STORIES_DB_ID?: string;
  /** Research Papers — notion_search scope "research_papers". */
  NOTION_RESEARCH_PAPERS_DB_ID?: string;
  /** Banners — notion_search scope "banners". */
  NOTION_BANNERS_DB_ID?: string;
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
  // off (reads-only allowlist; writes go through the bot token).
  SLACK_MCP_CLIENT_ID?: string;
  SLACK_MCP_CLIENT_SECRET?: string;
  SLACK_OAUTH_REDIRECT_URI?: string;
  SLACK_OAUTH_KV?: KVNamespace;
  // Visibility firewall for slack_search (tools/slack-search.ts): comma-
  // separated PRIVATE channel IDs whose content is team-designated as fair
  // game. Everything else private, and all DMs/group DMs, is hard-dropped by
  // the Worker before the model sees search results. Empty/unset → public only.
  SLACK_SEARCH_PRIVATE_ALLOWLIST?: string;
  // --- Gemini provider (dual-provider adapter, phase 1) ----------------------
  // MODEL_PROVIDER selects the runtime brain: "anthropic" (default) | "gemini".
  // Phase 1 ships the credential layer + /debug/gemini smoke test only; the
  // agent loop stays on Anthropic until the phase-2 adapter PR.
  MODEL_PROVIDER?: string;
  // Auth mode auto-selected by which credential exists (see gemini/client.ts).
  // RULE (2026-07-16): the Vertex service-account pair (GEMINI_SA_EMAIL +
  // GEMINI_SA_PRIVATE_KEY) is canonical and takes precedence. GEMINI_API_KEY
  // (AI Studio) is a local-dev fallback only — never set it on the Worker.
  GEMINI_API_KEY?: string;
  GEMINI_SA_EMAIL?: string;
  GEMINI_SA_PRIVATE_KEY?: string;
  GEMINI_PROJECT_ID?: string; // Vertex only, e.g. "hcii-plus"
  GEMINI_REGION?: string; // Vertex only; default "global"
  GEMINI_MODEL?: string; // default "gemini-3.5-flash"

  // --- Operational guards ----------------------------------------------------
  // Shared secret gating the /debug/* routes (they trigger a live model call
  // and credentialed MCP handshakes, so they must not be public). Unset → the
  // debug routes return 404. Set via `wrangler secret put DEBUG_TOKEN` and pass
  // it as the `x-debug-token` header. See src/index.ts.
  DEBUG_TOKEN?: string;
  // email_send authorization (defense beyond the requester-identity gate):
  // EMAIL_AUTHORIZED_USERS = comma-separated Slack user IDs allowed to trigger
  // outward email; EMAIL_ALLOWED_DOMAINS = comma-separated recipient domains
  // (e.g. "andrew.cmu.edu,tutor.plus"). Unset → email_send stays available to
  // any requester / any recipient (legacy behavior). See tools/send-email.ts.
  EMAIL_AUTHORIZED_USERS?: string;
  EMAIL_ALLOWED_DOMAINS?: string;
}
