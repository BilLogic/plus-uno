// The slack_search visibility firewall, as a PURE FUNCTION of
// (mode, raw assistant.search.context payload) → emitted results.
//
// It lives apart from the transport so it can be unit-tested against recorded
// payloads (npm test). Every finding that killed the first draft of this change
// is a property of this function, not of the fetch around it:
//
//   • assistant.search.context returns FLAT channel_id / channel_name and NO
//     privacy booleans. The old filter discriminated on m.channel.is_private /
//     is_im / is_mpim / is_group — on this payload m.channel is undefined, every
//     flag reads falsy, and every hit passes. Privateness is UNKNOWABLE from the
//     response, so it cannot be a client-side test. It is pinned server-side per
//     mode via channel_types (see slack-search.ts), and what remains here is a
//     POSITIVE id test: deny on unknown, never pass on unknown.
//   • `own` used to be a boolean whose true branch skipped the filter AND
//     stamped visibility: "requester-own" — a security label, not telemetry.
//     It is now a non-optional mode with an exhaustive switch whose default
//     is DROP.
//   • Context messages never inherit their hit's clearance: an entry is kept
//     only when it carries a channel_id equal to the hit's. Slack's context
//     entries carry no channel_id at all, so today that means "none" — which is
//     why the caller also asks for include_context_messages=false. Both halves
//     stay: the request is the policy, this is the enforcement.

/**
 * One search pass. Not one credential — the legacy token runs two passes
 * (public pinned, then private id-tested) because the API cannot express
 * "public OR these nine private channels" in a single call.
 */
export type SearchMode = "own" | "legacy-public" | "legacy-private" | "bot";

export interface ContextEntry {
  channel_id?: string;
  text?: string;
  ts?: string;
  user_id?: string;
}

export interface ContextSearchMessage {
  channel_id?: string;
  channel_name?: string;
  author_name?: string;
  message_ts?: string;
  content?: string;
  permalink?: string;
  context_messages?: { before?: ContextEntry[]; after?: ContextEntry[] };
}

export interface SearchContextPayload {
  ok?: boolean;
  error?: string;
  results?: { messages?: ContextSearchMessage[] };
  response_metadata?: { next_cursor?: string };
}

export interface EmittedHit {
  channel: string;
  from?: string;
  ts?: string;
  link: string;
  text: string;
  /** Present only when Slack returned same-channel context. Never citable —
   *  context entries carry no permalink. */
  context?: { text: string; ts?: string }[];
}

export interface Selection {
  results: EmittedHit[];
  /** Hits the firewall refused: out-of-allowlist, or unidentifiable. */
  dropped: number;
}

const TEXT_CAP = 400;

/** Does this mode admit this hit? Exhaustive; the default is DROP. */
function admits(mode: SearchMode, channelId: string, allowlist: ReadonlySet<string>): boolean {
  switch (mode) {
    case "own":
      // The token IS the requester's visibility and the ask arrived in their own
      // bot DM (surface-gated by the caller). Nothing here they can't already read.
      return true;
    case "legacy-public":
    case "bot":
      // channel_types was pinned to public_channel server-side. An id we cannot
      // read is still refused — the test is positive, not "no reason to drop".
      return channelId.length > 0;
    case "legacy-private":
      // The only private content the legacy token may surface is the team's
      // explicit allowlist (env.SLACK_SEARCH_PRIVATE_ALLOWLIST).
      return allowlist.has(channelId);
    default:
      return false;
  }
}

/** Context inherits nothing: same channel id, or it is dropped. */
function sameChannelContext(hit: ContextSearchMessage): { text: string; ts?: string }[] | undefined {
  const channelId = hit.channel_id ?? "";
  const entries = [...(hit.context_messages?.before ?? []), ...(hit.context_messages?.after ?? [])]
    .filter((e) => !!e.channel_id && e.channel_id === channelId && !!e.text)
    .map((e) => ({ text: (e.text ?? "").slice(0, TEXT_CAP), ts: e.ts }));
  return entries.length > 0 ? entries : undefined;
}

/**
 * Apply the firewall to one raw payload.
 *
 * @param mode       - which pass this is; decides what may pass at all
 * @param payload    - the parsed assistant.search.context body
 * @param allowlist  - private channel ids the team has cleared (legacy-private)
 * @param cap        - max hits emitted from this pass
 */
export function selectHits(
  mode: SearchMode,
  payload: SearchContextPayload,
  allowlist: ReadonlySet<string>,
  cap = 12,
): Selection {
  const messages = payload.results?.messages ?? [];
  const results: EmittedHit[] = [];
  let dropped = 0;

  for (const m of messages) {
    const channelId = typeof m.channel_id === "string" ? m.channel_id : "";
    if (!admits(mode, channelId, allowlist)) {
      dropped++;
      continue;
    }
    // A hit we cannot link is a hit the model cannot cite. Asserted, not
    // optional-chained into a citation-less quote.
    if (typeof m.permalink !== "string" || m.permalink.length === 0) {
      dropped++;
      continue;
    }
    if (results.length >= cap) continue;
    results.push({
      channel: m.channel_name ? `#${m.channel_name}` : channelId,
      from: m.author_name,
      ts: m.message_ts,
      link: m.permalink,
      text: (m.content ?? "").slice(0, TEXT_CAP),
      // Allowlisted-private hits stay hits-only: the allowlist was calibrated
      // when only the matching line surfaced, not its surroundings.
      ...(mode === "legacy-private" ? {} : { context: sameChannelContext(m) }),
    });
  }

  return { results, dropped };
}
