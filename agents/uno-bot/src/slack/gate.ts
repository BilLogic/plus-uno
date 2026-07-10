// Reaction-path confirmation gate. Text confirmations are handled by the
// agent loop via the resolve_pending_proposal tool — they don't pass through
// here.
//
// Filters:
//   - Only ✅ and ❌ reactions are considered.
//   - Only reactions on a proposal message we have pending state for.
//   - Only reactions from the original requester (bot's own :warning:
//     reaction is naturally excluded because the bot isn't the requester).

import type { Env } from "../types";
import { loadPendingProposalDetailed } from "../thread-state-client";
import { resolveProposal, type Decision } from "../agent/resolve-proposal";
import type { SlackReactionAddedEvent } from "./events";
import { postMessage } from "./api";

const CONFIRM_REACTIONS = new Set(["white_check_mark", "heavy_check_mark", "+1", "thumbsup"]);
const CANCEL_REACTIONS = new Set(["x", "negative_squared_cross_mark", "no_entry_sign"]);

function mapReaction(name: string): Decision | null {
  if (CONFIRM_REACTIONS.has(name)) return "confirm";
  if (CANCEL_REACTIONS.has(name)) return "cancel";
  return null;
}

export async function handleReaction(env: Env, event: SlackReactionAddedEvent): Promise<void> {
  const decision = mapReaction(event.reaction);
  if (!decision) return; // not a gate reaction; ignore silently

  if (event.item.type !== "message") return;

  const lookup = await loadPendingProposalDetailed(env, event.item.ts);
  if (lookup.state === "expired") {
    // A delayed ✅/❌ on a proposal that timed out. Never swallow this — the
    // person believes they just confirmed something (live 2026-07-10: a
    // delayed reaction met pure silence and read as "the bot is broken").
    await postMessage(env, {
      channel: event.item.channel,
      thread_ts: event.item.ts,
      text:
        `:hourglass: <@${event.user}> that proposal had already expired when your reaction landed — nothing was executed. ` +
        `Proposals stay live for an hour. Ask me again and I'll set the same thing up fresh.`,
    }).catch(() => {});
    return;
  }
  if (lookup.state !== "found") {
    // Reaction wasn't on a tracked proposal message; could be on anything else.
    return;
  }
  const pending = lookup.payload;

  if (event.user !== pending.requesterUserId) {
    // Cross-user reaction. Silently ignore (Slack reactions are low-stakes;
    // posting a "you can't do that" message would be noisy).
    console.log(
      `[gate] reaction :${event.reaction}: from <@${event.user}> on proposal ${event.item.ts}` +
      ` ignored — requester is <@${pending.requesterUserId}>`,
    );
    return;
  }

  await resolveProposal(env, pending, decision /* narrative: default */);
}
