// Commitment reminders, end to end: read a promise at the end of the day,
// nudge its promiser in its own thread at a weekday morning run, and take the
// answer as a reaction.
//
// THREE ENTRY POINTS, one module:
//
//   `commitmentThreadHook` — the end-of-day sweep's per-thread hook
//   (`SweepDeps.onThread`). The sweep reads each active thread once; this asks
//   the commitment detector about the thread's new messages and keeps each
//   promise as an `open` row, due at its stated deadline or two working days
//   out (`commitmentDueAt`). It posts nothing. A thread whose new messages
//   carry no promise words costs no model call. A promise by someone with a
//   live commitment in the same thread is that task said again: no new row,
//   and a later day it names moves the due date as a ⏳ would. The detector
//   learns from people's answers: it is shown the newest 🤔 and 🙌 commitments
//   as short summaries (`fewShotExamples`), never a DM's or another private
//   place's.
//
//   `runCommitmentNudges` — the morning's `commitment-nudge` job. It takes the
//   live commitments due now, soonest first, one at a time, each only once a
//   morning. Before any nudge it looks for completion: the thread since the
//   promise, the promiser's messages in the channel since, and the Notion and
//   GitHub pages they linked; the judge reading those as done makes the row
//   `auto_done` and nothing is sent. Otherwise the reminder goes up as a reply
//   in the promise's thread, mentioning the promiser only, and `due_at` is
//   re-armed two working days out for its one follow-up; a follow-up nobody
//   answers makes the row `lapsed`. Two posts per commitment in all: a ⏳
//   moves the date and adds none. At most `MAX_REMINDERS_PER_PERSON` a
//   promiser a morning, and card follow-ups `MAX_CARD_REMINDERS_PER_PERSON`
//   more on a budget of their own, a person's own asks first — the rest
//   wait, which is no hold — and a row held
//   `MAX_HOLDS` mornings running lapses. Nothing is sent outside the weekday
//   10:00 ET run (`isMorningRunTime`).
//
//   `answerReminder` — the reaction door's first look. A reaction on a
//   reminder is the reminder's, whatever the glyph: 🙌 ⏳ 🙅 🤔 from the
//   promiser set the state and replace the legend in place with no new ping,
//   and anything else — a ✅ among them — does nothing. A reaction on anything
//   else goes on to the gate untouched, and so does every reaction when the
//   reminder store cannot be read: it fails open.
//
// "REMIND ME". A `self_reminder` row (`./remind.ts`, set in the turn) rides
// the same morning job, cap and reaction door: it is posted in its DM or
// thread with no evidence check, answers to 🙌 and ⏳ only, gets no follow-up,
// and a ⏳ brings it back once at the morning run two working days out.
//
// WHERE IT POSTS. `pickDestination`, as every proactive job: a promise is a
// message in a thread, so the reminder goes to that thread — back into a
// private place only when the evidence was there. Never #uno-bot, never the
// lead by default. A thread a reminder goes into is marked the way a sweep
// card's is (`sweep/thread-mark.ts`), so the team's replies there don't start
// turns.
//
// THE BUDGET. Each commitment starts only when what is left covers it
// (`COMMITMENT_COST`); otherwise the job stops as the budget does and the
// runner runs it again on a fresh one. Everything before the post is a read,
// so a stop there leaves nothing half-done.
//
// Every dependency is injected, so the Node suite runs whole weeks against
// fakes (tests/commitment-reminders.test.ts). `Env` enters in `./env.ts`.

import { D1QueryBudgetError, rethrowIfBudget, SubrequestBudgetError } from "../net";
import { GATE_RESERVED } from "../gate/reactions";
import type { ScheduledJob } from "../scheduled/runs";
import { classifyLink, linksIn, pickDestination, resolveDestination, type SweepMessage, type SweepSource, type SweepThread, type TargetKind } from "../sweep/finding";
import type { SweepSlack, SweepSlackMessage } from "../sweep/run";
import {
  acknowledgement,
  followUpText,
  REMINDER_LEGEND,
  reminderAnswer,
  reminderBlocks,
  reminderText,
  SELF_REMINDER_LAST_LEGEND,
  SELF_REMINDER_LEGEND,
  selfReminderText,
  snoozeAcknowledgement,
} from "./copy";
import { mayHoldPromise, type CommitmentDetector, type EvidenceJudge, type FewShotExample } from "./detector";
import {
  commitmentDueAt,
  dayLabel,
  dueDayOf,
  etDayOf,
  isMorningRunTime,
  maySnooze,
  nudgeAt,
  rearmedDueAt,
  TEXT_KEEP_MS,
} from "./due";
import { snoozedRunAt } from "./remind";
import { budgetOf, cardTodoId, isCardKind, LIVE_STATES, type CommitmentRecord, type CommitmentStore, type CommitmentText, type ReminderBudget } from "./store";

