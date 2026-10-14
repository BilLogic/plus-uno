// share_for_feedback executor (D5 shareout — distinct from marketplace registration).
// Wire name: the tool is registered and proposed as `shareout_post`.
// Posts a "sharing this for feedback" message to #plus-design-feedback (or the
// origin thread if that channel isn't configured): what's being shared, a link
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
import { teamPostChannel, testChannelIdsOf } from "../usage/record";
import { fieldsFromInput, renderShareout } from "./share-out-render";

/** Where a share-out posts: the channel, the thread when it stays in the asking
 *  one, and how the result names the place. */
export interface ShareoutPlace {
  channel: string;
  threadTs?: string;
  where: string;
}

/**
 * Where a share-out posts: #plus-design-feedback, top level — unless it was
 * asked for in a test channel, or that channel is not set, when it stays in the
 * asking thread.
 *
 * @param env - `PLUS_DESIGN_FEEDBACK_CHANNEL_ID` and `TEST_CHANNEL_IDS`
 * @param slack - Where it was asked
 */
export function shareoutPlace(
  env: Pick<Env, "PLUS_DESIGN_FEEDBACK_CHANNEL_ID" | "TEST_CHANNEL_IDS">,
  slack: Pick<SlackContext, "channel" | "threadTs">,
): ShareoutPlace {
  const feedback = env.PLUS_DESIGN_FEEDBACK_CHANNEL_ID?.trim();
  const target = feedback ? teamPostChannel({ origin: "slack", channel: slack.channel, testChannelIds: testChannelIdsOf(env) }, feedback) : null;
  if (target && target === feedback) return { channel: target, where: "#plus-design-feedback" };
  return { channel: slack.channel, ...(slack.threadTs ? { threadTs: slack.threadTs } : {}), where: "this thread" };
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

  const place = shareoutPlace(env, slack);
  const requester = slack.requestedBy ? `<@${slack.requestedBy}>` : "A designer";

  // The Flow 3 template, per docs/connectors/slack.md § Share-out post. The
  // shape lives in share-out-render.ts so it can be asserted — it drifted from
  // the doc for months precisely because nothing compared the two.
  const body = renderShareout(fields, requester);

  try {
    const posted = await postMessage(env, {
      channel: place.channel,
      // In #plus-design-feedback this is a top-level post; anywhere else it
      // stays in the asking thread.
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
