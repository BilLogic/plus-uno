// Slack's Delivery adapter: everything a turn shows a person, in Slack terms.
//
// The turn says what it means — "acknowledge", "I'm working", "still going",
// "here is the answer", "approve this?" — and this file decides how Slack
// renders it. Three renderings live here and nowhere else now:
//
//   • the ONE acknowledgment rule: 👀 off the assistant surface only, because
//     there the working signal, the titled thread and the streamed reply
//     already say it and a fourth signal on one message is noise. The working
//     signal itself is raised on EVERY surface — this once read "never both",
//     which the code has not done since the DM-only condition came off
//     `setWorking` below: a channel turn gets 👀 AND a session status, and that
//     status is what makes Slack's native stop button available in a channel
//     thread at all (#576);
//   • the checklist (GLOSSARY.md). With the plan-stream switch on, a substantive
//     turn opens a stream in `task_display_mode: "plan"` with its first group
//     of lookups, and each lookup lands as a task card — in progress with its
//     group, complete when the next group starts or the turn answers — with
//     the narration that introduced it as its details, so the person reads
//     one filling-in checklist instead of loose messages. Consecutive lookups
//     of one kind share a card, and a routing choice is a card of its own.
//     Off, narration is a small ⏳ message and lookups show nothing. Which it
//     is has never been the turn's business, and now it cannot be;
//   • the answer posted BENEATH the checklist once its stream is stopped.
//     Closing the stream into the answer was the first design, and Slack
//     refuses it: a stream opened in plan mode takes task and plan chunks, and
//     the answer's markdown appended into it is `streaming_mode_mismatch`.
//
// AND THE TWO THINGS A PERSON ACTS ON, since #623: the proposal card and a
// gate verdict both arrive as data and are spelled on the way out —
// `proposal-render.ts` § `renderProposalCard` and `gate-note.ts` §
// `renderGateNote`. That includes what Slack's message-size limits force:
// a batch plan too long for the card posts as its own messages, from here,
// before the card. Turn used to build the mrkdwn and hand back the overflow.
//
// AND THE `[working]` LINE, which moved in from `slack/working-signal.ts`
// (#595). It was carved out of this file because "the adapter that calls them
// stays out of reach of the Node test build" — the classification and the
// formatter were testable there and the thing that called them was not. #594
// ended that, and a module whose only stated reason was a compile boundary that
// no longer exists is a module. What stayed behind is the part with four
// readers, one of them Env-facing: Slack's session-status vocabulary, in
// `slack/session-status.ts`.
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
// PURE by design: no `Env`, no Workers global, no fetch — which is what lets
// the Node suite DRIVE it rather than read it. (Not a compile property: the
// test compile is a glob over `src/**` and types the Workers globals beside the
// Node ones, so it would compile this file either way — see
// `tsconfig.test.json`.)

import { turnSurfaceOf } from "../turn/request";
import type { FooterKind } from "./footer-kind";
import type { AnswerFeedback } from "./feedback";
import { SLACK_TS, turnIdOf } from "../usage/record";
import type { SlackMessageMetadata } from "./api";
import { notedCardBlocks, proposalCardBlocks, renderProposalCard } from "./proposal-render";
import { toPlainText } from "./mrkdwn";
import { cardStaysLive, renderCardNote, renderGateNote } from "./gate-note";
import { whichCardMessage } from "./which-card";
import { planBlock } from "./plan-block";
import { retryValue } from "./try-again";
import type { Presentation, Delivery, DeliveryFailureStage, PostResult, ProposalCard } from "../turn/index";
import { isSubrequestBudgetError, subrequestsUsed } from "../net";
import { SUBREQUEST_CAP } from "../agent/loop-policy";
import { taskCardFor } from "../agent/tool-table";
import { readoutFor, type TaskCardDecision } from "../agent/task-card-readout";
import { threadVisibleSources, type CardSource } from "./card-sources";
import { estateIcon, type SlackIcon } from "./estate-glyphs";
import {
  settledStatus,
  WORKING_STATUS,
  type SessionStatus,
  type StatusResult,
} from "./session-status";

/** How many links one card carries: enough to open the source behind a
 *  claim, few enough that a card stays a line, not a reading list. A lookup
 *  hands over every link it read; the card shows the first of them. */
const MAX_SOURCES = 5;

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
 *  that holds `Env`. Its text is plain text, already through `toPlainText`;
 *  the client only holds it to Slack's chunk limit.
 *
 *  `status` is the three Slack takes. A call announced but not yet started is
 *  `pending` in the adapter's own bookkeeping (`Card` below) and is never
 *  sent: Slack answers `pending` with `invalid_arguments`, and the type is
 *  what keeps it from being sent again. */
export interface PlanTask {
  id: string;
  title: string;
  status: "in_progress" | "complete" | "error";
  /** The line under the title — the narration that introduced the card. */
  details?: string;
  /** What came of it — "4 pages", or the short reason a card ended in error. */
  output?: string;
  /** The links it read that the thread may see (`card-sources.ts`). */
  sources?: CardSource[];
  /** The glyph of the estate it reads (`estate-glyphs.ts`), or none. Not text,
   *  so it rides every update of the card, not only the first: Slack replaces
   *  a card's non-text fields rather than appending to them. */
  icon?: SlackIcon;
}

