// DM watch, end to end: a person turns a switch on in their Home tab; the
// end-of-day run reads THEIR OWN DMs with THEIR OWN token for promises; the
// next weekday morning run reminds them, and only them, in their DM with
// uno-bot; they answer with a reaction.
//
// FOUR ENTRY POINTS, one module:
//
//   `setDmWatch` — the Home tab's switches, saved. Each is off until turned
//   on, and turning one on reads nothing already said: it starts from now.
//   Turning one off stops its future jobs and lapses every live promise it was
//   tracking, silently. Turning one on needs a connected token (ADR-020).
//
//   `runDmPromiseRead` — the end-of-day `dm-promise-read` job, one per person
//   with a switch on. No switch on, or no token of their own: no DM is read.
//   Before any read it checks the token's granted scopes against Slack
//   (ADR-024); a missing scope skips the job with one log line. Then it lists
//   the person's DMs, reads each one's new messages, asks the commitment
//   detector, and keeps each promise the person made (`made`, when that switch
//   is on) or was made to them (`made_to`, likewise) as a row holding the
//   permalink, `due_at` and the state — no summary, no id of the other person.
//   It posts nothing.
//
//   `runDmPromiseNudges` — the morning `dm-promise-nudge` job, one per person.
//   Each due row's message is read again from its permalink with the same
//   token and the summary regenerated from it; a message that is gone, or no
//   longer reads as a promise, lapses silently. The messages after it are
//   judged for completion. Otherwise the reminder goes to the person's DM with
//   uno-bot — never a thread, a card, or anyone else's DM, and never to the
//   other person — and its one follow-up two working days later; unanswered,
//   it lapses.
//
//   `answerDmReminder` — the reaction door's look at a DM reminder. A promise
//   the person made answers to the thread reminder's four glyphs; a promise
//   made to them to 🙌 got it · ⏳ wait (two more working days, at most twice)
//   · 🙅 drop.
//
// THE BUDGET. One job per person, each on its own alarm and fresh budget. A
// DM starts only when what is left covers it; a stop saves where the job got
// to and rethrows, and the runner runs it again on a fresh budget.
//
// Every dependency is injected, so the Node suite runs whole days against
// fakes (tests/dm-watch.test.ts). `Env` enters in `./env.ts`.

import { D1QueryBudgetError, isSubrequestBudgetError, rethrowIfBudget, SubrequestBudgetError } from "../net";
import { GATE_RESERVED } from "../gate/reactions";
import type { ScheduledJob } from "../scheduled/runs";
import type { SweepMessage } from "../sweep/finding";
import type { SweepSlackMessage } from "../sweep/run";
import { acknowledgement, REMINDER_LEGEND, reminderAnswer, reminderBlocks, reminderText } from "../commitments/copy";
import type { CommitmentDetector, DetectedCommitment, EvidenceJudge } from "../commitments/detector";
import { commitmentDueAt, dayLabel, dueDayOf, etDayOf, isMorningRunTime, maySnooze, nudgeAt, rearmedDueAt } from "../commitments/due";
import { LIVE_STATES } from "../commitments/store";
import { madeFollowUpText, madeToAcknowledgement, MADE_TO_LEGEND, madeToFollowUpText, madeToText } from "./copy";
import {
  DM_WATCH_FEATURES,
  featureOf,
  type DmCommitmentKind,
  type DmCommitmentPatch,
  type DmCommitmentRecord,
  type DmWatchFeature,
  type DmWatchRecords,
} from "./store";

/** The user scopes the jobs read with: the DM list and the DMs themselves. */
export const REQUIRED_SCOPES = ["im:read", "im:history"] as const;
/** DMs one night reads at most; past it the rest wait, and the report says so. */
export const MAX_DMS_PER_NIGHT = 80;
/** Messages one DM read takes since the switch's `readThrough`. */
export const DM_HISTORY_LIMIT = 100;
/** Messages up to and including the promise, read again at nudge time. */
export const CONTEXT_MESSAGES = 8;
/** Messages after the promise the morning judges for completion. */
export const EVIDENCE_MESSAGES = 50;
/** Reminders one person gets from this job in one morning. */
export const MAX_DM_REMINDERS_PER_MORNING = 2;
/** Mornings running a row may be held before it lapses. */
export const MAX_DM_HOLDS = 3;
/** What one DM read may spend: the history, the detector, the insert. */
export const DM_READ_COST = { subrequests: 3, d1Queries: 2 };
/** What one reminder may spend: two DM reads, the detector, the judge, the
 *  name, the bot DM and the post, and the D1 statements around them. */
