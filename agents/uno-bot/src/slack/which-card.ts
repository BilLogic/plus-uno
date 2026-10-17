// "Approve which one?" — a decision that named no card, with several waiting.
//
// A thread can hold several live proposal cards (#1318). A typed ✅ / ⛔ there,
// or a "yes" the model could not tie to one card, resolves nothing: Gate
// answers with a `which-card` note (`gate/gate.ts` § `whichCardNote`) and this
// file is where it becomes a message — the question listing the cards by
// headline, numbered, and one short button per card naming its number (#1319).
// A headline is too long for a button: Slack draws buttons at its own width and
// cuts the label mid-word, so the headline lives in the question instead.
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
// A CARD DECIDED ANYWHERE DROPS OUT OF IT. The turn keeps the question as
// posted in the thread store (`putWhichQuestion`), and every door that decides
// a listed card — this question's button, the card's own, its Review pop-up,
// a reaction, a typed emoji, the model's `proposal_resolve` — marks it there
// and redraws the question from that record (`gate.ts`
// `dropFromWhichQuestion`): the card's line struck, its button gone, the
// numbers unchanged, and "Decided." once none are left.
//
// Pure apart from its named dependencies: no `Env`, no fetch.

import type { GateNote, WhichCard } from "../turn/index";
import { cardExpiresAt } from "../card-expiry";
import { renderGateNote, whichCardQuestion } from "./gate-note";
import { escapeSlackText } from "./mrkdwn";
import { isDeadlineBlock } from "./card-deadline";
import { runButtonDoor, type ButtonDoorDeps } from "./button-door";
import type { CardMessage } from "./proposal-render";
import type { ThreadState, WhichQuestion } from "../thread-state/index";

type WhichNote = Extract<GateNote, { kind: "which-card" }>;
type Decision = WhichNote["decision"];

/** Every "which one?" button's action id starts with this; the rest is the
 *  decision and the button's place in the row, which keeps ids unique. */
export const WHICH_ACTION_PREFIX = "uno_which_";

/** Slack's limit on an actions row: 25 elements. */
const MAX_BUTTONS = 25;

/** The question as Slack gets it: its words (`gate-note.ts`) listing the
 *  cards by number, and a row of one numbered button per card. Its buttons
 *  still lapse on the card rule, counted from the question's ts by the door,
 *  but the message does not say when.
 *
 * Redrawn after a door decides a card it lists (`Delivery.redrawWhichCard`),
 * that card's line is struck and its button goes, and every other card keeps
 * its number: "Cancel 2" goes on meaning card 2. With every card decided the
 * row gives way to "Decided.", as a press leaves it (`withButtons`).
 *
 * @param note - The question
 * @param decided - The listed cards decided since it was asked, by ts
 */
export function whichCardMessage(note: WhichNote, decided: readonly string[] = []): CardMessage {
  const cards = note.cards.slice(0, MAX_BUTTONS);
  // Headlines come from the model's input, so escaped.
  const listed = cards
    .map((card, i) => {
      const headline = escapeSlackText(card.headline);
      return decided.includes(card.ts) ? `~${i + 1}. ${headline}~` : `${i + 1}. *${headline}*`;
    })
    .join("\n");
  const open = cards.flatMap((card, i) => (decided.includes(card.ts) ? [] : [button(note.decision, card, i)]));
  return {
    text: renderGateNote(note),
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: `${whichCardQuestion(note)}\n${listed}` } },
      open.length ? { type: "actions", elements: open } : { type: "context", elements: [{ type: "mrkdwn", text: "Decided." }] },
    ],
  };
}

/** A kept question (`ThreadState.decideInWhichQuestion`), as Slack gets it. */
export function keptQuestionMessage(question: WhichQuestion): CardMessage {
  return whichCardMessage({ kind: "which-card", decision: question.decision, cards: question.cards }, question.decided);
}

/** One card's button: the decision and the card's number in the list above. */
function button(decision: Decision, card: WhichCard, i: number): Record<string, unknown> {
  return {
    type: "button",
    action_id: `${WHICH_ACTION_PREFIX}${decision}_${i}`,
    text: { type: "plain_text", text: `${decision === "confirm" ? "Approve" : "Cancel"} ${i + 1}`, emoji: true },
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

  // A win drops its card from the question it is kept on (`button-door.ts`,
  // `dropFromWhichQuestion`). When that is this question, it is redrawn here,
  // where it was pressed, from its record — and only once.
  let redrawn = false;
  await runButtonDoor(
    { channel: press.channel, messageTs: press.cardTs, decision: press.decision, userId: press.userId },
    {
      ...deps,
      replaceCard: (message) => deps.editCard(press.cardTs, message),
      delivery: (target) => {
        const delivery = deps.delivery(target);
        return {
          ...delivery,
          redrawWhichCard: async (question) => {
            if (question.questionTs !== press.questionTs) return delivery.redrawWhichCard(question);
            redrawn = true;
            await deps.replaceQuestion(keptQuestionMessage(question));
          },
        };
      },
    },
  );
  if (redrawn) return;

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
