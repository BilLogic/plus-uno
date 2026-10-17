// "Approve which one?" — a decision that named no card, with several waiting.
//
// A thread can hold several live proposal cards (#1318). A typed ✅ / ⛔ there,
// or a "yes" the model could not tie to one card, resolves nothing: Gate
// answers with a `which-card` note (`gate/gate.ts` § `whichCardNote`) and this
// file is where it becomes a message — the question, and one button per card
// named by its headline (#1319).
//
// EACH BUTTON IS THAT CARD'S OWN ✅ (or ⛔), pressed from here. Its value is
// the card's ts, and a press goes through the button door exactly as a press
// on the card would (`button-door.ts`): the claim, the confirmer set, the
// pointer rule, the card edited to its outcome. So a button acts only on its
// own card, and the other cards stay live.
//
// THE QUESTION LAPSES ON THE CARD RULE. Its buttons stop working
// `cardExpiresAt` after the question was asked — 24 weekday hours
// (`card-expiry.ts`) — counted from the question's own message ts, which Slack
// hands back on every press, so nothing has to be carried in the value. A card
// staged before the question can lapse first; a press on it then says so, as a
// press on the card would.
//
// Pure apart from its named dependencies: no `Env`, no fetch.

import type { GateNote, WhichCard } from "../turn/index";
import { cardExpiresAt } from "../card-expiry";
import { renderGateNote, whichCardQuestion } from "./gate-note";
import { deadlineBlock, isDeadlineBlock, withDeadline } from "./card-deadline";
import { runButtonDoor, type ButtonDoorDeps, type CardMessage } from "./button-door";
import type { ThreadState } from "../thread-state/index";

type WhichNote = Extract<GateNote, { kind: "which-card" }>;
type Decision = WhichNote["decision"];

/** Every "which one?" button's action id starts with this; the rest is the
 *  decision and the button's place in the row, which keeps ids unique. */
export const WHICH_ACTION_PREFIX = "uno_which_";

/** Slack's limits on an actions row: 25 elements; a button label, 75 chars. */
const MAX_BUTTONS = 25;
const LABEL_MAX = 75;

/** The question as Slack gets it: its words (`gate-note.ts`), when its
 *  buttons stop answering (#1316) — the rule's deadline from when it is
 *  asked, which the door holds a press to by the question's ts — and a row
 *  of one button per card.
 *
 * @param note - The question
 * @param askedAt - When it goes up, epoch ms
 */
export function whichCardMessage(note: WhichNote, askedAt: number = Date.now()): CardMessage {
  const expiresAt = cardExpiresAt(askedAt);
  return {
    text: withDeadline(renderGateNote(note), expiresAt),
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: whichCardQuestion(note) } },
      deadlineBlock(expiresAt),
      { type: "actions", elements: note.cards.slice(0, MAX_BUTTONS).map((card, i) => button(note.decision, card, i)) },
    ],
  };
}

function button(decision: Decision, card: WhichCard, i: number): Record<string, unknown> {
  const label = card.headline.length > LABEL_MAX ? `${card.headline.slice(0, LABEL_MAX - 1).trimEnd()}…` : card.headline;
  return {
    type: "button",
    action_id: `${WHICH_ACTION_PREFIX}${decision}_${i}`,
    text: { type: "plain_text", text: label, emoji: true },
    value: card.ts,
  };
}

/** A press's decision and card, from its action id and value; null for
 *  anything that is not one of these buttons. */
export function whichPressOf(actionId: string, value: string | undefined): { decision: Decision; cardTs: string } | null {
  const m = actionId.startsWith(WHICH_ACTION_PREFIX) ? /^(confirm|cancel)_\d+$/.exec(actionId.slice(WHICH_ACTION_PREFIX.length)) : null;
  if (!m || !value) return null;
  return { decision: m[1] as Decision, cardTs: value };
}

// ── The press ────────────────────────────────────────────────────────────────

/** A press on one of the question's buttons, in the facts the envelope has. */
export interface WhichPress {
  channel: string;
  /** The question's own message: when it was asked, and what to edit. */
  questionTs: string;
  /** The question as Slack holds it now — earlier presses may have taken
   *  buttons off it. */
  question: CardMessage;
  /** The card the pressed button names. */
  cardTs: string;
  decision: Decision;
  userId: string;
}

export interface WhichCardDoorDeps extends Omit<ButtonDoorDeps, "replaceCard" | "threadState"> {
  threadState: ThreadState;
  /** The decided card's message, edited to its outcome — the CARD, by its
   *  ts, not the question the press landed on. */
  editCard(cardTs: string, message: CardMessage): Promise<void>;
  /** The question, redrawn where it was pressed. */
  replaceQuestion(message: CardMessage): Promise<void>;
}

/** Said to the presser alone when the question has lapsed. */
export const WHICH_EXPIRED_REPLY = "That question expired, so nothing ran. Press Review on the card you mean.";

/**
 * One "which one?" button, pressed: that card's own ✅ or ⛔, through the
 * button door, and then the question redrawn without the button of any card
 * no longer waiting — so a second press on a decided card is not invited,
 * and the cards still waiting keep theirs.
 *
 * Past the question's deadline nothing is resolved: the presser is told, and
 * the question loses its buttons.
 */
export async function runWhichCardDoor(press: WhichPress, deps: WhichCardDoorDeps): Promise<void> {
  const now = (deps.now ?? Date.now)();
  const askedAt = Number.parseFloat(press.questionTs) * 1000;
  if (!Number.isFinite(askedAt) || now > cardExpiresAt(askedAt)) {
    console.log(`[interactive] which-card press on ${press.channel}/${press.questionTs} after its deadline`);
    await deps.replyEphemeral(WHICH_EXPIRED_REPLY);
    await deps.replaceQuestion(withButtons(press.question, () => false, "Expired."));
    return;
  }

  await runButtonDoor(
    { channel: press.channel, messageTs: press.cardTs, decision: press.decision, userId: press.userId },
    { ...deps, replaceCard: (message) => deps.editCard(press.cardTs, message) },
  );

  // Whatever the press came to — won, lost to another door, aged out — a card
  // that is no longer waiting keeps no button here. A read that fails says
  // nothing either way, so the button stays: a second press on a decided card
  // is told so, while a dropped button on a waiting one cannot be had back.
  const after = await deps.threadState.getProposalByTs(press.cardTs).catch((err: unknown) => {
    console.warn(`[interactive] which-card: ${press.channel}/${press.cardTs} not read after the press: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  });
  if (!after || after.state === "found") return;
  await deps.replaceQuestion(withButtons(press.question, (ts) => ts !== press.cardTs, "Decided."));
}

/**
 * The question with only the buttons `keep` keeps. With none left, the row
 * gives way to a context line saying why, and its deadline goes with it.
 */
function withButtons(question: CardMessage, keep: (cardTs: string) => boolean, done: string): CardMessage {
  const anyKept = (question.blocks as Array<{ type?: string; elements?: Array<{ value?: string }> }>).some(
    (block) => block.type === "actions" && (block.elements ?? []).some((e) => typeof e.value === "string" && keep(e.value)),
  );
  const blocks = (question.blocks as Array<{ type?: string; elements?: Array<{ value?: string }> }>).flatMap((block): unknown[] => {
    if (isDeadlineBlock(block)) return anyKept ? [block] : [];
    if (block.type !== "actions") return [block];
    const elements = (block.elements ?? []).filter((e) => typeof e.value === "string" && keep(e.value));
    return elements.length ? [{ ...block, elements }] : [{ type: "context", elements: [{ type: "mrkdwn", text: done }] }];
  });
  return { text: question.text, blocks };
}