/** What one commitment may spend before it starts: the evidence reads, the
 *  judge, the permalink and the post, and the D1 statements around them. */
export const COMMITMENT_COST = { subrequests: 10, d1Queries: 3 };
/** Thread pages read looking for completion. */
export const MAX_EVIDENCE_REPLY_PAGES = 3;
/** Channel pages read for the promiser's own messages since the promise. */
export const MAX_EVIDENCE_HISTORY_PAGES = 2;
/** Linked Notion and GitHub pages read looking for completion. */
export const MAX_EVIDENCE_SOURCES = 2;
/** Reminders of a person's own asks (promises, "remind me") one promiser gets
 *  in one morning run; the rest wait a morning. */
export const MAX_REMINDERS_PER_PERSON = 2;
/** Card follow-ups one promiser gets in one morning run, a budget of their
 *  own beside `MAX_REMINDERS_PER_PERSON`. */
export const MAX_CARD_REMINDERS_PER_PERSON = 2;
/** Mornings running a commitment may be held before it lapses. */
export const MAX_HOLDS = 3;
/** Earlier answers the detector is shown, of each kind — 🙌 done and 🤔 not a
 *  promise — unless `CommitmentConfig.fewShot` says otherwise. */
export const MAX_FEW_SHOT_PER_ANSWER = 3;

const EVIDENCE_KINDS: ReadonlySet<TargetKind> = new Set(["notion", "github", "design-system-code"]);

/** A reminder as Slack posts it. */
export interface ReminderMessage {
  text: string;
  blocks: unknown[];
}

/** The Slack calls, with the bot token. */
export interface CommitmentSlack {
  replies: SweepSlack["replies"];
  history: SweepSlack["history"];
  permalink(channel: string, ts: string): Promise<string | null>;
  post(to: { channel: string; threadTs: string | null }, message: ReminderMessage): Promise<{ ok: boolean; ts?: string }>;
  /** Replace a posted reminder's text in place: no new message, no ping. */
  update(channel: string, ts: string, message: ReminderMessage): Promise<boolean>;
}

export interface CommitmentConfig {
  /** #uno-bot: never a destination. */
  unoBot?: string;
  /** The bot's own user id, whose messages are never evidence. */
  botUserId?: string | null;
  figmaLibraryKey?: string;
  /** Earlier answers of each kind the detector is shown; 0 shows none.
   *  Defaults to `MAX_FEW_SHOT_PER_ANSWER`. */
  fewShot?: number;
}

export interface CommitmentDeps {
  slack: CommitmentSlack;
  sources: { read(url: string, kind: TargetKind): Promise<SweepSource | null> };
  detector: CommitmentDetector;
  judge: EvidenceJudge;
  store: CommitmentStore;
  /** Mark a thread a reminder went into (`markSweepThread`). */
  markThread(channel: string, thread: string): Promise<void>;
  config: CommitmentConfig;
  meter?: { headroom(): { subrequests: number; d1Queries: number } };
  now(): number;
  /** Reads, detects and judges as a real run does, and writes and posts nothing. */
  dryRun?: boolean;
}

// ── End of day: the sweep's thread hook ──────────────────────────────────────

/**
 * The commitments one swept thread's new messages hold, kept as `open` rows.
 * A dry run keeps nothing and answers with what it would keep.
 *
 * @param thread - The thread as the sweep read it: human messages, root first
 * @param since - The channel's cursor; messages after it are new
 * @param deps - The detector, the store, the clock, and where the detector's
 *   examples come from (`fewShotExamples`; none when absent)
 */
