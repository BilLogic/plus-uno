// The Delivery a Figma ask's turn speaks through (#903).
//
// The turn is the one Slack runs — routing, lookups, judges, the gate — and
// only where its words land differs. A Figma comment has no working signal,
// no progress and no reactions, so those are no-ops. The answer and any note
// are KEPT rather than posted: the job turns them into one plain reply after
// the turn ends (`./copy.ts`), because a comment cannot be edited into shape
// the way a Slack message can.
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
import { threadVisibleSources } from "../slack/card-sources";
import { describeCard, describeGateNote, type Delivery, type PostResult, type ProposalCard } from "../turn/index";

/** What a Figma ask's turn left for the reply. */
export interface FigmaAskDelivery extends Delivery {
  /** The answer, as the turn wrote it; null when it posted none. */
  readonly answer: () => string | null;
  /** Notes, oldest first: a clarifying question, a refusal. */
  readonly notes: () => string[];
  /** The links the turn's lookups read, that a public thread may carry. */
  readonly sources: () => string[];
  /** Why a card the turn tried to stage did not stage: no way to stage one
   *  was given, or #plus-design refused the post; null when none was refused. */
  readonly refusedCard: () => "not-allowed" | "not-posted" | null;
  /** Whether the turn said it failed. */
  readonly failed: () => boolean;
}

/**
 * The Delivery for one ask.
 *
 * @param opts - `stage`, how a card reaches #plus-design; absent, cards are refused
 */
export function figmaAskDelivery(opts: { stage?: (card: ProposalCard) => Promise<PostResult> } = {}): FigmaAskDelivery {
  let answer: string | null = null;
  const notes: string[] = [];
  const sources: string[] = [];
  let refused: "not-allowed" | "not-posted" | null = null;
  let failed = false;
  const quiet = async (): Promise<void> => {};

  return {
    answer: () => answer,
    notes: () => [...notes],
    sources: () => [...sources],
    refusedCard: () => refused,
    failed: () => failed,

    react: quiet,
    removeReaction: quiet,
    setWorking: quiet,
    clearWorking: quiet,
    beginProgress: quiet,
    endProgress: quiet,
    reopenCard: quiet,
    postInterim() {},

    toolProgress(event) {
      if (event.phase !== "finished" || !event.sources) return;
      for (const s of threadVisibleSources(event.sources as readonly TaskCardSource[])) {
        if (!sources.includes(s.url)) sources.push(s.url);
      }
    },

    async postAnswer(text) {
      answer = text;
      return { ok: true, text, ts: "figma-answer" };
    },

    async postNote(text) {
      notes.push(text);
      return { ok: true, text, ts: `figma-note-${notes.length}` };
    },

    async postGateNote(note) {
      const text = describeGateNote(note);
      notes.push(text);
      return { ok: true, text };
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

    async postFailure() {
      failed = true;
    },
  };
}
