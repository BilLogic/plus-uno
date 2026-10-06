// The deployment's standing confirmers: who may resolve any card that names
// its confirmers, beside the people it names (`thread-state` `cardConfirmers`).
// Read here, once per door, so Gate and Turn take the list by name and never
// see `Env`.
import type { Env } from "../types";
import { SLACK_USER_ID } from "./mrkdwn";

/** `STANDING_CONFIRMER_IDS` as Slack user ids. Unset, blank or junk entries
 *  admit nobody extra — anything that is not a user id is dropped. */
export function standingConfirmersOf(env: Pick<Env, "STANDING_CONFIRMER_IDS">): string[] {
  return (env.STANDING_CONFIRMER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => SLACK_USER_ID.test(id));
}
