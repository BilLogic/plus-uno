// The reaction door — a ✅ / ⛔ on a message, resolved.
//
// Gate decides; a door applies. This one builds the reaction signal, posts the
// verdict's text and runs the confirmed tool, inside the working signal Turn
// owns — because a door that resolves a card runs the tool for as long as any
// turn would, and never goes through Turn.
//
// IT TAKES NAMED DEPENDENCIES, the way Turn does (`turn/turn.ts`): the Delivery
// port, ThreadState, the thread-root read, the bot's own id, the confirmed
// tool. `Env` never enters — it is turned into `ReactionDoorDeps` once, in
// `slack/gate.ts`. What is left there is the envelope: the Slack event, the
// Slack client, and the 58-field binding record.
//
// So the whole door is exercised in `tests/confirmation-paths.test.ts` on the
// recording Delivery and the in-memory ThreadState. It used to be READ there
// instead — a `readFileSync` and a regex over this file's source — because a
// door whose one argument was an `Env` was a door a Node test had nothing to
// call. (Not a compile boundary, though that is what this note used to say:
// `tsconfig.test.json` carries the Workers types beside the Node ones and globs
// `src/**` — #595.)
//
// Anyone in the thread may confirm/cancel — the requester lock was removed
// 2026-07-14, and `requesterUserId` is still stored for the record (ADR-014).
//
// PURE by design: no `Env`, no Workers global, no fetch — which is what lets
// the Node suite DRIVE it rather than read it.

import { mapReaction } from "./reactions";
import type { ThreadState } from "../thread-state/index";
import { withWorkingSignal, type Delivery } from "../turn/index";
import { resolveSignal, type GateRestage, type GateVerdict } from "./gate";

/** One reaction, in the facts the envelope already has. */
export interface ReactionRequest {
  channel: string;
  /** The message the reaction landed on. May not be the card. */
  messageTs: string;
  /** Slack's emoji NAME, as a reaction event sends it. */
  glyph: string;
  /** Who reacted. */
  userId: string;
}

/** Where the door speaks: the verdict's own reply thread, against the message
 *  the person reacted to. */
export interface ReactionDoorTarget {
  channel: string;
  replyTs: string;
  userMsgTs: string;
  userId: string;
}

export interface ReactionDoorDeps {
  /** Per-thread memory — where the staged card is, and the claim that is the
   *  lock on it. */
  threadState: ThreadState;

  /**
   * Everything the person sees. A factory rather than an instance because
   * where the door speaks is the VERDICT's answer (`post.replyTs`, never the
   * reacted ts), which is not known until the claim is settled.
   */
  delivery(target: ReactionDoorTarget): Delivery;

  /** The conversation a reacted message belongs to, for the by-thread lookup
   *  that finds the live card when the reaction landed elsewhere. */
  threadRootOf(channel: string, reactedTs: string): Promise<string>;

  /** Who the bot is, so it never resolves its own card. */
  botUserId(): Promise<string | undefined>;

  /**
   * Act on a verdict: the confirmed side-effect tool, the acknowledging
   * reaction, the record of what was done.
   *
   * EVERY verdict that has something to post is handed here, including a stale
   * or cancelled one — the adapter is what decides a losing verdict costs
   * nothing (`agent/resolve-proposal.ts` returns early unless `outcome` is
   * `won`). An adapter that assumed it only ever sees a winner would run a
   * tool the claim awarded to somebody else.
   */
  applyVerdict(verdict: GateVerdict): Promise<void>;

  /**
   * Stage a fresh card for what a cut-off run never finished, through the
   * door's own Delivery, after the note that explains it. Only a cut-off
   * verdict carries anything to re-stage; building the card is Turn's
   * (`turn/turn.ts` `restageExecution`), and the envelope binds it.
   */
  restage(restage: GateRestage, delivery: Delivery): Promise<void>;
}

export async function runReactionDoor(
  request: ReactionRequest,
  deps: ReactionDoorDeps,
): Promise<void> {
  // A cheap pre-filter, not a second opinion: Gate parses the glyph itself and
  // is the authority on what it means. This one only decides whether the
  // reaction is worth the thread-root read below — every 🎉 in every channel
  // the bot is in arrives here, and a Slack call per party popper is a
  // subrequest spent on nothing.
  if (!mapReaction(request.glyph)) return;

  // The bot must never resolve its own proposals. slack_react refuses the
  // canonical pair, but the gate also accepts aliases (thumbsup et al) the
  // refusal list doesn't cover — without this check a bot-posted 👍 near a
  // card could self-confirm through the by-thread lookup.
  const self = await deps.botUserId();
  if (self && request.userId === self) return;

  const { channel } = request;
  const verdict = await resolveSignal(
    {
      kind: "reaction",
      messageTs: request.messageTs,
      channel,
      thread: await deps.threadRootOf(channel, request.messageTs),
      glyph: request.glyph,
      userId: request.userId,
    },
    { threadState: deps.threadState },
  );

  if (!verdict.post) return; // not a gate reaction, or nothing live to point at

  const post = verdict.post;
  const door = deps.delivery({
    channel,
    replyTs: post.replyTs,
    userMsgTs: verdict.proposal?.userMsgTs ?? request.messageTs,
    userId: request.userId,
  });

  // A ✅ on a card runs the tool, which can take as long as any turn — and
  // this door never goes through Turn, so the signal Turn owns has to be
  // raised and settled here. Same pairing, same `finally`.
  await withWorkingSignal(
    door,
    async (delivery) => {
      await delivery.setWorking({ status: "is working on that…" });
      try {
        // The narrative first, then the tool — the same order every door keeps, so
        // the person sees the acknowledgement before the work.
        const posted = await delivery.postGateNote(post.note);
        // A resolution that cannot speak is the failure this whole path guards
        // against, so it is never silent in the logs even when it is in Slack.
        if (!posted.ok) {
          console.error(`[gate] reaction post FAILED in ${channel} (thread=${post.replyTs})`);
        }
        await deps.applyVerdict(verdict);
        if (verdict.restage) await deps.restage(verdict.restage, delivery);
      } catch (err) {
        // A reaction confirmation must NEVER die silently — that's the exact "✅
        // did nothing" failure this path fights (live 2026-07-13). Surface it so
        // the user can retry instead of staring at an unacknowledged reaction.
        console.error(
          `[gate] reaction resolve failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        await delivery
          .postGateNote({ kind: "resolve-failed", glyph: request.glyph })
          .catch(() => {});
      }
    },
    // What the thread needs afterwards, stated rather than defaulted: this
    // door RESOLVED the card, so nothing in the thread is waiting on anybody.
    // The argument is required precisely so a door cannot inherit an answer it
    // never thought about (#575). A re-staged card is the one thing this door
    // can leave waiting on somebody.
    () => (verdict.restage ? "waiting-on-person" : "idle"),
  );
}
