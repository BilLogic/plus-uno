// Gate — five signals in, one verdict out.
//
// A staged proposal is resolved five ways: a reaction on the card, the card's
// own ✅/⛔ button, a decision in the card's Review pop-up, the same emoji typed
// alone as a message, and the model's `proposal_resolve` call once the loop
// has validated it. Until now each door
// looked the proposal up its own way, wrote its own lost-race handling, and
// two of them read the claim's answer while a third threw it away — which is
// the bug: `slack/gate.ts` ignored the boolean, so a reaction that LOST the
// race still posted "kicking that off" beside the winner's.
//
// So the claim lives here, once. A door builds a signal, calls
// `resolveSignal`, and applies what comes back.
//
// WHAT A VERDICT IS. Results, never effects: WHICH verdict this is, and the
// tool to execute. Gate makes no Slack call, imports no Slack module and never
// touches `Env` — a door holds all three and does the speaking through its
// Delivery. The verdict used to carry the TEXT as well, `:hourglass:` and
// `<@user>` and all, which made "no Slack call" true of the effects and false
// of the content (#623); the wordings now live in `slack/gate-note.ts` and the
// emoji vocabulary moved in here, as `gate/reactions.ts`. That is also what
// lets the agreement between every door be asserted in one Node test against the
// in-memory ThreadState (`tests/confirmation-paths.test.ts`) — as MEANINGS
// now, not as strings.
//
// THE CLAIM IS THE LOCK. `ThreadState.claimProposal` deletes the record, one
// caller at a time, and fails closed. Of two racing resolvers exactly one gets
// `true`; the loser's verdict is `stale` and its post says so. Nothing past
// the claim runs twice, which matters because `notion_create` is not
// idempotent.
//
// PURE by design: no `Env`, no Workers global, no fetch — which is what lets the
// Node suite DRIVE it rather than read it. (Not a compile property: the test
// compile is a glob over `src/**` and types the Workers globals beside the Node
// ones, so it would compile this file either way — `tsconfig.test.json`.)

import { mapReaction, typedEmojiDecision, type Decision } from "./reactions";
import { cancelRunOf, cardConfirmers, itemOfKey, mayConfirm, proposalOperations, unfinishedOperations } from "../thread-state/index";
import type {
  Execution,
  PendingProposal,
  ProposalOperation,
  StatedCardWords,
  ThreadState,
} from "../thread-state/index";
import type { GateNote } from "../turn/index";

// ── The signal ───────────────────────────────────────────────────────────────

/**
 * What the Review pop-up decides: a ✅ or a ⛔ as every door has them — the
 * pop-up's Reject is a ⛔ that may say why — or `revise`, Needs changes, which
 * only the pop-up has. A revise is not a resolution: it consumes nothing and
 * runs nothing; it locks the card as being revised (`ThreadState.markRevising`),
 * and the card stays findable for the revision that replaces it.
 */
export type ReviewDecision = Decision | "revise";

/**
 * One confirmation attempt, in the terms of the door it came through.
 *
 * A signal carries the FACTS the door already has, never a lookup: the ts a
 * reaction or a button press landed on, the conversation a typed message
 * arrived in, or — for the model — the proposal the loop already validated the
 * call against. Everything else (which proposal that is, what the emoji means,
 * whether it is still live) is this module's business.
 */
