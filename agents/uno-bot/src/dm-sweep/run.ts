// DMs with uno-bot, as a source for Capture and Follow through (#742's C6, C7
// and F6 rows).
//
// About half the asks happen in people's 1:1 DMs with uno-bot. uno-bot is a
// party to those, so the end-of-day `sweep-dms` job reads them with the bot
// token and no opt-in (`sweep/run.ts`), and hands each thread — both sides —
// to the hook here. What it finds is posted ONLY back into that same DM, at the
// next weekday morning run.
//
// THREE ENTRY POINTS, one module:
//
//   `dmThreadHook` — end of day, per DM thread. The DM detector (`./detector.ts`)
//   reads the thread's new messages:
//     • UNANSWERED (F6) — uno-bot said it could not find an answer, or was
//       not sure of it: kept as a `dm_unanswered` commitment, one per thread;
//     • DISAGREEMENT (C6) — uno-bot noticed two sources disagree: kept as a
//       `dm_disagreement` commitment, one per answer;
//     • DECISION (C7) — the person told uno-bot a decision: the verdict says
//       so, and the sweep runs its drift read over the thread, whose finding
//       becomes a proposal card in that DM (`sweep-post`, the private rung).
//   And when the thread holds uno-bot's F6 ask (tagged `DM_ASK_EVENT`) with the
//   person's reply after it, the ask is done and the verdict says `answered`:
//   the sweep's placement read runs as it does for an answered question in a
//   channel (#764), and its card lands in the DM too.
//
//   `dmAsksDue` — the morning's `commitment-nudge` job hands it each DM row
//   due, as it hands card follow-ups to theirs. F6: "Yesterday I couldn't find
//   <X>. Did you get it?", once, in the thread; unanswered by its next due
//   date, it lapses. C6: a proposal card in the thread offering to post a note —
//   its ✅ runs `sweep_share_post` with a reworded note (`./copy.ts`) in
//   #plus-universal for the design system, #plus-design otherwise
//   (`shareDestination`), and its ⛔ drops it. That ✅, by the person the DM is
//   with, is the only way anything found in a DM reaches a channel. Each raise
//   card holds a slot of its own (`raiseSlot`). A thread gets one raise, and a
//   pair of sources is raised once in a person's DM for `RAISE_QUIET_MS`
//   whatever became of it (`raisePrefix`). Every post here, the raise card's
//   result included, is tagged (`DM_ASK_EVENT`, `DM_RAISE_EVENT`), so the next
//   night reads it as uno-bot's own post (`detector.ts` § isFresh).
//
//   `answerDmAsk` — the reaction door's hand-off for a DM row: 🙅 on the F6
//   ask from its person drops it. Any other glyph does nothing. The raise
//   card is a proposal, so its ✅ and ⛔ go to the gate.
//
// WHAT IS KEPT. Rows in `commitments` with `channel_kind` 'dm' — the surface
// flag — and no text (ADR-030): what uno-bot could not find and what two
// sources disagree on wait in KV, in the detector's words, with an expiry.
// Nothing here is ever read by another person's job or the commitment
// detector's examples, which take thread promises only.
//
// PURE: every dependency is injected (tests/dm-sweep.test.ts); `Env` enters in
// `./env.ts`.

import { rethrowIfBudget } from "../net";
import { reminderAnswer, reminderBlocks } from "../commitments/copy";
import { dayLabel, etDayOf, rearmedDueAt, TEXT_KEEP_MS } from "../commitments/due";
import { MAX_HOLDS, type CommitmentAction, type ReminderReaction } from "../commitments/run";
import { LIVE_STATES, type CommitmentPatch, type CommitmentRecord, type CommitmentStore, type CommitmentText } from "../commitments/store";
import { shareDestination } from "../sweep/finding";
import { SWEEP_CARD_TTL_MS } from "../sweep/cards";
import type { DmThread, DmThreadVerdict } from "../sweep/run";
import type { PendingProposal, ThreadState } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { recordProposalEvents, stagedEvent, storesChannel, supersededEvents, type ProposalEventLog } from "../usage/index";
import { ASK_DROPPED, ASK_FOOTER, askText, DM_RAISE_EVENT, raiseCard, whenWord, type RaiseTo } from "./copy";
import type { DmDetection, DmDetector } from "./detector";

/** The tag on uno-bot's F6 ask: how the next night finds the ask its person
 *  replied under. */
export const DM_ASK_EVENT = "uno_dm_ask";

