// Gate — four signals in, one verdict out.
//
// A staged proposal is resolved four ways: a reaction on the card, the card's
// own ✅/⛔ button, the same emoji typed alone as a message, and the model's
// `proposal_resolve` call once the loop has validated it. Until now each door
// looked the proposal up its own way, wrote its own lost-race handling, and
// two of them read the claim's answer while a third threw it away — which is
// the bug: `slack/gate.ts` ignored the boolean, so a reaction that LOST the
// race still posted "kicking that off" beside the winner's.
//
// So the claim lives here, once. A door builds a signal, calls
// `resolveSignal`, and applies what comes back.
//
// WHAT A VERDICT IS. Results, never effects: the text to post and the tool to
// execute. Gate makes no Slack call and never touches `Env` — a door holds
// both and does the speaking through its Delivery. That is also what lets the
// whole four-path agreement be asserted in one Node test against the
// in-memory ThreadState (`tests/confirmation-paths.test.ts`).
//
// THE CLAIM IS THE LOCK. `ThreadState.claimProposal` deletes the record, one
// caller at a time, and fails closed. Of two racing resolvers exactly one gets
// `true`; the loser's verdict is `stale` and its post says so. Nothing past
// the claim runs twice, which matters because `notion_create` is not
// idempotent.
//
// PURE by design: no `Env`, no Workers global, no fetch, so
// `tsconfig.test.json` compiles it.

import { mapReaction, typedEmojiDecision, type Decision } from "../slack/gate-reactions";
import { proposalOperations } from "../thread-state/index";
import type {
  PendingProposal,
  ProposalOperation,
  ThreadState,
} from "../thread-state/index";

export type { Decision };

// ── The signal ───────────────────────────────────────────────────────────────

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
  | { kind: "typed"; channel: string; thread: string; text: string; userId: string }
  | {
      kind: "model";
      /** The loop validated the call against this proposal; Gate only claims
       *  and acts. */
      pending: PendingProposal;
      decision: Decision;
      messageToUser?: string;
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
 *   `won`   — this caller owns the resolution: post `post.text`, and run
 *             `execute` when it is set.
 *   `stale` — someone else already resolved it, or it aged out. `post.text`
 *             says which; nothing is executed.
 *   `none`  — there is nothing here to resolve: the glyph carries no decision,
 *             or the reaction sits somewhere other than the card. `post` is
 *             the pointer to the live card when there is one to point at, and
 *             null when silence is the right answer.
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
  /** What to say, and the ts to say it under. Null means say nothing. */
  post: { text: string; replyTs: string } | null;
  execute?: GateExecution;
}

export interface GateDeps {
  /** The proposal record and the claim. Gate's only dependency: expiry and the
   *  one-winner guarantee are the store's, so Gate holds no clock of its own —
   *  a second opinion about whether a proposal is live is how "already
   *  expired" and "already resolved" start disagreeing. */
  threadState: ThreadState;
}

// ── What the doors say ───────────────────────────────────────────────────────

/**
 * The lost race. One wording for all four doors, and deliberately without a
 * `<@user>`: the model's signal has no user, and a message that differs by
 * door is a message that drifts by door. Each door posts it where the person
 * is already looking.
 */
export const STALE_POST =
  ":hourglass: That proposal was already resolved — another confirmation got there first, " +
  "so nothing was executed twice.";

/** The delayed ✅/❌ on a card that aged out. Never silence: the person
 *  believes they just confirmed something (live 2026-07-10, where silence read
 *  as "the bot is broken"). */
export const EXPIRED_POST =
  ":hourglass: That proposal had already expired — nothing was executed. " +
  "Proposals stay live for an hour. Ask me again and I'll set the same thing up fresh.";

/** The default narrative, when the signal brought no words of its own. */
export function defaultNarrative(decision: Decision): string {
  return decision === "confirm" ? "Got it — kicking that off." : "Cancelled.";
}

/** A reaction that landed somewhere other than the card: say where the card
 *  is, and resolve nothing. */
function pointerPost(live: PendingProposal, glyph: string, userId: string): string {
  return (
    `:eyes: <@${userId}> I saw your :${glyph}:, but it is not on the proposal I am holding — ` +
    `nothing was executed. Use the buttons on the :warning: card for *${live.toolName}* just above, ` +
    `or react there.`
  );
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
 * conversation), check a reaction is on the card it claims to be, claim, and
 * only then describe what to run.
 */
