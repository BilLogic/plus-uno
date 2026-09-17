// Slack's Delivery adapter: everything a turn shows a person, in Slack terms.
//
// The turn says what it means — "acknowledge", "I'm working", "still going",
// "here is the answer", "approve this?" — and this file decides how Slack
// renders it. Three renderings live here and nowhere else now:
//
//   • the ONE acknowledgement rule: 👀 in a channel, the status line on the
//     assistant surface, never both;
//   • the plan stream. With `SLACK_STREAM_PLAN=on` a substantive turn opens a
//     stream in `task_display_mode: "plan"` and each narration line lands as a
//     task card that closes as the next one opens, so the person reads one
//     filling-in checklist instead of three loose messages. Off, the same
//     narration is a small ⏳ message. Which it is has never been the turn's
//     business, and now it cannot be;
//   • the answer closing the stream the checklist lives in, rather than opening
//     a second one beside it.
//
// `Env` stops here. The turn holds a `Delivery`, and this is the one place the
// Worker builds one.

import type { Env } from "../types";
import {
  addReaction,
  appendTask,
  postMessage,
  slackCall,
  startStream,
  stopStream,
} from "./api";
import { isAssistantThread, setAssistantTitle, setStatus, threadTitleFrom } from "./assistant";
import { postTextVerified, postVisibleFailure } from "./delivery";
import type { FooterKind } from "./footer-kind";
import { proposalCardBlocks } from "./proposal-render";
import type { Delivery, DeliveryFailureStage, PostResult, ProposalCard } from "../turn/index";
import { isSubrequestBudgetError, subrequestsUsed } from "../net";
import {
  outcomeOf,
  workingSignalLine,
  type StatusResult,
  type WorkingSignalOutcome,
  type WorkingSignalPhase,
} from "./working-signal";

/** Where this turn is happening, as Slack knows it. */
export interface SlackDeliveryTarget {
  channel: string;
  /** A real ts to reply under, or undefined to post at channel level (an
   *  agent_view DM has no thread). */
  replyTs?: string;
  /** The person's own message — what a reaction lands on. */
  userMsgTs: string;
  /** Who asked, and their workspace: `chat.startStream` wants both.
   *
   *  `team` is optional because two callers cannot supply it — `slack/gate.ts`
   *  and `slack/interactive.ts` build a door from a reaction event and a button
   *  payload, neither of which carries a team id here (the reaction's sits on
   *  the envelope, outside the DO job payload). Harmless today: those doors
   *  post through `postNote`, never `postAnswer`, so they never reach a stream
   *  — and if one ever does, `decideStream` makes it a plain post rather than
   *  the `invalid_arguments` of #572. */
  userId: string;
  team?: string;
  /** Forces the footer variant on the answer. Set by the `draft` shortcut,
   *  whose answer goes out under the PERSON'S name, so the standard "check
   *  before acting" line is wrong for it. Never sniffed from the body. */
  footerHint?: FooterKind;
}

/**
 * Make one status call and leave its verdict in the logs.
 *
 * Still best-effort — nothing here can fail a turn that already did its work —
 * but the swallow is no longer silent, and it logs on SUCCESS too. That is the
 * whole instrument: Slack's own refusals were always logged by api.ts, so what
 * a stuck indicator needed was evidence of the cases that produce no Slack
 * response at all. A `set` line with no `clear` line after it is an invocation
 * that died before delivery (#571).
 *
 * That pairing is the claim, and it is the only one made here: a surface with
 * no thread raises nothing and so logs neither half, which is why absence is
 * read as a BROKEN PAIR rather than as absence.
 *
 * @param phase - Which half of the pairing this is
 * @param call - The status call to make
 */
async function reportStatus(
  phase: WorkingSignalPhase,
  call: () => Promise<StatusResult>,
): Promise<void> {
  // Read the meter at the call, not after it: the number that matters is what
  // the turn had already spent by the time it reached delivery.
  const spent = subrequestsUsed();
  let outcome: WorkingSignalOutcome;
  try {
    outcome = outcomeOf(await call());
  } catch (err) {
    // One thing reaches here by construction: `slackCall` degrades every
    // transport and parse failure into `{ ok: false, error }` and rethrows
    // exactly the budget stop (`rethrowIfBudget`, api.ts). The second arm is
    // the compiler's, not a case — and it still refuses to put a JS exception
    // message behind the words "declined by Slack".
    outcome = isSubrequestBudgetError(err)
      ? { kind: "budget-stop" }
      : { kind: "unanswered", error: err instanceof Error ? err.message : String(err) };
  }
  const line = workingSignalLine(phase, outcome, spent);
  if (outcome.kind === "ok") console.log(line);
  else console.warn(line);
}

