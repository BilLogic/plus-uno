// The blueprint check as Slack shows it: the offer under a milestone's card,
// the Check it press, Stop, and the one message that says how the check is
// going (#1321, #1322).
//
// THE OFFER'S MESSAGE IS THE CHECK'S STATUS MESSAGE. It goes up as the offer
// ("this changes how *Call-off* works today — check it against the
// blueprint?") with a Check it button; a press edits it to
// the checking line, with Stop; the job edits it to what the check came to
// (`checkedMessage`: done, or failed with Try again); Stop edits it to the
// stopped line, with Check again. One ts for the check's whole life — the
// offer's (`BlueprintCheckOffer.offerTs`) — which is where every button on it,
// and a result's action, finds the check.
//
// ONE OWNER PER EDIT. The thread's record of the check (`ThreadState`
// `claimCheck` / `stepCheck`, one transaction each) decides who writes the
// message next: the press that claimed writes the checking line; the job
// writes done or failed only after its own step to that state took; Stop
// writes the stopped line only after its step took. So a Stop and the job's
// finish never both land, and a stopped run's late job writes nothing.
//
// ANYONE IN THE THREAD MAY PRESS Check it: the check only reads, and what it
// posts is follow-ups. Of two presses one runs it and the other is told, to
// them alone. Check again (after Stop) and Try again (after a failure) are
// the same button under other words: they claim the check anew. The press
// only claims, edits and queues: it runs inside `waitUntil`, and the check is
// a runner job of its own (`blueprintCheckRunnerKey`), never the thread's.
//
// STOP is for the person who pressed Check it and the card's requester;
// anyone else is told who can, privately, and the check carries on.
//
// THE DEADLINE IS THE CARD RULE. Check it (and so Check again and Try again)
// stops answering at `BlueprintCheckOffer.expiresAt` — `cardExpiresAt` from
// when the offer went up — without saying when; a press past it
// checks nothing, and the offer loses its button.
//
// THE RESULTS CARRY THEIR ACTION (#1323). The follow-up with today's steps
// beside the idea's has one button, by the card's state when it posted: Add
// these notes to the card while it waits, Update the Roadmap page once it was
// approved, none once it was cancelled or expired. A press reads the state
// again (`cardNow`) and does what fits it then, through Turn's own staging
// (`stageFromButton`). Its deadline is the card rule's from when the results
// posted. Who may press: for the notes, whoever may confirm the waiting card,
// since the revision is held to that card's confirmers; for the page, the
// PRD's requester, whose ✅ created it.
//
// Pure apart from its named dependencies: no `Env`, no fetch.

import {
  blueprintCheckRunnerKey,
  cardNow,
  checkRefOf,
  pageUpdateWithNotes,
  prdWithNotes,
  type CheckOutcome,
  type CheckResults,
  type ResultsAction,
} from "../blueprint-upkeep/check";
import { cardConfirmers, mayConfirm, type BlueprintCheckOffer, type PendingProposal, type ThreadState } from "../thread-state/index";
import type { ButtonStaging, CheckOfferNote } from "../turn/index";
import { revisionRefusal } from "../gate/refusal";
import type { RunnerJobPayload } from "./types";
import type { CardMessage } from "./button-door";
import { escapeSlackText, SLACK_USER_ID } from "./mrkdwn";

/** The Check it button's action id: also Check again and Try again. */
export const CHECK_IT_ACTION_ID = "uno_blueprint_check";
/** The Stop button's action id, on the checking line. */
export const STOP_CHECK_ACTION_ID = "uno_blueprint_check_stop";

const scenarioOf = (scenario: string) => `*${escapeSlackText(scenario)}*`;

/** The offer's words, without its deadline: the card is named only where
 *  one waits above the offer — a hand-off to the IDE stages none. */
function offerWords(scenario: string, underCard: boolean): string {
  const meanwhile = underCard ? "; review the card meanwhile." : ".";
  return `This changes how ${scenarioOf(scenario)} works today — check it against the blueprint? Takes a few minutes${meanwhile}`;
}

/** A button. Its value is nothing a door needs — the message's own ts names
 *  the offer — so no idea text ever rides on it. */
function button(actionId: string, label: string, value: string) {
  return { type: "button", action_id: actionId, text: { type: "plain_text", text: label, emoji: true }, value };
}

/**
 * The offer as Slack gets it: its words and Check it.
 *
 * @param offer - The scenario, the deadline, and whether a card waits above it
 */