export type GateSignal =
  | {
      kind: "reaction";
      /** The message the reaction landed on. May not be the card. */
      messageTs: string;
      channel: string;
      /** The conversation the reacted message belongs to — the door resolves
       *  the thread root, because that read is a Slack call. */
      thread: string;
      /** Slack's emoji NAME, as a reaction event sends it. */
      glyph: string;
      userId: string;
    }
  | {
      kind: "button";
      /** The card itself: a button press always carries its own message. */
      messageTs: string;
      decision: Decision;
      userId: string;
    }
  | {
      kind: "review";
      /** The card the pop-up was opened from: the view carries its ts, so the
       *  decision is about that card and no other, as a button press is. */
      messageTs: string;
      /** Approve, Reject (`cancel`), or Needs changes (`revise`). */
      decision: ReviewDecision;
      /** Needs changes' note, which the revision is written from; Reject's
       *  reason, when one was given. */
      note?: string;
      userId: string;
      /**
       * The batch as the pop-up's edits left it, already checked by the door
       * against the guards a draft passes (`slack/review-fields.ts`). Absent,
       * the card runs as staged. Applied only to the card the claim wins, so
       * it is what the execution record and the run both carry.
       */
      operations?: ProposalOperation[];
    }
  | {
      kind: "typed";
      channel: string;
      /** The reply thread the message sits in — the key a card is held on. */
      thread: string;
      text: string;
      userId: string;
      /**
       * Set for an unthreaded DM line, which sits in no card's thread: with no
       * card of its own it answers the DM's only live card, in whichever
       * thread, and asks which when there are several.
       */
      wholeDm?: true;
    }
  | {
      kind: "model";
      /** The loop validated the call against this proposal; Gate only claims
       *  and acts. */
      pending: PendingProposal;
      decision: Decision;
      messageToUser?: string;
      /**
       * The person whose turn the model is acting in — checked against the
       * card's confirmer set like every other door's `userId`. Optional only
       * because a card with no set has nothing to check it against; a card
       * with one refuses a model signal that does not say who is acting.
       */
      userId?: string;
    };

// ── The verdict ──────────────────────────────────────────────────────────────

/** The confirmed tool, as the executor wants it. Self-contained on purpose: a
 *  door hands this straight to the executor rather than re-deriving it. */
export interface GateExecution {
  /** The whole approved batch, in order. One ✅ approved all of it, so the
   *  executor runs all of it — there is no second card for operation two. */
  operations: ProposalOperation[];
  /** The FIRST operation, kept populated for one release so a reader that has
   *  not moved to `operations` yet keeps working unchanged. */
  toolName: string;
  input: Record<string, unknown>;
  channel: string;
  /** The conversation key — the history ref, and `SlackContext.threadTs`.
   *  **Never post with this**; `post.replyTs` is the value to reply under. */
  threadTs: string;
  userMsgTs: string;
  requesterUserId: string;
  /** The PRD resolved at proposal time, carried through the round trip. */
  notionPrdId?: string;
  notionPrdUrl?: string;
}

/**
 * What the signal came to:
 *
 *   `won`   — this caller owns the resolution: post `post.note`, and run
 *             `execute` when it is set.
 *   `stale` — someone else already resolved it, or it aged out. `post.note`
 *             says which; nothing is executed.
 *   `none`  — there is nothing here to resolve: the glyph carries no decision,
 *             the reaction sits somewhere other than the card, or the signal
 *             came from someone outside the card's confirmer set. `post` is
 *             the pointer to the live card, or who can confirm it, when there
 *             is something to say, and null when silence is the right answer.
 *
 * `decision` is set whenever the signal carried or parsed one, which is how a
 * caller tells "not a gate emoji" (absent) from "a gate emoji that resolved
 * nothing" (present).
 */
export interface GateVerdict {
  outcome: "won" | "stale" | "none";
  /** The proposal the signal was about, when one was found. */
  proposal?: PendingProposal;
  decision?: Decision;
  /**
   * What to say, and the ts to say it under. Null means say nothing.
   *
   * A `GateNote`, not a string: the note names the verdict and carries the
   * facts it turned on, and `slack/gate-note.ts` is where it becomes a line
   * with an emoji and — for the one verdict aimed at a person's own gesture —
   * a mention in it (#623). A door posts it through `Delivery.postGateNote`.
   */
  post: { note: GateNote; replyTs: string; card?: GateCard } | null;
  execute?: GateExecution;
  /**
   * Operations to put back in front of a person on a fresh card — set only on
   * a cut-off verdict, and only for what never came back. Never executed from
   * here: a re-staged card is a proposal like any other, and runs only on its
   * own ✅. The door that holds a card builder stages it, after the note.
   */
  restage?: GateRestage;
  /**
   * The door the signal came through and the person behind it, when it named
   * one — facts the signal carried, handed back so whoever applies the verdict
   * can record who decided the card and how (`usage/proposal-events.ts`).
   * Absent only on a verdict no signal produced (`cutOffVerdict` taken by a
   * turn).
   */
  by?: { door: GateSignal["kind"]; userId?: string };
  /**
   * Needs changes, accepted: the card is now locked as being revised, and a
   * revision is to be written from `note`. Set only on a `won` verdict of a
   * review `revise`, which has no `decision`, no `post` and no `execute` — the
   * door posts the note into the thread and the revision turn does the rest.
   */
  revise?: { note: string };
}