export const DM_NUDGE_COST = { subrequests: 8, d1Queries: 3 };

const PROMISE_KINDS: readonly DmCommitmentKind[] = ["made", "made_to"];

/** Reads on the owner's own token — reads only: nothing here can write. */
export interface OwnerSlack {
  /** auth.test: the scopes Slack actually granted this token, the workspace
   *  URL permalinks are built on, and whose token it is; null when refused. */
  identity(): Promise<{ scopes: readonly string[]; url: string; userId: string } | null>;
  /** The owner's DMs (`users.conversations`, `types=im`), each with the other
   *  person's id; null when unreadable. */
  ims(): Promise<{ channels: { id: string; user: string }[]; complete: boolean } | null>;
  /** One page of a DM's messages, newest first as Slack returns them; null
   *  when unreadable. */
  history(
    channel: string,
    range: { oldest?: string; latest?: string; inclusive?: boolean; limit: number },
  ): Promise<{ messages: SweepSlackMessage[]; hasMore: boolean } | null>;
}

/** Where a budget-stopped night picks up, kept for the day. */
export interface ReadProgress {
  get(key: string): Promise<{ latest: string; next: number } | null>;
  set(key: string, value: { latest: string; next: number }): Promise<void>;
  clear(key: string): Promise<void>;
}

interface Common {
  records: DmWatchRecords;
  /** The owner's own-token reads, or null when they have no token of their
   *  own (a workspace fallback never counts). */
  ownerSlack(userId: string): Promise<OwnerSlack | null>;
  detector: CommitmentDetector;
  /** The bot's user id: its DM is not a person's. */
  botUserId: string | null;
  meter?: { headroom(): { subrequests: number; d1Queries: number } };
  now(): number;
  /** Reads and detects as a real run does, and writes and posts nothing. */
  dryRun?: boolean;
  /** One line per skipped job; `console.log` when absent. */
  log?(line: string): void;
}

export type DmReadDeps = Common & { progress: ReadProgress };

export type DmNudgeDeps = Common & {
  judge: EvidenceJudge;
  /** The bot token's side: the owner's DM with uno-bot, the post, a name. */
  bot: {
    dmChannel(userId: string): Promise<string | null>;
    post(channel: string, message: { text: string; blocks: unknown[] }): Promise<{ ok: boolean; ts?: string }>;
    userName(userId: string): Promise<string | null>;
  };
};

/** What a job did — counts and ids, never a message's words. */
export interface DmJobReport {
  kind: "dm-promise-read" | "dm-promise-nudge";
  key: string;
  outcome: "handled" | "skipped";
  note: string | null;
  summary: string;
}

// ── The switches ─────────────────────────────────────────────────────────────

/**
 * Save the Home tab's switches for one person: `selected` is every switch that
 * should be on. A switch turned off lapses its live promises, silently. One
 * turned on starts reading from now, and only with a connected token.
 *
 * @returns The switches on afterwards
 */
export async function setDmWatch(
  userId: string,
  selected: readonly DmWatchFeature[],
  deps: { records: DmWatchRecords; connected(userId: string): Promise<boolean>; now(): number },
): Promise<DmWatchFeature[]> {
  const now = deps.now();
  const on = new Set((await deps.records.switches(userId)).map((s) => s.feature));
  let connected: boolean | undefined;
  for (const feature of DM_WATCH_FEATURES) {
    const want = selected.includes(feature);
    if (want && !on.has(feature)) {
      connected ??= await deps.connected(userId);
      if (!connected) continue;
      await deps.records.setSwitch(userId, feature, true, { now, readThrough: tsOf(now) });
      on.add(feature);
    } else if (!want && on.has(feature)) {
      await deps.records.setSwitch(userId, feature, false, { now, readThrough: tsOf(now) });
      await deps.records.lapseLive(userId, PROMISE_KINDS.filter((k) => featureOf(k) === feature), now);
      on.delete(feature);
    }
  }
  return DM_WATCH_FEATURES.filter((f) => on.has(f));
}

