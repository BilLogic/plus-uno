// Reaction-path confirmation gate. Text confirmations are handled by the
// agent loop via the proposal_resolve tool — they don't pass through
// here.
//
// Filters:
//   - Only ✅ and ❌ reactions are considered.
//   - Only reactions on a proposal message we have pending state for (or, on a
//     miss, the thread's active proposal — see findThreadProposal).
//   - Anyone in the thread may confirm/cancel (the requester lock was removed
//     2026-07-14; requesterUserId is still stored for the record).

import type { Env } from "../types";
import {
  loadPendingProposalDetailed,
  loadPendingProposalByThread,
  type PendingProposal,
} from "../thread-state-client";
import { resolveProposal, type Decision } from "../agent/resolve-proposal";
import type { SlackReactionAddedEvent } from "./events";
import { conversationsReplies, postMessage } from "./api";

const CONFIRM_REACTIONS = new Set(["white_check_mark", "heavy_check_mark", "+1", "thumbsup"]);
const CANCEL_REACTIONS = new Set(["x", "negative_squared_cross_mark", "no_entry_sign"]);

function mapReaction(name: string): Decision | null {
  if (CONFIRM_REACTIONS.has(name)) return "confirm";
  if (CANCEL_REACTIONS.has(name)) return "cancel";
  return null;
}

// Exact-message lookup missed. The ✅/❌ may sit on a SUPERSEDED proposal card
// (the old card keeps its ⚠️ after a newer one replaces it) or a nearby reply,
// so fall back to the thread's currently-active proposal. Needs the reacted
// message's thread root — resolve it via one cheap conversations.replies call.
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

export async function handleReaction(env: Env, event: SlackReactionAddedEvent): Promise<void> {
  const decision = mapReaction(event.reaction);
  if (!decision) return; // not a gate reaction; ignore silently

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

  let pending: PendingProposal | null =
    lookup.state === "found" ? lookup.payload : null;
  if (!pending) {
    // Not on the exact tracked message — try the thread's active proposal before
    // giving up (a ✅ on a stale/superseded card, live 2026-07-13). If there's
    // still nothing, the reaction genuinely wasn't a confirmation — stay silent.
    pending = await findThreadProposal(env, channel, event.item.ts).catch(() => null);
    if (!pending) return;
  }

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
      thread_ts: pending.threadTs,
      text: `:warning: I caught your :${event.reaction}: but hit a snag executing it — give it another go, or just say "go ahead" / "cancel".`,
    }).catch(() => {});
  }
}