/**
 * The card a note is about, when the note is about the card's own state: it
 * aged out, a revision replaced it, or it is waiting on someone else. Such a
 * note belongs ON the card, as its last line, rather than in a new message —
 * `Delivery.postGateNote` takes it there. `text` is the card as posted, and
 * `blocks` its own blocks when it had any: what the note is edited onto.
 */
export interface GateCard {
  ts: string;
  text: string;
  blocks?: unknown[];
}

/** The card a note is about, when its words are known: a staged proposal, or
 *  what an "expired" or "superseded" lookup kept of one. */
function cardOf(
  ts: string,
  posted: { proposalText?: string; proposalBlocks?: unknown[] },
): { card?: GateCard } {
  if (!posted.proposalText) return {};
  return {
    card: {
      ts,
      text: posted.proposalText,
      ...(posted.proposalBlocks ? { blocks: posted.proposalBlocks } : {}),
    },
  };
}

/** What a cut-off verdict asks to have staged again. */
export interface GateRestage {
  /** The card that was approved and cut off; the fresh one keeps its
   *  requester, thread and PRD. */
  proposal: PendingProposal;
  /** The operations that never came back, in batch order. Never empty. */
  operations: ProposalOperation[];
}

export interface GateDeps {
  /** The proposal record and the claim. Gate's only dependency: expiry and the
   *  one-winner guarantee are the store's, so Gate holds no clock of its own —
   *  a second opinion about whether a proposal is live is how "already
   *  expired" and "already resolved" start disagreeing. */
  threadState: ThreadState;
  /** Slack ids who may resolve any card with a confirmer set, beside its own
   *  set (`cardConfirmers`). Absent or empty, a card's own set is the whole
   *  of it. Read from `STANDING_CONFIRMER_IDS` where `Env` becomes the deps. */
  standingConfirmers?: readonly string[];
}

// ── What the doors say ───────────────────────────────────────────────────────

/**
 * A reaction that landed somewhere other than the card: say where the card is,
 * and resolve nothing.
 *
 * The only verdict that carries facts beyond the decision, and the reason a
 * note is a shape rather than an enum: the line names the gesture, the person
 * who made it and the tool on the live card, none of which Gate may spell.
 */
function pointerNote(live: PendingProposal, glyph: string, userId: string): GateNote {
  return { kind: "not-on-the-card", toolName: live.toolName, glyph, userId, ...(live.stated ? { stated: true } : {}) };
}

/** Where a resolution speaks: the card's own reply target, never `threadTs` —
 *  that is the history key and is the literal string "dm" in a DM, which Slack
 *  rejects (live 2026-08-22: an approved write said nothing at all). */
function replyTarget(proposal: PendingProposal): string {
  return proposal.replyTs ?? proposal.threadTs;
}

// ── The gate ─────────────────────────────────────────────────────────────────

/**
 * Resolve one signal.
 *
 * The order is fixed and is the whole of the gate's policy: read the decision
 * the signal carries, find the proposal it is about (by card ts, then by
 * reply thread, then — for an unthreaded DM line — the whole DM), check a reaction is on the card it claims to be, check
 * the signal's person may confirm it, claim, and only then describe what to
 * run.
 */
export async function resolveSignal(signal: GateSignal, deps: GateDeps): Promise<GateVerdict> {
  const verdict = await resolve(signal, deps);
  return { ...verdict, by: { door: signal.kind, ...(signal.userId ? { userId: signal.userId } : {}) } };
}