export async function recordThreadCommitments(
  thread: SweepThread,
  since: string,
  deps: Pick<CommitmentDeps, "detector" | "store" | "config" | "now" | "dryRun"> & {
    examples?(channel: string): Promise<FewShotExample[]>;
  },
): Promise<{ rows: CommitmentRecord[]; texts: Record<string, string> }> {
  if (thread.channel === deps.config.unoBot) return { rows: [], texts: {} };
  // Channel threads only, public or private; a group DM or a DM keeps none.
  if (thread.channelKind !== "public" && thread.channelKind !== "private") return { rows: [], texts: {} };
  // The detector's own gate, first, so a thread it would not ask about reads
  // no examples either.
  if (!mayHoldPromise(thread.messages, since)) return { rows: [], texts: {} };
  const examples = deps.examples ? await deps.examples(thread.channel) : [];
  const found = await deps.detector.detect({ thread, since, examples });
  if (!found.ok) throw new Error(`the commitment detector did not answer (${found.error})`);
  const now = deps.now();
  const rows: CommitmentRecord[] = [];
  const texts: Record<string, string> = {};
  for (const c of found.commitments) {
    // "I'll file a card for X" is a card to-do, read first and kept once:
    // no promise row beside it, so its person is asked once.
    if (await deps.store.get(cardTodoId(thread.channel, c.messageTs))) continue;
    const promisedAt = msOf(c.messageTs);
    const due = commitmentDueAt(promisedAt, c.deadline);
    const id = `${thread.channel}:${c.messageTs}`;
    rows.push({
      id,
      kind: "thread_promise",
      channel: thread.channel,
      channelKind: thread.channelKind,
      threadTs: thread.rootTs,
      messageTs: c.messageTs,
      promiserId: c.promiser,
      requesterId: c.requester,
      deadlineAt: due.stated ? due.dueAt : null,
      dueAt: due.dueAt,
      state: "open",
      nudges: 0,
      snoozes: 0,
      confidence: c.confidence,
      promisedAt,
      detectedAt: now,
      runDate: dateOf(now),
      nudgeTs: null,
      followupTs: null,
      checkedOn: null,
      holds: 0,
      remindedOn: null,
      resolvedAt: null,
    });
    texts[id] = c.what;
  }
  const kept = await foldRepromises(rows, deps);
  if (deps.dryRun || !kept.length) return { rows: kept, texts };
  await deps.store.addCommitments(kept);
  for (const row of kept) {
    // A row already there keeps its wording, and the reminder bodies with it.
    if (await deps.store.text(row.id)) continue;
    await deps.store.saveText(row.id, { what: texts[row.id]!, bodies: {} }, row.dueAt + TEXT_KEEP_MS);
  }
  return { rows: kept, texts };
}

/**
 * The new rows that are new commitments. A promise by someone who already has
 * a live one in the same thread — "sorry, will do by Fri" under a reminder —
 * is the same task said again, so it adds no row and restarts no reminders.
 * When it names a later day than the live one is due, it counts as a ⏳: the
 * due date moves (a snooze, capped, once a reminder is up) and no ping is
 * added. Two promises by one person in one thread on one night: the first
 * stands.
 */
async function foldRepromises(
  rows: CommitmentRecord[],
  deps: Pick<CommitmentDeps, "store" | "dryRun">,
): Promise<CommitmentRecord[]> {
  const kept: CommitmentRecord[] = [];
  for (const row of rows) {
    if (kept.some((k) => k.promiserId === row.promiserId)) continue;
    const live = await deps.store.liveInThread(row.channel, row.threadTs, row.promiserId);
    // None, or this very promise read again by a retried job.
    if (!live || live.id === row.id) {
      kept.push(row);
      continue;
    }
    if (row.deadlineAt === null || row.dueAt <= live.dueAt || deps.dryRun) continue;
    if (live.nudges === 0) {
      await deps.store.update(live.id, { dueAt: row.dueAt, deadlineAt: row.deadlineAt });
    } else if (maySnooze(live.snoozes)) {
      await deps.store.update(live.id, { state: "snoozed", snoozes: live.snoozes + 1, dueAt: row.dueAt, deadlineAt: row.deadlineAt });
    }
  }
  return kept;
}

/**
 * The sweep's per-thread hook over these dependencies. A budget stop throws
 * through, so the sweep saves and defers; any other failure is logged and
 * leaves the drift sweep to go on — a missed promise is not worth a held
 * thread.
 */
