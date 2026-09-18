// Slack's Delivery adapter: everything a turn shows a person, in Slack terms.
//
// The turn says what it means — "acknowledge", "I'm working", "still going",
// "here is the answer", "approve this?" — and this file decides how Slack
// renders it. Three renderings live here and nowhere else now:
//
//   • the ONE acknowledgement rule: 👀 off the assistant surface only, because
//     there the working signal, the titled thread and the streamed reply
//     already say it and a fourth signal on one message is noise. The working
//     signal itself is raised on EVERY surface — this once read "never both",
//     which the code has not done since the DM-only condition came off
//     `setWorking` below: a channel turn gets 👀 AND a session status, and that
//     status is what makes Slack's native stop button available in a channel
//     thread at all (#576);
//   • the plan stream. With the plan-stream switch on, a substantive turn opens
//     a stream in `task_display_mode: "plan"` and each narration line lands as a
//     task card that closes as the next one opens, so the person reads one
//     filling-in checklist instead of three loose messages. Off, the same
//     narration is a small ⏳ message. Which it is has never been the turn's
//     business, and now it cannot be;
//   • the answer closing the stream the checklist lives in, rather than opening
//     a second one beside it.
//
// IT TAKES NAMED DEPENDENCIES, the way the stop doors do (`slack/stop-doors.ts`,
// #593), the reaction door does (`gate/reaction-door.ts`, #592) and Turn does
// (`turn/turn.ts`): the Slack client as ONE record of the calls this adapter
// makes, the plan-stream switch as a boolean, and the `[working]` log as a
// function. `Env` never enters — it is turned into that record once, in
// `slack/slack-delivery.ts`, which is also where the 58-field binding record,
// `api.ts` and `assistant.ts` stay.
//
// So the adapter is DRIVEN in `tests/working-signal.test.ts` on a recording
// Slack client. It used to be READ there instead — a `readFileSync` and three
// regexes over this file's source, which could ask whether
// `reportStatus("set", () => setSessionStatus(` appeared in a file and nothing
// else. A regex cannot tell a settle that computes its status from one that
// writes a literal on the way past, and it goes green on an adapter nobody
// calls. What the suite asks now is which status Slack was handed, on which
// thread, for which settlement.
//
// PURE by design: no `Env`, no Workers global, no fetch, so
// `tsconfig.test.json` compiles it.