export function slackDelivery(env: Env, target: SlackDeliveryTarget): Delivery {
  const { channel, replyTs, userMsgTs } = target;

  // The plan stream, if one is open: its ts, the card currently in progress,
  // and how many steps have passed. The card is carried WHOLE, not just its id
  // — a task update REPLACES the card, so re-sending the id with a placeholder
  // title would rewrite the step's name as it completed.
  let planTs: string | null = null;
  let planCurrent = { id: "understand", title: "" };
  let planStep = 0;

  /** Mark the in-progress card and forget the stream, so nothing re-uses it. */
  const settlePlan = async (status: "complete" | "error"): Promise<string | null> => {
    if (!planTs) return null;
    const ts = planTs;
    await appendTask(env, channel, ts, { ...planCurrent, status }).catch(() => {});
    planTs = null;
    return ts;
  };

  const endProgress = async (outcome: "complete" | "error"): Promise<void> => {
    const ts = await settlePlan(outcome);
    if (ts) await stopStream(env, channel, ts).catch(() => {});
  };

  return {
    async react(emoji) {
      await addReaction(env, channel, userMsgTs, emoji).catch(() => {});
    },

    async removeReaction(emoji) {
      // Best-effort, like every other reaction call: a reaction that would not
      // come off is not worth a turn.
      await slackCall(env, "reactions.remove", {
        channel,
        timestamp: userMsgTs,
        name: emoji,
      }).catch(() => {});
    },

    async setWorking({ status, titleFrom }) {
      // setStatus IS the thinking indicator on an app thread — the documented
      // one — and it also opens the thread. A thread is all it needs: the
      // DM-only condition that used to stand here decided for Slack which
      // surfaces can show a status, and the cost of guessing wrong was a
      // channel thread with an indicator nobody could take down. Ask, and let
      // the API decline where it wants to — a rejection here is a signal that
      // did not appear, which is exactly what the condition was for.
      if (!replyTs) return;
      if (status) await reportStatus("set", () => setStatus(env, channel, replyTs, status));
      // The title is the assistant surface's alone: `assistant.threads.setTitle`
      // names an App thread, and a channel thread has no such name to set.
      if (titleFrom && isAssistantThread(channel)) {
        // Title the thread from the question that started it, so it is findable
        // in History/Messages. Slack: "Set the title initially to capture the
        // first question from the user."
        await setAssistantTitle(env, channel, replyTs, threadTitleFrom(titleFrom)).catch(() => {});
      }
    },

    async clearWorking() {
      // The empty status IS the clear (`assistant.threads.setStatus` with ""),
      // and it goes wherever the set went — same condition, or the pairing is
      // a set on one surface and a clear on another.
      if (!replyTs) return;
      await reportStatus("clear", () => setStatus(env, channel, replyTs, ""));
    },

    async beginProgress(label) {
      // An early stream is only honest in plan mode: with plain text there is
      // nothing to put in it and the client renders an empty bubble for the
      // whole run (tried, reverted — see api.ts).
      if (env.SLACK_STREAM_PLAN !== "on" || !replyTs) return;
      planTs = await startStream(env, channel, replyTs, target.userId, target.team, "plan");
      if (!planTs) return;
      planCurrent = { id: "understand", title: label };
      await appendTask(env, channel, planTs, { ...planCurrent, status: "in_progress" }).catch(
        () => {},
      );
    },

    endProgress,

    postInterim(text) {
      if (planTs) {
        // Each narration line is its own card, and the previous one is closed
        // by re-sending its id with status complete — that is what makes it
        // read as progress rather than as a list of things all still happening.
        const open = planTs;
        void appendTask(env, channel, open, { ...planCurrent, status: "complete" });
        planCurrent = { id: `step-${++planStep}`, title: text.slice(0, 120) };
        void appendTask(env, channel, open, { ...planCurrent, status: "in_progress" });
        return;
      }
      postMessage(env, {
        channel,
        thread_ts: replyTs,
        text: `:hourglass_flowing_sand: ${text}`,
      }).catch(() => {});
    },

    async postAnswer(text): Promise<PostResult> {
      // The answer CLOSES the checklist's stream instead of opening a second
      // one beside it.
      const openStream = await settlePlan("complete");
      try {
        const posted = await postTextVerified(
          env,
          channel,
          replyTs,
          text,
          // The recipient pair. The plan stream above has always passed it;
          // the answer path could not, because this was the only place holding
          // the ids and it never handed them over (#572).
          { userId: target.userId, team: target.team },
          target.footerHint,
          openStream ?? undefined,
        );
        return { ok: posted.ok, text: posted.text };
      } catch (err) {
        // The stream was handed over to be closed INTO the answer. If the post
        // threw before it got there, nobody else holds its ts — and a stream
        // left open renders as a live "typing" bubble that never settles.
        if (openStream) await stopStream(env, channel, openStream).catch(() => {});
        throw err;
      }
    },

    async postNote(text): Promise<PostResult> {
      const posted = await postMessage(env, { channel, thread_ts: replyTs, text }).catch(() => ({
        ok: false as const,
      }));
      return {
        ok: !!posted.ok,
        text,
        ...("ts" in posted && posted.ts ? { ts: posted.ts } : {}),
      };
    },

    async stageProposal(card: ProposalCard): Promise<PostResult> {
      // Every card carries ✅ Approve / ⛔ Cancel buttons (2026-08-22). Cards
      // that built their own blocks (the Figma preview) already include them;
      // a text-only card gets the text as sections plus the row. The text is
      // kept alongside as the notification/fallback copy, and it is what the
      // button handler re-renders the card from.
      const blocks = card.blocks ?? proposalCardBlocks(card.text);
      let posted = await postMessage(env, {
        channel,
        thread_ts: replyTs,
        text: card.text,
        blocks,
      });
      // If Slack rejected the blocks (it could not fetch the Figma image_url,
      // or a section overflowed), retry text-only so the confirmation gate
      // still works — reactions and typed emoji resolve a text-only card just
      // the same.
      if (!posted.ok) {
        console.warn("[slack] proposal with blocks failed; retrying text-only");
        posted = await postMessage(env, { channel, thread_ts: replyTs, text: card.text });
      }
      return {
        ok: !!posted.ok,
        text: card.text,
        ...(posted.ok && posted.ts ? { ts: posted.ts } : {}),
      };
    },

    async postFailure(stage: DeliveryFailureStage, err) {
      // The checklist is settled by the turn's own `endProgress("error")`
      // before it gets here — a failure message under a step that still claims
      // to be in progress is how the plan stream read after a dead run.
      await postVisibleFailure(env, channel, replyTs, userMsgTs, err, stage);
    },
  };
}
