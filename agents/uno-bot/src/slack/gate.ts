// The reaction door. A ✅ / ⛔ on a message becomes a Gate signal, and the
// verdict is applied: post the text, run the tool.
//
// Everything this file used to decide is `gate/gate.ts` now — which proposal
// the reaction is about, what the emoji means, whether the card is still live,
// whether this caller won the claim, and what to say when it did not. The bug
// that moved it: the claim's answer was thrown away here, so a reaction that
// LOST the race still announced the winner's action as its own.
//
// What stays is what needs Slack: who reacted (the bot must never resolve its
// own card), which conversation the reacted message belongs to (a thread-root
// read), and the posting itself.
//
// Anyone in the thread may confirm/cancel — the requester lock was removed
// 2026-07-14, and `requesterUserId` is still stored for the record (ADR-014).

import type { Env } from "../types";
import { resolveSignal } from "../gate/index";
import { executeVerdict } from "../agent/resolve-proposal";
import { threadStateFor } from "../thread-state/production";
import { mapReaction } from "./gate-reactions";
import type { SlackReactionAddedEvent } from "./events";
import { conversationsReplies, getBotIdentity } from "./api";
import { slackDelivery } from "./slack-delivery";
import { withWorkingSignal } from "../turn/index";

/** The conversation a reacted message belongs to, for the by-thread lookup
 *  that finds the live card when the reaction landed elsewhere. */
async function threadRootOf(env: Env, channel: string, reactedTs: string): Promise<string> {
  const replies = await conversationsReplies(env, channel, reactedTs, 1).catch(() => null);
  const root = replies?.messages?.[0];
  return root?.thread_ts ?? root?.ts ?? reactedTs;
}

export async function handleReaction(env: Env, event: SlackReactionAddedEvent): Promise<void> {
  if (event.item.type !== "message") return;

  // A cheap pre-filter, not a second opinion: Gate parses the glyph itself and
  // is the authority on what it means. This one only decides whether the
  // reaction is worth the thread-root read below — every 🎉 in every channel
  // the bot is in arrives here, and a Slack call per party popper is a
  // subrequest spent on nothing.
  if (!mapReaction(event.reaction)) return;

  // The bot must never resolve its own proposals. slack_react refuses the
  // canonical pair, but the gate also accepts aliases (thumbsup et al) the
  // refusal list doesn't cover — without this check a bot-posted 👍 near a
  // card could self-confirm through the by-thread lookup.
  const self = await getBotIdentity(env);
  if (self && event.user === self.userId) return;

  const channel = event.item.channel;
  const verdict = await resolveSignal(
    {
      kind: "reaction",
      messageTs: event.item.ts,
      channel,
      thread: await threadRootOf(env, channel, event.item.ts),
      glyph: event.reaction,
      userId: event.user,
    },
    { threadState: threadStateFor(env) },
  );

  if (!verdict.post) return; // not a gate reaction, or nothing live to point at

  const post = verdict.post;
  const door = slackDelivery(env, {
    channel,
    replyTs: post.replyTs,
    userMsgTs: verdict.proposal?.userMsgTs ?? event.item.ts,
    userId: event.user,
  });

  // A ✅ on a card runs the tool, which can take as long as any turn — and
  // this door never goes through Turn, so the signal Turn owns has to be
  // raised and settled here. Same pairing, same `finally`.
  await withWorkingSignal(door, async (delivery) => {
    await delivery.setWorking({ status: "is working on that…" });
    try {
      // The narrative first, then the tool — the same order every door keeps, so
      // the person sees the acknowledgement before the work.
      const posted = await delivery.postNote(post.text);
      // A resolution that cannot speak is the failure this whole path guards
      // against, so it is never silent in the logs even when it is in Slack.
      if (!posted.ok) {
        console.error(`[gate] reaction post FAILED in ${channel} (thread=${post.replyTs})`);
      }
      await executeVerdict(env, verdict);
    } catch (err) {
      // A reaction confirmation must NEVER die silently — that's the exact "✅
      // did nothing" failure this path fights (live 2026-07-13). Surface it so
      // the user can retry instead of staring at an unacknowledged reaction.
      console.error(
        `[gate] reaction resolve failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      await delivery
        .postNote(
          `:warning: I caught your :${event.reaction}: but hit a snag executing it — give it another go, or tell me and I'll retry.`,
        )
        .catch(() => {});
    }
  });
}
