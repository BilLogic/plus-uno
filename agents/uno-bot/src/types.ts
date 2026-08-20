// Slack context threaded into every tool executor: where the run lives + who
// asked. (Moved here from tools/dispatcher.ts, 2026-07-12, so both the tool
// layer and the agent loop reference it without importing the dispatcher.)
export interface SlackContext {
  channel: string;
  threadTs: string;
  userMsgTs: string;
  /** The CONVERSATION's identity — `thread_ts` in a channel, the constant "dm"
   *  in an agent_view DM. Distinct from threadTs, which is only a post target.
   *
   *  It exists here for one reader: the cancel check. `/stop` and the Home-tab
   *  button both record and clear a flag keyed by conversation, and the loop
   *  has to read the SAME key or the flag is set somewhere nothing looks. It
   *  was derived independently in three places and two of them disagreed. */
  conversationTs?: string;
  requestedBy?: string;
  /** Slack's per-event action token, forwarded from the triggering message.
   *  assistant.search.context requires it for BOT-token calls, which is why a
   *  bot-token search cannot run outside an event-driven turn (no cron, no
   *  prefetch). Absent on events that don't carry one — slack_search then falls
   *  through rather than sending an invalid call. */
  actionToken?: string;
  /** Notion PRD reference resolved at proposal time, forwarded to the GitHub
   *  implement/scaffold workflows so codegen gets PRD context. */
  notionPrdId?: string;
  notionPrdUrl?: string;
}

export interface Env {
  SLACK_SIGNING_SECRET: string;
  SLACK_BOT_TOKEN: string;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
  FIGMA_ACCESS_TOKEN: string;
  // Figma library poll (figma-poll.ts, cron-fired). Both optional — unset →
  // the poll logs a skip and does nothing. FIGMA_FILE_KEY is the DS file
  // (non-secret: it's in every shared Figma URL); UNO_BOT_CHANNEL_ID is where
  // the "🎨 Figma Design System Updated" card lands (#uno-bot).
  FIGMA_FILE_KEY?: string;
  UNO_BOT_CHANNEL_ID?: string;
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
  // Channel for operational alerts (capacity/quota outages). Unset → defaults to
  // #uno-bot. See slack/delivery.ts alertCapacity.
  UNO_BOT_ALERT_CHANNEL?: string;
  // Gmail send (D6 connector). All optional — when unset, send_email fails
  // gracefully with a "not configured" error instead of sending.
  GMAIL_SENDER?: string;
  GMAIL_CLIENT_ID?: string;
  GMAIL_CLIENT_SECRET?: string;
  GMAIL_REFRESH_TOKEN?: string;
  // uno-blueprint Supabase (D8 grounding). Read-only. When unset, search_blueprint
  // reports "not configured" so the bot falls back to cited docs instead of
  // fabricating.
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  // Kill-switch for the semantic (vector) blueprint search. Unset/"on" → vector
  // first with keyword fallback; "off" → keyword only (instant rollback via a
  // var change + redeploy). See integrations/blueprint.ts.
  SEMANTIC_SEARCH?: string;
  // Kill-switch for the FUSED retrieval path. Unset/"on" → one call to
  // public.blueprint_hybrid_search (vector + prose + structural-name, fused by
  // reciprocal rank); "off" → the old semantic → rpc → tables ladder, kept for
  // exactly one release as the rollback. See integrations/blueprint.ts.
  BLUEPRINT_HYBRID?: string;
  // Public base URL of the uno-blueprint app. Every cell/slice row the bot
  // returns carries a deep link built from this, so an answer in Slack or the
  // IDE can be opened at the exact cell it cites. Unset → rows carry no url
  // (the answer is still grounded, just not clickable).
  BLUEPRINT_APP_URL?: string;
  // Attach the LIVE blueprint index (phases → scenarios → paths) to every
  // search_blueprint result, plus an `orientation` status field. "on" to enable;
  // anything else (including unset) = off.
  //
  // FLAGGED OFF BY DEFAULT on purpose. Tool-payload instructions are not
  // additive: on 2026-08-06 a slack_search fix displaced an unrelated
  // instruction and broke a different eval case. This one is enabled in ONE DM
  // first, and the judged evals are compared CASE BY CASE (a stable total hides
  // one case breaking as another recovers) before it goes wide.
  BLUEPRINT_INDEX?: string;
  THREAD_STATE: DurableObjectNamespace;
  // Per-thread agent-run executor: DO alarms escape the waitUntil() 30s
  // wall-clock cancellation that silently killed long agent runs (👀-then-
  // silence, 2026-07-09). See agent-runner.ts.
  AGENT_RUNNER: DurableObjectNamespace;
  // Harness resilience: stores the last fully-successful system-prompt assembly
  // + the alert-throttle timestamp. (The harness itself is now baked into the
  // Worker bundle at build time — src/generated/harness.ts — so serving it costs
  // zero subrequests; this KV is the fallback/alert path. See agent/skills.ts.)
  /** Tier models on the Gemini lane. The tier IS the model now; the thinking
   *  dial is pinned to medium. GEMINI_MODEL remains the `default` tier so
   *  existing config keeps working. GEMINI_GRIND_MODEL is separate from
   *  GEMINI_FALLBACK_MODEL on purpose — one is "the capable model", the other
   *  is "what we fall back to when the primary fails". */
  GEMINI_CHILL_MODEL?: string;
  GEMINI_GRIND_MODEL?: string;