// ── End of day: read the owner's DMs ─────────────────────────────────────────

/**
 * The end-of-day `dm-promise-read` job for `job.user`.
 *
 * @throws A budget stop, after saving where it got to — so the runner defers
 */
export async function runDmPromiseRead(job: ScheduledJob, deps: DmReadDeps): Promise<DmJobReport> {
  const report = reporter("dm-promise-read", job);
  const user = job.user;
  if (!user) return report("skipped", "no user on the job");
  const switches = (await deps.records.switches(user)).filter((s) => PROMISE_KINDS.some((k) => featureOf(k) === s.feature));
  if (!switches.length) return report("skipped", "no switch on");
  const slack = await ready(user, deps);
  if (typeof slack === "string") return report("skipped", slack);

  const now = deps.now();
  const key = `dm-watch:read:${user}:${dateOf(now)}`;
  const saved = await deps.progress.get(key);
  const latest = saved?.latest ?? tsOf(now);
  const oldest = switches.map((s) => s.readThrough).reduce((a, b) => (Number(a) <= Number(b) ? a : b));
  const listed = await slack.api.ims();
  if (!listed) {
    log(deps, `[dm-watch] ${user}: the DM list could not be read, job skipped`);
    return report("skipped", "the DM list could not be read");
  }
  const people = listed.channels
    .filter((c) => c.user && c.user !== user && c.user !== deps.botUserId && c.user !== "USLACKBOT")
    .sort((a, b) => a.id.localeCompare(b.id));
  const ims = people.slice(0, MAX_DMS_PER_NIGHT);
  const counts = { read: 0, unreadable: 0, made: 0, made_to: 0 };
  let i = saved?.next ?? 0;
  try {
    for (; i < ims.length; i++) {
      ensureHeadroom(deps, DM_READ_COST);
      const im = ims[i]!;
      const page = await slack.api.history(im.id, { oldest, latest, limit: DM_HISTORY_LIMIT });
      if (!page) {
        counts.unreadable += 1;
        continue;
      }
      counts.read += 1;
      const messages = humans(page.messages, deps.botUserId);
      if (!messages.length) continue;
      const found = await deps.detector.detect({ thread: { channel: im.id, channelKind: "dm", rootTs: messages[0]!.ts, messages }, since: oldest });
      if (!found.ok) {
        counts.unreadable += 1;
        continue;
      }
      const rows = found.commitments.flatMap((c) => rowFor(c, { user, channel: im.id, url: slack.url, switches, now }));
      for (const row of rows) counts[row.kind] += 1;
      if (rows.length && !deps.dryRun) await deps.records.addCommitments(rows);
    }
  } catch (err) {
    if (isSubrequestBudgetError(err) && !deps.dryRun) await deps.progress.set(key, { latest, next: i });
    throw err;
  }
  if (!deps.dryRun) {
    await deps.records.advance(user, switches.map((s) => s.feature), latest);
    await deps.progress.clear(key);
  }
  const more = people.length > ims.length ? `; ${people.length - ims.length} DM(s) past the nightly cap` : "";
  return report(
    "handled",
    null,
    `${counts.read} DM(s) read, ${counts.unreadable} unreadable; ${counts.made} made, ${counts.made_to} made to them ${deps.dryRun ? "would be kept" : "kept"}${more}`,
  );
}

/** A detected promise as a row, when its switch is on and it is new to it. */
function rowFor(
  c: DetectedCommitment,
  at: { user: string; channel: string; url: string; switches: { feature: DmWatchFeature; readThrough: string }[]; now: number },
): DmCommitmentRecord[] {
  const kind: DmCommitmentKind = c.promiser === at.user ? "made" : "made_to";
  const sw = at.switches.find((s) => s.feature === featureOf(kind));
  if (!sw || Number(c.messageTs) <= Number(sw.readThrough)) return [];
  return [
    {
      id: `${at.user}:${at.channel}:${c.messageTs}`,
      ownerId: at.user,
      kind,
      permalink: permalinkOf(at.url, at.channel, c.messageTs),
      dueAt: commitmentDueAt(msOf(c.messageTs), c.deadline).dueAt,
      state: "open",
      nudges: 0,
      snoozes: 0,
      detectedAt: at.now,
      nudgeTs: null,
      followupTs: null,
      checkedOn: null,
      holds: 0,
      remindedOn: null,
      resolvedAt: null,
    },
  ];
}