export function checkOfferMessage(offer: CheckOfferNote): CardMessage {
  const words = offerWords(offer.scenario, offer.underCard);
  return {
    text: words,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: words } },
      { type: "actions", elements: [button(CHECK_IT_ACTION_ID, "Check it", "check")] },
    ],
  };
}

/** A message that is one line of mrkdwn, and its one button when it has one. */
function line(text: string, action?: ReturnType<typeof button>): CardMessage {
  return {
    text,
    blocks: [{ type: "section", text: { type: "mrkdwn", text } }, ...(action ? [{ type: "actions", elements: [action] }] : [])],
  };
}

/** What the check's words need of its offer: the scenario, and whether it
 *  was offered under a card. A hand-off's offer (#1324) has none, so its
 *  words never mention one. */
export type CheckSubject = Pick<BlueprintCheckOffer, "scenario" | "cardTs">;

/** " Your card isn't affected." under a card; nothing without one. */
function cardStands(offer: CheckSubject): string {
  return offer.cardTs ? " Your card isn't affected." : "";
}

/**
 * The offer once Check it was pressed: the check is running, who asked, that
 * the card stands, and Stop.
 *
 * @param offer - The offer being checked
 * @param by - Who pressed Check it
 */
export function checkingMessage(offer: CheckSubject, by: string): CardMessage {
  const who = SLACK_USER_ID.test(by) ? ` <@${by}> asked.` : "";
  const follow = offer.cardTs ? "The results will follow in this thread; your card isn't affected." : "The results will follow in this thread.";
  return line(`Checking ${scenarioOf(offer.scenario)} against today's blueprint…${who} ${follow}`, button(STOP_CHECK_ACTION_ID, "Stop", "stop"));
}

/**
 * The status message once Stop took, with Check again.
 *
 * @param offer - The offer that was being checked
 */
export function stoppedMessage(offer: CheckSubject): CardMessage {
  return line(`Stopped the blueprint check.${cardStands(offer)}`, button(CHECK_IT_ACTION_ID, "Check again", "check"));
}

/**
 * The status message once the check is over: done, which loses Stop as the
 * results go up, or failed, with Try again.
 *
 * @param offer - The offer checked
 * @param outcome - What the check came to
 */
export function checkedMessage(offer: CheckSubject, outcome: CheckOutcome): CardMessage {
  if (outcome.kind === "done") return line(`Checked ${scenarioOf(offer.scenario)} against today's blueprint. The results are below.`);
  const why =
    outcome.reason === "unreadable"
      ? `. Today's ${scenarioOf(offer.scenario)} path couldn't be read.`
      : outcome.reason === "timed-out"
        ? " — it ran too long."
        : ".";
  return line(`The blueprint check didn't finish${why}${cardStands(offer)}`, button(CHECK_IT_ACTION_ID, "Try again", "check"));
}

/**
 * Said to the presser alone when the offer's deadline has passed.
 *
 * @param offer - The offer pressed
 */
export function checkExpiredReply(offer: CheckSubject): string {
  return `That offer expired, so nothing was checked.${cardStands(offer)}`;
}
/** Said to the presser alone when the store holds no such offer. */
export const CHECK_GONE_REPLY = "That offer is no longer available, so nothing was checked.";
/**
 * Said to the presser alone when the check's job could not be queued; the
 * message offers Try again.
 *
 * @param offer - The offer pressed
 */
export function checkNotStartedReply(offer: CheckSubject): string {
  return `I couldn't start the blueprint check — try again in a moment.${cardStands(offer)}`;
}
/** Said to the presser alone when the thread's check of the scenario is
 *  already running. */
export function alreadyCheckedReply(scenario: string): string {
  return `${scenarioOf(scenario)} is already being checked in this thread — the results post here.`;
}
/** Said to whoever pressed Stop once the check finished. */
export const CHECK_FINISHED_REPLY = "That check already finished — the results are in the thread.";
/** Said to whoever pressed Stop on a check that is not running. */
export const CHECK_NOT_RUNNING_REPLY = "That check isn't running, so there was nothing to stop.";

/**
 * Said to someone who may not stop the check: who may, each a Slack user id
 * mentioned once (the markup sanitizer keeps nothing else).
 *
 * @param may - The presser and the card's requester
 */