  HARNESS_KV?: KVNamespace;
  /** "on" enables chat.startStream for the agent surface. OFF by default:
   *  Slack returns invalid_arguments for this app even with thread_ts +
   *  recipient_user_id + recipient_team_id (r34–r37, 2026-08-06), and each
   *  attempt burns one of the 50 subrequests an invocation gets. The thinking
   *  indicator is served by assistant.threads.setStatus instead. Flip to "on"
   *  to retest once the argument shape is known. */
  SLACK_STREAMING?: string;
  /** "on" opens the turn's stream UP FRONT in `task_display_mode: "plan"` and
   *  routes the between-tool narration into it as task cards, instead of
   *  posting them as loose :hourglass: messages. Off by default: an early
   *  stream is only honest in plan mode (with plain text it renders an empty
   *  bubble for the whole run — tried and reverted), so if Slack renders the
   *  cards differently than expected the artifact is on every turn. */
  SLACK_STREAM_PLAN?: string;
  /** "on" swaps the hand-rolled 👍/👎 `actions` row for Slack's native
   *  `context_actions` block (`feedback_buttons` + an `icon_button` delete).
   *  Off by default only because an invalid block degrades SILENTLY here —
   *  delivery falls back to plain text, which would drop the footer from every
   *  answer while looking fine. Verify once on a real answer, then default it. */
  SLACK_NATIVE_FEEDBACK?: string;
  /** "on" enables Phase 5 context management: the derived {goal, constraints,
   *  decisions, artifacts} block, progressive summarisation of long histories,
   *  and drift detection. OFF by default and gated on case-by-case judged-eval
   *  comparison — it changes what the model sees on EVERY turn, and its failure
   *  mode is subtly worse answers rather than an error. See context-state.ts. */
  CONTEXT_STATE?: string;

  // --- Slack login (user token for slack_search) -----------------------------
  // slack_search calls Slack's search Web API, which REJECTS bot tokens, so it
  // needs a user (xoxp) token issued via a one-time OAuth consent. Slack has no
  // dynamic client registration → a STATIC pre-registered client is used
  // (SLACK_MCP_CLIENT_ID is a non-secret [vars] entry; SLACK_MCP_CLIENT_SECRET
  // is a wrangler secret). The issued user token lives in SLACK_OAUTH_KV. Unset
  // → slack_search reports "not configured". All bot writes (messages,
  // reactions) go through SLACK_BOT_TOKEN and post as uno-bot.
  SLACK_MCP_CLIENT_ID?: string;
  SLACK_MCP_CLIENT_SECRET?: string;
  SLACK_OAUTH_REDIRECT_URI?: string;
  SLACK_OAUTH_KV?: KVNamespace;
  // Visibility firewall for slack_search (tools/slack-search.ts): comma-
  // separated PRIVATE channel IDs whose content is team-designated as fair
  // game. Everything else private, and all DMs/group DMs, is hard-dropped by
  // the Worker before the model sees search results. Empty/unset → public only.
  SLACK_SEARCH_PRIVATE_ALLOWLIST?: string;
  // --- Model provider adapter ------------------------------------------------
  // MODEL_PROVIDER selects the runtime brain: "gemini" (DEFAULT / production) |
  // "vertex-claude" (Claude via Google Vertex AI, billed to the GCP project).
  // Flipping it is the whole switch — see agent/run-agent.ts.
  MODEL_PROVIDER?: string;
  // Gemini auth mode auto-selected by which credential exists (gemini/client.ts).
  // RULE (2026-07-16, ADR-018): the Vertex service-account pair (GEMINI_SA_EMAIL
  // + GEMINI_SA_PRIVATE_KEY + GEMINI_PROJECT_ID) is canonical and takes
  // precedence; it ALSO powers the Vertex-Claude lane (vertex/claude.ts) — same
  // token. GEMINI_API_KEY (AI Studio) is a local-dev fallback only — never set
  // it on the Worker.
  GEMINI_API_KEY?: string;
  GEMINI_SA_EMAIL?: string;
  GEMINI_SA_PRIVATE_KEY?: string;
  GEMINI_PROJECT_ID?: string; // Vertex only, e.g. "hcii-plus"
  // Backup model for the one-shot mid-turn failover when the active model
  // returns a capacity/availability error (404/429/500/503) — see
  // agent/gemini-agent.ts. Default "gemini-2.5-pro" (separate quota pool from
  // the flash models, probed healthy during the 2026-07-16 quota incident).
  GEMINI_FALLBACK_MODEL?: string;
  GEMINI_REGION?: string; // Vertex only; default "global"
  GEMINI_MODEL?: string; // default "gemini-3.6-flash"
  // Vertex-Claude model id for the default lane (chill/grind are fixed in
  // routing.ts). Optional — defaults to MODELS.default ("claude-sonnet-5").
  CLAUDE_MODEL?: string;

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
