// Who may decide a card a job posts: the channel's members, read in pages.
// Shared by every Worker-posted report — the Dev Mode links card, the DS
// precedence report, the Figma comment decisions, the tidy-up and the Dev
// Mode links.

import type { Env } from "../types";
import { conversationsMembers } from "./api";
import { standingConfirmersOf } from "./standing-confirmers";

/** Pages of 200 members — a channel of up to 600 people. */
export const MEMBER_PAGES = 3;

/**
 * A channel's member ids, or null when Slack would not say — or when there are
 * more than the pages read, since a card must not quietly leave out anyone who
 * may decide it. The design-ops team is whoever is in #plus-universal. Slack
 * will not list a 1:1 DM's members, and the bot holds no `im:read` to ask who
 * a DM is with, so a card in a DM (a `D` id) is decided by the deployment's
 * standing confirmers — the only DM a card is sent to is one of theirs.
 *
 * @param env - Worker bindings
 * @param channel - The channel
 */
export async function channelMembers(env: Env, channel: string): Promise<string[] | null> {
  if (channel.startsWith("D")) {
    const confirmers = standingConfirmersOf(env);
    return confirmers.length ? confirmers : null;
  }
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