async function resolve(signal: GateSignal, deps: GateDeps): Promise<GateVerdict> {
  // The model's call has already been validated against the thread's pending
  // state by the loop, and carries the proposal itself — there is nothing to
  // look up, only the claim.
  if (signal.kind === "model") {
    if (itemOfKey(signal.pending.proposalTs)) return reviewOnly(signal.pending, signal.decision);
    return claim(signal.pending, signal.decision, signal.userId, deps, { narrative: signal.messageToUser });
  }

  // Parse before any read: a 🎉 in a thread that happens to hold a proposal is
  // not a gate signal and must cost nothing and say nothing.
  // A Needs changes that finds nothing live to change is answered as a ⛔
  // would be: it asked for nothing to run, so it can only be told why.
  const decision =
    signal.kind === "review"
      ? signal.decision === "revise"
        ? "cancel"
        : signal.decision
      : signal.kind === "button"
        ? signal.decision
        : signal.kind === "reaction"
        ? mapReaction(signal.glyph)
        : typedEmojiDecision(signal.text);
  if (!decision) return { outcome: "none", post: null };

  const found = await locate(signal, deps);

  if (found.state === "superseded") {
    // Answered under the card they acted on, which is where they are looking.
    // No by-thread pointer: the live one is the thread's newest CARD (replies
    // land after it), and a second lookup to name it buys nothing.
    return {
      outcome: "stale",
      decision,
      post: {
        note: { kind: "superseded", ...(found.stated ? { stated: true } : {}) },
        replyTs: replyTargetOf(signal),
        ...cardSignalled(signal, found),
      },
    };
  }

  if (found.state === "expired") {
    // The by-ts lookup knows the card aged out; answer the person under the
    // message they acted on, since the card's own record is gone.
    return {
      outcome: "stale",
      decision,
      post: {
        // The card's own lifetime rides along when it had one, so the note
        // says how long it was live rather than assuming the hour — and a
        // stated card's own line, which says it in that card's terms.
        note: {
          kind: "expired",
          ...(found.ttlMs !== undefined ? { ttlMs: found.ttlMs } : {}),
          ...(found.stated ? { words: found.stated.expired } : {}),
        },
        replyTs: replyTargetOf(signal),
        ...cardSignalled(signal, found),
      },
    };
  }

  if (found.state === "cut-off") {
    // The card was approved and its run never reported back. Say so, and put
    // what did not come back on a fresh card — never run it (see
    // `cutOffVerdict`).
    return cutOffVerdict(found.execution, decision);
  }

  if (found.state === "several") {
    // Outside every card's thread, and more than one card it could mean: two
    // cards are two different writes, so ask rather than pick one.
    return {
      outcome: "none",
      decision,
      post: { note: { kind: "which-card", count: found.count }, replyTs: replyTargetOf(signal) },
    };
  }

  if (found.state === "none") {
    // An unthreaded DM line with no card anywhere in the DM is not about a
    // card at all: nothing to say here, so the turn hands it to the model.
    if (signal.kind === "typed" && signal.wholeDm) return { outcome: "none", decision, post: null };
    // Nothing live anywhere in the thread. A reaction may be ordinary
    // punctuation, so it stays silent; a button press, a typed gate emoji and
    // the model's call are all unambiguously ABOUT a card, so each gets an
    // answer rather than silence.
    if (signal.kind === "reaction") return { outcome: "none", decision, post: null };
    return {
      outcome: "stale",
      decision,
      post: { note: { kind: "already-resolved" }, replyTs: replyTargetOf(signal) },
    };
  }

  const proposal = found.proposal;

  // A reaction or a button resolves the card it was placed ON, or it resolves
  // nothing. This used to be an execution fallback — whatever the reaction sat
  // on, resolve the thread's live proposal — and it silently answered a
  // different question: react ✅ on a card that is not the thread's live one
  // and the NEWER proposal fired. The by-thread lookup is a POINTER here, never
  // an executor, and that is the execution guarantee the superseded branch
  // above leans on rather than duplicates.
  if (signal.kind !== "typed" && signal.messageTs !== proposal.proposalTs) {
    return {
      outcome: "none",
      proposal,
      decision,
      post:
        signal.kind === "reaction"
          ? {
              note: pointerNote(proposal, signal.glyph, signal.userId),
              replyTs: replyTarget(proposal),
            }
          : { note: { kind: "already-resolved" }, replyTs: replyTarget(proposal) },
    };
  }

  // Sent back with Needs changes: its revision is being written, and the
  // revised card is the one to decide. Every door, every decision — a second
  // Needs changes included, which is how two presses start one revision.
  if (proposal.revising) return beingRevised(proposal, decision);

  // One item of a decision report shares its thread, and its message, with
  // the report's other items, so a typed emoji cannot say which it means: an
  // item is decided in its own Review pop-up and nowhere else. A reaction or
  // an old card button never reaches here — neither carries an item's key, so
  // the pointer branch above has already answered it.
  if (signal.kind === "typed" && itemOfKey(proposal.proposalTs)) return reviewOnly(proposal, decision);

  if (signal.kind === "review") {
    if (signal.decision === "revise") return askForChanges(proposal, signal.note ?? "", signal.userId, deps);
    // The pop-up's ⛔ is Reject, and its reason rides on the note it posts.
    if (decision === "cancel") {
      const reason = signal.note?.trim();
      return claim(proposal, decision, signal.userId, deps, { byCard: true, rejected: reason ? { reason } : {} });
    }
    return claim(edited(proposal, signal.operations), decision, signal.userId, deps, { byCard: true });
  }
  return claim(proposal, decision, signal.userId, deps, { byCard: signal.kind !== "typed" });
}

