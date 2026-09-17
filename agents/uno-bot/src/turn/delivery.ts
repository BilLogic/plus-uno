// Delivery — the port a turn speaks to the person through.
//
// A turn has mid-turn effects: the 👀 that says "I'm on it", the thinking
// indicator, the narration that lands while a long lookup runs, the proposal
// card that has to be reactable the moment it posts. None of them can wait for
// the outcome, so none of them can be a field on it — and until now every one
// of them was a direct `slack/api.ts` call inside the handler, which is why a
// whole turn could not be exercised without Slack.
//
// So they are METHODS here and nothing else. The port names what the turn
// means, never how Slack renders it: `postInterim` is "say something is still
// happening", and whether that becomes a task card inside a plan stream or a
// loose ⏳ message is the Slack adapter's business (`slack/slack-delivery.ts`).
// Two adapters exist: that one, and `recordingDelivery` below, which every
// Turn test runs on.
//
// PURE by design — no `Env`, no Workers type, no fetch — so
// `tsconfig.test.json` compiles this file and the recording adapter beside the
// turn's own tests.

/** How far a turn got before it failed. Drives what the message the person
 *  sees can honestly promise (`slack/failure-message.ts`). */
export type DeliveryFailureStage = "context" | "agent" | "delivery" | "internal";

/** What a turn asks Delivery to stage behind the ✅ gate. `blocks` is present
 *  only for the cards that build their own (the Figma preview); a text-only
 *  card is shaped by the adapter. */
export interface ProposalCard {
  text: string;
  blocks?: unknown[];
}

/** What a post actually did. `text` is what was posted, which is not always
 *  what was handed in — the body is stripped and capped on the way out. */
export interface PostResult {
  ok: boolean;
  text: string;
  /** The ts it landed on, where the adapter knows one. */
  ts?: string;
}

export interface Delivery {
  /** React on the person's own message. The one acknowledgement a channel
   *  turn gets, and the ❌ a failed one carries. */
  react(emoji: string): Promise<void>;

  /** Take a reaction back off. Nothing in a turn retracts one today; the gate
   *  (#500) is the caller this exists for, and an adapter that could not do it
   *  would be an adapter the gate cannot use. */
  removeReaction(emoji: string): Promise<void>;

  /**
   * The two things a surface with a working signal gets: the signal itself,
   * and a title for a thread this turn opened.
   *
   * One call rather than two because they are one gesture — "this is being
   * worked on, and here is what it is about" — and a surface with neither (a
   * channel) no-ops both. `titleFrom` is the QUESTION, not the title: naming a
   * thread from it is presentation, so the adapter shapes it.
   */
  setWorking(note: { status?: string; titleFrom?: string }): Promise<void>;

  /**
   * Take the working signal back down.
   *
   * It exists as a method because a set with no clear on the port was a signal
   * only Slack could retract, and only where it happened to look: the one
   * clear lived in the events handler's `finally` and was gated to DMs, so a
   * channel thread kept saying "is working…" after the turn was over. A clear
   * a caller cannot express is a clear that gets forgotten.
   *
   * Idempotent by contract, and best-effort like the set: a surface with no
   * indicator no-ops, and a surface that never had one clears nothing.
   */
  clearWorking(): Promise<void>;

  /**
   * Open the progress surface for a substantive turn, and close it.
   *
   * `beginProgress` is what makes the first narration land somewhere other than
   * loose in the thread. `endProgress` settles it — `"error"` when the turn died
   * with a step still claiming to be in flight — and is called only on the exits
   * that post no answer: `postAnswer` closes the surface INTO the answer, so a
   * checklist and the reply it belongs to stay one message. Both no-op where the
   * surface has no progress rendering, which is what keeps the turn from caring.
   */
  beginProgress(label: string): Promise<void>;
  endProgress(outcome: "complete" | "error"): Promise<void>;

  /**
   * Say that work is still happening. FIRE AND FORGET by contract: it is
   * called from inside the agent loop's narration callback, where waiting on a
   * post would put a courtesy message in front of the answer.
   */
  postInterim(text: string): void;

  /** The answer. A progress surface still open closes INTO it. */
  postAnswer(text: string): Promise<PostResult>;

  /** A note that is not an answer: a clarifying question, a cancellation, a
   *  "you just cancelled that" bounce. No footer, no confidence pre-check. */
  postNote(text: string): Promise<PostResult>;

  /** Stage a proposal card. The ts it comes back with is the card's identity —
   *  what a ✅ resolves against — so a null ts means nothing was staged. */
  stageProposal(card: ProposalCard): Promise<PostResult>;

