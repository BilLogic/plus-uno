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
// loose ⏳ message is the Slack adapter's business
// (`slack/delivery-adapter.ts`, built from `Env` by `slack/slack-delivery.ts`).
//
// WHICH NOW HOLDS FOR THE TWO THINGS A PERSON ACTS ON. `card` takes a
// `ProposalCard` that is DATA — a verb, a lead, the staged fields, the caveats
// the turn decided, the whole batch — and `postGateNote` takes a `GateNote`.
// Both used to be strings the caller had already spelled in Slack mrkdwn, from
// inside modules documented as Slack-free (#623). Now the arrow only ever runs
// outward: Turn and Gate say what they mean, the Slack adapter says it in
// Slack, and a recording is HANDED a spelling rather than owning one.
// Two adapters exist: that one, and `recordingDelivery` below, which every
// Turn test runs on. A third recording stands one layer further down, for the
// Slack adapter's own tests: `tests/helpers/recording-slack.ts` stands in for
// the Slack CLIENT rather than for this port.
//
// PURE by design — no `Env`, no Workers type, no fetch — which is what lets
// the turn's own tests run on the recording adapter beside it, with no Worker
// anywhere. (Not a compile property: `tsconfig.test.json` globs `src/**`.)

import type { ProposalOperation } from "../thread-state/index";

/** How far a turn got before it failed. Drives what the message the person
 *  sees can honestly promise (`slack/failure-message.ts`). */
export type DeliveryFailureStage = "context" | "agent" | "delivery" | "internal";

/**
 * What the finished work left behind, in the port's own words: whether a
 * person now has to act before this thread can go anywhere.
 *
 * Deliberately NOT glossed in CONTEXT.md: `TurnDisposition` is not either, and
 * the vocabulary is internal.
 *
 * Two words rather than Slack's four-value lifecycle, because this is the only
 * distinction a turn is entitled to make. Which status renders it is the Slack
 * adapter's business (`slack/session-status.ts` `settledStatus`) — a port that
 * named Slack's enum would be Slack leaking upward, and "the conversation is
 * complete" (`closed`) is a claim no turn of ours can make at all (#575).
 */
export type TurnSettlement =
  /** Nobody is waiting on anybody: the thread is open and quiet. */
  | "idle"
  /** The thread cannot proceed until a person does something — clicks a ✅ on
   *  a staged card, or answers a clarifying question. */
  | "waiting-on-person";

// ── The card ─────────────────────────────────────────────────────────────────

/**
 * One labelled thing on a card: a staged parameter, or a parameter inside one.
 *
 * `label` is the tool input's OWN key, raw — `page_url`, not `Page link`.
 * Turning a key into words a designer reads is presentation, so the adapter
 * does it; a card that carried `Page link` would have spelled itself.
 */
export interface CardField {
  label: string;
  /** A scalar value, which belongs on the label's own line. */
  value?: string;
  /** What sits UNDER the label, in the order the input had it: a bare bullet
   *  for a scalar, a labelled sub-field for anything with structure. */
  under?: CardRow[];
}

export type CardRow = { item: string } | { field: CardField };

/**
 * Something the turn decided a person must see BEFORE pressing ✅.
 *
 * A caveat is a JUDGEMENT, so it is the turn's: "this brief named no open
 * questions" and "this share-out bundle is missing two of its three links" are
 * both reached by reading the staged input, and both used to be reached inside
 * the renderer. The WORDS are the adapter's — a caveat carries only which
 * caveat it is and what it found.
 */
export type CardCaveat =
  /** A PRD-shaped brief that named no ambiguity of its own, so the ✅ is
   *  knowingly accepting a gap-free reading of it. */
  | { kind: "no-open-questions" }
  /** A prototype share-out staged without the bundle's full set of links. */
  | { kind: "bundle-incomplete"; missing: string[] }
  /** A write that lands somewhere anyone can read — a GitHub issue on the
   *  public repo — so the ✅ is consent to publish the words on the card. */
  | { kind: "public-repo"; repo: string }
  /** A comment on an issue in a public repo — the same consent, for words
   *  added to an issue that already exists. */
  | { kind: "public-comment"; repo: string };

