// share_for_feedback executor (D5 shareout — distinct from marketplace_add).
// Posts a "sharing this for feedback" message to #plus-design (or the origin
// thread if that channel isn't configured): what's being shared, a link back,
// a feedback prompt, and @-mentioned reviewers. This is the uno-publish
// shareout ritual — NOT marketplace registration (which opens a catalog PR).
// Side effect: it pings people, so it routes through the confirmation gate.

import type { Env } from "../types";
import type { SlackContext } from "./dispatcher";
import { postMessage } from "../slack/api";

// A Slack user id ("U…"/"W…") gets @-mentioned; anything else is shown as-is.
function renderReviewer(r: string): string {
  return /^[UW][A-Z0-9]{6,}$/.test(r.trim()) ? `<@${r.trim()}>` : r.trim();
}

function asList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

export async function executeShareForFeedback(
  env: Env,
  input: Record<string, unknown>,
  slack: SlackContext,
): Promise<string> {
  const summary = typeof input.summary === "string" ? input.summary.trim() : "";
  const link = typeof input.link === "string" ? input.link.trim() : "";
  const deadline = typeof input.deadline === "string" ? input.deadline.trim() : "";
  const reviewers = asList(input.reviewers);

  if (!summary) return JSON.stringify({ ok: false, error: "missing 'summary' of what's being shared" });

  const target = env.PLUS_DESIGN_CHANNEL_ID?.trim();
  const channel = target || slack.channel;
  const requester = slack.requestedBy ? `<@${slack.requestedBy}>` : "A designer";

  const lines = [
    `:mega: *Sharing for feedback* — ${summary}`,
    link ? `Take a look: ${link}` : "",
    reviewers.length ? `Feedback wanted from: ${reviewers.map(renderReviewer).join(" ")}` : "",
    `Shared by ${requester}. Please drop comments in-thread${deadline ? ` by *${deadline}*` : ""}.`,
  ].filter(Boolean);

  try {
    const posted = await postMessage(env, {
      channel,
      // In #plus-design this is a top-level post; if falling back to the origin
      // channel, keep it in the thread.
      thread_ts: target ? undefined : slack.threadTs,
      text: lines.join("\n"),
    });
    if (!posted.ok) {
      return JSON.stringify({ ok: false, status: "post_failed", detail: (posted as { error?: string }).error ?? "unknown" });
    }
    const where = target ? "#plus-design" : "this thread";
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
