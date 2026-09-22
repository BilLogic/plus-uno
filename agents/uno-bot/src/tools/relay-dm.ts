// dm_relay executor — the relayed DM. Runs only past the Gate: the card named
// the recipient and showed the exact text, and someone approved it.
//
// What it does, per operation (one operation is one recipient):
//   1. fetch the requesting message's permalink — fetched, never constructed
//      (`getPermalink`'s own rule);
//   2. open the DM with `conversations.open`;
//   3. post the approved text wrapped in the Worker's attribution and link
//      (`relayed-dm-render.ts`);
//   4. remember the DM in the recipient's own DM conversation with the bot,
//      so a reply there ("what's this about?") has what was sent to go on;
//   5. say in the requesting thread where it went, or why it could not go.
//
// NO RECIPIENT ALLOWLIST and no member-type filter. Guests and Slack Connect
// partners are valid recipients when the card was approved; the Gate is what
// decides who is appropriate. A recipient Slack cannot DM — a deactivated
// account, a bot — fails at step 2 with its cause named.
//
// No `#plus-design` fan-out either: the row's `reviewRequest` is null, because
// a DM is not a reviewable artifact.
//
// The Slack client and the memory arrive BY NAME, the way every seam in Turn
// takes its dependencies, so a test drives a whole approved batch through
// fakes; `relaySlackFor` and `relayMemoryFor` are the places `Env` is bound.

import type { Env, SlackContext } from "../types";
import { getPermalink, openConversation, postMessage } from "../slack/api";
import { DM_CONVERSATION, type ThreadState } from "../thread-state/index";
import { threadStateFor } from "../thread-state/production";
import { relayFailure, relayRecipientId, renderRelayedDm } from "./relayed-dm-render";

/** The three Slack calls a relay makes, and nothing else. */
export interface RelaySlack {
  openDm(userId: string): Promise<{ ok: true; channel: string } | { ok: false; error: string }>;
  postMessage(message: { channel: string; text: string; thread_ts?: string }): Promise<{ ok: boolean; error?: string; ts?: string }>;
  permalink(channel: string, ts: string): Promise<string | null>;
}

/**
 * Where a sent relay is remembered: the recipient's DM with the bot, as a turn
 * the bot said. A reply typed in that DM's composer reads its history from the
 * store and not from Slack (`slack/events.ts` § buildThreadHistory), so a relay
 * the store never heard of is one the bot cannot talk about.
 */
export interface RelayMemory {
  remember(dmChannel: string, turn: { content: string; ts?: string }): Promise<void>;
}

export interface RelayDeps {
  slack: RelaySlack;
  memory: RelayMemory;
}

/** The production client: the `slack/api.ts` wrappers, with `Env` bound. */
export function relaySlackFor(env: Env): RelaySlack {
  return {
    openDm: (userId) => openConversation(env, userId),
    postMessage: async (message) => {
      const res = await postMessage(env, message);
      return res.ok ? { ok: true, ...(res.ts ? { ts: res.ts } : {}) } : { ok: false, error: res.error };
    },
    permalink: (channel, ts) => getPermalink(env, channel, ts),
  };
}

/** The memory over a thread store: the relay goes in under the key an
 *  unthreaded reply in that DM reads its history from. */
export function relayMemoryOver(store: Pick<ThreadState, "appendHistory">): RelayMemory {
  return {
    async remember(dmChannel, turn) {
      await store.appendHistory({ channel: dmChannel, thread: DM_CONVERSATION }, { role: "assistant", ...turn });
    },
  };
}

/** The production memory: the thread store, with `Env` bound. */
export function relayMemoryFor(env: Env): RelayMemory {
  return relayMemoryOver(threadStateFor(env));
}

export async function executeRelayDm(
  deps: RelayDeps,
  input: Record<string, unknown>,
  context: SlackContext,
): Promise<string> {
  const { slack, memory } = deps;
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

  const sent = renderRelayedDm({
    requesterId: context.requestedBy,
    text,
    permalink,
    originIsDm: context.channel.startsWith("D"),
  });
  const posted = await slack.postMessage({ channel: dm.channel, text: sent });
  if (!posted.ok) return refused(posted.error ?? "unknown");

  // Best-effort: the DM is in their inbox either way, and a store hiccup must
  // not read as a relay that failed.
  await memory
    .remember(dm.channel, { content: sent, ...(posted.ts ? { ts: posted.ts } : {}) })
    .catch((err: unknown) =>
      console.warn(`[relay] couldn't remember the DM: ${err instanceof Error ? err.message : String(err)}`),
    );

  await tellThread(`:incoming_envelope: Sent to <@${recipient}>.`);
  return JSON.stringify({
    ok: true,
    status: "sent",
    recipient,
    message: `Sent to <@${recipient}> as a relayed DM.`,
  });
}