/** The card with a pop-up's edited batch in place of its own, the first
 *  operation mirrored where the one-operation readers look. */
function edited(proposal: PendingProposal, operations: ProposalOperation[] | undefined): PendingProposal {
  const [first] = operations ?? [];
  if (!first) return proposal;
  return { ...proposal, operations, toolName: first.toolName, input: first.input };
}

/**
 * Needs changes on a live card: the confirmer rules a claim applies, and then
 * no claim.
 *
 * The card is NOT consumed and NOT retired here, only marked as being revised,
 * which every signal on it is refused by until the revision replaces it or the
 * revision turn ends without one. The revision is a turn in the
 * card's thread, and a turn revises the card it finds pending there — so the
 * card has to still be pending when it looks. Staging the revision is what
 * retires it (`ThreadState.putProposal`), and the turn retires it ahead of
 * writing (`retireProposal`), which is the supersession every other revision
 * gets. An empty note revises nothing: there is nothing to write it from.
 */
async function askForChanges(
  proposal: PendingProposal,
  note: string,
  userId: string,
  deps: GateDeps,
): Promise<GateVerdict> {
  const text = note.trim();
  if (!text) return { outcome: "none", proposal, post: null };
  if (!mayConfirm(proposal, userId, deps.standingConfirmers)) return notAConfirmer(proposal, "cancel", userId, deps, true);
  // The mark is the lock, as the claim is for a decision: of two presses, or a
  // press racing an Approve, one wins. A failed write revises nothing.
  const mark = await deps.threadState.markRevising(proposal.proposalTs, userId).catch(() => "gone" as const);
  if (mark === "already") return beingRevised(proposal, "cancel");
  if (mark === "gone") {
    return { outcome: "stale", proposal, decision: "cancel", post: { note: { kind: "already-resolved" }, replyTs: replyTarget(proposal) } };
  }
  console.log(`[gate] ${proposal.toolName} at ${proposal.proposalTs}: changes asked by ${userId}`);
  return { outcome: "won", proposal, post: null, revise: { note: text } };
}

/** A typed emoji or the model's call on one item of a decision report:
 *  nothing resolved, and Review named as the way to decide it. */
function reviewOnly(proposal: PendingProposal, decision: Decision): GateVerdict {
  console.log(`[gate] ${proposal.toolName} at ${proposal.proposalTs}: a report item, decided from Review only`);
  return { outcome: "none", proposal, decision, post: { note: { kind: "review-only" }, replyTs: replyTarget(proposal) } };
}

/** A signal on a card whose revision is being written: nothing resolved. */
function beingRevised(proposal: PendingProposal, decision: Decision): GateVerdict {
  console.log(`[gate] ${proposal.toolName} at ${proposal.proposalTs}: being revised, signal refused`);
  return { outcome: "stale", proposal, decision, post: { note: { kind: "being-revised" }, replyTs: replyTarget(proposal) } };
}

/**
 * A signal from someone the card does not accept: nothing resolved, and who
 * can resolve it named.
 *
 * `byCard` is a gesture made ON the card — a reaction, a press, the pop-up —
 * whose person is looking at the card, so the line goes there. A typed emoji
 * or the model's call was made in the thread, and is answered there, near the
 * message, as it always was: a line edited onto a card above would be missed.
 */