// ── Morning: re-read, then remind ────────────────────────────────────────────

/**
 * The morning `dm-promise-nudge` job for `job.user`.
 *
 * @throws A budget stop before a row it cannot finish — the runner defers
 */
export async function runDmPromiseNudges(job: ScheduledJob, deps: DmNudgeDeps): Promise<DmJobReport> {
  const report = reporter("dm-promise-nudge", job);
  const user = job.user;
  if (!user) return report("skipped", "no user on the job");
  const now = deps.now();
  if (!deps.dryRun && !isMorningRunTime(now)) return report("skipped", "outside the weekday morning run");
  const runDate = dateOf(now);
  const on = new Set((await deps.records.switches(user)).map((s) => s.feature));
  let sent = await deps.records.remindedCount(user, runDate);
  let slack: Awaited<ReturnType<typeof ready>> | undefined;
  const tally: Record<string, number> = {};
  while (sent < MAX_DM_REMINDERS_PER_MORNING) {
    ensureHeadroom(deps, DM_NUDGE_COST);
    const c = await deps.records.nextDue(user, now, runDate);
    if (!c) break;
    slack ??= await ready(user, deps);
    // A missing scope skips the whole job, rows untouched (ADR-024).
    if (typeof slack === "string" && slack !== NO_TOKEN) return report("skipped", slack);
    const action = await remind(deps, c, on, typeof slack === "string" ? null : slack, now, runDate);
    tally[action] = (tally[action] ?? 0) + 1;
    if (action === "nudged" || action === "followed-up") sent += 1;
    if (deps.dryRun) break;
  }
  const summary = Object.entries(tally).map(([a, n]) => `${n} ${a}`).join(", ") || "nothing due";
  return report("handled", null, summary);
}

type RemindAction = "nudged" | "followed-up" | "auto_done" | "lapsed" | "held";

async function remind(
  deps: DmNudgeDeps,
  c: DmCommitmentRecord,
  on: ReadonlySet<DmWatchFeature>,
  slack: { api: OwnerSlack; url: string } | null,
  now: number,
  runDate: string,
): Promise<RemindAction> {
  const settle = async (patch: DmCommitmentPatch) => {
    if (!deps.dryRun) await deps.records.update(c.id, { checkedOn: runDate, ...patch });
  };
  const lapse = async (): Promise<RemindAction> => {
    await settle({ state: "lapsed", resolvedAt: now });
    return "lapsed";
  };
  const hold = async (note: string): Promise<RemindAction> => {
    const holds = c.holds + 1;
    if (holds >= MAX_DM_HOLDS) {
      log(deps, `[dm-watch] ${c.id} lapsed after ${holds} held mornings: ${note}`);
      await settle({ state: "lapsed", holds, resolvedAt: now });
      return "lapsed";
    }
    await settle({ holds });
    return "held";
  };
  // Its switch turned off since: lapsed, silently (the toggle lapses these;
  // this covers a row it missed).
  if (!on.has(featureOf(c.kind))) return lapse();
  if (c.nudges >= 2) return lapse();
  if (!slack) return hold("no connected token");
  const at = parsePermalink(c.permalink);
  if (!at) return lapse();

  const context = await slack.api.history(at.channel, { latest: at.ts, inclusive: true, limit: CONTEXT_MESSAGES });
  if (!context) return hold("the DM could not be read");
  const shown = humans(context.messages, deps.botUserId);
  const index = shown.findIndex((m) => m.ts === at.ts);
  // Deleted, or no longer a person's message: nothing to remind about.
  if (index < 0) return lapse();
  const since = index > 0 ? shown[index - 1]!.ts : "0";
  const found = await deps.detector.detect({ thread: { channel: at.channel, channelKind: "dm", rootTs: shown[0]!.ts, messages: shown.slice(0, index + 1) }, since });
  if (!found.ok) return hold("the detector did not answer");
  const promise = found.commitments.find((x) => x.messageTs === at.ts);
  // Edited away, or read differently now: silently gone.
  if (!promise || (promise.promiser === c.ownerId) !== (c.kind === "made")) return lapse();

  const later = await slack.api.history(at.channel, { oldest: at.ts, limit: EVIDENCE_MESSAGES });
  if (!later) return hold("the DM could not be read");
  const after = humans(later.messages, deps.botUserId).filter((m) => Number(m.ts) > Number(at.ts));
  if (after.length) {
    const verdict = await deps.judge.judge({ promiser: promise.promiser, what: promise.what, promiseTs: at.ts, messages: after, sources: [] });
    if (!verdict.ok) return hold("the judge did not answer");
    if (verdict.done) {
      await settle({ state: "auto_done", resolvedAt: now });
      return "auto_done";
    }
  }

  const first = c.nudges === 0;
  const promisedAt = msOf(at.ts);
  const due = commitmentDueAt(promisedAt, promise.deadline);
  const byLabel = due.stated ? dayLabel(dueDayOf(due.dueAt), etDayOf(now)) : null;
  const promisedLabel = dayLabel(etDayOf(promisedAt), etDayOf(now));
  let body: string;
  if (c.kind === "made") {
    body = first
      ? reminderText({ promiser: c.ownerId, what: promise.what, deadlineLabel: byLabel, promisedLabel, permalink: c.permalink })
      : madeFollowUpText(c.ownerId, c.permalink);
  } else {
    body = first
      ? madeToText({ name: await deps.bot.userName(promise.promiser), what: promise.what, byLabel, promisedLabel, permalink: c.permalink })
      : madeToFollowUpText(c.ownerId, c.permalink);
  }
  const action = first ? "nudged" : "followed-up";
  if (deps.dryRun) return action;

  // The owner's DM with uno-bot, top level: never a thread, never anyone else.
  const dm = await deps.bot.dmChannel(c.ownerId);
  if (!dm) return hold("the owner's DM with uno-bot could not be opened");
  const posted = await deps.bot.post(dm, { text: body, blocks: reminderBlocks(body, c.kind === "made" ? REMINDER_LEGEND : MADE_TO_LEGEND) });
  if (!posted.ok || !posted.ts) return hold("Slack refused the post");
  await settle({
    state: "nudged",
    nudges: c.nudges + 1,
    holds: 0,
    remindedOn: runDate,
    dueAt: rearmedDueAt(now),
    ...(first ? { nudgeTs: posted.ts } : { followupTs: posted.ts }),
  });
  return action;
}