export function notAStopperReply(may: ReadonlyArray<string | undefined>): string {
  const who = [...new Set(may.filter((id): id is string => !!id && SLACK_USER_ID.test(id)))].map((id) => `<@${id}>`);
  return who.length ? `Only ${who.join(" or ")} can stop this check.` : "Nobody here can stop this check.";
}

// ── The press ────────────────────────────────────────────────────────────────

/** A press on the status message, in the facts the envelope has. */
export interface CheckPress {
  channel: string;
  /** The offer's own message: the record's key, and what the press edits. */
  offerTs: string;
  userId: string;
}

/** A press on Check it, Check again or Try again. */
export type CheckItPress = CheckPress;

export interface CheckItDoorDeps {
  store: Pick<ThreadState, "getCheckOffer" | "claimCheck" | "stepCheck">;
  /** Queue a runner job under a runner name: whether it was queued. */
  enqueue(job: RunnerJobPayload, runnerKey: string): Promise<boolean>;
  /** Redraw the offer's message where it was pressed. */
  replaceOffer(message: CardMessage): Promise<void>;
  /** Answer the presser alone, where they pressed. */
  replyEphemeral(text: string): Promise<void>;
  now?(): number;
}

/**
 * One Check it press: the thread's check of the scenario claimed as a new run,
 * the offer edited to the checking line, and the check queued on a runner of
 * its own. Past the deadline, for an offer the store no longer holds, or for
 * a check already running in the thread, nothing is queued and the presser
 * is told. A check that finished is checked again. A job the runner refuses fails the run: the presser is
 * told, and the message offers Try again.
 *
 * @param press - Who pressed, on which offer
 * @param deps - The store, the runner, and the two Slack replies
 */