function notAConfirmer(
  proposal: PendingProposal,
  decision: Decision,
  userId: string | undefined,
  deps: GateDeps,
  byCard: boolean,
): GateVerdict {
  console.log(`[gate] ${proposal.toolName} at ${proposal.proposalTs}: ${userId ?? "no user"} is not a confirmer`);
  return {
    outcome: "none",
    proposal,
    decision,
    post: {
      note: {
        kind: "not-a-confirmer",
        confirmers: cardConfirmers(proposal, deps.standingConfirmers) ?? [],
        ...(userId ? { userId } : {}),
      },
      replyTs: replyTarget(proposal),
      // The card is still live and waiting on one of them: the line goes on it.
      ...(byCard ? cardOf(proposal.proposalTs, proposal) : {}),
    },
  };
}

/**
 * What a person opening a card's Review pop-up is shown: the card, and whether
 * they may decide it — or why there is nothing left to decide.
 *
 * A look, not a signal: it claims nothing, consumes nothing and records
 * nothing, so opening the pop-up twice, or opening it and closing it, leaves
 * the card exactly as it was. `mayDecide` is the same `mayConfirm` the claim
 * checks, so the pop-up never offers a decision the claim would refuse. The
 * decision itself comes back through `resolveSignal` as a `review` signal,
 * which re-checks all of it: a card can expire or be replaced while the pop-up
 * is open.
 */
export type ProposalLook =
  | { state: "live"; proposal: PendingProposal; mayDecide: boolean; confirmers: string[] }
  | { state: "superseded"; stated?: StatedCardWords; proposalText?: string; proposalBlocks?: unknown[] }
  | { state: "expired"; ttlMs?: number; stated?: StatedCardWords; proposalText?: string; proposalBlocks?: unknown[] }
  /** Decided, cut off, or never a card: nothing here is waiting on anyone. */
  | { state: "gone" };

export async function lookAtProposal(messageTs: string, userId: string, deps: GateDeps): Promise<ProposalLook> {
  const byTs = await deps.threadState.getProposalByTs(messageTs).catch(() => ({ state: "none" }) as const);
  if (byTs.state === "found") {
    const proposal = byTs.proposal;
    return {
      state: "live",
      proposal,
      mayDecide: mayConfirm(proposal, userId, deps.standingConfirmers),
      confirmers: cardConfirmers(proposal, deps.standingConfirmers) ?? [],
    };
  }
  if (byTs.state === "superseded" || byTs.state === "expired") return byTs;
  return { state: "gone" };
}