/** A card as the adapter keeps it: a `PlanTask`, or a call announced and not
 *  yet started — kept so its place, title and details are ready when it
 *  starts, and so a call that never runs can settle as "Not run". */
type Card = Omit<PlanTask, "status"> & { status: PlanTask["status"] | "pending" };

/** One call's part of a card several consecutive calls share. */
interface CallState {
  status: Card["status"];
  /** Its readout, or the reason it failed. */
  output?: string;
  sources?: CardSource[];
  /** It ran and its source failed. */
  failed?: true;
  /** It never ran: refused, most often for the turn's budget. */
  skipped?: true;
}

/** Whether a call has ended, however it ended. */
const settled = (c: CallState): boolean => c.status === "complete" || c.status === "error";

/**
 * What several calls came to, as one card's output: each readout of a call
 * that read something, then how many failed and how many were skipped.
 *
 * @param calls - The calls a card stands for
 * @param lead - What goes before the list when it is not empty
 */
function tally(calls: readonly CallState[], lead = ""): string {
  const read = calls.flatMap((c) => (c.status === "complete" && !c.failed && !c.skipped && c.output ? [c.output] : []));
  const failed = calls.filter((c) => c.failed).length;
  const skipped = calls.filter((c) => c.skipped).length;
  const parts = [...read, ...(failed ? [`${failed} failed`] : []), ...(skipped ? [`${skipped} skipped`] : [])];
  return parts.length ? `${lead}${parts.join(" · ")}` : "";
}

/** The card a checklist opens with, titled with the turn's progress label and
 *  closed when the first lookup starts. */
const OPENING_CARD = "understand";

/** How many task cards one turn's checklist shows, the opening card aside.
 *  Calls past the last fold into one overflow card — a busy turn stays
 *  readable, and every card it does not open is an append it does not spend. */
export const TASK_CARD_CAP = 8;

/** The overflow card's id, beside the `tool-<seq>` ids it stands in for. */
const OVERFLOW_CARD = "tool-more";

/** What a card whose lookup never ran says: refused, or still queued when
 *  the turn answered. */
const SKIPPED = "Skipped";

/** How a card whose lookup's source failed opens its output. */
const FAILED = "Failed";

/** Slack's cap on a plan or task chunk's text. */
const HEADING_CHARS = 256;

/**
 * The checklist's heading, from the ask: one line, inside Slack's chunk cap,
 * cut on a word where one is near. No model call — the ask already says what
 * the turn is for, in the person's own words.
 *
 * @param ask - The person's message, whole
 */
export function checklistHeading(ask: string): string {
  // Plain text first, then the cut: the limit is on what Slack shows.
  const oneLine = toPlainText(ask).replace(/\s+/g, " ").trim();
  if (oneLine.length <= HEADING_CHARS) return oneLine;
  const cut = oneLine.slice(0, HEADING_CHARS - 1);
  const brk = cut.lastIndexOf(" ");
  return `${brk > HEADING_CHARS / 2 ? cut.slice(0, brk) : cut}…`;
}

/** How long an error card's reason may run. A card says THAT a lookup failed
 *  and roughly why; the answer is where a surviving limitation is explained. */
const REASON_CHARS = 120;

/**
 * A tool's error, cut to what an error card can carry: its first line, and no
 * more than a glance's worth of it.
 *
 * @param error - The tool's own error string, or the refusal it was handed
 */
export function shortReason(error: string): string {
  const line = error.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  return line.length > REASON_CHARS ? `${line.slice(0, REASON_CHARS - 1).trimEnd()}…` : line;
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
    metadata?: SlackMessageMetadata;
  }): Promise<{ ok: boolean; ts?: string }>;
  /** The answer, rendered, footered, split across messages and verified —
   *  `slack/delivery.ts` § `postTextVerified`. Reports what it POSTED, which
   *  is not what it was handed. It takes no stream of the checklist's: the
   *  answer is markdown, and a plan-mode stream refuses markdown. */
  postAnswer(input: {
    channel: string;
    threadTs?: string;
    text: string;
    recipient: { userId: string; team?: string };
    footerHint?: FooterKind;
    /** What rides beneath the answer, when the turn left anything. */
    presentation?: Presentation;
    /** The feedback buttons' turn, under a substantive answer. */
    feedback?: AnswerFeedback;
  }): Promise<{ ok: boolean; text: string }>;
  /** The visible failure: the ❌ and the message that says how far it got. */
  postFailure(input: {
    channel: string;
    threadTs?: string;
    userMsgTs: string;
    stage: DeliveryFailureStage;
    err?: unknown;
    /** The question and who asked it, as the Try again button carries them
     *  (`try-again.ts` § `retryValue`). */
    ask?: string;
  }): Promise<void>;
  /** Open a plan-mode stream, or report that none opened. */
  startStream(
    channel: string,
    threadTs: string,
    userId: string,
    team?: string,
  ): Promise<string | null>;
  /** Put task cards into an open stream, or update ones already there — all
   *  in ONE append, because each append is a subrequest and closing one group
   *  while opening the next is one transition, not two. `title` retitles the
   *  checklist (a `plan_update`) in the same append. */
  appendTasks(channel: string, ts: string, tasks: readonly PlanTask[], title?: string): Promise<void>;
  /** Close a stream. `tasks` and `title` are the checklist's last changes,
   *  carried by the stop itself rather than by an append of their own. */
  stopStream(channel: string, ts: string, tasks?: readonly PlanTask[], title?: string): Promise<void>;
  /** Rewrite one of the bot's own messages in place — how a static checklist
   *  settles where no stream could open. */
  updateMessage(input: { channel: string; ts: string; text: string; blocks: unknown[] }): Promise<{ ok: boolean }>;
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
  if (!oneLine) return "Chat with le goat";
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

