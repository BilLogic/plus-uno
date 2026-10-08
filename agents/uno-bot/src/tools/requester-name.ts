// The requester's name, as a write outside Slack prints it: a mention id means
// nothing on GitHub or in Notion, so the GitHub footer and the Notion
// attribution line both name the person by their Slack display name.

import type { Env, SlackContext } from "../types";
import { usersInfo } from "../slack/api";

/** What a write says when it cannot name anyone: no requester and no known
 *  approver on the run, or a Slack read that failed. */
export const UNNAMED_REQUESTER = "a Slack teammate";

/**
 * The display name of the person a write is for: the requester of record the
 * Gate hands the executor. A Worker-staged card has none, and there the person
 * who pressed ✅ is the one who asked for the write.
 * @param env - Worker bindings
 * @param slack - The run's Slack context; `requestedBy` is who asked
 */
export async function requesterName(env: Env, slack: SlackContext): Promise<string> {
  const userId = slack.requestedBy || slack.approvedBy;
  if (!userId) return UNNAMED_REQUESTER;
  const res = await usersInfo(env, userId).catch(() => null);
  const user = res?.ok ? res.user : undefined;
  return user?.profile?.display_name || user?.real_name || user?.name || UNNAMED_REQUESTER;
}