  /** Make a failure visible. Best-effort and never throwing, because the one
   *  thing worse than an error message is silence. */
  postFailure(stage: DeliveryFailureStage, err?: unknown): Promise<void>;
}

// ── The recording adapter ────────────────────────────────────────────────────

/** One thing the turn asked Delivery to do, in order. */
export type DeliveryCall =
  | { kind: "react"; emoji: string }
  | { kind: "removeReaction"; emoji: string }
  | { kind: "working"; status?: string; titleFrom?: string }
  | { kind: "working-clear" }
  | { kind: "beginProgress"; label: string }
  | { kind: "endProgress"; outcome: "complete" | "error" }
  | { kind: "interim"; text: string }
  | { kind: "answer"; text: string }
  | { kind: "note"; text: string }
  | { kind: "proposal"; card: ProposalCard }
  | { kind: "failure"; stage: DeliveryFailureStage; message?: string };

export interface RecordingDelivery extends Delivery {
  /** Everything the turn did, in order. */
  readonly calls: DeliveryCall[];
  /** Just the posts a person would read, in order — answers, notes and cards. */
  readonly posted: string[];
  /** Fake ts values handed back, newest last. */
  readonly stagedAt: string[];
}

export interface RecordingDeliveryOptions {
  /** Make a post fail, so the turn's "never ✅ a reply that was never
   *  delivered" path is reachable in a test. */
  answerFails?: boolean;
  /** Stage nothing — a card Slack rejected outright. */
  stagingFails?: boolean;
}

/**
 * A Delivery that records instead of posting, and hands back fake ts values.
 *
 * It answers like the Slack adapter answers — a post reports what it posted, a
 * staged card reports a ts — because a fake that is merely close is worse than
 * none: the test passes and the real path still breaks.
 */
export function recordingDelivery(opts: RecordingDeliveryOptions = {}): RecordingDelivery {
  const calls: DeliveryCall[] = [];
  const posted: string[] = [];
  const stagedAt: string[] = [];
  let staged = 0;

  return {
    calls,
    posted,
    stagedAt,

    async react(emoji) {
      calls.push({ kind: "react", emoji });
    },

    async removeReaction(emoji) {
      calls.push({ kind: "removeReaction", emoji });
    },

    async setWorking(note) {
      calls.push({ kind: "working", ...note });
    },

    async clearWorking() {
      calls.push({ kind: "working-clear" });
    },

    async beginProgress(label) {
      calls.push({ kind: "beginProgress", label });
    },

    async endProgress(outcome) {
      calls.push({ kind: "endProgress", outcome });
    },

    postInterim(text) {
      calls.push({ kind: "interim", text });
    },

    async postAnswer(text) {
      calls.push({ kind: "answer", text });
      if (opts.answerFails) return { ok: false, text };
      posted.push(text);
      return { ok: true, text, ts: `answer-${calls.length}` };
    },

    async postNote(text) {
      calls.push({ kind: "note", text });
      posted.push(text);
      return { ok: true, text, ts: `note-${calls.length}` };
    },

    async stageProposal(card) {
      calls.push({ kind: "proposal", card });
      if (opts.stagingFails) return { ok: false, text: card.text };
      posted.push(card.text);
      const ts = `card-${++staged}`;
      stagedAt.push(ts);
      return { ok: true, text: card.text, ts };
    },

    async postFailure(stage, err) {
      calls.push({
        kind: "failure",
        stage,
        ...(err === undefined ? {} : { message: err instanceof Error ? err.message : String(err) }),
      });
    },
  };
}

// ── The set/clear pairing, in one place ──────────────────────────────────────

/**
 * Run something that may raise the working signal, and guarantee the signal is
 * down when it returns.
 *
 * Three callers raise it — a turn, and the two Gate doors that resolve a card
 * without one — and every one of them has more exits than a person can hold in
 * mind: the turn alone leaves by nine. So the clear is not written at the
 * exits at all. The work runs through a Delivery whose `setWorking` is watched,
 * and the `finally` here clears IF something was raised, which is what makes a
 * tenth exit safe by construction rather than by review.
 *
 * The clear is swallowed: a surface that cannot take the signal down is not a
 * reason to fail a turn that already did its work.
 */
export async function withWorkingSignal<T>(
  delivery: Delivery,
  run: (delivery: Delivery) => Promise<T>,
): Promise<T> {
  let raised = false;
  const watched: Delivery = {
    ...delivery,
    async setWorking(note) {
      raised = true;
      await delivery.setWorking(note);
    },
  };
  try {
    return await run(watched);
  } finally {
    if (raised) await delivery.clearWorking().catch(() => {});
  }
}