export async function resolveSignal(signal: GateSignal, deps: GateDeps): Promise<GateVerdict> {
  // The model's call has already been validated against the thread's pending
  // state by the loop, and carries the proposal itself — there is nothing to
  // look up, only the claim.
  if (signal.kind === "model") {
    return claim(signal.pending, signal.decision, deps, signal.messageToUser);
  }

  // Parse before any read: a 🎉 in a thread that happens to hold a proposal is
  // not a gate signal and must cost nothing and say nothing.
  const decision =
    signal.kind === "button"
      ? signal.decision
      : signal.kind === "reaction"
        ? mapReaction(signal.glyph)
        : typedEmojiDecision(signal.text);
  if (!decision) return { outcome: "none", post: null };

  const found = await locate(signal, deps);

  if (found.state === "expired") {
    // The by-ts lookup knows the card aged out; answer the person under the
    // message they acted on, since the card's own record is gone.
    return {
      outcome: "stale",
      decision,
      post: { text: EXPIRED_POST, replyTs: replyTargetOf(signal) },
    };
  }

  if (found.state === "none") {
    // Nothing live anywhere in the conversation. A reaction may be ordinary
    // punctuation, so it stays silent; a button press, a typed gate emoji and
    // the model's call are all unambiguously ABOUT a card, so each gets an
    // answer rather than silence.
    if (signal.kind === "reaction") return { outcome: "none", decision, post: null };
    return {
      outcome: "stale",
      decision,
      post: { text: STALE_POST, replyTs: replyTargetOf(signal) },
    };
  }

  const proposal = found.proposal;

  // A reaction or a button resolves the card it was placed ON, or it resolves
  // nothing. This used to be an execution fallback — whatever the reaction sat
  // on, resolve the thread's live proposal — and it silently answered a
  // different question: react ✅ on a superseded card and the NEWER proposal
  // fired. The by-thread lookup is a POINTER here, never an executor.
  if (signal.kind !== "typed" && signal.messageTs !== proposal.proposalTs) {
    return {
      outcome: "none",
      proposal,
      decision,
      post:
        signal.kind === "reaction"
          ? {
              text: pointerPost(proposal, signal.glyph, signal.userId),
              replyTs: replyTarget(proposal),
            }
          : { text: STALE_POST, replyTs: replyTarget(proposal) },
    };
  }

  return claim(proposal, decision, deps);
}

/** The claim, and the verdict that follows from it. */
async function claim(
  proposal: PendingProposal,
  decision: Decision,
  deps: GateDeps,
  narrative?: string,
): Promise<GateVerdict> {
  // A person who reacts ✅ and then, unsure it registered, also types "go
  // ahead" runs two handlers that each loaded this same record. Whoever loses
  // here must not post the winner's narrative and above all must not execute.
  if (!(await deps.threadState.claimProposal(proposal.proposalTs))) {
    console.log(`[gate] ${proposal.toolName} at ${proposal.proposalTs} was already claimed`);
    return {
      outcome: "stale",
      proposal,
      decision,
      post: { text: STALE_POST, replyTs: replyTarget(proposal) },
    };
  }

  return {
    outcome: "won",
    proposal,
    decision,
    post: { text: narrative ?? defaultNarrative(decision), replyTs: replyTarget(proposal) },
    ...(decision === "confirm"
      ? {
          execute: {
            operations: proposalOperations(proposal),
            toolName: proposal.toolName,
            input: proposal.input,
            channel: proposal.channel,
            threadTs: proposal.threadTs,
            userMsgTs: proposal.userMsgTs,
            requesterUserId: proposal.requesterUserId,
            ...(proposal.notionPrdId ? { notionPrdId: proposal.notionPrdId } : {}),
            ...(proposal.notionPrdUrl ? { notionPrdUrl: proposal.notionPrdUrl } : {}),
          },
        }
      : {}),
  };
}

/**
 * By card ts, then by conversation.
 *
 * The by-ts read is the authoritative one — it is the only lookup that can
 * report "expired" — and the by-thread read is what a signal with no card ts
 * (a typed emoji) has instead, and what a reaction needs in order to point at
 * the card it missed. A failed read reads as "none", exactly as the doors'
 * own `.catch` did: every path below has something honest to say about
 * nothing.
 */
async function locate(
  signal: Exclude<GateSignal, { kind: "model" }>,
  deps: GateDeps,
): Promise<
  { state: "found"; proposal: PendingProposal } | { state: "expired" } | { state: "none" }
> {
  if (signal.kind !== "typed") {
    const byTs = await deps.threadState
      .getProposalByTs(signal.messageTs)
      .catch(() => ({ state: "none" }) as const);
    if (byTs.state === "found") return { state: "found", proposal: byTs.proposal };
    if (byTs.state === "expired") return { state: "expired" };
  }

  const ref = threadRefOf(signal);
  if (!ref) return { state: "none" };
  const live = await deps.threadState.getProposalByThread(ref).catch(() => null);
  return live ? { state: "found", proposal: live } : { state: "none" };
}

function threadRefOf(
  signal: Exclude<GateSignal, { kind: "model" }>,
): { channel: string; thread: string } | null {
  if (signal.kind === "button") return null; // a press carries no conversation
  return { channel: signal.channel, thread: signal.thread };
}

/** Where to answer a signal whose proposal was never found. */
function replyTargetOf(signal: Exclude<GateSignal, { kind: "model" }>): string {
  return signal.kind === "typed" ? signal.thread : signal.messageTs;
}