export function commitmentThreadHook(
  deps: Pick<CommitmentDeps, "detector" | "store" | "config" | "now" | "dryRun">,
): (thread: SweepThread, since: string) => Promise<void> {
  const examples = fewShotExamples(deps);
  return async (thread, since) => {
    try {
      const { rows } = await recordThreadCommitments(thread, since, { ...deps, examples });
      if (rows.length) {
        console.log(`[commitments] ${thread.channel} ${thread.rootTs}: ${rows.length} commitment(s) ${deps.dryRun ? "would be kept" : "kept"}`);
      }
    } catch (err) {
      rethrowIfBudget(err);
      console.warn(`[commitments] ${thread.channel} ${thread.rootTs}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
}

/**
 * Where the detector's examples come from: the newest commitments people
 * answered 🙌 or 🤔, at most `config.fewShot` of each, from public channels
 * and the swept channel itself (`CommitmentRecords.latestAnswers`), each with
 * the summary kept beside it — at most one a promiser, so no one person's
 * answers steer every channel. One read a channel for the life of the loader —
 * one sweep job — however many of its threads the detector is asked about.
 * An answer whose summary has expired is left out rather than replaced. A
 * store that fails gives no examples: a missing example is not worth a missed
 * promise. A budget stop throws through.
 */
export function fewShotExamples(
  deps: Pick<CommitmentDeps, "store" | "config">,
): (channel: string) => Promise<FewShotExample[]> {
  const limit = Math.max(0, Math.floor(deps.config.fewShot ?? MAX_FEW_SHOT_PER_ANSWER));
  const read = new Map<string, Promise<FewShotExample[]>>();
  const load = async (channel: string): Promise<FewShotExample[]> => {
    if (!limit) return [];
    try {
      // Twice the rows, so one example a promiser still leaves room for others.
      const rows = await deps.store.latestAnswers(channel, limit * 2);
      const out: FewShotExample[] = [];
      const promisers = new Set<string>();
      const count = { done: 0, not_promise: 0 };
      for (const row of rows) {
        const answer = row.state === "done" ? "done" : "not_promise";
        if (promisers.has(row.promiserId) || count[answer] >= limit) continue;
        const what = (await deps.store.text(row.id))?.what;
        if (!what) continue;
        promisers.add(row.promiserId);
        count[answer] += 1;
        out.push({ answer, what });
      }
      return out;
    } catch (err) {
      rethrowIfBudget(err);
      console.warn(`[commitments] ${channel}: the detector's examples could not be read, asking without them: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  };
  return (channel) => {
    let pending = read.get(channel);
    if (!pending) {
      pending = load(channel);
      read.set(channel, pending);
    }
    return pending;
  };
}

// ── Morning: check, then nudge ───────────────────────────────────────────────

/**
 * What the morning job reads with: everything but the detector, and the
 * handler for the card kinds (`../follow-through/`), which settle on their own
 * evidence and say their own words. Absent, a card row due is left alone.
 */
export type NudgeDeps = Omit<CommitmentDeps, "detector"> & {
  cards?: { due(c: CommitmentRecord, now: number, runDate: string): Promise<CommitmentAction> };
};

/** What the morning did with one commitment. */
export interface CommitmentAction {
  id: string;
  action: "nudged" | "followed-up" | "auto_done" | "lapsed" | "held" | "refused";
  /** Why, in code's words. */
  note?: string;
  /** The reminder's text: posted, or on a dry run what would be. */
  text?: string;
  ts?: string;
}

export interface CommitmentJobReport {
  kind: "commitment-nudge";
  key: string;
  outcome: "handled" | "skipped";
  note: string | null;
  actions: CommitmentAction[];
  summary: string;
}

/**
 * The morning's commitment job.
 *
 * @param job - The `commitment-nudge` job
 * @param deps - Everything it touches, by name
 * @throws A budget stop before a commitment it cannot finish — the runner defers
 */
export async function runCommitmentNudges(job: ScheduledJob, deps: NudgeDeps): Promise<CommitmentJobReport> {
  const now = deps.now();
  const actions: CommitmentAction[] = [];
  const report = (outcome: CommitmentJobReport["outcome"], note: string | null): CommitmentJobReport => {
    const counts = ["nudged", "followed-up", "auto_done", "lapsed", "held", "refused"]
      .map((a) => [a, actions.filter((x) => x.action === a).length] as const)
      .filter(([, n]) => n)
      .map(([a, n]) => `${n} ${a}`);
    const done = counts.length ? counts.join(", ") : "nothing due";
    return { kind: "commitment-nudge", key: job.key, outcome, note, actions, summary: note ? `${done} — ${note}` : done };
  };
  if (!deps.dryRun && !isMorningRunTime(now)) return report("skipped", "outside the weekday morning run");

  const runDate = dateOf(now);
  ensureHeadroom(deps, COMMITMENT_COST);
  // Read again by a retried job, so the cap holds across its alarms.
  const reminded = await deps.store.remindedOn(runDate);
  const limit: Record<ReminderBudget, number> = { asked: MAX_REMINDERS_PER_PERSON, cards: MAX_CARD_REMINDERS_PER_PERSON };
  const capped = (b: ReminderBudget) => Object.keys(reminded[b]).filter((p) => reminded[b][p]! >= limit[b]);
  for (;;) {
    ensureHeadroom(deps, COMMITMENT_COST);
    const c = await deps.store.nextDue(now, runDate, { asked: capped("asked"), cards: capped("cards") });
    if (!c) break;
    const action = await handleDue(deps, c, now, runDate);
    if (action.action === "nudged" || action.action === "followed-up") {
      const counts = reminded[budgetOf(c.kind)];
      counts[c.promiserId] = (counts[c.promiserId] ?? 0) + 1;
    }
    actions.push(action);
    // A rehearsal marks nothing, so the same row would come back: it shows one.
    if (deps.dryRun) break;
  }
  return report("handled", null);
}

async function handleDue(deps: NudgeDeps, c: CommitmentRecord, now: number, runDate: string): Promise<CommitmentAction> {
  if (isCardKind(c.kind)) {
    if (deps.cards) return deps.cards.due(c, now, runDate);
    if (!deps.dryRun) await deps.store.update(c.id, { checkedOn: runDate });
    return { id: c.id, action: "held", note: "no handler for card follow-ups on this run" };
  }
  const settle = async (patch: Parameters<CommitmentStore["update"]>[1]): Promise<void> => {
    if (!deps.dryRun) await deps.store.update(c.id, { checkedOn: runDate, ...patch });
  };
  // Held on too many mornings running — an archived channel, a removed bot,
  // a deleted thread — it lapses rather than being tried forever.
  const hold = async (note: string): Promise<CommitmentAction> => {
    const holds = c.holds + 1;
    if (holds < MAX_HOLDS) {
      await settle({ holds });
      return { id: c.id, action: "held", note: `${note}; tried again tomorrow` };
    }
    await settle({ state: "lapsed", holds, resolvedAt: now });
    console.warn(`[commitments] ${c.id} lapsed after ${holds} held mornings: ${note}`);
    return { id: c.id, action: "lapsed", note: `held ${holds} mornings running (${note})` };
  };
  if (c.kind !== "thread_promise" && c.kind !== "self_reminder") {
    // A kind this Worker does not know — a row a newer one wrote: held, and
    // lapsed after as many mornings as any other hold.
    console.warn(`[commitments] ${c.id}: unknown kind ${String(c.kind)}, held`);
    return hold(`unknown kind ${String(c.kind)}`);
  }
  // The reminder and its one follow-up are all a commitment gets, whatever
  // ⏳ moved its date.
  if (c.nudges >= 2) {
    await settle({ state: "lapsed", resolvedAt: now });
    return { id: c.id, action: "lapsed", note: "its reminder and follow-up are spent" };
  }
  // A "remind me" nobody answered gets no follow-up: the person asked for one
  // reminder, and only a ⏳ brings it back.
  if (c.kind === "self_reminder" && c.state === "nudged") {
    await settle({ state: "lapsed", resolvedAt: now });
    return { id: c.id, action: "lapsed", note: "its reminder went unanswered" };
  }
  const place = destinationOf(c, deps.config);
  if (!place) {
    await settle({ state: "lapsed", resolvedAt: now });
    return { id: c.id, action: "refused", note: "no destination this job may post in" };
  }
  const text = await deps.store.text(c.id);
  if (!text) {
    await settle({ state: "lapsed", resolvedAt: now });
    return { id: c.id, action: "lapsed", note: "its wording expired" };
  }
  if (c.kind === "self_reminder") return remindSelf(deps, c, text, place, now, runDate, settle, hold);

  const evidence = await checkEvidence(deps, c, text);
  if (evidence === "unknown") return hold("its thread or the judge could not be read");
  if (evidence === "done") {
    await settle({ state: "auto_done", resolvedAt: now });
    return { id: c.id, action: "auto_done" };
  }

  const first = c.nudges === 0;
  const body = first
    ? reminderText({
        promiser: c.promiserId,
        what: text.what,
        deadlineLabel: c.deadlineAt === null ? null : dayLabel(dueDayOf(c.deadlineAt), etDayOf(now)),
        promisedLabel: dayLabel(etDayOf(c.promisedAt), etDayOf(now)),
        permalink: await deps.slack.permalink(c.channel, c.messageTs),
      })
    : followUpText(c.promiserId);
  const action = first ? "nudged" : "followed-up";
  if (deps.dryRun) return { id: c.id, action, text: body };

  const posted = await deps.slack.post(place, { text: body, blocks: reminderBlocks(body, REMINDER_LEGEND) });
  if (!posted.ok || !posted.ts) return hold("Slack refused the post");
  await settle({
    state: "nudged",
    nudges: c.nudges + 1,
    holds: 0,
    remindedOn: runDate,
    dueAt: rearmedDueAt(now),
    ...(first ? { nudgeTs: posted.ts } : { followupTs: posted.ts }),
  });
  await keepText(deps, c.id, { ...text, bodies: { ...text.bodies, [posted.ts]: body } }, now);
  await deps.markThread(place.channel, place.threadTs ?? posted.ts);
  return { id: c.id, action, text: body, ts: posted.ts };
}

/**
 * A "remind me", delivered: no evidence check (nothing was promised to anyone,
 * so there is nothing to find done) and no thread mark (the person invited
 * uno-bot there). Its first post, and one more if a ⏳ brings it back — the
 * two posts every commitment is allowed.
 */
async function remindSelf(
  deps: NudgeDeps,
  c: CommitmentRecord,
  text: CommitmentText,
  place: { channel: string; threadTs: string | null },
  now: number,
  runDate: string,
  settle: (patch: Parameters<CommitmentStore["update"]>[1]) => Promise<void>,
  hold: (note: string) => Promise<CommitmentAction>,
): Promise<CommitmentAction> {
  const first = c.nudges === 0;
  const body = selfReminderText({ requester: c.promiserId, what: text.what, permalink: await deps.slack.permalink(c.channel, c.messageTs) });
  if (deps.dryRun) return { id: c.id, action: "nudged", text: body };
  const legend = c.nudges + 1 < 2 && maySnooze(c.snoozes) ? SELF_REMINDER_LEGEND : SELF_REMINDER_LAST_LEGEND;
  const posted = await deps.slack.post(place, { text: body, blocks: reminderBlocks(body, legend) });
  if (!posted.ok || !posted.ts) return hold("Slack refused the post");
  await settle({
    state: "nudged",
    nudges: c.nudges + 1,
    holds: 0,
    remindedOn: runDate,
    // Unanswered by then, it lapses (above).
    dueAt: rearmedDueAt(now),
    ...(first ? { nudgeTs: posted.ts } : { followupTs: posted.ts }),
  });
  await keepText(deps, c.id, { ...text, bodies: { ...text.bodies, [posted.ts]: body } }, now);
  return { id: c.id, action: "nudged", text: body, ts: posted.ts };
}

/** Where a commitment's reminder goes, or null when that is nowhere this job
 *  may post. */
function destinationOf(c: CommitmentRecord, config: CommitmentConfig): { channel: string; threadTs: string | null } | null {
  const destination = pickDestination({
    evidence: { channel: c.channel, channelKind: "public", threadTs: c.threadTs, messageTs: [c.messageTs], permalinks: [] },
    // Never read: a promise always sits in a thread, the second rung.
    target: { url: "", kind: "github", writable: false, title: "", pillars: [] },
  });
  if (destination.rung !== "thread" && destination.rung !== "private") return null;
  const place = resolveDestination(destination, {});
  if (!place || place.channel === config.unoBot) return null;
  return place;
}

/**
 * Whether the promise shows as kept: the thread since it, the promiser's own
 * messages in the channel since, and the Notion and GitHub pages those link,
 * read by the judge. `unknown` when the thread or the judge could not be read
 * — a reminder is not sent on a check that never happened.
 */
async function checkEvidence(deps: NudgeDeps, c: CommitmentRecord, text: CommitmentText): Promise<"done" | "not-done" | "unknown"> {
  const later = await laterMessages(deps, c);
  if (!later) return "unknown";
  if (!later.length) return "not-done";
  const links = [...new Set(later.filter((m) => m.user === c.promiserId).flatMap((m) => linksIn(m.text)))]
    .map((url) => ({ url, kind: classifyLink(url, deps.config.figmaLibraryKey) }))
    .filter((l): l is { url: string; kind: TargetKind } => l.kind !== null && EVIDENCE_KINDS.has(l.kind))
    .slice(0, MAX_EVIDENCE_SOURCES);
  const sources: SweepSource[] = [];
  for (const link of links) {
    try {
      const source = await deps.sources.read(link.url, link.kind);
      if (source) sources.push(source);
    } catch (err) {
      // A page that failed to read is left out; the messages still count.
      rethrowIfBudget(err);
    }
  }
  const verdict = await deps.judge.judge({ promiser: c.promiserId, what: text.what, promiseTs: c.messageTs, messages: later, sources });
  if (!verdict.ok) return "unknown";
  return verdict.done ? "done" : "not-done";
}

/** Human messages after the promise: its thread's, then the promiser's own at
 *  the channel's top; null when the thread could not be read. */
async function laterMessages(deps: NudgeDeps, c: CommitmentRecord): Promise<SweepMessage[] | null> {
  const after = (m: SweepSlackMessage) => Number(m.ts) > Number(c.messageTs) && isHuman(m, deps.config.botUserId);
  const found = new Map<string, SweepMessage>();
  let page: string | undefined;
  for (let i = 0; i < MAX_EVIDENCE_REPLY_PAGES; i++) {
    const res = await deps.slack.replies(c.channel, c.threadTs, page);
    if (!res) return null;
    for (const m of res.messages) if (after(m)) found.set(m.ts, toMessage(m));
    page = res.nextCursor;
    if (!page) break;
  }
  page = undefined;
  for (let i = 0; i < MAX_EVIDENCE_HISTORY_PAGES; i++) {
    const res = await deps.slack.history(c.channel, c.messageTs, page);
    if (!res) break; // the thread was read; the channel is extra
    for (const m of res.messages) if (after(m) && m.user === c.promiserId) found.set(m.ts, toMessage(m));
    page = res.nextCursor;
    if (!page) break;
  }
  return [...found.values()].sort((a, b) => Number(a.ts) - Number(b.ts));
}

// ── Reactions ────────────────────────────────────────────────────────────────

/** A reaction, in the facts the envelope has. */
export interface ReminderReaction {
  channel: string;
  messageTs: string;
  glyph: string;
  userId: string;
  /** Who wrote the reacted message, when the event says. */
  messageAuthorId?: string;
}

export interface ReminderDoorDeps {
  store: CommitmentStore;
  /** A reaction on a card follow-up (`../follow-through/`): its own answers. */
  cards?(c: CommitmentRecord, r: ReminderReaction): Promise<void>;
  update: CommitmentSlack["update"];
  botUserId(): Promise<string | undefined>;
  now(): number;
}

/**
 * A reaction on a reminder, answered. True when the reacted message is a
 * reminder — the reaction is then the reminder's, whether or not it changed
 * anything, and the gate never sees it; false for everything else.
 *
 * @param r - The reaction
 * @param deps - The store, the in-place edit, the bot's id, the clock
 */
export async function answerReminder(r: ReminderReaction, deps: ReminderDoorDeps): Promise<boolean> {
  try {
    return await answerOrThrow(r, deps);
  } catch (err) {
    // Fail open: a reminder store that cannot be read (a D1 error, a table
    // not yet migrated) must never keep a card's ✅ or ⛔ from the gate.
    rethrowIfBudget(err);
    console.error(`[commitments] reminder lookup for ${r.channel} ${r.messageTs} failed, passing to the gate: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function answerOrThrow(r: ReminderReaction, deps: ReminderDoorDeps): Promise<boolean> {
  const answer = reminderAnswer(r.glyph);
  // Only a reminder glyph, or a gate glyph a reminder must swallow, is worth
  // the lookup: every 🎉 in every channel arrives here.
  if (!answer && !GATE_RESERVED.has(r.glyph.replace(/::skin-tone-\d$/, ""))) return false;
  const bot = await deps.botUserId();
  if (r.messageAuthorId && bot && r.messageAuthorId !== bot) return false;
  const c = await deps.store.byReminderTs(r.messageTs);
  if (!c || c.channel !== r.channel) return false;
  if (isCardKind(c.kind)) {
    // Whatever the glyph, a card follow-up's own: its ✅ drafts a card, and
    // never reaches the gate.
    if (deps.cards) await deps.cards(c, r);
    return true;
  }

  if (!answer || r.userId !== c.promiserId || !LIVE_STATES.includes(c.state)) return true;
  const now = deps.now();
  let ack: string;
  if (c.kind === "self_reminder") {
    // 🙌 and ⏳ only; a ⏳ only while a post is left to bring it back.
    if (answer === "done") {
      await deps.store.update(c.id, { state: "done", resolvedAt: now });
      ack = acknowledgement("done");
    } else if (answer === "soon" && c.nudges < 2 && maySnooze(c.snoozes)) {
      const dueAt = snoozedRunAt(now);
      await deps.store.update(c.id, { state: "snoozed", snoozes: c.snoozes + 1, dueAt });
      ack = snoozeAcknowledgement(dayLabel(etDayOf(dueAt), etDayOf(now)));
    } else {
      return true;
    }
  } else if (answer === "soon") {
    // Capped: a third ⏳ leaves the commitment where it is.
    if (!maySnooze(c.snoozes)) return true;
    const dueAt = rearmedDueAt(now);
    // The date moves; the reminder and its follow-up stay the only two posts.
    await deps.store.update(c.id, { state: "snoozed", snoozes: c.snoozes + 1, dueAt });
    ack = acknowledgement("soon", dayLabel(etDayOf(nudgeAt(dueAt)), etDayOf(now)));
  } else {
    const state = answer === "done" ? "done" : answer === "not_doing" ? "dropped" : "not_promise";
    await deps.store.update(c.id, { state, resolvedAt: now });
    ack = acknowledgement(answer);
  }
  const body = (await deps.store.text(c.id))?.bodies[r.messageTs];
  if (!body) {
    console.warn(`[commitments] ${c.id}: answered, but reminder ${r.messageTs} has no kept body to edit`);
    return true;
  }
  const edited = await deps.update(r.channel, r.messageTs, { text: body, blocks: reminderBlocks(body, ack) });
  if (!edited) console.warn(`[commitments] ${c.id}: answered, but reminder ${r.messageTs} could not be edited`);
  return true;
}

// ── Shared ───────────────────────────────────────────────────────────────────

async function keepText(deps: Pick<CommitmentDeps, "store">, id: string, text: CommitmentText, now: number): Promise<void> {
  await deps.store.saveText(id, text, now + TEXT_KEEP_MS);
}

function ensureHeadroom(deps: Pick<CommitmentDeps, "meter">, need: { subrequests: number; d1Queries: number }): void {
  const left = deps.meter?.headroom() ?? { subrequests: Infinity, d1Queries: Infinity };
  if (left.d1Queries < need.d1Queries) throw new D1QueryBudgetError(need.d1Queries);
  if (left.subrequests < need.subrequests) throw new SubrequestBudgetError(need.subrequests);
}

function isHuman(m: SweepSlackMessage, botUserId: string | null | undefined): boolean {
  if (m.bot_id || !m.user || m.user === botUserId) return false;
  return !m.subtype || m.subtype === "thread_broadcast";
}

function toMessage(m: SweepSlackMessage): SweepMessage {
  return { ts: m.ts, user: m.user ?? "", text: m.text ?? "" };
}

function msOf(ts: string): number {
  return Math.round(Number(ts) * 1000);
}

function dateOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
