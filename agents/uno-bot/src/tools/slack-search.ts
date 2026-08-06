// slack_search — workspace message search behind a VISIBILITY FIREWALL.
//
// Transport is assistant.search.context (Slack's Real-time Search API). Slack
// says explicitly not to use the legacy search.messages: its search:read scope
// cannot exclude DMs, which is why the granular scopes exist.
//
// Three credential modes (ADR-020, extended 2026-08-05). Order is by REACH,
// not by trust — each one's firewall is stated where it is enforced:
//
//   OWN token (requester consented at /oauth/slack/start) + the ask arrives in
//   the requester's own DM with the bot → results carry the requester's own
//   Slack visibility: their DMs, group DMs, and private channels pass. This is
//   physics, not policy — a user token can only see conversations its owner is
//   part of. Own-visibility NEVER activates outside the requester's bot DM: in
//   shared channels a passer-by could read what the bot quotes.
//
//   LEGACY workspace token (single consenting admin) → that token's visibility
//   is NOT the requester's, so it runs TWO pinned passes: public_channel (all
//   pass) and private_channel (only env.SLACK_SEARCH_PRIVATE_ALLOWLIST ids
//   pass). Two passes because the API cannot express "public OR these nine"
//   in one call, and because privateness is unknowable from the response —
//   a single mixed call could only fail open.
//
//   BOT token (install-time, no consent anywhere) → public channels only, and
//   that is a SCOPE fact, not a filter: search:read.im/.mpim/.private are
//   deliberately absent from the bot block of slack-app-manifest.yaml. This is
//   the floor — what answers a public-channel question when nothing is stored.
//   It requires an action_token from the triggering event, so it cannot run
//   outside an event-driven turn (no cron, no prefetch).
//
// The model cannot surface what it never receives. What passes the firewall is
// decided by selectHits() in slack-search-filter.ts — pure, and unit-tested.

import type { Env, SlackContext } from "../types";
import { slackConnectUrl } from "../oauth/slack";
import {
  slackSearchCredentials,
  type SearchCredentialKind,
} from "../slack/search-credential";
import { countedFetch, rethrowIfBudget } from "../net";
import {
  selectHits,
  type EmittedHit,
  type SearchContextPayload,
  type SearchMode,
} from "./slack-search-filter";

// Slack errors that mean THIS CREDENTIAL is spent — the token is dead, not the
// query. Anything outside this set (bad query, rate limit, server fault) is a
// real failure and must not be retried against a narrower credential, which
// would silently answer from less than the caller asked for.
const AUTH_ERRORS: ReadonlySet<string> = new Set([
  "token_revoked",
  "invalid_auth",
  "not_authed",
  "account_inactive",
  "token_expired",
  "missing_scope",
]);

const SEARCH_URL = "https://slack.com/api/assistant.search.context";
const MAX_HITS = 12;

/** One pinned pass. channel_types is the server-side half of the firewall. */
async function searchPass(
  token: string,
  query: string,
  channelTypes: string,
  actionToken?: string,
): Promise<SearchContextPayload> {
  const params = new URLSearchParams({
    query,
    limit: "20",
    channel_types: channelTypes,
    content_types: "messages",
    highlight: "false",
    // Context messages carry no permalink and no channel id, so they can be
    // neither cited nor cleared. Off at the request, and dropped again in
    // selectHits if Slack ever sends them anyway.
    include_context_messages: "false",
    // Semantic search triggers on question-shaped queries and adds latency we
    // cannot predict; keyword timing is the one we budget for.
    disable_semantic_search: "true",
    ...(actionToken ? { action_token: actionToken } : {}),
  });
  const res = await countedFetch(SEARCH_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body: params.toString(),
  });
  return (await res.json()) as SearchContextPayload;
}

