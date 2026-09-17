// The order an ⏳ narration and the answer it precedes land in.
//
// `Delivery.postInterim` is fire-and-forget BY CONTRACT — the agent loop must
// not wait on a courtesy message — and that is right. What it quietly also
// meant is "lands whenever": the post was never looked at again, so a narration
// whose request resolves after the answer's prints BELOW it, and the thread
// reads bottom-up as "here is your answer, and now I am off checking Notion and
// GitHub". Fire and forget is about not BLOCKING on it, not about letting it
// arrive out of order.
//
// WHY THIS IS NOT THEORETICAL, and why it is also not common. Almost every
// narration is safe by accident: a full model round-trip separates it from the
// answer, which is several seconds against a post's few hundred milliseconds.
// The exceptions are the exits that finish WITHOUT one. `/stop` returns
// `STOPPED_MESSAGE` from the top of the next iteration (`agent/loop.ts`), and a
// reply under `MIN_DRAFT_CHARS` skips the judge (`agent/draft-judge.ts`) — so
// the last narration's post and the answer's leave together and land in
// whichever order Slack finishes them. You stop the bot, it says it stopped,
// and then it says it is checking Notion.
//
// PURE by design — no `Env`, no Slack client, no fetch — so `tsconfig.test.json`
// compiles it and the Node lane tests the discipline by RUNNING it. The adapter
// that wires it (`slack/slack-delivery.ts`) names `Env` and stays out of reach,
// which is the same split `working-signal.ts` and `stream-recipient.ts` make.

/** How long a turn's last word waits for a narration already on the wire.
 *
 *  Bounded because a hung Slack post must never hold an answer that is ready:
 *  past this the narration takes its chances and the answer goes. A late
 *  narration is untidy; a withheld answer is the failure this whole codebase
 *  is organised against. */
export const INTERIM_DRAIN_MS = 1_500;

export interface NarrationOrder {
  /** Whether a narration may still be sent. False once the turn has said its
   *  last word — whatever that line was going to announce is by then a lie in
   *  the past tense. */
  open(): boolean;
  /** Track a narration's in-flight post. Takes the promise rather than making
   *  it: what a post IS belongs to the adapter. */
  track(post: Promise<unknown>): void;
  /** Wait for what is on the wire, bounded. Does NOT close: the Gate doors post
   *  a verdict and then run the real tool, which is entitled to narrate again. */
  drain(): Promise<void>;
  /** Close, then drain. Nothing narrates after this, and anything already on
   *  the wire gets its moment first. */
  lastWord(): Promise<void>;
}

/**
 * One turn's narration ordering.
 *
 * A SET rather than one promise: tool boundaries can be closer together than a
 * Slack post takes, so more than one narration is legitimately in flight, and
 * keeping only the newest would leave the older one free to land under the
 * answer — the same bug, one narration to the left.
 *
 * @param drainMs - The bound. Overridden only by tests, which must not wait.
 */
export function narrationOrder(drainMs: number = INTERIM_DRAIN_MS): NarrationOrder {
  const inFlight = new Set<Promise<unknown>>();
  let closed = false;

  const drain = async (): Promise<void> => {
    if (inFlight.size === 0) return;
    const landed = Promise.all([...inFlight]);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const bound = new Promise<void>((resolve) => {
      timer = setTimeout(resolve, drainMs);
    });
    try {
      await Promise.race([landed, bound]);
    } catch {
      // A narration that failed to post is a narration nobody is waiting for.
      // The answer behind it is not best-effort and must not inherit the throw.
    } finally {
      // The timer is cleared even when the bound lost, or a finished turn sits
      // holding a pending timeout for no reason.
      if (timer) clearTimeout(timer);
    }
  };

  return {
    open: () => !closed,
    track(post) {
      inFlight.add(post);
      // Forget it as soon as it settles, so a long turn's drain waits on what
      // is actually outstanding rather than on every narration it ever sent.
      //
      // `then(clean, clean)` rather than `finally(clean)`: `finally` PASSES A
      // REJECTION THROUGH, so voiding its result turns a post that failed into
      // an unhandled rejection — which on workerd can take the invocation down
      // with the answer still unsent. Today's caller hands in an already
      // `.catch`-ed promise so it cannot happen; a module that is only safe
      // because of what its caller does is a module that breaks when a second
      // caller arrives. Both arms swallow, because a narration nobody could
      // post is not news.
      void post.then(
        () => inFlight.delete(post),
        () => inFlight.delete(post),
      );
    },
    drain,
    async lastWord() {
      closed = true;
      await drain();
    },
  };
}
