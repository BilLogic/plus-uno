// The Slack envelope for the reaction door: a `reaction_added` event becomes a
// reaction request, `Env` becomes the door's named dependencies, and
// `runReactionDoor` does the rest.
//
// Everything this file used to decide is `gate/gate.ts` now — which proposal
// the reaction is about, what the emoji means, whether the card is still live,
// whether this caller won the claim, and what to say when it did not. The bug
// that moved it: the claim's answer was thrown away here, so a reaction that
// LOST the race still announced the winner's action as its own.
//
// Everything it then still DID with that verdict — the post, the tool, the
// working signal around both — is `gate/reaction-door.ts`, which takes the
// Delivery port, ThreadState, the thread-root read, the bot's own id and the
// confirmed tool by name. That is what puts the door on the Node test compile:
// a door that named `Env` could only be read with a regex.
//
// What is left here is what genuinely belongs to the envelope: the Slack event
// shape, the Slack client, and the bindings.
//
// `Env` enters here and stops here.

import type { Env } from "../types";
import { runReactionDoor, type ReactionDoorDeps } from "../gate/index";
import { executeVerdict } from "../agent/resolve-proposal";
import { threadStateFor } from "../thread-state/production";
import { restageFor } from "../turn/env-deps";
import type { SlackReactionAddedEvent } from "./events";
import { conversationsReplies, getBotIdentity } from "./api";
import { slackDelivery } from "./slack-delivery";

export async function handleReaction(env: Env, event: SlackReactionAddedEvent): Promise<void> {
  if (event.item.type !== "message") return;

  await runReactionDoor(
    {
      channel: event.item.channel,
      messageTs: event.item.ts,
      glyph: event.reaction,
      userId: event.user,
    },
    reactionDoorDeps(env),
  );
}

/**
 * `Env`, once, as the dependencies the door actually reads.
 *
 * Every entry is either a port with two adapters (the thread store, Delivery)
 * or one named client — the same shape `slack/turn-adapter.ts` builds for a
 * turn, so a test builds a recording Delivery, an in-memory store and nothing
 * else.
 */
function reactionDoorDeps(env: Env): ReactionDoorDeps {
  const threadState = threadStateFor(env);
  return {
    threadState,

    delivery: (target) => slackDelivery(env, target),

    async threadRootOf(channel, reactedTs) {
      const replies = await conversationsReplies(env, channel, reactedTs, 1).catch(() => null);
      const root = replies?.messages?.[0];
      return root?.thread_ts ?? root?.ts ?? reactedTs;
    },

    async botUserId() {
      return (await getBotIdentity(env))?.userId;
    },

    applyVerdict: (verdict) => executeVerdict(env, verdict),

    restage: restageFor(env, threadState),
  };
}