/** The claim, and the verdict that follows from it. */
async function claim(
  proposal: PendingProposal,
  decision: Decision,
  userId: string | undefined,
  deps: GateDeps,
  opts: {
    /** The model's own words for the outcome. */
    narrative?: string;
    /** Set for the pop-up's Reject: a ⛔ that says so, with its reason. */
    rejected?: { reason?: string };
    /** The signal was a gesture on the card itself (`notAConfirmer`). */
    byCard?: boolean;
  } = {},
): Promise<GateVerdict> {
  const { narrative, rejected } = opts;
  // A card with a confirmer set resolves only for its members, on every door.
  // Checked BEFORE the claim, because the claim consumes the card: a refused
  // signal has to leave it exactly as it was for the person who may confirm.
  // `none`, not `stale` — nobody else resolved it and it has not aged out;
  // this signal was simply not one the card accepts.
  if (!mayConfirm(proposal, userId, deps.standingConfirmers)) {
    return notAConfirmer(proposal, decision, userId, deps, opts.byCard ?? false);
  }

  // A person who reacts ✅ and then, unsure it registered, also types "go
  // ahead" runs two handlers that each loaded this same record. Whoever loses
  // here must not post the winner's narrative and above all must not execute.
  if (!(await deps.threadState.claimProposal(proposal.proposalTs))) {
    console.log(`[gate] ${proposal.toolName} at ${proposal.proposalTs} was not claimable`);
    // WHY the claim was refused decides what to say, and the store is the only
    // one who knows (#583). Two doors reach this function with a proposal they
    // are holding in memory rather than one they looked up — the model's
    // `proposal_resolve` and Turn's identical re-stage — so this is the first
    // point on either path at which a replaced card can be recognised. Telling
    // that person "another confirmation got there first" invents a second
    // person; what happened is that their card was revised. One extra read, on
    // the losing path only.
    const why = await deps.threadState
      .getProposalByTs(proposal.proposalTs)
      .catch(() => ({ state: "none" }) as const);
    // Still there, and refused: someone sent it back with Needs changes.
    if (why.state === "found" && why.proposal.revising) return beingRevised(proposal, decision);
    return {
      outcome: "stale",
      proposal,
      decision,
      post: {
        note:
          why.state === "superseded"
            ? { kind: "superseded", ...(proposal.stated ? { stated: true } : {}) }
            : { kind: "already-resolved" },
        replyTs: replyTarget(proposal),
        // A replaced card says so on itself; a lost race is about this
        // person's signal, not the card, and is said in the thread.
        ...(why.state === "superseded" ? cardOf(proposal.proposalTs, proposal) : {}),
      },
    };
  }

  // Won by someone the card's own set would have refused: the standing set let
  // them in, and the log says so (the usage record keeps only who).
  if (userId && !mayConfirm(proposal, userId)) {
    console.log(`[gate] ${proposal.toolName} at ${proposal.proposalTs}: ${userId} won as a standing confirmer`);
  }

  // Won, and about to run: record that it started, before anything can. The
  // claim just consumed the card, so from here until the outcome is told this
  // record is the only trace that an approved run exists — the one a later
  // look reads when the run never reports back (`cutOffVerdict`). A failed
  // write is logged and the run goes ahead untracked, as every run did before
  // the record existed: refusing to run an approved card over bookkeeping
  // would be a worse answer to the person than the rare untracked cut-off.
  // What runs: the card on a ✅; on a ⛔, only what the card said a cancel
  // still runs (`PendingProposal.onCancel`), which every turn's card leaves
  // unset — so for them a cancel runs nothing, as it always has.
  const run = decision === "confirm" ? proposal : cancelRunOf(proposal);
  if (run) {
    await deps.threadState.beginExecution(run).catch((err: unknown) => {
      console.warn(
        `[gate] execution record for ${proposal.proposalTs} not written: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
  }

  return {
    outcome: "won",
    proposal,
    decision,
    post: {
      // The model's own words when it brought any, and otherwise the fact that
      // the card resolved — which is all Gate knows and all it needs to say.
      note: narrative
        ? { kind: "said", text: narrative }
        : {
            kind: "resolved",
            decision,
            ...(decision === "cancel" && run ? { stillRuns: proposalOperations(run).map((op) => op.toolName) } : {}),
            ...(decision === "cancel" && proposal.stated ? { cancelled: proposal.stated.cancelled } : {}),
            ...(decision === "cancel" && rejected ? { rejected } : {}),
          },
      replyTs: replyTarget(proposal),
    },
    ...(run
      ? {
          execute: {
            operations: proposalOperations(run),
            toolName: run.toolName,
            input: run.input,
            channel: run.channel,
            threadTs: run.threadTs,
            userMsgTs: run.userMsgTs,
            requesterUserId: run.requesterUserId,
            ...(run.notionPrdId ? { notionPrdId: run.notionPrdId } : {}),
            ...(run.notionPrdUrl ? { notionPrdUrl: run.notionPrdUrl } : {}),
          },
        }
      : {}),
  };
}

/**
 * What a later look at a cut-off run comes to: a note, and a fresh card for
 * what never came back.
 *
 * `stale`, because nothing here is claimed or run. The note names what
 * finished and what did not — an operation that never returned may still have
 * happened, so the person is told to check before approving it again, and
 * nothing is ever re-run on the strength of the original ✅. Completed
 * operations are never re-staged; a batch that finished every operation and
 * only failed to say so re-stages nothing at all.
 *
 * A ⛔ on the stuck card is answered with the note and no card: the person
 * asked for nothing more to happen.
 *
 * Exported for Turn, whose next turn in the card's thread is the other later
 * look: it takes the execution itself and brings it here.
 */
export function cutOffVerdict(execution: Execution, decision: Decision): GateVerdict {
  const proposal = execution.proposal;
  const operations = proposalOperations(proposal);
  const unfinished = unfinishedOperations(execution);
  const restaged = decision === "confirm" && unfinished.length > 0;
  console.log(
    `[gate] cut-off run on ${proposal.proposalTs}: settled=${execution.settled.length}/${operations.length} restaged=${restaged}`,
  );
  return {
    outcome: "stale",
    proposal,
    decision,
    post: {
      note: {
        kind: "cut-off",
        finished: [...execution.settled]
          .sort((a, b) => a.index - b.index)
          .map((s) => ({ toolName: operations[s.index]?.toolName ?? proposal.toolName, ok: s.ok })),
        unfinished: unfinished.map((op) => op.toolName),
        restaged,
      },
      replyTs: replyTarget(proposal),
    },
    ...(restaged ? { restage: { proposal, operations: unfinished } } : {}),
  };
}

/**
 * By card ts, then by reply thread — and, for an unthreaded DM line, across
 * the whole DM.
 *
 * The by-ts read is the authoritative one — it is the only lookup that can
 * report "expired" or "superseded" — and the by-thread read is what a signal
 * with no card ts (a typed emoji) has instead, and what a reaction needs in
 * order to point at the card it missed. A failed read reads as "none", exactly
 * as the doors' own `.catch` did: every path below has something honest to say
 * about nothing.
 */
async function locate(
  signal: Exclude<GateSignal, { kind: "model" }>,
  deps: GateDeps,
): Promise<
  | { state: "found"; proposal: PendingProposal }
  | { state: "superseded"; stated?: StatedCardWords; proposalText?: string; proposalBlocks?: unknown[] }
  | { state: "expired"; ttlMs?: number; stated?: StatedCardWords; proposalText?: string; proposalBlocks?: unknown[] }
  | { state: "cut-off"; execution: Execution }
  | { state: "several"; count: number }
  | { state: "none" }
> {
  if (signal.kind !== "typed") {
    const byTs = await deps.threadState
      .getProposalByTs(signal.messageTs)
      .catch(() => ({ state: "none" }) as const);
    if (byTs.state === "found") return { state: "found", proposal: byTs.proposal };
    // A superseded or aged-out card stops here rather than falling through to
    // the by-thread lookup. Not for the execution guarantee — the pointer
    // branch in `resolveSignal` already holds that independently, since a
    // signal whose `messageTs` is not the found card's resolves nothing on
    // either door. This is about WORDING: the fallback would hand back the
    // thread's newest card and the person would be told their ✅ "is not on
    // the proposal I am holding", when what actually happened is that the card
    // they acted on was replaced.
    if (byTs.state === "superseded") return byTs;
    if (byTs.state === "expired") return byTs;
    // No card under this ts — and the claim that consumed it may belong to a
    // run that was cut off. Only a gesture ON the stuck card asks this: a
    // reaction anywhere else must not collect another card's note.
    const cutOff = await deps.threadState
      .takeCutOffExecution(signal.messageTs)
      .catch(() => null);
    if (cutOff) return { state: "cut-off", execution: cutOff };
  }

  const ref = threadRefOf(signal);
  if (!ref) return { state: "none" };
  const live = await deps.threadState.getProposalByThread(ref).catch(() => null);
  if (live) return { state: "found", proposal: live };

  if (signal.kind !== "typed" || !signal.wholeDm) return { state: "none" };
  const all = await deps.threadState.getProposalsByChannel(signal.channel).catch(() => []);
  if (all.length === 1) return { state: "found", proposal: all[0]! };
  return all.length > 1 ? { state: "several", count: all.length } : { state: "none" };
}

function threadRefOf(
  signal: Exclude<GateSignal, { kind: "model" }>,
): { channel: string; thread: string } | null {
  // A press, on the card or in its pop-up, carries no conversation.
  if (signal.kind === "button" || signal.kind === "review") return null;
  return { channel: signal.channel, thread: signal.thread };
}

/** The card a by-ts signal was placed on: a reaction's or a press's own
 *  message. A typed signal names no card. */
function cardSignalled(
  signal: Exclude<GateSignal, { kind: "model" }>,
  posted: Parameters<typeof cardOf>[1],
): { card?: GateCard } {
  return signal.kind === "typed" ? {} : cardOf(signal.messageTs, posted);
}

/** Where to answer a signal whose proposal was never found. */
function replyTargetOf(signal: Exclude<GateSignal, { kind: "model" }>): string {
  return signal.kind === "typed" ? signal.thread : signal.messageTs;
}
