// Shaping the slack_search payload — the part that decides what the MODEL is
// allowed to know, as distinct from what the search found.
//
// Split out of slack-search.ts because two live eval failures (S1, S2, judged
// run 2026-08-06 against r47) were both response-shape bugs, and neither was
// reachable by a unit test while this logic sat inside the network path.
//
// S2, the serious one. In a PUBLIC CHANNEL the bot said:
//
//   "…didn't find any mention of a migration deadline — though there were 6
//    matches in private spaces that were withheld by the visibility firewall
//    and that I can't surface."
//
// The COUNT is the leak. Confirming that six private messages exist about a
// named topic is disclosure to everyone in the channel, even with no content
// attached. `withheld_private_matches` was designed for the requester's own DM,
// where "there are matches I can't show you" is useful and safe; it was sent
// everywhere, so the model narrated it in a channel. slack-search.ts's own
// header states the principle this broke: "The model cannot surface what it
// never receives." The fix is to stop sending it, not to ask the model nicely.
//
// S1: a zero-result search was reported as "No, no one in Slack has mentioned
// a hard deadline" — an absolute claim about Slack, from a search of public
// channels only. The scope was in the reply, but after the verdict, which is
// too late to be the verdict.

export interface SearchResponseInput {
  query: string;
  visibility: string;
  searchedSurfaces: string;
  results: unknown[];
  /** Hits the firewall dropped. Only ever disclosed in the requester's own DM. */
  dropped: number;
  /** True when the ask arrived in the requester's own DM with the bot. */
  inOwnDm: boolean;
  connectNote?: string;
}

export function buildSearchResponse(input: SearchResponseInput): Record<string, unknown> {
  const { query, visibility, searchedSurfaces, results, dropped, inOwnDm, connectNote } = input;

  const body: Record<string, unknown> = {
    ok: true,
    query,
    visibility,
    // Zero results must not read as "nothing exists": searched_surfaces says
    // what was actually looked at, so an empty list can be reported honestly as
    // "nothing in what I can see" rather than "nothing".
    searched_surfaces: searchedSurfaces,
    results,
  };

  // The withheld COUNT is disclosure. In the requester's own DM it is a useful
  // honesty signal — "there were matches in spaces I can't surface". Anywhere
  // else it tells a room that private material exists on a named topic, which
  // is the ADR-020 surface gate stated in terms of metadata instead of content.
  if (inOwnDm && dropped > 0) {
    body.withheld_private_matches = dropped;
  }

  // Zero results are where absence gets overclaimed, so the instruction ships
  // WITH the empty result rather than living only in the tool description,
  // where it competes with everything else for the model's attention.
  //
  // The connect nudge is folded into the SAME string when both apply. Shipped
  // as two sibling fields they compete, and the model does one: adding
  // absence_scope alone regressed S3 (the unconsented-in-own-DM case) from pass
  // to 2/3 in the very run where it fixed S1 — it scoped the absence and
  // dropped the connect link. One instruction, both obligations.
  if (results.length === 0) {
    body.absence_scope =
      `No matches in: ${searchedSurfaces}. This is an absence IN WHAT WAS SEARCHED, not an absence in Slack. ` +
      `Say what was searched in the same breath as the finding — "nothing in the public channels I can see" — never a bare "no one has mentioned this".` +
      (connectNote ? ` THEN, in the same reply, say their own DMs and private channels were NOT searched and offer the connect link: ${connectNote}` : "");
  }

  // Still sent separately: a non-empty result needs the nudge too, and there
  // is no absence to scope in that case.
  if (connectNote) body.note = connectNote;
  return body;
}