import { turnSurfaceOf } from "../turn/request";
import type { FooterKind } from "./footer-kind";
import { proposalCardBlocks } from "./proposal-render";
import type { Delivery, DeliveryFailureStage, PostResult, ProposalCard } from "../turn/index";
import { isSubrequestBudgetError, subrequestsUsed } from "../net";
import {
  outcomeOf,
  settledStatus,
  workingSignalLine,
  WORKING_STATUS,
  type SessionStatus,
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
   *  `team` is optional because two doors cannot supply it — the reaction door
   *  (`gate/reaction-door.ts`, built here by `slack/gate.ts`) and the button
   *  door (`slack/interactive.ts`) start from a reaction event and a button
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

/** One card in the plan stream's checklist. Structurally `api.ts`'s
 *  `TaskChunk`, restated here so the pure adapter does not import the module
 *  that holds `Env`. */
export interface PlanTask {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "complete" | "error";
}

/**
 * Every Slack call this adapter makes, as one record.
 *
 * It is the Slack CLIENT, not Slack's API surface: each method is named for
 * what the adapter wants rather than for the endpoint that serves it, and the
 * envelope decides which `api.ts` / `assistant.ts` function answers it. That is
 * what lets a recording stand-in answer the same questions — a fake shaped like
 * the endpoints would have to re-implement the endpoints to be honest.
 *
 * Every method is BEST-EFFORT ONLY WHERE THE ADAPTER SAYS SO: the swallowing is
 * written below, at each call, so a test can hand in a client that refuses and
 * see what the turn does about it.
 */
export interface SlackDeliveryClient {
  /** React on a message. */
  addReaction(channel: string, ts: string, name: string): Promise<void>;
  /** Take a reaction back off. */
  removeReaction(channel: string, ts: string, name: string): Promise<void>;
  /** A plain message: the narration fallback, the note, the proposal card. */
  postMessage(input: {
    channel: string;
    text: string;
    thread_ts?: string;
    blocks?: unknown[];
  }): Promise<{ ok: boolean; ts?: string }>;
  /** The answer, rendered, footered, split across messages and verified —
   *  `slack/delivery.ts` § `postTextVerified`. Reports what it POSTED, which
   *  is not what it was handed. */
  postAnswer(input: {
    channel: string;
    threadTs?: string;
    text: string;
    recipient: { userId: string; team?: string };
    footerHint?: FooterKind;
    /** ts of a stream already open for this turn: the answer closes it. */
    openStreamTs?: string;
  }): Promise<{ ok: boolean; text: string }>;
  /** The visible failure: the ❌ and the message that says how far it got. */
  postFailure(input: {
    channel: string;
    threadTs?: string;
    userMsgTs: string;
    stage: DeliveryFailureStage;
    err?: unknown;
  }): Promise<void>;
  /** Open a plan-mode stream, or report that none opened. */
  startStream(
    channel: string,
    threadTs: string,
    userId: string,
    team?: string,
  ): Promise<string | null>;
  /** Put a task card into an open stream, or update one already there. */
  appendTask(channel: string, ts: string, task: PlanTask): Promise<void>;
  /** Close a stream. */
  stopStream(channel: string, ts: string): Promise<void>;
  /** Move the agent session's lifecycle status — the working signal itself. */
  setSessionStatus(channel: string, threadTs: string, status: SessionStatus): Promise<StatusResult>;
  /** Name the session, so the conversation is findable in History / Messages. */
  renameSession(channel: string, threadTs: string, title: string): Promise<void>;
}

export interface SlackDeliveryDeps {
  /** Everything this adapter says to Slack. */
  slack: SlackDeliveryClient;

  /** Whether a substantive turn opens a plan-mode stream (`SLACK_STREAM_PLAN`).
   *  A boolean rather than the binding, because "is the flag the string 'on'"
   *  is the envelope's question and there is exactly one right answer to it. */
  planStream: boolean;

  /**
   * Where a `[working]` line goes.
   *
   * A dependency because the LINE IS THE INSTRUMENT (#571): the whole point of
   * the pairing is that a `set` with no `clear` after it is an invocation that
   * died before delivery, and an instrument nothing can read is not one. In the
   * Worker this is `console`; in the suite it is an array, which is what makes
   * "a refused set still reports" a thing a test can see rather than a thing a
   * regex can look for.
   *
   * Required, not defaulted: an optional dependency nobody passes is the shape
   * of #578 (`turn/delivery.ts` § `withWorkingSignal` tells that story).
   */
  logWorking(line: string, outcome: WorkingSignalOutcome): void;
}

/** The Worker's `logWorking`: the happy line at log level, everything else at
 *  warn, which is the split a log reader filters on. */
export function consoleWorkingLog(line: string, outcome: WorkingSignalOutcome): void {
  if (outcome.kind === "ok") console.log(line);
  else console.warn(line);
}

/** A thread title from the opening question: one line, trimmed to something a
 *  sidebar can show. Slack truncates anyway; doing it here keeps the ellipsis
 *  on a word boundary.
 *
 *  It lives with the adapter that sends it — naming a thread from a question is
 *  presentation, and this is the one caller. */
export function threadTitleFrom(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine) return "Chat with UNO Bot";
  if (oneLine.length <= 60) return oneLine;
  const cut = oneLine.slice(0, 60);
  const brk = cut.lastIndexOf(" ");
  return `${brk > 30 ? cut.slice(0, brk) : cut}…`;
}

/** Assistant threads are IM channels (id starts with "D"). Gates the title,
 *  which is the one affordance that belongs to the assistant surface alone.
 *
 *  The rule itself is `turn/request.ts` § `turnSurfaceOf`, which is what every
 *  caller of Turn reads it from — one statement, so a surface cannot be read
 *  one way when the request is built and another way here. */
export function isAssistantThread(channel: string): boolean {
  return turnSurfaceOf(channel) === "assistant";
}

/**
 * Make one status call and leave its verdict in the log.
 *
 * Still best-effort — nothing here can fail a turn that already did its work —
 * but the swallow is no longer silent, and it reports on SUCCESS too. That is
 * the whole instrument: Slack's own refusals were always logged by api.ts, so
 * what a stuck indicator needed was evidence of the cases that produce no Slack
 * response at all. A `set` line with no `clear` line after it is an invocation
 * that died before delivery (#571).
 *
 * That pairing is the claim, and it is the only one made here: a surface with
 * no thread raises nothing and so reports neither half, which is why absence is
 * read as a BROKEN PAIR rather than as absence.
 *
 * @param phase - Which half of the pairing this is
 * @param call - The status call to make
 * @param log - Where the line goes
 */
async function reportStatus(
  phase: WorkingSignalPhase,
  call: () => Promise<StatusResult>,
  log: SlackDeliveryDeps["logWorking"],
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
  log(workingSignalLine(phase, outcome, spent), outcome);
}

