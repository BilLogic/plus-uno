// Reaction-path confirmation gate. Typed confirmations are handled by the
// agent loop via the proposal_resolve tool; button presses by
// slack/interactive.ts. All three converge on resolveProposal and its claim.
//
// Filters:
//   - Only the gate emoji resolve — ✅ (and ✔️, 👍) confirm, ⛔ (and ❌, ❎, 🚫)
//     cancel. The sets and their reasons live in gate-reactions.ts.
//   - Only reactions ON the live proposal card resolve it. A reaction anywhere
//     else in the thread points at the card and executes nothing.
//   - Anyone in the thread may confirm/cancel (the requester lock was removed
//     2026-07-14; requesterUserId is still stored for the record).

import type { Env } from "../types";
import {
  loadPendingProposalDetailed,
  loadPendingProposalByThread,
  type PendingProposal,
} from "../thread-state-client";
import { resolveProposal } from "../agent/resolve-proposal";
import { mapReaction } from "./gate-reactions";
import type { SlackReactionAddedEvent } from "./events";
import { conversationsReplies, getBotIdentity, postMessage } from "./api";

// The reaction vocabulary lives in gate-reactions.ts so it can be tested —
// notably that 👍 does NOT confirm. See that file for why.


// The thread's live proposal, for a reaction that landed somewhere ELSE — a
// superseded card (the old one keeps its ⚠️ after a newer one replaces it) or
// a nearby reply.
//
// This used to be an execution fallback: whatever the reaction sat on, resolve
// the thread's active proposal. That silently answered a different question
// from the one the person asked. React ✅ on the card in front of you and, if
// it had been superseded, the NEWER proposal fired — you confirmed one thing
// and got another. With 👍 still a confirm reaction, a thumbs-up on a
// colleague's message anywhere in the thread did the same.
//
// It is now a POINTER, never an executor: find the live card so we can say
// where to react, and resolve nothing on this path.
async function findThreadProposal(
  env: Env,
  channel: string,
  reactedTs: string,
): Promise<PendingProposal | null> {
  const replies = await conversationsReplies(env, channel, reactedTs, 1);
  const root = replies.messages?.[0];
  const threadTs = root?.thread_ts ?? root?.ts ?? reactedTs;
  return loadPendingProposalByThread(env, channel, threadTs);
}

/** Slack permalink-ish pointer to the live card, for "react over there". */
function cardPointer(pending: PendingProposal): string {
  return `the :warning: card for *${pending.toolName}* just above`;
}

export async function handleReaction(env: Env, event: SlackReactionAddedEvent): Promise<void> {
  const decision = mapReaction(event.reaction);
  if (!decision) return; // not a gate reaction; ignore silently

  // The bot must never resolve its own proposals. slack_react refuses the
  // canonical pair, but the gate also accepts aliases (thumbsup et al) the
  // refusal list doesn't cover — without this check a bot-posted 👍 near a
  // card could self-confirm through the thread-fallback lookup.
  const self = await getBotIdentity(env);
  if (self && event.user === self.userId) return;

  if (event.item.type !== "message") return;
  const channel = event.item.channel;

  const lookup = await loadPendingProposalDetailed(env, event.item.ts);
  if (lookup.state === "expired") {
    // A delayed ✅/❌ on a proposal that timed out. Never swallow this — the
    // person believes they just confirmed something (live 2026-07-10: a
    // delayed reaction met pure silence and read as "the bot is broken").
    await postMessage(env, {
      channel,
      thread_ts: event.item.ts,
      text:
        `:hourglass: <@${event.user}> that proposal had already expired when your reaction landed — nothing was executed. ` +
        `Proposals stay live for an hour. Ask me again and I'll set the same thing up fresh.`,
    }).catch(() => {});
    return;
  }

  if (lookup.state !== "found") {
    // The reaction is not on a live proposal card. It may be on a superseded
    // card, or on any other message in a thread that happens to have one
    // pending. Either way this must NOT execute — a confirmation resolves the
    // thing it was placed on, or it resolves nothing.
    //
    // Point at the live card instead of acting. Silence was the old behaviour
    // for the "no proposal anywhere" case and is kept, because a ✅ used as
    // ordinary punctuation in an unrelated thread should not make the bot
    // speak.
    const live = await findThreadProposal(env, channel, event.item.ts).catch(() => null);
    if (!live) return;
    await postMessage(env, {
      channel: live.channel,
      thread_ts: live.replyTs ?? live.threadTs,
      text:
        `:eyes: <@${event.user}> I saw your :${event.reaction}:, but it is not on the proposal I am holding — ` +
        `nothing was executed. Use the buttons on ${cardPointer(live)}, or react there.`,
    }).catch(() => {});
    return;
  }

  const pending: PendingProposal = lookup.payload;

  // Anyone in the thread may confirm/cancel — no requester check (2026-07-14).
  try {
    await resolveProposal(env, pending, decision /* narrative: default */);
  } catch (err) {
    // A reaction confirmation must NEVER die silently — that's the exact "✅ did
    // nothing" failure this path fights (live 2026-07-13). Surface it so the user
    // can retry instead of staring at an unacknowledged reaction.
    console.error(`[gate] reaction resolve failed: ${err instanceof Error ? err.message : String(err)}`);
    await postMessage(env, {
      channel: pending.channel,
      thread_ts: pending.replyTs ?? pending.threadTs,
      text: `:warning: I caught your :${event.reaction}: but hit a snag executing it — give it another go, or tell me and I'll retry.`,
    }).catch(() => {});
  }
}
