// The blueprint check as Slack shows it: the offer under a milestone's card,
// the Check it press, and the one message that says how the check is going
// (#1321).
//
// THE OFFER'S MESSAGE IS THE CHECK'S STATUS MESSAGE. It goes up as the offer
// ("this changes how *Call-off* works today — check it against the
// blueprint?") with a Check it button and its deadline; a press edits it to
// the checking line; the job edits it to what the check came to
// (`checkedMessage`). One ts for the check's whole life — the offer's
// (`BlueprintCheckOffer.offerTs`) — which is where a Stop button or a result's
// action finds it.
//
// ANYONE IN THE THREAD MAY PRESS: the check only reads, and what it posts is
// follow-ups. The thread's one check of a scenario is claimed at the press
// (`ThreadState.claimComparison`), so of two presses one runs it and the
// other is told, to them alone. The press only claims, edits and queues: it
// runs inside `waitUntil`, and the check is a runner job of its own
// (`blueprintCheckRunnerKey`), never the thread's.
//
// THE DEADLINE IS THE CARD RULE. Check it stops answering at
// `BlueprintCheckOffer.expiresAt` — `cardExpiresAt` from when the offer went
// up — and says so (`deadlineBlock`); a press past it checks nothing, and the
// offer loses its button.
//
// Pure apart from its named dependencies: no `Env`, no fetch.

import { blueprintCheckRunnerKey, type CheckOutcome } from "../blueprint-upkeep/check";
import type { BlueprintCheckOffer, ThreadState } from "../thread-state/index";
import type { CheckOfferNote } from "../turn/index";
import type { RunnerJobPayload } from "./types";
import type { CardMessage } from "./button-door";
import { deadlineBlock, withDeadline } from "./card-deadline";
import { escapeSlackText, SLACK_USER_ID } from "./mrkdwn";

/** The Check it button's action id. */
export const CHECK_IT_ACTION_ID = "uno_blueprint_check";

const scenarioOf = (scenario: string) => `*${escapeSlackText(scenario)}*`;

/** The offer's words, without its deadline: the card is named only where
 *  one waits above the offer — a hand-off to the IDE stages none. */
function offerWords(scenario: string, underCard: boolean): string {
  const meanwhile = underCard ? "; review the card meanwhile." : ".";
  return `This changes how ${scenarioOf(scenario)} works today — check it against the blueprint? Takes a few minutes${meanwhile}`;
}

/**
 * The offer as Slack gets it: its words, its deadline, and Check it. The
 * button's value is nothing the press needs — the message's own ts names the
 * offer — so no idea text ever rides on it.
 *
 * @param offer - The scenario, the deadline, and whether a card waits above it
 */
export function checkOfferMessage(offer: CheckOfferNote): CardMessage {
  const words = offerWords(offer.scenario, offer.underCard);
  return {
    text: withDeadline(words, offer.expiresAt),
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: words } },
      deadlineBlock(offer.expiresAt),
      {
        type: "actions",
        elements: [
          { type: "button", action_id: CHECK_IT_ACTION_ID, text: { type: "plain_text", text: "Check it", emoji: true }, value: "check" },
        ],
      },
    ],
  };
}

/** A message that is one line of mrkdwn and nothing to press. */
function line(text: string): CardMessage {
  return { text, blocks: [{ type: "section", text: { type: "mrkdwn", text } }] };
}

/**
 * The offer once Check it was pressed: the check is running, who asked, and
 * that the card stands.
 *
 * @param scenario - The scenario being checked
 * @param by - Who pressed Check it
 */
export function checkingMessage(scenario: string, by: string): CardMessage {
  const who = SLACK_USER_ID.test(by) ? ` <@${by}> asked.` : "";
  return line(`Checking ${scenarioOf(scenario)} against today's blueprint…${who} The results will follow in this thread; your card isn't affected.`);
}

/**
 * The status message once the check is over.
 *
 * @param scenario - The scenario checked
 * @param outcome - What the check came to
 */
export function checkedMessage(scenario: string, outcome: CheckOutcome): CardMessage {
  if (outcome.kind === "done") return line(`Checked ${scenarioOf(scenario)} against today's blueprint. The results are below.`);
  const why = outcome.reason === "unreadable" ? ` Today's ${scenarioOf(scenario)} path couldn't be read.` : "";
  return line(`The blueprint check didn't finish.${why} Your card isn't affected.`);
}

/** Said to the presser alone when the offer's deadline has passed. */
export const CHECK_EXPIRED_REPLY = "That offer expired, so nothing was checked. Your card isn't affected.";
/** Said to the presser alone when the store holds no such offer. */
export const CHECK_GONE_REPLY = "That offer is no longer available, so nothing was checked.";
/** Said to the presser alone when the thread's check of the scenario is
 *  already claimed. */
export function alreadyCheckedReply(scenario: string): string {
  return `${scenarioOf(scenario)} is already being checked in this thread — the results post here.`;
}

// ── The press ────────────────────────────────────────────────────────────────

/** A press on Check it, in the facts the envelope has. */
export interface CheckItPress {
  channel: string;
  /** The offer's own message: the record's key, and what the press edits. */
  offerTs: string;
  userId: string;
}

export interface CheckItDoorDeps {
  store: Pick<ThreadState, "getCheckOffer" | "claimComparison">;
  /** Queue a runner job under a runner name. */
  enqueue(job: RunnerJobPayload, runnerKey: string): Promise<void>;
  /** Redraw the offer's message where it was pressed. */
  replaceOffer(message: CardMessage): Promise<void>;
  /** Answer the presser alone, where they pressed. */
  replyEphemeral(text: string): Promise<void>;
  now?(): number;
}

/**
 * One Check it press: the thread's check of the scenario claimed, the offer
 * edited to the checking line, and the check queued on a runner of its own.
 * Past the deadline, for an offer the store no longer holds, or for a check
 * already claimed in the thread, nothing is queued and the presser is told.
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
    await deps.replyEphemeral(CHECK_EXPIRED_REPLY);
    await deps.replaceOffer(line(`${offerWords(offer.scenario, !!offer.cardTs)}\nExpired.`));
    return;
  }
  if (!(await deps.store.claimComparison(conversationOf(offer), offer.scenario))) {
    await deps.replyEphemeral(alreadyCheckedReply(offer.scenario));
    return;
  }
  // The checking line goes up before the job is queued, so the job's own
  // edit when it is done can never be overwritten by this one.
  await deps.replaceOffer(checkingMessage(offer.scenario, press.userId));
  await deps.enqueue({ kind: "blueprint-check", offerTs: offer.offerTs, by: press.userId }, blueprintCheckRunnerKey(offer.channel, offer.offerTs));
}

/** The conversation an offer's claim is kept under. */
function conversationOf(offer: BlueprintCheckOffer): { channel: string; thread: string } {
  return { channel: offer.channel, thread: offer.threadTs };
}