// ── the `[working]` line, and what it classifies ────────────────────────────
//
// THE GAP IT CLOSES, stated accurately. A Slack refusal was never the untraced
// case: `parseSlackResponse` in api.ts has logged `[slack] <method> failed:
// <error>` on every `ok: false` since long before any of this existed. What was
// silence is the pair either side of it — a clear that SUCCEEDED, and a clear
// that never left the Worker because the invocation died on the free plan's
// external-subrequest cap (SUBREQUEST_CAP) or was hard-killed mid-turn. Neither
// produces a Slack response, so neither produced a line, and a stuck "Working…"
// therefore had three possible causes and one symptom. That is why the same
// artifact kept being diagnosed from screenshots.
//
// So the pairing reports itself EVERY time, success included, carrying the
// turn's external spend. The instrument is not any one line: it is that a `set`
// line with no `clear` line after it means the invocation died before delivery,
// which no amount of failure logging could ever have shown.
//
// ON THE DOUBLE LINE. A refusal now logs twice — api.ts's `[slack]` line owns
// Slack's error, this one owns the phase and the spend — and that is deliberate:
// #571 asks for one line naming WHICH half was refused and its code, and the
// api.ts line knows the method but not whether it was the set or the clear, nor
// what the turn had spent by then.

/** Which half of the pairing spoke: the set that raises the indicator, or the
 *  clear that takes it down. Named in the line because the whole diagnostic is
 *  reading one against the other. */
export type WorkingSignalPhase = "set" | "clear";

/**
 * What a status call came back as.
 *
 * Four kinds because there are four genuinely different things to do about it,
 * and exactly one of them is Slack saying no. Collapsing the rest into
 * "declined" is the misdirection #571 exists to end.
 */
export type WorkingSignalOutcome =
  /** The indicator moved. */
  | { kind: "ok" }
  /** Slack answered, and said no. `error` is its own code — the only kind
   *  entitled to the word "Slack" in its line. */
  | { kind: "declined"; error: string }
  /** The call left the Worker and nothing came back that could be read: a
   *  transport failure or an unparseable body, which api.ts degrades into the
   *  same `{ ok: false, error }` shape a refusal arrives in. Slack may never
   *  have seen it, so the line must not claim Slack refused anything. */
  | { kind: "unanswered"; error: string }
  /** The call never left the Worker: the subrequest budget stopped it. NOT a
   *  Slack failure — the fix is a cheaper turn, not a Slack scope. */
  | { kind: "budget-stop" }
  /** There was no thread to decorate, so nothing was sent. Also not Slack's
   *  word; see `setSessionStatus`, whose guard this comes from. */
  | { kind: "no-thread" };

/**
 * The codes in `error` that did NOT come from Slack.
 *
 * `slackCall` degrades a fetch throw to `network_error` and an unreadable body
 * to `http_<status>` (api.ts), precisely so that every caller can handle one
 * shape. The cost of that kindness is that the shape lies about its origin, and
 * a 502 or a dropped socket reported as "Slack declined: network_error" sends
 * the next person to check app scopes for a problem in the network.
 */
function neverReachedSlack(error: string): boolean {
  return error === "network_error" || error.startsWith("http_");
}

/**
 * Slack's answer as an outcome.
 *
 * @param result - What the Slack client's `setSessionStatus` reported
 */
export function outcomeOf(result: StatusResult): WorkingSignalOutcome {
  if (result.ok) return { kind: "ok" };
  const error = result.error || "unknown";
  if (error === "no_thread") return { kind: "no-thread" };
  if (neverReachedSlack(error)) return { kind: "unanswered", error };
  return { kind: "declined", error };
}

/**
 * The one line a set or a clear leaves behind.
 *
 * `spent` is the turn's EXTERNAL subrequest count at the moment the call was
 * made, against the free plan's cap. It is on every line, including the happy
 * one, because the number is only useful as a series: a clear logged at two
 * short of SUBREQUEST_CAP says the next turn of the same shape will die before
 * it gets here, which is exactly the reading no screenshot could give.
 *
 * @param phase - Which half of the pairing spoke
 * @param outcome - What came back
 * @param spent - External subrequests spent this invocation so far
 */