export function deliveryAdapter(deps: SlackDeliveryDeps, target: SlackDeliveryTarget): Delivery {
  const { slack, logWorking } = deps;
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
    await slack.appendTask(channel, ts, { ...planCurrent, status }).catch(() => {});
    planTs = null;
    return ts;
  };

  const endProgress = async (outcome: "complete" | "error"): Promise<void> => {
    const ts = await settlePlan(outcome);
    if (ts) await slack.stopStream(channel, ts).catch(() => {});
  };

  return {
    async react(emoji) {
      await slack.addReaction(channel, userMsgTs, emoji).catch(() => {});
    },

    async removeReaction(emoji) {
      // Best-effort, like every other reaction call: a reaction that would not
      // come off is not worth a turn.
      await slack.removeReaction(channel, userMsgTs, emoji).catch(() => {});
    },

    async setWorking({ status, titleFrom }) {
      // Moving the session to `processing` IS the working signal — the
      // documented one — and it is also what opens the SESSION: the reference
      // gives `title` and `initiator_user_id` as the arguments used "when
      // creating new sessions", which is a session coming into being, not a
      // thread root being posted. A thread is all it needs: the DM-only
      // condition that used to stand here decided for Slack
      // which surfaces can show a status, and the cost of guessing wrong was a
      // channel thread with an indicator nobody could take down. Ask, and let
      // the API decline where it wants to — a rejection here is a signal that
      // did not appear, which is exactly what the condition was for.
      if (!replyTs) return;
      // `status` is now a request to raise the signal, not the words to raise
      // it with: `agents.sessions.setStatus` takes a lifecycle value out of a
      // closed set and no text (#574). The port keeps the string because the
      // turn and both Gate doors express the same intent through it, and
      // because a port that named Slack's enum would be Slack leaking upward.
      if (status) {
        await reportStatus(
          "set",
          () => slack.setSessionStatus(channel, replyTs, WORKING_STATUS),
          logWorking,
        );
      }
      // The title is the DM surface's alone: it is how a conversation is found
      // again in History / Messages, and a channel thread has no such name to
      // set.
      if (titleFrom && isAssistantThread(channel)) {
        // Title the session from the question that started it. Slack: "Set the
        // title initially to capture the first question from the user."
        await slack.renameSession(channel, replyTs, threadTitleFrom(titleFrom)).catch(() => {});
      }
    },

    async clearWorking(settlement) {
      // Settling the session is the clear, and it is now the ONLY clear: the
      // migration guide is explicit that "Unlike `assistant.threads.setStatus`,
      // the loading UX no longer disappears automatically when your app posts a
      // message to the thread", so the answer landing no longer takes the
      // indicator down. A session left in `processing` stays there for the hour
      // Slack takes to time it out (#574).
      //
      // It goes wherever the set went — same condition, or the pairing is a set
      // on one surface and a clear on another. WHICH settled status is
      // `settledStatus`'s decision, not a literal here: the turn hands over
      // what it left behind and the pure module picks the lifecycle word, so a
      // thread waiting on a ✅ settles to `suspended` rather than claiming to
      // be idle (#575).
      if (!replyTs) return;
      await reportStatus(
        "clear",
        () => slack.setSessionStatus(channel, replyTs, settledStatus(settlement)),
        logWorking,
      );
    },

    async beginProgress(label) {
      // An early stream is only honest in plan mode: with plain text there is
      // nothing to put in it and the client renders an empty bubble for the
      // whole run (tried, reverted — see api.ts).
      if (!deps.planStream || !replyTs) return;
      planTs = await slack.startStream(channel, replyTs, target.userId, target.team);
      if (!planTs) return;
      planCurrent = { id: "understand", title: label };
      await slack
        .appendTask(channel, planTs, { ...planCurrent, status: "in_progress" })
        .catch(() => {});
    },

    endProgress,

    postInterim(text) {
      if (planTs) {
        // Each narration line is its own card, and the previous one is closed
        // by re-sending its id with status complete — that is what makes it
        // read as progress rather than as a list of things all still happening.
        const open = planTs;
        void slack.appendTask(channel, open, { ...planCurrent, status: "complete" });
        planCurrent = { id: `step-${++planStep}`, title: text.slice(0, 120) };
        void slack.appendTask(channel, open, { ...planCurrent, status: "in_progress" });
        return;
      }
      void slack
        .postMessage({
          channel,
          thread_ts: replyTs,
          text: `:hourglass_flowing_sand: ${text}`,
        })
        .catch(() => {});
    },

    async postAnswer(text): Promise<PostResult> {
      // The answer CLOSES the checklist's stream instead of opening a second
      // one beside it.
      const openStream = await settlePlan("complete");
      try {
        const posted = await slack.postAnswer({
          channel,
          threadTs: replyTs,
          text,
          // The recipient pair. The plan stream above has always passed it;
          // the answer path could not, because this was the only place holding
          // the ids and it never handed them over (#572).
          recipient: { userId: target.userId, team: target.team },
          footerHint: target.footerHint,
          ...(openStream ? { openStreamTs: openStream } : {}),
        });
        return { ok: posted.ok, text: posted.text };
      } catch (err) {
        // The stream was handed over to be closed INTO the answer. If the post
        // threw before it got there, nobody else holds its ts — and a stream
        // left open renders as a live "typing" bubble that never settles.
        if (openStream) await slack.stopStream(channel, openStream).catch(() => {});
        throw err;
      }
    },

    async postNote(text): Promise<PostResult> {
      const posted = await slack
        .postMessage({ channel, thread_ts: replyTs, text })
        .catch(() => ({ ok: false as const }));
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
      let posted = await slack.postMessage({
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
        posted = await slack.postMessage({ channel, thread_ts: replyTs, text: card.text });
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
      await slack.postFailure({ channel, threadTs: replyTs, userMsgTs, stage, err });
    },
  };
}