// ── Reactions ────────────────────────────────────────────────────────────────

export interface DmReminderReaction {
  channel: string;
  messageTs: string;
  glyph: string;
  userId: string;
  messageAuthorId?: string;
}

export interface DmReminderDoorDeps {
  records: DmWatchRecords;
  /** The reminder's body as posted, read back from Slack with the bot token —
   *  kept nowhere else, since a row holds no summary. */
  reminderBody(channel: string, ts: string): Promise<string | null>;
  update(channel: string, ts: string, message: { text: string; blocks: unknown[] }): Promise<boolean>;
  botUserId(): Promise<string | undefined>;
  now(): number;
}

/**
 * A reaction on a DM reminder, answered. True when the reacted message is one
 * — the reaction is then its own, and the gate never sees it.
 */
export async function answerDmReminder(r: DmReminderReaction, deps: DmReminderDoorDeps): Promise<boolean> {
  try {
    return await answerOrThrow(r, deps);
  } catch (err) {
    // Fail open, as the thread reminders' door does.
    rethrowIfBudget(err);
    console.error(`[dm-watch] reminder lookup for ${r.channel} ${r.messageTs} failed, passing on: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function answerOrThrow(r: DmReminderReaction, deps: DmReminderDoorDeps): Promise<boolean> {
  // Every DM reminder is in a person's DM with uno-bot.
  if (!r.channel.startsWith("D")) return false;
  const answer = reminderAnswer(r.glyph);
  if (!answer && !GATE_RESERVED.has(r.glyph.replace(/::skin-tone-\d$/, ""))) return false;
  const bot = await deps.botUserId();
  if (r.messageAuthorId && bot && r.messageAuthorId !== bot) return false;
  const c = await deps.records.byReminderTs(r.messageTs);
  if (!c) return false;
  if (!answer || r.userId !== c.ownerId || !LIVE_STATES.includes(c.state)) return true;
  const now = deps.now();
  let ack: string;
  if (answer === "soon") {
    if (!maySnooze(c.snoozes)) return true;
    const dueAt = rearmedDueAt(now);
    await deps.records.update(c.id, { state: "snoozed", snoozes: c.snoozes + 1, dueAt });
    const day = dayLabel(etDayOf(nudgeAt(dueAt)), etDayOf(now));
    ack = c.kind === "made" ? acknowledgement("soon", day) : madeToAcknowledgement("soon", day);
  } else if (c.kind === "made_to") {
    if (answer === "not_promise") return true;
    await deps.records.update(c.id, { state: answer === "done" ? "done" : "dropped", resolvedAt: now });
    ack = madeToAcknowledgement(answer);
  } else {
    await deps.records.update(c.id, { state: answer === "done" ? "done" : answer === "not_doing" ? "dropped" : "not_promise", resolvedAt: now });
    ack = acknowledgement(answer);
  }
  const body = await deps.reminderBody(r.channel, r.messageTs);
  if (!body || !(await deps.update(r.channel, r.messageTs, { text: body, blocks: reminderBlocks(body, ack) }))) {
    console.warn(`[dm-watch] ${c.id}: answered, but reminder ${r.messageTs} could not be edited`);
  }
  return true;
}

// ── Shared ───────────────────────────────────────────────────────────────────

const NO_TOKEN = "no connected token";

/**
 * The owner's reads, once the token is theirs and its granted scopes cover the
 * job (ADR-024); otherwise why not, logged once.
 */
async function ready(user: string, deps: Common): Promise<{ api: OwnerSlack; url: string } | string> {
  const api = await deps.ownerSlack(user);
  if (!api) {
    log(deps, `[dm-watch] ${user}: ${NO_TOKEN}, job skipped`);
    return NO_TOKEN;
  }
  const id = await api.identity();
  if (!id || id.userId !== user) {
    log(deps, `[dm-watch] ${user}: the token was refused or is not theirs, job skipped`);
    return "the token was refused";
  }
  const missing = REQUIRED_SCOPES.filter((s) => !id.scopes.includes(s));
  if (missing.length) {
    log(deps, `[dm-watch] ${user}: the token lacks ${missing.join(", ")}, job skipped`);
    return `the token lacks ${missing.join(", ")}`;
  }
  return { api, url: id.url };
}

/** A person's messages, oldest first. */
function humans(messages: readonly SweepSlackMessage[], botUserId: string | null): SweepMessage[] {
  return messages
    .filter((m) => !m.bot_id && m.user && m.user !== botUserId && (!m.subtype || m.subtype === "thread_broadcast"))
    .map((m) => ({ ts: m.ts, user: m.user ?? "", text: m.text ?? "" }))
    .sort((a, b) => Number(a.ts) - Number(b.ts));
}

/** A message's permalink, built on the workspace URL auth.test gave: no call. */
export function permalinkOf(workspaceUrl: string, channel: string, ts: string): string {
  return `${workspaceUrl.replace(/\/+$/, "")}/archives/${channel}/p${ts.replace(".", "")}`;
}

/** The channel and ts a permalink names, or null. */
export function parsePermalink(permalink: string): { channel: string; ts: string } | null {
  const m = /\/archives\/([A-Z0-9]+)\/p(\d{10})(\d{6})(?:[?#]|$)/.exec(permalink);
  return m ? { channel: m[1]!, ts: `${m[2]}.${m[3]}` } : null;
}

function reporter(kind: DmJobReport["kind"], job: ScheduledJob) {
  return (outcome: DmJobReport["outcome"], note: string | null, done?: string): DmJobReport => ({
    kind,
    key: job.key,
    outcome,
    note,
    summary: [done, note].filter(Boolean).join(" — ") || outcome,
  });
}

function ensureHeadroom(deps: Pick<Common, "meter">, need: { subrequests: number; d1Queries: number }): void {
  const left = deps.meter?.headroom() ?? { subrequests: Infinity, d1Queries: Infinity };
  if (left.d1Queries < need.d1Queries) throw new D1QueryBudgetError(need.d1Queries);
  if (left.subrequests < need.subrequests) throw new SubrequestBudgetError(need.subrequests);
}

function log(deps: Pick<Common, "log">, line: string): void {
  (deps.log ?? console.log)(line);
}

function tsOf(ms: number): string {
  return (ms / 1000).toFixed(6);
}

function msOf(ts: string): number {
  return Math.round(Number(ts) * 1000);
}

function dateOf(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