export async function runCheckItDoor(press: CheckItPress, deps: CheckItDoorDeps): Promise<void> {
  const offer = await deps.store.getCheckOffer(press.offerTs);
  if (!offer) {
    await deps.replyEphemeral(CHECK_GONE_REPLY);
    await deps.replaceOffer(line("Expired."));
    return;
  }
  if ((deps.now ?? Date.now)() > offer.expiresAt) {
    console.log(`[blueprint-check] press on ${press.channel}/${press.offerTs} after its deadline`);
    await deps.replyEphemeral(checkExpiredReply(offer));
    await deps.replaceOffer(line(`${offerWords(offer.scenario, !!offer.cardTs)}\nExpired.`));
    return;
  }
  const ref = checkRefOf(offer);
  const claim = await deps.store.claimCheck(ref, offer.scenario, { by: press.userId, statusTs: offer.offerTs });
  if (claim.state !== "claimed") {
    await deps.replyEphemeral(alreadyCheckedReply(offer.scenario));
    return;
  }
  // The checking line goes up before the job is queued, so the job's own
  // edit when it is done can never be overwritten by this one.
  await deps.replaceOffer(checkingMessage(offer, press.userId));
  const job: RunnerJobPayload = { kind: "blueprint-check", offerTs: offer.offerTs, by: press.userId, run: claim.run };
  const queued = await deps.enqueue(job, blueprintCheckRunnerKey(offer.channel, offer.offerTs)).catch((err: unknown) => {
    console.error(`[blueprint-check] queueing ${offer.channel}/${offer.offerTs} threw: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  });
  if (queued) return;
  if (await deps.store.stepCheck(ref, offer.scenario, claim.run, "failed")) {
    await deps.replaceOffer(checkedMessage(offer, { kind: "failed", reason: "error" }));
  }
  await deps.replyEphemeral(checkNotStartedReply(offer));
}

// ── Stop ─────────────────────────────────────────────────────────────────────

export interface StopCheckDoorDeps {
  store: Pick<ThreadState, "getCheckOffer" | "getCheck" | "stepCheck">;
  /** Abort the run's model call in flight, on the check's own runner.
   *  Best-effort: the record already says stopped, which is what the job
   *  obeys. */
  cancel(offer: BlueprintCheckOffer, run: string): Promise<void>;
  /** Redraw the offer's message where it was pressed. */
  replaceOffer(message: CardMessage): Promise<void>;
  /** Answer the presser alone, where they pressed. */
  replyEphemeral(text: string): Promise<void>;
}

/**
 * One Stop press. From the presser of Check it or the card's requester, a
 * running check is stopped: its run marked so, its model call aborted, and
 * the message edited to the stopped line with Check again. Anyone else is
 * told who can stop it, and the check carries on. A check that already
 * finished, or is not running, is left as it is, and the presser told.
 *
 * @param press - Who pressed, on which offer
 * @param deps - The store, the check's runner, and the two Slack replies
 */
export async function runStopCheckDoor(press: CheckPress, deps: StopCheckDoorDeps): Promise<void> {
  const offer = await deps.store.getCheckOffer(press.offerTs);
  if (!offer) {
    await deps.replyEphemeral(CHECK_GONE_REPLY);
    return;
  }
  const ref = checkRefOf(offer);
  const check = await deps.store.getCheck(ref, offer.scenario);
  // The record's status message is this one: a check of the same scenario
  // under another offer is not this message's to stop.
  if (!check || check.statusTs !== offer.offerTs || check.state !== "running") {
    await deps.replyEphemeral(check?.state === "done" ? CHECK_FINISHED_REPLY : CHECK_NOT_RUNNING_REPLY);
    return;
  }
  if (press.userId !== check.by && press.userId !== offer.requesterUserId) {
    await deps.replyEphemeral(notAStopperReply([check.by, offer.requesterUserId]));
    return;
  }
  if (!(await deps.store.stepCheck(ref, offer.scenario, check.run, "stopped"))) {
    // It finished, or failed, between the read and the step: its own words
    // are on the message.
    await deps.replyEphemeral(CHECK_NOT_RUNNING_REPLY);
    return;
  }
  await deps.replaceOffer(stoppedMessage(offer));
  await deps.cancel(offer, check.run).catch((err: unknown) => {
    console.warn(`[blueprint-check] cancel of ${offer.channel}/${offer.offerTs} not delivered: ${err instanceof Error ? err.message : String(err)}`);
  });
}

// ── The results and their action (#1323) ─────────────────────────────────────

/** Add these notes to the card: the button's action id. */
export const ADD_NOTES_ACTION_ID = "uno_blueprint_add_notes";
/** Update the Roadmap page: the button's action id. */
export const UPDATE_PAGE_ACTION_ID = "uno_blueprint_update_page";

const ACTION_BUTTONS: Readonly<Record<ResultsAction, { actionId: string; label: string }>> = {
  "add-notes": { actionId: ADD_NOTES_ACTION_ID, label: "Add these notes to the card" },
  "update-page": { actionId: UPDATE_PAGE_ACTION_ID, label: "Update the Roadmap page" },
};

/** The action a results button's id names, or null. */
export function resultsActionOf(actionId: string): ResultsAction | null {
  for (const [action, button] of Object.entries(ACTION_BUTTONS)) if (button.actionId === actionId) return action as ResultsAction;
  return null;
}

/**
 * The results as Slack gets them: their words, then — while they offer an
 * action — its button; or, once acted on or past it, a line
 * saying what became of it. The button's value is the offer's ts: the words
 * are kept on the offer, never on the button.
 *
 * @param offerTs - The offer the results answer
 * @param results - Their words, their action and its deadline
 * @param after - What became of the action, said in place of the button
 */
export function resultsMessage(offerTs: string, results: CheckResults, after?: string): CardMessage {
  const button = results.action && !after ? ACTION_BUTTONS[results.action] : null;
  const blocks: unknown[] = [{ type: "markdown", text: results.text }];
  if (button) {
    blocks.push({
      type: "actions",
      elements: [{ type: "button", action_id: button.actionId, text: { type: "plain_text", text: button.label, emoji: true }, value: offerTs }],
    });
  }
  if (after) blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: after }] });
  const text = button ? results.text : after ? `${results.text}\n\n${after}` : results.text;
  return { text, blocks };
}

/** Said to the presser alone when the offer no longer holds its results. */
export const RESULTS_GONE_REPLY = "Those results are no longer available, so nothing was added.";
/** Said to the presser alone past the results' deadline. */
export const RESULTS_EXPIRED_REPLY = "That button expired, so nothing was added. Your card isn't affected.";
/** Said to the presser alone when the card closed without a page to update. */
export const CARD_CLOSED_REPLY = "That card is no longer waiting, so there is nothing to add the notes to.";
/** Said to the presser alone when the card moved while the press was staging. */
export const CARD_MOVED_REPLY = "That card changed just now, so nothing was added. Press again to add the notes to it.";
/** Said to anyone but the requester pressing Update the Roadmap page. */
export function pageRequesterOnlyReply(requester: string): string {
  const who = SLACK_USER_ID.test(requester) ? `<@${requester}>` : "the person who asked for the PRD";
  return `Only ${who} can propose this update to the Roadmap page.`;
}

/** The conversation the offer came up in, which a card it stages is built
 *  and recorded by. */
const conversationOf = (offer: BlueprintCheckOffer): ButtonStaging["conversation"] => ({
  surface: offer.surface,
  ...(offer.conversationType ? { conversationType: offer.conversationType } : {}),
});

const byLine = (userId: string) => (SLACK_USER_ID.test(userId) ? ` — <@${userId}>` : "");

/** A press on a results button, in the facts the envelope has. */
export interface ResultsPress {
  channel: string;
  /** The offer the results answer: the button's value. */
  offerTs: string;
  userId: string;
  action: ResultsAction;
}

export interface ResultsDoorDeps {
  store: Pick<ThreadState, "getCheckOffer" | "getProposalsByThread">;
  /** The Roadmap page a matter's ✅ created, or null (`MatterPages.pageOf`). */
  createdPage(channel: string, matter: string): Promise<string | null>;
  /** Turn's staging of a card a button asked for (`stageFromButton`). */
  stage(ask: ButtonStaging): Promise<PendingProposal | null>;
  /** Redraw the results where they were pressed. */
  replaceResults(message: CardMessage): Promise<void>;
  /** Answer the presser alone, where they pressed. */
  replyEphemeral(text: string): Promise<void>;
  /** The deployment's standing confirmers, for a card with a confirmer set. */
  standingConfirmers?: readonly string[];
  now?(): number;
}

/**
 * One press on a results button: the card's state read again, and the action
 * that fits it now staged — the notes as a revision of the matter's current
 * card, or as an update to the page its ✅ created. The results then say what
 * became of it in place of the button. Past the deadline, with the card
 * closed, or for someone who may not, nothing is staged and the presser is
 * told, to them alone.
 *
 * @param press - Who pressed, on which results
 * @param deps - The store, the created pages, Turn's staging and Slack
 */
export async function runResultsDoor(press: ResultsPress, deps: ResultsDoorDeps): Promise<void> {
  const offer = await deps.store.getCheckOffer(press.offerTs);
  const results = offer?.results;
  if (!offer || !results) {
    await deps.replyEphemeral(RESULTS_GONE_REPLY);
    return;
  }
  const shown: CheckResults = { ...results, action: press.action };
  if ((deps.now ?? Date.now)() > results.expiresAt) {
    await deps.replyEphemeral(RESULTS_EXPIRED_REPLY);
    await deps.replaceResults(resultsMessage(offer.offerTs, shown, "Expired."));
    return;
  }
  const now = await cardNow(offer, deps);
  if (now.kind === "closed") {
    await deps.replyEphemeral(CARD_CLOSED_REPLY);
    await deps.replaceResults(resultsMessage(offer.offerTs, shown, "The card is no longer waiting."));
    return;
  }
  if (now.kind === "waiting") {
    if (!mayConfirm(now.card, press.userId, deps.standingConfirmers)) {
      await deps.replyEphemeral(revisionRefusal(cardConfirmers(now.card, deps.standingConfirmers) ?? [], press.userId));
      return;
    }
    const staged = await deps.stage({
      kind: "revision",
      of: now.card,
      operations: prdWithNotes(now.card, results.text),
      conversation: conversationOf(offer),
    });
    if (!staged) return deps.replyEphemeral(CARD_MOVED_REPLY);
    await deps.replaceResults(resultsMessage(offer.offerTs, shown, `Added to the card${byLine(press.userId)}.`));
    return;
  }
  if (press.userId !== offer.requesterUserId) {
    await deps.replyEphemeral(pageRequesterOnlyReply(offer.requesterUserId));
    return;
  }
  const staged = await deps.stage({
    kind: "separate",
    thread: {
      channel: offer.channel,
      threadTs: offer.threadTs,
      ...(offer.replyTs ? { replyTs: offer.replyTs } : {}),
      userMsgTs: offer.userMsgTs,
      requesterUserId: offer.requesterUserId,
    },
    operations: pageUpdateWithNotes(now.pageUrl, results.text),
    conversation: conversationOf(offer),
  });
  if (!staged) return;
  await deps.replaceResults(resultsMessage(offer.offerTs, shown, `Proposed as an update to the Roadmap page${byLine(press.userId)}.`));
}
