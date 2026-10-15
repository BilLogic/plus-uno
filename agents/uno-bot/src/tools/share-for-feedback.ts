// share_for_feedback executor (D5 shareout — distinct from marketplace registration).
// Wire name: the tool is registered and proposed as `shareout_post`.
// Posts a "sharing this for feedback" message to #plus-design-feedback, or in
// the asking conversation when the asker keeps it there (`place: "here"`) or
// that channel isn't configured: what's being shared, a link
// back, a feedback prompt, and @-mentioned reviewers. This is the uno-publish
// shareout ritual — NOT marketplace registration (manual today; see #173).
// Side effect: it pings people, so it routes through the confirmation gate.
//
// A share-out asked for in a test channel (`TEST_CHANNEL_IDS`) is test traffic,
// by the usage record's rule: it posts in that channel's thread, never in the
// team channel (`teamPostChannel`).

import type { Env } from "../types";
import type { SlackContext } from "../types";
import { postMessage } from "../slack/api";
import { DM_CONVERSATION } from "../thread-state/index";
import { teamPostChannel, testChannelIdsOf } from "../usage/record";
import { fieldsFromInput, renderShareout } from "./share-out-render";

/** Where a share-out posts: the channel, the thread when it stays in the asking
 *  one, and how the result and the card name the place. */
export interface ShareoutPlace {
  channel: string;
  threadTs?: string;
  where: string;
}

/**
 * Where a share-out posts: #plus-design-feedback, top level — unless the asker
 * kept it in the conversation (`place: "here"`), it was asked for in a test
 * channel, or that channel is not set, when it stays where it was asked: the
 * asking thread, or the DM.
 *
 * The card names the place from this same decision (`turn/env-deps.ts`
 * `cardReadsFor` § `shareoutWhere`), so a ✅ posts where the card said.
 *
 * @param env - `PLUS_DESIGN_FEEDBACK_CHANNEL_ID` and `TEST_CHANNEL_IDS`
 * @param slack - Where it was asked
 * @param place - The tool's `place` input: `"here"` keeps it in the
 *                conversation; anything else means the feedback channel
 */
export function shareoutPlace(
  env: Pick<Env, "PLUS_DESIGN_FEEDBACK_CHANNEL_ID" | "TEST_CHANNEL_IDS">,
  slack: Pick<SlackContext, "channel" | "threadTs" | "replyTs">,
  place?: unknown,
): ShareoutPlace {
  const feedback = place === "here" ? undefined : env.PLUS_DESIGN_FEEDBACK_CHANNEL_ID?.trim();
  const target = feedback ? teamPostChannel({ origin: "slack", channel: slack.channel, testChannelIds: testChannelIdsOf(env) }, feedback) : null;
  if (target && target === feedback) return { channel: target, where: "#plus-design-feedback" };
  // A threadless DM's conversation key is not a ts Slack accepts: reply under
  // the real one when there is one, and top level otherwise.
  const thread = slack.replyTs ?? (slack.threadTs && slack.threadTs !== DM_CONVERSATION ? slack.threadTs : undefined);
  return {
    channel: slack.channel,
    ...(thread ? { threadTs: thread } : {}),
    where: slack.channel.startsWith("D") ? "this DM" : "this thread",
  };
}

export async function executeShareForFeedback(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const fields = fieldsFromInput(input);
  if (!fields.summary) {
    return JSON.stringify({ ok: false, error: "missing 'summary' of what's being shared" });
  }

  const place = shareoutPlace(env, slack, input.place);
  const requester = slack.requestedBy ? `<@${slack.requestedBy}>` : "A designer";

  // The Flow 3 template, per docs/connectors/slack/shapes.md § Share-out post. The
  // shape lives in share-out-render.ts so it can be asserted — it drifted from
  // the doc for months precisely because nothing compared the two.
  const body = renderShareout(fields, requester);

  try {
    const posted = await postMessage(env, {
      channel: place.channel,
      // In #plus-design-feedback this is a top-level post; anywhere else it
      // stays in the asking conversation.
      thread_ts: place.threadTs,
      text: body,
    });
    if (!posted.ok) {
      return JSON.stringify({ ok: false, status: "post_failed", detail: (posted as { error?: string }).error ?? "unknown" });
    }
    return JSON.stringify({
      ok: true,
      status: "shared",
      posted_to: place.where,
      message: `Shared for feedback in ${place.where}.`,
    });
  } catch (err) {
    return JSON.stringify({ ok: false, status: "post_failed", detail: err instanceof Error ? err.message : String(err) });
  }
}