/** The page a write lands on, in the words a Notion read reported — never a
 *  bare hex id, which is the whole reason the read happens. */
export interface CardTarget {
  title: string;
  parent?: string;
  url?: string;
}

/**
 * A `notion_update` as a revision of a page that already says something: what
 * it says now, and what it will say.
 *
 * Its own shape rather than `fields`, because this card leads with the diff
 * instead of the ⚠️ preamble — the one proposal that reads as a conversation.
 */
export interface CardRevision {
  /** The page, as the read named it. A `title` the read could not resolve
   *  leaves the link to name itself — never a bare hex URL. */
  page?: { url: string; title?: string; parent?: string };
  /** One changed property: `from` absent where the page has no value yet. */
  properties: Array<{ label: string; from?: string; to: string }>;
  /** Blocks rewritten in place, with the first line of each new text — the one
   *  operation that overwrites words a human already wrote. */
  rewrite?: { blocks: number; previews: string[] };
  /** What an append adds: the section headings it writes, or — with none — a
   *  bare note on the page. */
  append?: { headings: string[] };
}

/**
 * What a turn asks Delivery to stage behind the ✅ gate — as DATA.
 *
 * It used to be `{ text, blocks? }`: Slack mrkdwn, the ⚠️, the `:mag:` and the
 * confirm footer, all built inside Turn from `slack/proposal-render.ts`. So the
 * import arrow ran from a module declared Slack-free into Slack, a turn test
 * could only match rendered strings, and the eval suite measured Slack's
 * spelling as the turn's outcome (#623).
 *
 * Now the turn states what a person is being asked to approve and the adapter
 * spells it: `slack/proposal-render.ts` § `renderProposalCard` is the ONE place
 * mrkdwn, the emoji and the button row come from, and the recording adapter
 * below is handed a spelling rather than owning one.
 *
 * WHAT IS STILL SPELLED ELSEWHERE, and why it is not a leak: `target` and
 * `revision` are filled by `TurnDeps.cards`, named clients that perform the
 * Notion read Turn may not perform itself (`slack/notion-card.ts`). They hand
 * back these structures, not text — the read is theirs, the words are the
 * adapter's.
 */
export interface ProposalCard {
  /**
   * Which card this is.
   *
   * `confirm` is the ⚠️ card every gated tool gets: a preamble naming the verb,
   * then the staged parameters. `revision` is `notion_update`'s — the diff
   * leads and there is no preamble, because the named page and the
   * `current → new` lines say it better than a warning would.
   */
  kind: "confirm" | "revision";
  /** What one ✅ does, in the GATED ROW's own words (`agent/tool-table.ts`
   *  § `GateWords`, #598) — never the bare tool name a designer cannot read. */
  verb: string;
  /** The model's own lead line, when it wrote one. Prose, so it passes
   *  through: this is the one thing on the card the turn did not decide. */
  lead?: string;
  /** The concrete page a write lands on, where a read resolved one. */
  target?: CardTarget;
  /** The diff, on a `revision` card. */
  revision?: CardRevision;
  /** The staged parameters of the batch's FIRST operation. */
  fields: CardField[];
  caveats: CardCaveat[];
  /**
   * The WHOLE batch this one ✅ runs, in order.
   *
   * On the card because the card is what a person consents to: the adapter
   * groups it by what each operation touches and never truncates it, moving
   * the full list to its own messages rather than dropping any of it. Turn
   * used to splice that plan itself and hand the follow-up messages back to be
   * posted — which put Slack's message-size limits inside the turn.
   */
  operations: ProposalOperation[];
  /** A Figma render of the design a `prototype_scaffold` implements, when one
   *  could be fetched. A URL, not a block: what Slack does with an image is
   *  the adapter's. */
  previewImageUrl?: string;
}

