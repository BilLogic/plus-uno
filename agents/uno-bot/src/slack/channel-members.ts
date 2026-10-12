// Who may decide a card a job posts: the channel's members, read in pages.
// Shared by every Worker-posted report — the library publish card, the DS
// precedence report, the Figma comment decisions, the tidy-up and the Dev
// Mode links.

import type { Env } from "../types";
import { conversationsMembers } from "./api";

/** Pages of 200 members — a channel of up to 600 people. */
const MEMBER_PAGES = 3;

/**
 * A channel's member ids, or null when Slack would not say — or when there are
 * more than the pages read, since a card must not quietly leave out anyone who
 * may decide it. The design-ops team is whoever is in #plus-universal.
 *
 * @param env - Worker bindings
 * @param channel - The channel
 */
export async function channelMembers(env: Env, channel: string): Promise<string[] | null> {
  const ids: string[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MEMBER_PAGES; page++) {
    const res = await conversationsMembers(env, channel, 200, cursor).catch(() => null);
    if (!res?.ok) return null;
    ids.push(...(res.members ?? []));
    cursor = res.response_metadata?.next_cursor || undefined;
    if (!cursor) return ids;
  }
  console.error(`[slack] ${channel} has more than ${MEMBER_PAGES * 200} members`);
  return null;
}

