// dm_relay executor — the relayed DM. Runs only past the Gate: the card named
// the recipient and showed the exact text, and someone approved it.
//
// What it does, per operation (one operation is one recipient):
//   1. fetch the requesting message's permalink — fetched, never constructed
//      (`getPermalink`'s own rule);
//   2. open the DM with `conversations.open`;
//   3. post the approved text wrapped in the Worker's attribution and link
//      (`relayed-dm-render.ts`);
//   4. say in the requesting thread where it went, or why it could not go.
//
// NO RECIPIENT ALLOWLIST and no member-type filter. Guests and Slack Connect
// partners are valid recipients when the card was approved; the Gate is what
// decides who is appropriate. A recipient Slack cannot DM — a deactivated
// account, a bot — fails at step 2 with its cause named.
//
// No `#plus-design` fan-out either: the row's `reviewRequest` is null, because
// a DM is not a reviewable artifact.
//
// The Slack client arrives BY NAME, the way every seam in Turn takes its
// dependencies, so a test drives a whole approved batch through a fake client;
// `relaySlackFor` is the one place `Env` is bound into it.

import type { Env, SlackContext } from "../types";
import { getPermalink, openConversation, postMessage } from "../slack/api";
import { relayFailure, relayRecipientId, renderRelayedDm } from "./relayed-dm-render";

/** The three Slack calls a relay makes, and nothing else. */
export interface RelaySlack {
  openDm(userId: string): Promise<{ ok: true; channel: string } | { ok: false; error: string }>;
  postMessage(message: { channel: string; text: string; thread_ts?: string }): Promise<{ ok: boolean; error?: string }>;
  permalink(channel: string, ts: string): Promise<string | null>;
}

export interface RelayDeps {
  slack: RelaySlack;
}

/** The production client: the `slack/api.ts` wrappers, with `Env` bound. */
export function relaySlackFor(env: Env): RelaySlack {
  return {
    openDm: (userId) => openConversation(env, userId),
    postMessage: async (message) => {
      const res = await postMessage(env, message);
      return res.ok ? { ok: true } : { ok: false, error: res.error };
    },
    permalink: (channel, ts) => getPermalink(env, channel, ts),
  };
}

export async function executeRelayDm(
  deps: RelayDeps,
  input: Record<string, unknown>,
  context: SlackContext,
): Promise<string> {
  const { slack } = deps;
  const recipient = relayRecipientId(input.recipient);
  const text = typeof input.text === "string" ? input.text : "";
  if (!recipient) {
    return JSON.stringify({
      ok: false,
      error: "'recipient' must be one Slack user id (U…), bare or as an <@U…> mention",
    });
  }
  if (!text.trim()) return JSON.stringify({ ok: false, error: "missing 'text'" });
  // The attribution is the point of the wrapper: a DM that cannot say who
  // asked for it is not sent.
  if (!context.requestedBy) {
    return JSON.stringify({ ok: false, error: "no requester on record to attribute the DM to" });
  }

  // Under the Gate's reply target, never the conversation key (see
  // `SlackContext.replyTs`). In a batch the Gate's one summary names every
  // recipient from the results below, so a line per recipient would say it
  // twice.
  const tellThread = async (line: string): Promise<void> => {
    if (context.batched) return;
    await slack
      .postMessage({ channel: context.channel, thread_ts: context.replyTs ?? context.threadTs, text: line })
      .catch(() => ({ ok: false }));
  };

  const permalink = await slack.permalink(context.channel, context.userMsgTs).catch(() => null);

  const refused = async (error: string): Promise<string> => {
    const { cause, next } = relayFailure(error);
    await tellThread(`:x: Couldn't send that to <@${recipient}> — ${cause}. Next: ${next}.`);
    return JSON.stringify({
      ok: false,
      status: "not_sent",
      recipient,
      error: `couldn't send to <@${recipient}> — ${cause} (\`${error}\`). Next: ${next}`,
    });
  };

  const dm = await slack.openDm(recipient);
  if (!dm.ok) return refused(dm.error);

  const posted = await slack.postMessage({
    channel: dm.channel,
    text: renderRelayedDm({
      requesterId: context.requestedBy,
      text,
      permalink,
      originIsDm: context.channel.startsWith("D"),
    }),
  });
  if (!posted.ok) return refused(posted.error ?? "unknown");

  await tellThread(`:incoming_envelope: Sent to <@${recipient}>.`);
  return JSON.stringify({
    ok: true,
    status: "sent",
    recipient,
    message: `Sent to <@${recipient}> as a relayed DM.`,
  });
}