// ── What Gate's verdict says ─────────────────────────────────────────────────

/**
 * The verdict a gate signal came to, in the port's words rather than Slack's.
 *
 * The port's, not Gate's, for the same reason `TurnSettlement` is: Gate posts
 * through this port and may not import Slack, so the thing a door hands over
 * has to be vocabulary the port already holds. Every one of these used to be a
 * `:hourglass:`-carrying string constant in `gate/gate.ts`, and one of them
 * carried a `<@user>` mention — which made a module documented as "results,
 * never effects; no Slack call" the author of Slack copy (#623).
 *
 * `slack/gate-note.ts` is where each becomes a line.
 */
export type GateNote =
  /** The claim was won and the signal brought no words of its own. */
  | { kind: "resolved"; decision: "confirm" | "cancel" }
  /** The claim was won and the model said what it was doing. Prose, so it
   *  passes through — the same exemption `ProposalCard.lead` gets. */
  | { kind: "said"; text: string }
  /** The lost race: someone else's confirmation got there first. */
  | { kind: "already-resolved" }
  /** A ✅ on a card that aged out of the store. */
  | { kind: "expired" }
  /** A ✅ on a card a revision replaced (#573). */
  | { kind: "superseded" }
  /** A reaction that landed somewhere other than the card it claims: say where
   *  the live card is, and resolve nothing. */
  | { kind: "not-on-the-card"; toolName: string; glyph: string; userId: string }
  /** The door caught the gesture and then failed to run it. */
  | { kind: "resolve-failed"; glyph: string };

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
   *
   * `settlement` is what the surface should say once the indicator is down. It
   * is an argument because "the work is over" and "the thread is ready" are
   * different facts: a turn that ends holding a staged card is over and still
   * blocked, and a surface told the second reports the thread as ready while a
   * decision on it is still outstanding (#575). What that difference LOOKS like
   * to a person is not asserted anywhere here — Slack documents what
   * `processing` renders as and says nothing about the rest.
   */
  clearWorking(settlement: TurnSettlement): Promise<void>;

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

  /**
   * Say what a gate signal came to.
   *
   * Its own method rather than a `postNote` with the words already in it,
   * because the four gate doors are the callers that may NOT hold Slack's
   * copy: three of them live in Gate and one in Turn, and every verdict line
   * carries an emoji and one of them a user mention. Handing over the verdict
   * is what lets those lines be spelled once, in the adapter, and asserted as
   * meanings in `tests/confirmation-paths.test.ts`.
   */
  postGateNote(note: GateNote): Promise<PostResult>;

  /**
   * Stage a proposal card — the agreed hand-over (#623):
   * `Turn ──► Delivery.card({ kind, subject, fields, actions })`.
   *
   * The ts it comes back with is the card's identity — what a ✅ resolves
   * against — so a null ts means nothing was staged. `text` on the result is
   * what the adapter actually POSTED, and is what the turn stores as the
   * proposal's text and writes into the conversation's memory: the turn no
   * longer has a rendering of its own to store instead (#623).
   *
   * An adapter may post MORE than the card — a batch plan too long for one
   * Slack message goes out as its own messages, before the card, so the
   * buttons stay the last thing in the thread. That is the adapter's business
   * because it is Slack's size limits doing the deciding.
   *
   * @param proposal what the person is being asked to approve
   */
  card(proposal: ProposalCard): Promise<PostResult>;

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
  | { kind: "working-clear"; settlement: TurnSettlement }
  | { kind: "beginProgress"; label: string }
  | { kind: "endProgress"; outcome: "complete" | "error" }
  | { kind: "interim"; text: string }
  | { kind: "answer"; text: string }
  | { kind: "note"; text: string }
  | { kind: "gate-note"; note: GateNote }
  | { kind: "proposal"; card: ProposalCard }
  | { kind: "failure"; stage: DeliveryFailureStage; message?: string };

export interface RecordingDelivery extends Delivery {
  /** Everything the turn did, in order. */
  readonly calls: DeliveryCall[];
  /** Just the posts a person would read, in order — answers, notes and cards. */
  readonly posted: string[];
  /** Fake ts values handed back, newest last. */
  readonly stagedAt: string[];
  /** Every card the turn staged, as the turn MEANT it — which is what a test
   *  about what a person approves should be asserting, rather than the string
   *  the spelling below happened to produce. */
  readonly stagedCards: ProposalCard[];
  /** Every gate verdict said out loud, as a meaning. */
  readonly gateNotes: GateNote[];
}

/**
 * How a recording turns a card and a verdict into the text it reports posting.
 *
 * INJECTED, because the two things a recording is used for want different
 * answers. A turn test is asserting what the turn meant, and reads `calls`; the
 * eval route is measuring a real transcript — the card's words reach the model
 * on the next turn through the thread's history — so it must be spelled exactly
 * as Slack spells it, and `eval/turn-adapter.ts` hands in
 * `slack/proposal-render.ts`'s own renderer to get that.
 *
 * A caller that hands in nothing gets `describeCard` / `describeGateNote`
 * below: a flat description in the PORT's vocabulary, deliberately not
 * Slack-shaped. That is the safe default in both directions — a test that only
 * wants "a card went up" gets a readable line, and a test that asserts Slack
 * copy against an unwired recording fails loudly instead of passing on a
 * lookalike.
 */
export interface DeliverySpelling {
  /** The card's text, and anything the adapter would post BEFORE it. */
  card(card: ProposalCard): { text: string; followUp?: string[] };
  gateNote(note: GateNote): string;
}

export interface RecordingDeliveryOptions {
  /** How this recording spells a card and a verdict. */
  spelling?: DeliverySpelling;
  /** Make a post fail, so the turn's "never ✅ a reply that was never
   *  delivered" path is reachable in a test. */
  answerFails?: boolean;
  /** Stage nothing — a card Slack rejected outright. */
  stagingFails?: boolean;
  /**
   * Make a note fail, the way Slack refuses a post into a conversation the bot
   * was removed from.
   *
   * The stop doors are what this exists for (`slack/stop-doors.ts`): each of
   * them has a duty that must outlive a refused line — the Home-tab button
   * still owes the presser a receipt, and the in-thread control must settle
   * the session whatever Slack does with the confirmation, since an indicator
   * that outlives the press is the failure the control exists to remove.
   */
  noteFails?: boolean;
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
  const stagedCards: ProposalCard[] = [];
  const gateNotes: GateNote[] = [];
  const spelling: DeliverySpelling = opts.spelling ?? {
    card: (card) => ({ text: describeCard(card) }),
    gateNote: describeGateNote,
  };
  let staged = 0;

  return {
    calls,
    posted,
    stagedAt,
    stagedCards,
    gateNotes,

    async react(emoji) {
      calls.push({ kind: "react", emoji });
    },

    async removeReaction(emoji) {
      calls.push({ kind: "removeReaction", emoji });
    },

    async setWorking(note) {
      calls.push({ kind: "working", ...note });
    },

    async clearWorking(settlement) {
      calls.push({ kind: "working-clear", settlement });
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
      if (opts.noteFails) return { ok: false, text };
      posted.push(text);
      return { ok: true, text, ts: `note-${calls.length}` };
    },

    async postGateNote(note) {
      calls.push({ kind: "gate-note", note });
      gateNotes.push(note);
      const text = spelling.gateNote(note);
      if (opts.noteFails) return { ok: false, text };
      posted.push(text);
      return { ok: true, text, ts: `note-${calls.length}` };
    },

    async card(proposal) {
      const { text, followUp } = spelling.card(proposal);
      // A plan too long for one Slack message goes out as its own messages
      // BEFORE the card, so the buttons stay last — recorded here in that same
      // order, and recorded whether or not the card itself then lands.
      for (const message of followUp ?? []) {
        calls.push({ kind: "note", text: message });
        posted.push(message);
      }
      calls.push({ kind: "proposal", card: proposal });
      stagedCards.push(proposal);
      if (opts.stagingFails) return { ok: false, text };
      posted.push(text);
      const ts = `card-${++staged}`;
      stagedAt.push(ts);
      return { ok: true, text, ts };
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

// ── The port's own description of a card and a verdict ───────────────────────

/**
 * A card in the port's words, for a recording nobody handed a spelling to.
 *
 * Deliberately NOT Slack-shaped — no mrkdwn, no ⚠️, no confirm footer. A
 * lookalike would be the worse fake of the two the header warns about: a test
 * asserting Slack copy would pass here and the real path would still be broken.
 * What it does carry is everything a reader needs to see which card this is.
 */
export function describeCard(card: ProposalCard): string {
  const parts = [`card(${card.kind}): ${card.verb}`];
  if (card.lead) parts.push(`lead: ${card.lead}`);
  if (card.target) parts.push(`target: ${card.target.title}`);
  for (const field of card.fields) parts.push(describeField(field));
  for (const caveat of card.caveats) parts.push(`caveat: ${caveat.kind}`);
  if (card.operations.length > 1) parts.push(`${card.operations.length} operations`);
  return parts.join("\n");
}

function describeField(field: CardField): string {
  const under = (field.under ?? [])
    .map((row) => ("item" in row ? row.item : describeField(row.field)))
    .join(", ");
  const value = field.value ?? "";
  return `${field.label}: ${[value, under].filter(Boolean).join(" ")}`.trimEnd();
}

/** A verdict in the port's words, on the same terms. */
export function describeGateNote(note: GateNote): string {
  switch (note.kind) {
    case "resolved":
      return `gate: ${note.decision}ed`;
    case "said":
      return note.text;
    case "not-on-the-card":
      return `gate: not-on-the-card (${note.toolName})`;
    case "resolve-failed":
      return `gate: resolve-failed (${note.glyph})`;
    default:
      return `gate: ${note.kind}`;
  }
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
 *
 * WHAT THE CLEAR SAYS is a MAPPER, not a read of the run's result. The wrapper
 * is instantiated with `T = void` by the two Gate doors, and one that inspected
 * what it wrapped would have to know every shape any caller might return — so
 * the caller that has an outcome hands over a function from it, and the
 * wrapper stays a `finally` that knows nothing (#575).
 *
 * REQUIRED, even for the `T = void` callers whose answer is a constant. It was
 * optional for one revision, and an optional argument nobody passes is the
 * shape of #578: a stream argument defaulted away for six revisions and
 * silently disabled the feature, and the fix was to make it required so the
 * next caller gets no hole. Here the hole is a caller that raises the signal
 * and settles a thread to whatever the default happened to be, which no test
 * outside the exit table would catch. So the type carries the guarantee and
 * each call site states its own fact — one line for a door.
 *
 * A run that THREW never reaches the mapper, and `"idle"` stands: the person is
 * deciding whether to retry, not answering something the agent asked for.
 */
export async function withWorkingSignal<T>(
  delivery: Delivery,
  run: (delivery: Delivery) => Promise<T>,
  settlementFrom: (result: T) => TurnSettlement,
): Promise<T> {
  let raised = false;
  let settlement: TurnSettlement = "idle";
  const watched: Delivery = {
    ...delivery,
    async setWorking(note) {
      raised = true;
      await delivery.setWorking(note);
    },
  };
  try {
    const result = await run(watched);
    settlement = settlementFrom(result);
    return result;
  } finally {
    if (raised) await delivery.clearWorking(settlement).catch(() => {});
  }
}