/** What a rehearsal (`/debug/sweep`) shows of a DM ask: whoever calls the
 *  probe may be anyone, and a DM's words are its person's (ADR-031). */
export const DM_WITHHELD = "(withheld: this ask is for a DM)";

/** How long after an ask is answered a retried end-of-day job still reads
 *  its thread for placement: the rest of that night's run. */
const RETRY_WINDOW_MS = 6 * 60 * 60 * 1000;

/** The raise card's slot key in its thread (`proposalSlot`): one slot per
 *  offer (`raiseSlot`), so a second raise in a thread never retires the first. */
export const DM_RAISE_KEY = "dm-raise";

/** The slot one raise card holds: its row's own. */
export function raiseSlot(id: string): string {
  return `${DM_RAISE_KEY}:${id}`;
}

/**
 * The tag a proposal's batch result posts with, when it has one: a raise
 * card's result is uno-bot's own post in the DM, read as context that night
 * (`detector.ts` § isFresh). Undefined for any other proposal.
 *
 * @param p - The resolved proposal
 */
export function dmResultTag(p: { supersedeKey?: string }): { event_type: string; event_payload: Record<string, unknown> } | undefined {
  return p.supersedeKey?.startsWith(`${DM_RAISE_KEY}:`) ? { event_type: DM_RAISE_EVENT, event_payload: { role: "result" } } : undefined;
}

/** How long an earlier raise about the same two sources keeps a new one
 *  from being offered, whatever became of it (⛔, ✅ or lapsed). */
export const RAISE_QUIET_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * The names the detector gives the estates, each to one canonical name, so
 * "the Figma library" and "Figma", or "the codebase" and "the code", are one
 * source. Matched after `raisePrefix` normalises (lower case, no punctuation,
 * no leading article); a name not here keeps its normalised self.
 */
const SOURCE_ALIASES: Readonly<Record<string, readonly string[]>> = {
  figma: ["figma", "figma library", "figma file", "figma design", "figma designs", "figma spec"],
  code: ["code", "codebase", "code base", "repo", "repository", "source code"],
  storybook: ["storybook", "storybook docs", "storybook story"],
  notion: ["notion", "notion page", "notion doc"],
  blueprint: ["blueprint", "service blueprint", "uno blueprint"],
  prd: ["prd", "prd page"],
  roadmap: ["roadmap", "roadmap card"],
};
const CANONICAL_SOURCE = new Map(Object.entries(SOURCE_ALIASES).flatMap(([canon, names]) => names.map((n) => [n, canon] as const)));

/**
 * The prefix every raise about one pair of sources shares in one person's DM
 * (a 1:1 DM is one person's): the DM, then the pair, normalised, mapped to
 * its canonical names (`SOURCE_ALIASES`: "the Figma library" and "the code"
 * → `code|figma`), sorted and hashed, so no source name and no topic wording
 * reaches D1 (ADR-030). Keyed by the pair rather than the topic, so the same
 * disagreement reworded ("the warning colour", "the warning token") is the
 * same raise.
 *
 * @param channel - The DM
 * @param sources - The detector's two source names
 */