export async function executeSlackSearch(
  env: Env,
  input: Record<string, unknown>,
  slack?: SlackContext,
): Promise<string> {
  const query = typeof input.query === "string" ? input.query.trim() : "";
  if (!query) return JSON.stringify({ ok: false, error: "missing query" });

  // Own-visibility is surface-gated: only in the requester's own bot DM.
  const inOwnDm = Boolean(slack?.channel?.startsWith("D"));
  const requester = inOwnDm ? slack?.requestedBy : undefined;
  const credentials = await slackSearchCredentials(env, requester);
  // A bot-token search is invalid without the triggering event's action_token,
  // so that candidate only counts when we actually carry one.
  const actionToken = slack?.actionToken;
  const viable = credentials.filter((c) => c.kind !== "bot" || !!actionToken);
  if (viable.length === 0) {
    return JSON.stringify({
      ok: false,
      error:
        credentials.length > 0
          ? "workspace search unavailable (bot search needs the triggering event's action_token, which this turn did not carry) — use thread/channel reads instead"
          : "workspace search unavailable (no search credential stored) — use thread/channel reads instead",
    });
  }

  const allowlist = new Set(
    (env.SLACK_SEARCH_PRIVATE_ALLOWLIST ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  // Which passes a credential runs, and what each pass may emit.
  const passesFor = (kind: SearchCredentialKind): { mode: SearchMode; channelTypes: string }[] =>
    kind === "own"
      ? [{ mode: "own", channelTypes: "public_channel,private_channel,mpim,im" }]
      : kind === "legacy"
        ? [
            { mode: "legacy-public", channelTypes: "public_channel" },
            ...(allowlist.size > 0
              ? [{ mode: "legacy-private" as SearchMode, channelTypes: "private_channel" }]
              : []),
          ]
        : [{ mode: "bot", channelTypes: "public_channel" }];

  try {
    // Walk the chain. A credential that fails AUTH is spent, not fatal: drop to
    // the next rung. Anything else is a real search failure and stops here.
    //
    // Without this the ladder was upside down — the first viable credential was
    // the only one ever tried, so a revoked token took search DOWN instead of
    // narrowing it to public-only, and storing MORE credentials made the tool
    // MORE fragile. That is what turned the 2026-08-06 app reinstall (which
    // revokes every stored user token) into an outage rather than a degradation.
    let lastAuthError: string | null = null;

    for (const c of viable) {
      const passes = passesFor(c.kind);
      const results: EmittedHit[] = [];
      let dropped = 0;
      let authError: string | null = null;
      let hardError: string | null = null;

      for (const pass of passes) {
        const data = await searchPass(
          c.token,
          query,
          pass.channelTypes,
          c.kind === "bot" ? actionToken : undefined,
        );
        if (!data.ok) {
          const err = data.error ?? "search failed";
          if (AUTH_ERRORS.has(err)) authError = err;
          else hardError = err;
          break;
        }
        const selected = selectHits(pass.mode, data, allowlist, MAX_HITS - results.length);
        results.push(...selected.results);
        dropped += selected.dropped;
      }

      if (authError) {
        // Note the rung by name: "which credential died" is the first question
        // when search degrades, and it is invisible from the reply alone.
        console.warn(`[slack-search] ${c.kind} credential rejected (${authError}) — trying next rung`);
        lastAuthError = authError;
        continue;
      }
      // A failed pass is a failed search: reporting the survivors as if they
      // were the whole answer is the false-absence failure this tool exists
      // to avoid. Only auth failures fall through — a bad query must not
      // silently re-run against a narrower credential and look successful.
      if (hardError) return JSON.stringify({ ok: false, error: hardError });

      // Consent nudge: in their own DM without a connected token, tell the model
      // the requester can widen coverage themselves (the link is user-facing).
      const connectUrl = slackConnectUrl(env);
      const connectNote =
        inOwnDm && c.kind !== "own" && connectUrl
          ? `these results do not cover DMs or un-allowlisted private channels. The requester can connect their own Slack history — searches here will then cover everything they can see — at ${connectUrl}`
          : undefined;

      const visibility =
        c.kind === "own"
          ? "requester-own (their DMs/private included)"
          : c.kind === "legacy"
            ? "workspace-filtered (public + team-allowlisted private)"
            : "public-only (no user credential — public channels are the whole search)";

      return JSON.stringify({
        ok: true,
        query,
        visibility,
        // Zero results must not read as "nothing exists": searched_surfaces says
        // what was actually looked at, so an empty list can be reported honestly
        // as "nothing in what I can see" rather than "nothing".
        searched_surfaces: passes.map((p) => p.channelTypes).join(","),
        results,
        // The model is told results are pre-cleared; the count of withheld hits
        // lets it say "there were matches in spaces I can't surface" honestly
        // without knowing anything about them.
        withheld_private_matches: dropped,
        ...(connectNote ? { note: connectNote } : {}),
      });
    }

    // Every rung rejected us. Say so plainly — this is a credential problem an
    // admin must fix, not an empty result, and the model must not report it as
    // "nothing found".
    return JSON.stringify({
      ok: false,
      error: `workspace search unavailable — every stored credential was rejected by Slack (${lastAuthError ?? "auth failed"}). Stored tokens are likely revoked; re-consent at /oauth/slack/start. Use thread/channel reads instead.`,
    });
  } catch (err) {
    // A budget stop is not an empty result. Flattening it to {ok:false} told the
    // model the search ran and found nothing.
    rethrowIfBudget(err);
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