export function workingSignalLine(
  phase: WorkingSignalPhase,
  outcome: WorkingSignalOutcome,
  spent: number,
): string {
  const budget = `spent=${spent}/${SUBREQUEST_CAP}`;
  switch (outcome.kind) {
    case "ok":
      return `[working] ${phase} ok ${budget}`;
    case "declined":
      return `[working] ${phase} declined by Slack: error=${outcome.error} ${budget}`;
    case "unanswered":
      return `[working] ${phase} got no answer: error=${outcome.error} ${budget}`;
    case "budget-stop":
      return `[working] ${phase} never sent — subrequest budget stopped it ${budget}`;
    case "no-thread":
      return `[working] ${phase} never sent — no thread to decorate ${budget}`;
  }
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

  // The checklist: the opening card the turn's label names, then one task card
  // per lookup. Every card is carried WHOLE — a task update REPLACES the card,
  // so an update that re-sent only an id and a status would wipe the title it
  // went out with.
  //
  // `planOpen` says a checklist was begun; `planTs` is the message it lives in
  // once one exists. They differ on the stream path, which opens its stream
  // with the first group of lookups rather than when progress begins: a stream
  // with nothing in it renders an empty bubble, and a turn that looks nothing
  // up spends no call on a checklist at all.
  let planOpen = false;
  let planTs: string | null = null;
  /** Set once the stream has been asked for, so a refused one is not re-asked. */
  let streamAsked = false;
  // WHERE NO STREAM CAN OPEN — a top-level DM, which has no thread — the same
  // checklist is a static `plan` block instead: posted once when progress
  // begins, rewritten once at settle, and never touched in between, so a turn
  // spends two calls on it however many lookups it makes. `planTs` is then the
  // ts of that message rather than of a stream, and the cards below are kept
  // exactly as the stream path keeps them, so the settle renders whatever they
  // carry.
  let planMode: "stream" | "static" = "stream";
  /** The static checklist's heading, kept for the rewrite. */
  let planTitle = "";
  /** A channel checklist's heading, still to ride the stream's first append. */
  let headingPending: string | null = null;
  /** Every card on the checklist, by id, in the order each first appeared. */
  const cards = new Map<string, Card>();
  /** The one card in progress, if any. */
  let running: string | null = null;
  /** Narration waiting for the card it introduces. */
  let heldDetails: string | null = null;

  // THE CHECKLIST GOES TO SLACK AT GROUP BOUNDARIES, NOT PER LOOKUP. Every
  // Slack call is a subrequest out of the turn's fifty, the same fifty its
  // lookups read from, and a checklist that sent each lookup's start and end
  // spent 21 of them on one turn and left its last blueprint search refused.
  // So a card's state is kept here as it moves, and the checklist is sent when
  // a group of lookups is announced — which closes the group before it and
  // opens this one in one append — and at settle, inside the stop itself. A call announced
  // with its group shows in progress with it: Slack's statuses are in
  // progress, complete or error, and `pending` is refused (`invalid_arguments`,
  // the whole append with it).
  //
  // EVERY APPEND GOES THROUGH THIS ONE CHAIN, and each link is caught: a
  // refused append with no catch is an unhandled rejection in the Worker, and
  // two in flight at once can land in either order. A link carries every
  // change made before it leaves, and a card whose status and text Slack
  // already shows is left out, so an append that would change nothing is never
  // sent. Whoever settles the checklist awaits the chain first.
  //
  // A CARD'S TEXT GOES ONCE. Slack appends a re-sent `details` to the card's
  // existing details rather than replacing it: live, a card read "onboarding"
  // as "onboardingonboarding" after its complete re-sent the same text. So a
  // field already sent for a card is left off its later updates; its status
  // moves every time, its text only when the text is new. Counted as shown
  // once handed over: a refused append leaves the card stuck either way, and
  // re-sending its text would not unstick it.
  let planChain: Promise<void> = Promise.resolve();
  let linkQueued = false;
  /** What each card already shows on Slack: its status and its text. */
  const shown = new Map<string, Partial<Pick<PlanTask, "status" | "title" | "details" | "output" | "sources">>>();

  /** The cards whose status or text Slack does not show yet, as they go out,
   *  noted as shown. A card still pending goes out in progress with its group. */
  const changes = (): PlanTask[] => {
    const out: PlanTask[] = [];
    for (const card of cards.values()) {
      const status: PlanTask["status"] = card.status === "pending" ? "in_progress" : card.status;
      const was = shown.get(card.id);
      const { details, output, sources, ...rest } = card;
      const fresh = {
        ...(details && details !== was?.details ? { details } : {}),
        ...(output && output !== was?.output ? { output } : {}),
        ...(sources?.length && JSON.stringify(sources) !== JSON.stringify(was?.sources) ? { sources } : {}),
      };
      if (was?.status === status && was.title === card.title && !Object.keys(fresh).length) continue;
      shown.set(card.id, { ...was, ...fresh, status, title: card.title });
      out.push({ ...rest, status, ...fresh });
    }
    return out;
  };

  /** Queue one append behind every one already issued, unless one is queued
   *  and not yet run — that one will carry whatever changes before it does.
   *  The stream's first append opens the stream. */
  const flush = (): Promise<void> => {
    if (planMode === "static" || linkQueued) return planChain;
    linkQueued = true;
    planChain = planChain
      .then(async () => {
        linkQueued = false;
        if (!planTs) {
          if (streamAsked || !replyTs) return;
          streamAsked = true;
          planTs = await slack.startStream(channel, replyTs, target.userId, target.team);
          // No stream, no checklist: narration goes back to being posted.
          if (!planTs) {
            planOpen = false;
            return;
          }
        }
        const tasks = changes();
        const heading = headingPending;
        headingPending = null;
        if (tasks.length || heading) await slack.appendTasks(channel, planTs, tasks, heading ?? undefined);
      })
      .catch(() => {});
    return planChain;
  };

  /** Move a card that is on the checklist to a new state. Nothing is sent. */
  const move = (id: string, status: Card["status"], extra: Partial<PlanTask> = {}): void => {
    const card = cards.get(id);
    if (!card) return;
    if (running === id && status !== "in_progress") running = null;
    cards.set(id, { ...card, ...extra, status });
  };

  // THE CAP. The first `TASK_CARD_CAP` cards are shown; every call after
  // them folds into one overflow card, whose count is how many it holds and
  // whose status is theirs taken together — pending while none has started,
  // complete once all have settled, in progress in between. So the checklist
  // never holds more than cap + 1 tool cards.
  /** Each folded call's state, by the card id it would have had. */
  const folded = new Map<string, CallState>();

  /** Redraw the overflow card from the calls folded into it. */
  const drawOverflow = (): void => {
    const states = [...folded.values()];
    const status: Card["status"] = states.every((s) => s.status === "pending")
      ? "pending"
      : states.every(settled)
        ? "complete"
        : "in_progress";
    if (running === OVERFLOW_CARD && status !== "in_progress") running = null;
    const output = tally(states);
    const was = cards.get(OVERFLOW_CARD);
    cards.set(OVERFLOW_CARD, {
      ...(was ?? {}),
      id: OVERFLOW_CARD,
      title: `…and ${folded.size} more`,
      status,
      ...(output ? { output } : {}),
    });
  };

  // CONSECUTIVE LOOKUPS SHARE A STEP. A call of the same tool, routed the same
  // way, as the call admitted just before it joins that call's card while the
  // card is still open — three blueprint searches in one reply read as one
  // step that searched three things, not three steps. A card already settled
  // is not reopened: its output may have gone out, and Slack appends a re-sent
  // output rather than replacing it. So a later reply's search is a new step.
  //
  // A shared card is drawn from its calls: in progress while any is unsettled,
  // then complete, with every call's query as its details and every call's
  // readout as its output. Its details grow only until the card first goes
  // out, for the same reason.
  /** Each call's own state on the card it shares, by card id then call id. */
  const members = new Map<string, Map<string, CallState>>();
  /** Which card each admitted call is on. */
  const cardOf = new Map<string, string>();
  /** The card the last lookup was admitted to, and what a call must match to
   *  join it. */
  let lastLookup: { card: string; key: string } | null = null;

  // A ROUTING DECISION IS A STEP. When a call's code routes it somewhere —
  // which repo, which Notion database (`task-card-readout.ts` § decisions) —
  // and that differs from where the turn last routed a call of the same kind,
  // the choice is a card of its own just before the lookup it routed, settled
  // complete as the lookup starts. It takes a place under the cap like any
  // card; with no room for both, the lookup keeps the place and the decision
  // is left off, since it is a lookup the overflow card counts.
  /** The last choice of each kind, so a repeat is not a new step. */
  const lastDecision = new Map<TaskCardDecision["kind"], string>();
  /** The decision card each call was routed by, by call id. */
  const decisionOf = new Map<string, string>();

  const ownCards = (): number => [...cards.keys()].filter((k) => k !== OPENING_CARD && k !== OVERFLOW_CARD).length;

  /**
   * Put a call on the checklist if it is not there yet — the open card of the
   * call before it when the two are consecutive, its own card while there is
   * room, the overflow card after — and say which card is its.
   */
  const admit = (id: string, card: Card, key: string, decision: TaskCardDecision | null): string => {
    if (folded.has(id)) return OVERFLOW_CARD;
    const known = cardOf.get(id);
    if (known) return known;
    const prior = lastLookup && lastLookup.key === key ? cards.get(lastLookup.card) : undefined;
    if (prior && (prior.status === "pending" || prior.status === "in_progress")) {
      members.get(prior.id)?.set(id, { status: "pending" });
      cardOf.set(id, prior.id);
      if (card.details && !shown.has(prior.id)) {
        cards.set(prior.id, { ...prior, details: [prior.details, card.details].filter(Boolean).join(" · ") });
      }
      return prior.id;
    }
    if (ownCards() >= TASK_CARD_CAP) {
      lastLookup = null;
      folded.set(id, { status: "pending" });
      drawOverflow();
      return OVERFLOW_CARD;
    }
    const decided = decision && lastDecision.get(decision.kind) !== decision.value ? decision : null;
    if (decision) lastDecision.set(decision.kind, decision.value);
    if (decided && ownCards() + 1 < TASK_CARD_CAP) {
      const decisionId = `decision-${id}`;
      cards.set(decisionId, {
        id: decisionId,
        title: toPlainText(decided.title),
        status: "pending",
        ...(card.icon ? { icon: card.icon } : {}),
      });
      decisionOf.set(id, decisionId);
    }
    members.set(id, new Map([[id, { status: "pending" }]]));
    cardOf.set(id, id);
    lastLookup = { card: id, key };
    cards.set(id, card);
    return id;
  };

  /** A shared card, drawn from its calls. Its output and links wait for the
   *  last of them, so each goes out once. */
  const drawShared = (cardId: string, calls: readonly CallState[]): void => {
    if (!calls.every(settled)) {
      const status = calls.every((c) => c.status === "pending") ? "pending" : "in_progress";
      if (cards.get(cardId)?.status !== status) move(cardId, status);
      return;
    }
    const seen = new Set<string>();
    const sources = calls
      .flatMap((c) => c.sources ?? [])
      .filter((s) => !seen.has(s.url) && seen.add(s.url))
      .slice(0, MAX_SOURCES);
    move(cardId, "complete", { output: `${calls.length} lookups${tally(calls, ": ")}`, ...(sources.length ? { sources } : {}) });
  };

  /** Move a call's card — its own, its share of a card it joined, or its
   *  share of the overflow card. */
  const moveCall = (id: string, state: CallState): void => {
    if (folded.has(id)) {
      folded.set(id, state);
      drawOverflow();
      return;
    }
    const cardId = cardOf.get(id);
    const calls = cardId ? members.get(cardId) : undefined;
    if (!cardId || !calls) return;
    calls.set(id, state);
    if (calls.size === 1) {
      move(cardId, state.status, {
        ...(state.output ? { output: state.output } : {}),
        ...(state.sources ? { sources: state.sources } : {}),
      });
    } else drawShared(cardId, [...calls.values()]);
  };

  /** Settle every card still open, send the checklist's final state, and
   *  forget it, so nothing re-uses it. A stream's ts and its last changes come
   *  back for the caller to stop with; a static checklist is rewritten here
   *  and returns none.
   *
   *  A card still in progress settles with the turn. A card still PENDING is
   *  a lookup that never ran — a stopped turn answers with some queued — so it
   *  settles as skipped: a tick beside a read that never happened, with no
   *  word, would claim work nobody did.
   *
   *  AN ANSWERED TURN ENDS COMPLETE, EVERY CARD OF IT. Slack titles a plan
   *  from its cards, and a plan holding one error card reads "Something went
   *  wrong" above the answer that follows it (live 2026-10-11: a search the
   *  budget refused did exactly that). A lookup that failed or was skipped
   *  says so in its output; the answer's ⚠️ line says what it cost. Error is
   *  kept for the turn that died. */
  const settlePlan = async (
    status: "complete" | "error",
  ): Promise<{ ts: string; tasks: PlanTask[]; title?: string } | null> => {
    if (!planOpen) return null;
    planOpen = false;
    for (const card of [...cards.values()]) {
      if (card.status === "in_progress") move(card.id, status);
      else if (card.status === "pending") move(card.id, status, { output: SKIPPED });
    }
    heldDetails = null;
    // A stream still being opened has its chance to land first, so the final
    // state goes into it rather than past it.
    await planChain;
    if (planMode === "static") {
      if (!planTs) return null;
      const ts = planTs;
      planTs = null;
      // The one rewrite, with every card's final state. Best-effort like every
      // card update: a checklist that would not settle is not worth a turn.
      // Nothing for an answer to close, so the answer posts beneath it.
      // Every card has settled above, so none is pending any more.
      const final = [...cards.values()].filter((c): c is PlanTask => c.status !== "pending");
      await slack.updateMessage({ channel, ts, text: planTitle, blocks: [planBlock(planTitle, final)] }).catch(() => {});
      return null;
    }
    if (!planTs) return null;
    const ts = planTs;
    planTs = null;
    const heading = headingPending;
    headingPending = null;
    return { ts, tasks: changes(), ...(heading ? { title: heading } : {}) };
  };

  // The final state rides the stop: `chat.stopStream` takes the same task
  // chunks an append does, so settling spends no call of its own.
  const endProgress = async (outcome: "complete" | "error"): Promise<void> => {
    const last = await settlePlan(outcome);
    if (last) await slack.stopStream(channel, last.ts, last.tasks, last.title).catch(() => {});
  };

  /** Post the static checklist, opening card in progress. A refused post
   *  leaves no checklist, exactly as a refused stream does. */
  const beginStaticPlan = async (label: string): Promise<void> => {
    const opening: PlanTask = { id: OPENING_CARD, title: label, status: "in_progress" };
    const posted = await slack
      .postMessage({ channel, text: label, blocks: [planBlock(label, [opening])] })
      .catch(() => ({ ok: false as const }));
    if (!posted.ok || !("ts" in posted) || !posted.ts) return;
    planOpen = true;
    planMode = "static";
    planTitle = label;
    planTs = posted.ts;
    running = OPENING_CARD;
    cards.set(OPENING_CARD, opening);
  };

  /** A plain post into the thread. A local rather than only a port method,
   *  because `postGateNote` is the same post with the verdict spelled first.
   *  A throw reads as `ok: false`, including a timeout after Slack accepted
   *  the post — so a caller that retries on failure can post twice. The
   *  cut-off note's retry is capped at `CUT_OFF_NOTE_ATTEMPTS` for that. */
  const postNote = async (text: string, tag?: ProposalCard["tag"]): Promise<PostResult> => {
    const posted = await slack
      .postMessage({
        channel,
        thread_ts: replyTs,
        text,
        ...(tag ? { metadata: { event_type: tag.eventType, event_payload: tag.payload } } : {}),
      })
      .catch(() => ({ ok: false as const }));
    return {
      ok: !!posted.ok,
      text,
      ...("ts" in posted && posted.ts ? { ts: posted.ts } : {}),
    };
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
      // No checklist update still in flight when the settle goes.
      await planChain;
      await reportStatus(
        "clear",
        () => slack.setSessionStatus(channel, replyTs, settledStatus(settlement)),
        logWorking,
      );
    },

    async beginProgress(label, ask) {
      // An early checklist is only honest in plan mode: with plain text there
      // is nothing to put in a stream and the client renders an empty bubble
      // for the whole run (tried, reverted — see api.ts).
      if (!deps.planStream) return;
      // DM progress keeps the working label; channel checklists use the ask
      // as their heading so the thread remains identifiable.
      const heading = ask && !isAssistantThread(channel) ? checklistHeading(ask) : "";
      if (!replyTs) {
        await beginStaticPlan(label);
        // A static plan is rewritten once at settle anyway, so its retitle
        // rides that rewrite rather than spending a call of its own.
        if (planTs && heading) planTitle = heading;
        return;
      }
      // Nothing goes to Slack yet: the stream opens with the first group of
      // lookups, and the heading rides its first append.
      planOpen = true;
      running = OPENING_CARD;
      cards.set(OPENING_CARD, { id: OPENING_CARD, title: label, status: "in_progress" });
      if (heading) headingPending = heading;
    },

    endProgress,

    postInterim(text, kind = "narration") {
      if (planOpen) {
        // The backstop line only says the turn is still alive, and with a
        // checklist open the working signal already says so. Held as details
        // it would read as what the next lookup is for, so it is dropped.
        if (kind === "backstop") return;
        // With a checklist open, narration is not a card of its own: it says
        // what the lookups it introduces are for, so it becomes the details of
        // the next card announced. The latest line wins — it is the one written
        // nearest the calls.
        heldDetails = text;
        return;
      }
      void slack
        .postMessage({
          channel,
          thread_ts: replyTs,
          text,
        })
        .catch(() => {});
    },

    toolProgress(event) {
      // No checklist: with the switch off the narration above is the whole of
      // what a person sees, exactly as before there were cards.
      if (!planOpen) return;
      const words = taskCardFor(event.name);
      if (!words) return;
      const id = `tool-${event.seq}`;
      const icon = estateIcon(words.estate, event.args);
      // EVERY WORD ON A CARD IS PLAIN TEXT, passed once as it arrives here —
      // the narration, the query, a tool's output or error, a source's name.
      // Slack shows these fields unparsed, so markup is turned into the words
      // it shows rather than escaped (`mrkdwn.ts` § `toPlainText`, which also
      // says why that is as safe as the escaper against a blanked message).
      // Once, here, because the pass decodes entities and is not idempotent.
      /** The card as a call first puts it on the checklist. */
      const fresh: Card = { id, title: toPlainText(words.title), status: "pending", ...(icon ? { icon } : {}) };
      // Where the call's code routes it, and so what a call must match to
      // share its card: the same tool, routed the same way, reading the same
      // estate — a link read on Figma and one on GitHub keep their own glyphs.
      const decision = readoutFor(event.name)?.decision?.(event.args) ?? null;
      const key = [event.name, icon?.name ?? "", decision ? `${decision.kind}:${decision.value}` : ""].join("|");
      switch (event.phase) {
        case "announced": {
          // What the call looks for, after the narration that introduced it.
          const query = readoutFor(event.name)?.details(event.args) ?? null;
          const details = toPlainText([heldDetails, query].filter(Boolean).join(" · "));
          heldDetails = null;
          admit(id, { ...fresh, ...(details ? { details } : {}) }, key, decision);
          // A group of lookups starting is a boundary: the checklist goes out,
          // carrying the group before it closed and this one open. The whole
          // group is announced in one breath, and its first call starts in the
          // same one, so one append carries all of it.
          void flush();
          return;
        }
        case "started": {
          const card = admit(id, fresh, key, decision);
          // One card in progress at a time: whatever was running — the opening
          // card, on the first lookup — closes. Calls that share a card,
          // folded or consecutive, close nothing as the next starts.
          if (running && running !== card) move(running, "complete");
          running = card;
          // The choice was made as the call went out, so its step is done.
          const decided = decisionOf.get(id);
          if (decided) move(decided, "complete");
          moveCall(id, { status: "in_progress" });
          return;
        }
        case "finished": {
          if (event.error) {
            moveCall(id, { status: "complete", failed: true, output: `${FAILED}: ${shortReason(toPlainText(event.error))}` });
            return;
          }
          // A call folded into the overflow card has no card of its own to
          // carry a readout; only its status counts there.
          const output = event.output ? toPlainText(event.output) : "";
          const sources = threadVisibleSources(event.sources ?? [])
            .slice(0, MAX_SOURCES)
            .map((s) => ({ ...s, text: toPlainText(s.text) }));
          moveCall(id, { status: "complete", ...(output ? { output } : {}), ...(sources.length ? { sources } : {}) });
          return;
        }
        case "refused":
          // Refused before it ran — the budget, most often. Skipped, not
          // failed: nothing went wrong with the source.
          moveCall(id, { status: "complete", skipped: true, output: SKIPPED });
          return;
      }
    },

    async postAnswer(text, presentation): Promise<PostResult> {
      // The checklist settles and its stream stops FIRST, then the answer
      // posts beneath it the ordinary way. The stream's ts is not handed on:
      // the answer is markdown, and markdown appended into a stream opened in
      // plan mode is refused (`streaming_mode_mismatch`) — after which the
      // answer path stopped the stream, stopped it again, and posted anyway.
      await endProgress("complete");
      const posted = await slack.postAnswer({
        channel,
        threadTs: replyTs,
        text,
        // The recipient pair. The plan stream above has always passed it;
        // the answer path could not, because this was the only place holding
        // the ids and it never handed them over (#572).
        recipient: { userId: target.userId, team: target.team },
        footerHint: target.footerHint,
        // Handed on as data: the blocks and the plain list are the posting
        // path's to spell (`slack/result-table-block.ts`).
        ...(presentation ? { presentation } : {}),
        // The usage record's id for this turn, worked out as the turn works it
        // out: a tap on the answer's feedback buttons is filed against it.
        ...(SLACK_TS.test(userMsgTs) ? { feedback: { turnId: turnIdOf(channel, userMsgTs, 0) } } : {}),
      });
      return { ok: posted.ok, text: posted.text };
    },

    postNote,

    // A gate verdict is spelled HERE and nowhere else (#623): every
    // `:hourglass:`, the one `<@user>`, and the line that points at the live
    // card. Gate hands over which verdict it is; `slack/gate-note.ts` says it.
    //
    // A note about a card's own state is edited onto that card instead: its
    // words as posted, the note as its last line, and Review while it can
    // still be decided or View once it cannot. An edit Slack refuses posts the
    // note in the thread as before, so the person is never left with silence.
    async postGateNote(note, card) {
      // "Approve which one?" is the one note that carries buttons: one per
      // card it could mean (`which-card.ts`).
      if (note.kind === "which-card") {
        const message = whichCardMessage(note);
        const posted = await slack
          .postMessage({ channel, thread_ts: replyTs, text: message.text, blocks: message.blocks })
          .catch(() => ({ ok: false as const }));
        return { ok: !!posted.ok, text: message.text, ...("ts" in posted && posted.ts ? { ts: posted.ts } : {}) };
      }
      if (!card) return postNote(renderGateNote(note));
      const line = renderCardNote(note);
      const updated = await slack
        .updateMessage({
          channel,
          ts: card.ts,
          text: card.text,
          blocks: notedCardBlocks(card, line, cardStaysLive(note) ? "Review" : "View"),
        })
        .catch(() => ({ ok: false }));
      if (updated.ok) return { ok: true, text: line, ts: card.ts };
      console.warn(`[slack] gate note could not be edited onto ${channel}/${card.ts}; posting it`);
      return postNote(renderGateNote(note));
    },

    async reopenCard(card) {
      const updated = await slack
        .updateMessage({ channel, ts: card.ts, text: card.text, blocks: card.blocks ?? proposalCardBlocks(card.text) })
        .catch(() => ({ ok: false }));
      if (!updated.ok) console.warn(`[slack] card ${channel}/${card.ts} could not be reopened`);
    },

    async card(card: ProposalCard): Promise<PostResult> {
      // THE CARD ARRIVES AS DATA and is spelled here (#623): the turn decided
      // what a person is being asked to approve, and this is where that becomes
      // mrkdwn, an ⚠️, a confirm footer and a button row.
      const rendered = renderProposalCard(card);
      // A batch too long for one Slack message posts its full plan as its own
      // messages FIRST, so the card — which carries the buttons — stays the
      // last thing in the thread. Slack's size limits are what decide there is
      // anything to send, so the decision is the adapter's and not the turn's.
      for (const message of rendered.followUp ?? []) {
        await slack.postMessage({ channel, thread_ts: replyTs, text: message }).catch(() => ({}));
      }
      // Every card carries ✅ Approve / ⛔ Cancel buttons (2026-08-22). Cards
      // with blocks of their own (the Figma preview) already include them; a
      // text-only card gets the text as sections plus the row. The text is
      // kept alongside as the notification/fallback copy, and it is what the
      // button handler re-renders the card from.
      const blocks = rendered.blocks ?? proposalCardBlocks(rendered.text);
      // Its own blocks, as long as they are what went up: the record keeps
      // them so a note or a decision is edited onto them.
      let own = rendered.blocks;
      const metadata = card.tag ? { event_type: card.tag.eventType, event_payload: card.tag.payload } : undefined;
      let posted = await slack.postMessage({
        channel,
        thread_ts: replyTs,
        text: rendered.text,
        blocks,
        ...(metadata ? { metadata } : {}),
      });
      // If Slack rejected the blocks (it could not fetch the Figma image_url,
      // or a section overflowed), retry text-only so the confirmation gate
      // still works — reactions and typed emoji resolve a text-only card just
      // the same.
      if (!posted.ok) {
        console.warn("[slack] proposal with blocks failed; retrying text-only");
        posted = await slack.postMessage({ channel, thread_ts: replyTs, text: rendered.text, ...(metadata ? { metadata } : {}) });
        own = undefined;
      }
      return {
        ok: !!posted.ok,
        text: rendered.text,
        ...(posted.ok && posted.ts ? { ts: posted.ts } : {}),
        ...(posted.ok && own ? { blocks: own } : {}),
      };
    },

    async postFailure(stage: DeliveryFailureStage, err, ask) {
      // The checklist is settled by the turn's own `endProgress("error")`
      // before it gets here — a failure message under a step that still claims
      // to be in progress is how the plan stream read after a dead run.
      // The button carries who asked, so only they can ask it again.
      const retry = ask ? retryValue(target.userId, ask) : undefined;
      await slack.postFailure({ channel, threadTs: replyTs, userMsgTs, stage, err, ...(retry ? { ask: retry } : {}) });
    },
  };
}