export function raisePrefix(channel: string, sources: readonly [string, string]): string {
  const norm = (s: string) => {
    const n = s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .replace(/^(the|a|an|our)\s+/, "");
    return CANONICAL_SOURCE.get(n) ?? n;
  };
  const key = sources.map(norm).sort().join("|");
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${channel}:raise:${h.toString(16).padStart(8, "0")}:`;
}

/**
 * A disagreement's row id: its pair's prefix (`raisePrefix`), then the thread.
 *
 * @param channel - The DM
 * @param sources - The detector's two source names
 * @param rootTs - The thread
 */
export function raiseId(channel: string, sources: readonly [string, string], rootTs: string): string {
  return `${raisePrefix(channel, sources)}${rootTs}`;
}

// ── End of day ───────────────────────────────────────────────────────────────

export interface DmHookDeps {
  detector: DmDetector;
  /** The end-of-day run's date (`JobContext.runDate`), which dates each row. */
  runDate: string;
  store: CommitmentStore;
  now(): number;
  /** Detects as a real run does, and keeps nothing. */
  dryRun?: boolean;
}

/**
 * The per-thread hook `sweep-dms` feeds. A budget stop throws through, so the
 * sweep saves and defers; any other failure is logged, and the thread's
 * verdict is what was learned before it.
 *
 * @param deps - The detector, the commitment store, the clock
 */
export function dmThreadHook(deps: DmHookDeps): (thread: DmThread, since: string) => Promise<DmThreadVerdict> {
  return async (thread, since) => {
    const verdict: DmThreadVerdict = { decision: false, answered: false };
    try {
      verdict.answered = await answeredAsk(thread, deps);
      const found = await deps.detector.detect({ rootTs: thread.rootTs, messages: thread.messages, since });
      if (!found.ok) throw new Error(`the DM detector did not answer (${found.error})`);
      verdict.decision = found.decisions.length > 0;
      const kept = await keep(thread, found, deps);
      if (kept) console.log(`[dm-sweep] ${thread.channel} ${thread.rootTs}: ${kept} ask(s) ${deps.dryRun ? "would be kept" : "kept"}`);
    } catch (err) {
      rethrowIfBudget(err);
      console.warn(`[dm-sweep] ${thread.channel} ${thread.rootTs}: ${err instanceof Error ? err.message : String(err)}`);
    }
    return verdict;
  };
}

/**
 * Whether the person replied under uno-bot's F6 ask in this thread — the ask
 * still waiting, a reply of theirs after it. The ask is then done.
 */
async function answeredAsk(thread: DmThread, deps: DmHookDeps): Promise<boolean> {
  for (const ask of thread.messages) {
    const id = ask.byBot && ask.tag?.type === DM_ASK_EVENT ? ask.tag.payload.id : undefined;
    if (typeof id !== "string") continue;
    const replied = thread.messages.some((m) => !m.byBot && Number(m.ts) > Number(ask.ts) && m.text.trim().length > 0);
    if (!replied) continue;
    const c = await deps.store.get(id);
    if (!c || c.kind !== "dm_unanswered" || c.channel !== thread.channel) continue;
    // Answered tonight already: a retried job, after a stop, still asks for
    // the placement read it did not finish.
    const tonight = c.state === "done" && (c.resolvedAt ?? 0) > deps.now() - RETRY_WINDOW_MS;
    if (c.state !== "nudged" && !tonight) continue;
    if (!deps.dryRun && !tonight) await deps.store.update(c.id, { state: "done", resolvedAt: deps.now() });
    return true;
  }
  return false;
}

/** The thread's F6 and C6 items, kept as open rows due at the next morning
 *  run; answers how many are new. */
async function keep(thread: DmThread, found: Extract<DmDetection, { ok: true }>, deps: DmHookDeps): Promise<number> {
  const now = deps.now();
  const rows: CommitmentRecord[] = [];
  const texts: Record<string, CommitmentText> = {};
  const row = (id: string, kind: CommitmentRecord["kind"], answerTs: string, confidence: number): CommitmentRecord => ({
    id,
    kind,
    channel: thread.channel,
    channelKind: "dm",
    threadTs: thread.rootTs,
    messageTs: answerTs,
    promiserId: thread.person,
    requesterId: thread.person,
    deadlineAt: null,
    // Due at once: only the weekday morning run posts, so that is when.
    dueAt: now,
    state: "open",
    nudges: 0,
    snoozes: 0,
    confidence,
    promisedAt: msOf(answerTs),
    detectedAt: now,
    runDate: deps.runDate,
    nudgeTs: null,
    followupTs: null,
    checkedOn: null,
    holds: 0,
    remindedOn: null,
    resolvedAt: null,
  });
  // One ask a thread: "Did you get it?" is about what the thread was for.
  const miss = found.unanswered[0];
  if (miss) {
    const id = `${thread.channel}:${thread.rootTs}:unanswered`;
    rows.push(row(id, "dm_unanswered", miss.answerTs, miss.confidence));
    texts[id] = { what: miss.what, bodies: {} };
  }
  // At most one raise a thread, and none about a pair of sources this person
  // was already asked about: still live, or answered or lapsed within
  // `RAISE_QUIET_MS`. The first disagreement whose pair is not quiet is the
  // one raised. One read covers both — every raise in this DM.
  if (found.disagreements.length) {
    const earlier = (await deps.store.byIdPrefix(`${thread.channel}:raise:`)).filter((r) => r.kind === "dm_disagreement");
    const live = (r: CommitmentRecord) => LIVE_STATES.includes(r.state);
    const recent = (r: CommitmentRecord) => live(r) || Math.max(r.detectedAt, r.resolvedAt ?? 0) > now - RAISE_QUIET_MS;
    const threadHasOne = earlier.some((r) => r.threadTs === thread.rootTs && live(r));
    const d = threadHasOne
      ? undefined
      : found.disagreements.find((x) => {
          const prefix = raisePrefix(thread.channel, x.sources);
          return !earlier.some((r) => r.id.startsWith(prefix) && recent(r));
        });
    if (d) {
      const id = raiseId(thread.channel, d.sources, thread.rootTs);
      const to: RaiseTo = shareDestination({ kind: d.designSystem ? "design-system-code" : "notion", pillars: [] }).channel;
      rows.push(row(id, "dm_disagreement", d.answerTs, d.confidence));
      texts[id] = { what: d.topic, bodies: {}, raise: { sources: d.sources, to } };
    }
  }
  if (!rows.length || deps.dryRun) return rows.length;
  // Only a new row, or a live one missing its wording, takes wording: one
  // that is answered or lapsed keeps none for nothing.
  const wanted: CommitmentRecord[] = [];
  const fresh: CommitmentRecord[] = [];
  for (const r of rows) {
    const had = await deps.store.get(r.id);
    if (!had) fresh.push(r);
    if (!had || LIVE_STATES.includes(had.state)) wanted.push(r);
  }
  // The wording first, so a row is never kept without it: a stop between
  // the two leaves only wording that expires. Wording already there stays.
  for (const r of wanted) {
    if (await deps.store.text(r.id)) continue;
    await deps.store.saveText(r.id, texts[r.id]!, now + TEXT_KEEP_MS);
  }
  if (fresh.length) await deps.store.addCommitments(fresh);
  return fresh.length;
}

// ── Morning ──────────────────────────────────────────────────────────────────

/** A message as the DM ask posts it. */
export interface DmAskMessage {
  text: string;
  blocks: unknown[];
  metadata: { event_type: string; event_payload: Record<string, unknown> };
}

export interface DmMorningDeps {
  store: CommitmentStore;
  slack: {
    /** Post the F6 ask in the DM thread, tagged. */
    post(to: { channel: string; threadTs: string }, message: DmAskMessage): Promise<{ ok: boolean; ts?: string }>;
    /** Post the raise card in the DM thread, tagged. */
    postCard(
      to: { channel: string; threadTs: string },
      card: ProposalCard,
      metadata: DmAskMessage["metadata"],
    ): Promise<{ ok: boolean; ts?: string; text?: string }>;
  };
  threadState: Pick<ThreadState, "putProposal">;
  proposalEvents: ProposalEventLog;
  /** The team channels a raise note may go to, and #uno-bot, which it never does. */
  channels: { plusDesign?: string; plusUniversal?: string; unoBot?: string };
  dryRun?: boolean;
}

/**
 * The handler the morning's commitment job hands each due DM row.
 *
 * @param deps - The store, the DM posts, ThreadState, the usage record
 */
export function dmAsksDue(deps: DmMorningDeps): { due(c: CommitmentRecord, now: number, runDate: string): Promise<CommitmentAction> } {
  return { due: (c, now, runDate) => dueOne(deps, c, now, runDate) };
}

async function dueOne(deps: DmMorningDeps, c: CommitmentRecord, now: number, runDate: string): Promise<CommitmentAction> {
  const settle = async (patch: CommitmentPatch): Promise<void> => {
    if (!deps.dryRun) await deps.store.update(c.id, { checkedOn: runDate, ...patch });
  };
  const lapse = async (action: "lapsed" | "refused", note: string): Promise<CommitmentAction> => {
    await settle({ state: "lapsed", resolvedAt: now });
    return { id: c.id, action, note };
  };
  const hold = async (note: string): Promise<CommitmentAction> => {
    const holds = c.holds + 1;
    if (holds >= MAX_HOLDS) return lapse("lapsed", `held ${holds} mornings running (${note})`);
    await settle({ holds });
    return { id: c.id, action: "held", note: `${note}; tried again tomorrow` };
  };
  // Only ever back into its own DM: a row that is not a DM's is refused.
  if (c.channelKind !== "dm" || !c.channel.startsWith("D") || !c.threadTs) {
    return lapse("refused", "a DM ask posts only in its own DM");
  }
  // Once: asked, and its next due date come, it is done with.
  if (c.nudges >= 1) return lapse("lapsed", "asked once");
  const text = await deps.store.text(c.id);
  if (!text) return lapse("lapsed", "its wording expired");
  const said = etDayOf(c.promisedAt);
  const when = whenWord(said, etDayOf(now), dayLabel(said, etDayOf(now)));
  const place = { channel: c.channel, threadTs: c.threadTs };
  const asked: CommitmentPatch = { state: "nudged", nudges: 1, holds: 0, remindedOn: runDate, dueAt: rearmedDueAt(now) };

  if (c.kind === "dm_unanswered") {
    const body = askText({ when, what: text.what });
    if (deps.dryRun) return { id: c.id, action: "nudged", text: DM_WITHHELD };
    const posted = await deps.slack.post(place, {
      text: body,
      blocks: reminderBlocks(body, ASK_FOOTER),
      metadata: { event_type: DM_ASK_EVENT, event_payload: { id: c.id } },
    });
    if (!posted.ok || !posted.ts) return hold("Slack refused the post");
    await settle({ ...asked, nudgeTs: posted.ts });
    await deps.store.saveText(c.id, { ...text, bodies: { ...text.bodies, [posted.ts]: body } }, now + TEXT_KEEP_MS);
    return { id: c.id, action: "nudged", text: body, ts: posted.ts };
  }

  if (c.kind !== "dm_disagreement" || !text.raise) return lapse("refused", `not a DM ask this Worker knows (${c.kind})`);
  const to = text.raise.to;
  const channel = (to === "plus-universal" ? deps.channels.plusUniversal : deps.channels.plusDesign)?.trim();
  if (!channel || channel === deps.channels.unoBot?.trim()) return lapse("refused", `no ${to} channel to raise it in`);
  const { card, operations } = raiseCard({ when, topic: text.what, sources: text.raise.sources, channel, to });
  if (deps.dryRun) return { id: c.id, action: "nudged", text: DM_WITHHELD };
  const sent = await deps.slack.postCard(place, card, { event_type: DM_RAISE_EVENT, event_payload: { id: c.id } });
  if (!sent.ok || !sent.ts) return hold("Slack refused the post");
  const first = operations[0]!;
  const proposal: PendingProposal = {
    operations,
    toolName: first.toolName,
    input: first.input,
    channel: c.channel,
    threadTs: c.threadTs,
    replyTs: c.threadTs,
    userMsgTs: c.threadTs,
    proposalTs: sent.ts,
    proposalText: sent.text ?? card.lead ?? "",
    requesterUserId: c.promiserId,
    ttlMs: SWEEP_CARD_TTL_MS,
    // The person the DM is with, and nobody else.
    confirmers: [c.promiserId],
    supersedeKey: raiseSlot(c.id),
  };
  const { retired } = await deps.threadState.putProposal(proposal);
  // A DM is never named on the record (`storesChannel`).
  await recordProposalEvents(deps.proposalEvents, [
    ...supersededEvents(retired, now, "worker"),
    stagedEvent({ proposal, at: now, via: "worker", channelStored: storesChannel("assistant", "im") }),
  ]);
  // No reminder ts: the card is a proposal, so its ✅ and ⛔ reach the gate.
  await settle(asked);
  return { id: c.id, action: "nudged", text: card.lead ?? "", ts: sent.ts };
}

// ── Reactions ────────────────────────────────────────────────────────────────

export interface DmAnswerDeps {
  store: CommitmentStore;
  update(channel: string, ts: string, message: { text: string; blocks: unknown[] }): Promise<boolean>;
  now(): number;
}

/**
 * A reaction on a DM row's message: 🙅 on the F6 ask, from its person, drops
 * it and says so in place, with no new ping. Anything else does nothing.
 *
 * @param deps - The store, the in-place edit, the clock
 */
export function answerDmAsk(deps: DmAnswerDeps): (c: CommitmentRecord, r: ReminderReaction) => Promise<void> {
  return async (c, r) => {
    if (c.kind !== "dm_unanswered" || c.state !== "nudged" || r.userId !== c.promiserId) return;
    if (reminderAnswer(r.glyph) !== "not_doing") return;
    await deps.store.update(c.id, { state: "dropped", resolvedAt: deps.now() });
    const body = (await deps.store.text(c.id))?.bodies[r.messageTs];
    if (!body) return;
    const edited = await deps.update(r.channel, r.messageTs, { text: body, blocks: reminderBlocks(body, ASK_DROPPED) });
    if (!edited) console.warn(`[dm-sweep] ${c.id}: dropped, but ask ${r.messageTs} could not be edited`);
  };
}

function msOf(ts: string): number {
  return Math.round(Number(ts) * 1000);
}
