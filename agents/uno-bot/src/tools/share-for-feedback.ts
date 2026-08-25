// share_for_feedback executor (D5 shareout — distinct from marketplace registration).
// Wire name: the tool is registered and proposed as `shareout_post`.
// Posts a "sharing this for feedback" message to #plus-design (or the origin
// thread if that channel isn't configured): what's being shared, a link back,
// a feedback prompt, and @-mentioned reviewers. This is the uno-publish
// shareout ritual — NOT marketplace registration (manual today; see #173).
// Side effect: it pings people, so it routes through the confirmation gate.

import type { Env } from "../types";
import type { SlackContext } from "./dispatcher";
import { postMessage } from "../slack/api";
import { fieldsFromInput, renderShareout } from "./share-out-render";

export async function executeShareForFeedback(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const fields = fieldsFromInput(input);
  if (!fields.summary) {
    return JSON.stringify({ ok: false, error: "missing 'summary' of what's being shared" });
  }

  const target = env.PLUS_DESIGN_FEEDBACK_CHANNEL_ID?.trim();
  const channel = target || slack.channel;
  const requester = slack.requestedBy ? `<@${slack.requestedBy}>` : "A designer";

  // The Flow 3 template, per docs/connectors/slack.md § Share-out post. The
  // shape lives in share-out-render.ts so it can be asserted — it drifted from
  // the doc for months precisely because nothing compared the two.
  const body = renderShareout(fields, requester);

  try {
    const posted = await postMessage(env, {
      channel,
      // In #plus-design this is a top-level post; if falling back to the origin
      // channel, keep it in the thread.
      thread_ts: target ? undefined : slack.threadTs,
      text: body,
    });
    if (!posted.ok) {
      return JSON.stringify({ ok: false, status: "post_failed", detail: (posted as { error?: string }).error ?? "unknown" });
    }
    const where = target ? "#plus-design-feedback" : "this thread";
    return JSON.stringify({
      ok: true,
      status: "shared",
      posted_to: where,
      message: `Shared for feedback in ${where}.`,
    });
  } catch (err) {
    return JSON.stringify({ ok: false, status: "post_failed", detail: err instanceof Error ? err.message : String(err) });
  }
}
