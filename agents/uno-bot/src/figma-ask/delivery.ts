// The Delivery a Figma ask's turn speaks through (#903).
//
// The turn is the one Slack runs — routing, lookups, judges, the gate — and
// only where its words land differs. A Figma comment has no working signal,
// no progress and no reactions, so those are no-ops. The answer and any note
// are KEPT rather than posted: the job turns them into one plain reply after
// the turn ends (`./copy.ts`), because a comment cannot be edited into shape
// the way a Slack message can. So an answer or a note reports no ts — nothing
// was posted, as the Slack adapter's answer reports none — and the turn reads
// none from either. What each reports as its `text` is the lines the reply
// will carry (`plainAnswer`), so the thread remembers what Figma shows and not
// the lines the reply cut: anyone on the file reads the thread's next answer.
//
// A CARD IS REFUSED, always: a Figma ask is answer-only. The turn stages a
// proposal only once its card has posted, so a refused card leaves nothing
// staged and nothing to approve; the turn ends there, and the reply says what
// the card would have done (its write's fixed gate verb, never the card's own
// words, which can name a private repo or page) and where to ask for it
// instead. So nothing an ask in Figma proposes is ever written, and nothing
// is posted to Slack.
//
// PURE.

import type { TaskCardSource } from "../agent/task-card-readout";
import { gateWordsFor } from "../agent/tool-table";
import { describeCard, describeGateNote, type Delivery } from "../turn/index";
import { plainAnswer } from "./copy";

/** The lines of `text` the reply carries, as the thread remembers them. */
const shown = (text: string): string => plainAnswer(text).lines.join("\n");

/** What a Figma ask's turn left for the reply. */
export interface FigmaAskDelivery extends Delivery {
  /** The answer, as the turn wrote it; null when it posted none. */
  readonly answer: () => string | null;
  /** Notes, oldest first: a clarifying question, a refusal. */
  readonly notes: () => string[];
  /** Every link the turn's lookups read, with what each tool said of who may see it. */
  readonly sources: () => TaskCardSource[];
  /** The card the turn tried to stage, refused: what its approval would do,
   *  in its first write's fixed gate words (`agent/tool-table.ts`), never
   *  the card's own, which can name a repo or a page; null when the turn
   *  tried none. `verb` is empty for a write with no gate words. */
  readonly refusedCard: () => { verb: string } | null;
}

/** The Delivery for one ask. */
export function figmaAskDelivery(): FigmaAskDelivery {
  let answer: string | null = null;
  const notes: string[] = [];
  const sources: TaskCardSource[] = [];
  let refused: { verb: string } | null = null;
  const quiet = async (): Promise<void> => {};

  return {
    answer: () => answer,
    notes: () => [...notes],
    sources: () => [...sources],
    refusedCard: () => refused,

    react: quiet,
    removeReaction: quiet,
    setWorking: quiet,
    clearWorking: quiet,
    beginProgress: quiet,
    endProgress: quiet,
    reopenCard: quiet,
    postInterim() {},
    // A failure is told in the reply the job posts, from the turn's outcome.
    postFailure: quiet,

    toolProgress(event) {
      if (event.phase !== "finished") return;
      for (const s of event.sources ?? []) if (!sources.some((k) => k.url === s.url)) sources.push(s);
    },

    async postAnswer(text) {
      answer = text;
      return { ok: true, text: shown(text) };
    },

    async postNote(text) {
      notes.push(text);
      return { ok: true, text: shown(text) };
    },

    async postGateNote(note) {
      const text = describeGateNote(note);
      notes.push(text);
      return { ok: true, text: shown(text) };
    },

    async card(card) {
      const first = card.operations[0]?.toolName;
      refused = { verb: (first && gateWordsFor(first)?.verb) || "" };
      return { ok: false, text: describeCard(card) };
    },
  };
}
