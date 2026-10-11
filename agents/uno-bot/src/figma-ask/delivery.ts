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
// A CARD IS THE ONE THING POSTED MID-TURN, and it goes to Slack, never to
// Figma: `stage` posts it in #plus-design, where Review decides it. With no
// `stage` — an asker Team Members does not know, or no #plus-design configured
// — the card is refused, the turn ends without staging anything, and the
// reply says why. So nothing an ask in Figma proposes is ever written from
// Figma.
//
// PURE: what posts the card arrives by name.

import type { TaskCardSource } from "../agent/task-card-readout";
import { describeCard, describeGateNote, type Delivery, type PostResult, type ProposalCard } from "../turn/index";
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
  /** Why a card the turn tried to stage did not stage: no way to stage one
   *  was given, or #plus-design refused the post; null when none was refused. */
  readonly refusedCard: () => "not-allowed" | "not-posted" | null;
}

/**
 * The Delivery for one ask.
 *
 * @param opts - `stage`, how a card reaches #plus-design; absent, cards are refused
 */
export function figmaAskDelivery(opts: { stage?: (card: ProposalCard) => Promise<PostResult> } = {}): FigmaAskDelivery {
  let answer: string | null = null;
  const notes: string[] = [];
  const sources: TaskCardSource[] = [];
  let refused: "not-allowed" | "not-posted" | null = null;
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
      if (!opts.stage) {
        refused = "not-allowed";
        return { ok: false, text: describeCard(card) };
      }
      const posted = await opts.stage(card);
      if (!posted.ok || !posted.ts) refused = "not-posted";
      return posted;
    },
  };
}
