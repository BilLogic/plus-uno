// DM watch, end to end: a person turns a switch on in their Home tab; the
// end-of-day run reads THEIR OWN DMs with THEIR OWN token for promises; the
// next weekday morning run reminds them, and only them, in their DM with
// uno-bot; they answer with a reaction.
//
// FIVE ENTRY POINTS, one module:
//
//   `setDmWatch` — the Home tab's switches, saved. Each is off until turned
//   on, and turning one on reads nothing already said: it counts from now.
//   Turning one on needs a token of their own whose granted scopes cover the
//   jobs (ADR-020, ADR-024); otherwise it stays off and says why. Turning one
//   off stops its future jobs and lapses every live promise it was tracking,
//   silently; the last one off forgets how far their DMs were read.
//   `saveDmWatchAction` is the Home tab's checkboxes, handed to it.
//
//   `runDmPromiseRead` — the end-of-day `dm-promise-read` job, one per person
//   with a switch on. No switch on, or no token of their own: no DM is read.
//   Before any read it checks the token's granted scopes against Slack; a
//   missing scope skips the job with one log line. Then it lists every one of
//   the person's DMs, page by page, and reads the ones read longest ago first
//   — each from where it was last read to where tonight stops — up to
//   `MAX_DMS_PER_NIGHT`. A DM's position moves only when all of its new
//   messages were read, so a DM not reached tonight, or too busy to read
//   whole, loses nothing: it comes first another night. Each promise the
//   person made (`made`) or was made to them (`made_to`), for a switch that is
//   on, is kept as a row holding the permalink, `due_at` and the state — no
//   summary, no id of the other person. It posts nothing.
//
//   `runDmPromiseNudges` — the morning `dm-promise-nudge` job, one per person.
//   Each due row's message is read again from its permalink with the same
//   token and the summary regenerated from it; a message that is gone, or no
//   longer reads as a promise, lapses silently, and so does a row whose switch
//   is off. The messages after it are judged for completion. Otherwise the
//   reminder goes to the person's DM with uno-bot — never a thread, a card, or
//   anyone else's DM, and never to the other person. Unanswered, it gets one
//   follow-up two working days later, then lapses. A ⏳ earns a check-back
//   two working days out, at most twice (`postsAllowed`).
//
//   `answerDmReminder` — the reaction door's look at a DM reminder. A promise
//   the person made answers to the thread reminder's four glyphs; a promise
//   made to them to 🙌 got it · ⏳ wait · 🙅 drop.
//
// THE BUDGET. One job per person, each on its own alarm and fresh budget. A
// DM starts only when what is left covers it. A stop saves the positions of
// the DMs finished so far and rethrows; the runner runs the job again on a
// fresh budget, which keeps the night's stopping point (keyed by the run's
// date, so a retry past midnight UTC resumes rather than restarts) and skips
// the DMs already read.
//
// Every dependency is injected, so the Node suite runs whole days against
// fakes (tests/dm-watch.test.ts). `Env` enters in `./env.ts`.

import { D1QueryBudgetError, isSubrequestBudgetError, rethrowIfBudget, SubrequestBudgetError } from "../net";
import { GATE_RESERVED } from "../gate/reactions";
import type { JobContext, ScheduledJob } from "../scheduled/runs";
import type { SweepMessage } from "../sweep/finding";
import type { SweepSlackMessage } from "../sweep/run";
import { acknowledgement, REMINDER_LEGEND, reminderAnswer, reminderBlocks, reminderText } from "../commitments/copy";
import type { CommitmentDetector, DetectedCommitment, EvidenceJudge } from "../commitments/detector";
import { commitmentDueAt, dayLabel, dueDayOf, etDayOf, isMorningRunTime, maySnooze, nudgeAt, rearmedDueAt } from "../commitments/due";
import { LIVE_STATES } from "../commitments/store";
import { madeFollowUpText, madeToAcknowledgement, MADE_LAST_LEGEND, MADE_TO_LAST_LEGEND, MADE_TO_LEGEND, madeToFollowUpText, madeToText } from "./copy";
import {
  DM_WATCH_FEATURES,
  featureOf,
  isDmWatchFeature,
  postsAllowed,
  type DmCommitmentKind,
  type DmCommitmentPatch,
  type DmCommitmentRecord,
  type DmWatchFeature,
  type DmWatchRecords,
} from "./store";

/** The user scopes the jobs read with: the DM list and the DMs themselves. */
export const REQUIRED_SCOPES = ["im:read", "im:history"] as const;
/** DMs one night reads at most, the ones read longest ago first; the rest
 *  come first another night, and the report counts them. */
export const MAX_DMS_PER_NIGHT = 80;
/** `users.conversations` pages of 200 read for the DM list; a list longer
 *  than this is reported incomplete. */
export const MAX_IM_PAGES = 5;
/** Messages per history page. */
export const DM_HISTORY_LIMIT = 100;
/** History pages one DM may take in a night; past it the DM keeps its
 *  position and is read first another night. */
export const MAX_HISTORY_PAGES = 3;
/** Messages up to and including the promise, read again at nudge time. */
export const CONTEXT_MESSAGES = 8;
/** Messages after the promise the morning judges for completion. */
export const EVIDENCE_MESSAGES = 50;
/** Reminders one person gets from this job in one morning. */
export const MAX_DM_REMINDERS_PER_MORNING = 2;
/** Mornings running a row may be held before it lapses. */
export const MAX_DM_HOLDS = 3;
/** What one history page of a DM may spend: the page and the detector, the
 *  insert and the positions saved at a stop. */
export const DM_READ_COST = { subrequests: 2, d1Queries: 2 };
/** What one reminder may spend: two DM reads, the detector, the judge, the
 *  name, the bot DM and the post, and the D1 statements around them. */
export const DM_NUDGE_COST = { subrequests: 8, d1Queries: 3 };

const PROMISE_KINDS: readonly DmCommitmentKind[] = ["made", "made_to"];

/** Reads on the owner's own token — reads only: nothing here can write. */
export interface OwnerSlack {
  /** auth.test: the scopes Slack actually granted this token, the workspace
   *  URL permalinks are built on, and whose token it is; null when refused. */
  identity(): Promise<{ scopes: readonly string[]; url: string; userId: string } | null>;
  /** One page of the owner's DMs (`users.conversations`, `types=im`), each
   *  with the other person's id, and the next page's cursor; null when
   *  unreadable. */
  ims(cursor?: string): Promise<{ channels: { id: string; user: string }[]; nextCursor?: string } | null>;
  /** One page of a DM's messages, newest first as Slack returns them, and the
   *  next (older) page's cursor; null when unreadable. */
  history(
    channel: string,
    range: { oldest?: string; latest?: string; inclusive?: boolean; limit: number; cursor?: string },
  ): Promise<{ messages: SweepSlackMessage[]; hasMore: boolean; nextCursor?: string } | null>;
}

/** Where tonight's read stops, kept for the run so a retried job reads to the
 *  same point. */
export interface ReadProgress {
  get(key: string): Promise<{ latest: string } | null>;
  set(key: string, value: { latest: string }): Promise<void>;
  clear(key: string): Promise<void>;
}

/** Whether a person's token can run the jobs. */
export type DmAccess =
  | { ok: true; api: OwnerSlack; url: string }
  | { ok: false; reason: "no-token" | "refused" }
  | { ok: false; reason: "missing-scopes"; missing: string[] };

interface Common extends Pick<JobContext, "runDate"> {
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

/** What saving the switches did: what is on, and why a switch asked for
 *  stayed off. */
export interface SetDmWatchResult {
  on: DmWatchFeature[];
  refused?: Exclude<DmAccess, { ok: true }>;
}

/**
 * Save the Home tab's switches for one person: `selected` is every switch that
 * should be on. A switch turned off lapses its live promises, silently. One
 * turned on counts from now, and only when their own token can run the jobs.
 */
export async function setDmWatch(
  userId: string,
  selected: readonly DmWatchFeature[],
  deps: { records: DmWatchRecords; access(userId: string): Promise<DmAccess>; now(): number },
): Promise<SetDmWatchResult> {
  const now = deps.now();
  const on = new Set((await deps.records.switches(userId)).map((s) => s.feature));
  let access: DmAccess | undefined;
  for (const feature of DM_WATCH_FEATURES) {
    const want = selected.includes(feature);
    if (want && !on.has(feature)) {
      access ??= await deps.access(userId);
      if (!access.ok) continue;
      await deps.records.setSwitch(userId, feature, true, { now, readThrough: tsOf(now) });
      on.add(feature);
    } else if (!want && on.has(feature)) {
      await deps.records.setSwitch(userId, feature, false, { now, readThrough: tsOf(now) });
      await deps.records.lapseLive(userId, PROMISE_KINDS.filter((k) => featureOf(k) === feature), now);
      on.delete(feature);
    }
  }
  if (!on.size) await deps.records.clearPositions(userId);
  const result: SetDmWatchResult = { on: DM_WATCH_FEATURES.filter((f) => on.has(f)) };
  return access && !access.ok ? { ...result, refused: access } : result;
}

/**
 * The Home tab's checkboxes, saved for the person who clicked them — the
 * payload's user, never anyone the action names — and their Home published
 * again, saying why a switch stayed off.
 */
export async function saveDmWatchAction(
  payload: { user?: { id?: string }; actions?: { selected_options?: { value?: string }[] }[] },
  deps: {
    save(userId: string, selected: DmWatchFeature[]): Promise<SetDmWatchResult>;
    publish(userId: string, refused?: SetDmWatchResult["refused"]): Promise<void>;
  },
): Promise<void> {
  const userId = payload.user?.id;
  if (!userId) return;
  const selected = (payload.actions?.[0]?.selected_options ?? []).map((o) => o.value).filter(isDmWatchFeature);
  const result = await deps.save(userId, selected);
  await deps.publish(userId, result.refused);
}

/** Whether this person's own token can run the jobs: theirs, and granted the
 *  scopes they read with, as Slack reports them live (ADR-024). */
export async function accessOf(userId: string, ownerSlack: Common["ownerSlack"]): Promise<DmAccess> {
  const api = await ownerSlack(userId);
  if (!api) return { ok: false, reason: "no-token" };
  const id = await api.identity();
  if (!id || id.userId !== userId) return { ok: false, reason: "refused" };
  const missing = REQUIRED_SCOPES.filter((s) => !id.scopes.includes(s));
  if (missing.length) return { ok: false, reason: "missing-scopes", missing };
  return { ok: true, api, url: id.url };
}

// ── End of day: read the owner's DMs ─────────────────────────────────────────

/**
 * The end-of-day `dm-promise-read` job for `job.user`.
 *
 * @throws A budget stop, after saving the DMs finished — so the runner defers
 */
export async function runDmPromiseRead(job: ScheduledJob, deps: DmReadDeps): Promise<DmJobReport> {
  const report = reporter("dm-promise-read", job);
  const user = job.user;
  if (!user) return report("skipped", "no user on the job");
  const switches = (await deps.records.switches(user)).filter((s) => PROMISE_KINDS.some((k) => featureOf(k) === s.feature));
  if (!switches.length) return report("skipped", "no switch on");
  const slack = await ready(user, deps);
  if (!slack.ok) return report("skipped", slack.note);

  const now = deps.now();
  const key = `dm-watch:read:${user}:${deps.runDate}`;
  const saved = await deps.progress.get(key);
  const latest = saved?.latest ?? tsOf(now);
  if (!saved && !deps.dryRun) await deps.progress.set(key, { latest });
  const floor = switches.map((s) => s.readThrough).reduce((a, b) => (Number(a) <= Number(b) ? a : b));

  const listed = await listIms(slack.api);
  if (!listed) {
    log(deps, `[dm-watch] ${user}: the DM list could not be read, job skipped`);
    return report("skipped", "the DM list could not be read");
  }
  const people = listed.channels.filter((c) => c.user !== user && c.user !== deps.botUserId && c.user !== "USLACKBOT");
  const positions = await deps.records.positions(user);
  const from = (id: string) => {
    const p = positions[id];
    return p && Number(p) > Number(floor) ? p : floor;
  };
  // Read at an earlier alarm of this same night.
  const doneTonight = people.filter((c) => Number(from(c.id)) >= Number(latest)).length;
  // The longest unread first, so a DM a night did not reach comes first next.
  const waiting = people
    .filter((c) => Number(from(c.id)) < Number(latest))
    .sort((a, b) => Number(from(a.id)) - Number(from(b.id)) || a.id.localeCompare(b.id));
  const tonight = waiting.slice(0, Math.max(0, MAX_DMS_PER_NIGHT - doneTonight));
  const counts = { read: 0, busy: 0, unreadable: 0, made: 0, made_to: 0 };
  const finished: Record<string, string> = {};
  const save = async () => {
    if (!deps.dryRun) await deps.records.savePositions(user, finished);
  };
  try {
    for (const im of tonight) {
      const since = from(im.id);
      const read = await readDm(slack.api, im.id, since, latest, deps);
      if (!read) {
        counts.unreadable += 1;
        continue;
      }
      if (read.messages.length) {
        const found = await deps.detector.detect({
          thread: { channel: im.id, channelKind: "dm", rootTs: read.messages[0]!.ts, messages: read.messages },
          since,
        });
        if (!found.ok) {
          // Its position stays: read again another night.
          counts.unreadable += 1;
          continue;
        }
        const rows = found.commitments.flatMap((c) => rowFor(c, { user, channel: im.id, url: slack.url, switches, now }));
        for (const row of rows) counts[row.kind] += 1;
        if (rows.length && !deps.dryRun) await deps.records.addCommitments(rows);
      }
      if (read.complete) {
        counts.read += 1;
        finished[im.id] = latest;
      } else {
        counts.busy += 1;
        log(deps, `[dm-watch] ${user}: a DM had more than ${MAX_HISTORY_PAGES} pages since it was last read; it keeps its place`);
      }
    }
  } catch (err) {
    if (isSubrequestBudgetError(err)) {
      // What finished stays finished; a save the budget refuses only means
      // those DMs are read again, which keeps no row twice.
      await save().catch(() => undefined);
    }
    throw err;
  }
  await save();
  if (!deps.dryRun) {
    // A switch turned off while this ran: what it just kept lapses too.
    const still = new Set((await deps.records.switches(user)).map((s) => s.feature));
    const off = PROMISE_KINDS.filter((k) => !still.has(featureOf(k)) && switches.some((s) => s.feature === featureOf(k)));
    if (off.length) await deps.records.lapseLive(user, off, now);
    await deps.progress.clear(key);
  }
  const notes = [
    waiting.length > tonight.length ? `${waiting.length - tonight.length} DM(s) wait for another night` : "",
    listed.complete ? "" : `the DM list ran past ${MAX_IM_PAGES} pages, so later DMs were not listed`,
  ].filter(Boolean);
  return report(
    "handled",
    notes.length ? notes.join("; ") : null,
    `${counts.read} DM(s) read, ${counts.busy} too busy to finish, ${counts.unreadable} unreadable; ${counts.made} made, ${counts.made_to} made to them ${deps.dryRun ? "would be kept" : "kept"}`,
  );
}

/** Every DM of the owner's, page by page, up to `MAX_IM_PAGES`; null when the
 *  list cannot be read. */
async function listIms(api: OwnerSlack): Promise<{ channels: { id: string; user: string }[]; complete: boolean } | null> {
  const channels: { id: string; user: string }[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_IM_PAGES; page++) {
    const res = await api.ims(cursor);
    if (!res) return page ? { channels, complete: false } : null;
    channels.push(...res.channels);
    cursor = res.nextCursor;
    if (!cursor) return { channels, complete: true };
  }
  return { channels, complete: false };
}

/**
 * One DM's messages after `since` up to `latest`, oldest first: `complete`
 * when every page was read, so its position may move to `latest`. Null when
 * Slack would not say.
 */
async function readDm(
  api: OwnerSlack,
  channel: string,
  since: string,
  latest: string,
  deps: Pick<Common, "botUserId" | "meter">,
): Promise<{ messages: SweepMessage[]; complete: boolean } | null> {
  const all: SweepSlackMessage[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_HISTORY_PAGES; page++) {
    ensureHeadroom(deps, DM_READ_COST);
    const res = await api.history(channel, { oldest: since, latest, limit: DM_HISTORY_LIMIT, ...(cursor ? { cursor } : {}) });
    if (!res) return null;
    all.push(...res.messages);
    cursor = res.hasMore ? res.nextCursor : undefined;
    // Slack says more with no cursor to reach it: not complete.
    if (res.hasMore && !cursor) return { messages: humans(all, deps.botUserId), complete: false };
    if (!cursor) return { messages: humans(all, deps.botUserId), complete: true };
  }
  return { messages: humans(all, deps.botUserId), complete: false };
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
      reminderChannel: null,
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
  const runDate = deps.runDate;
  const on = new Set((await deps.records.switches(user)).map((s) => s.feature));
  let sent = await deps.records.remindedCount(user, runDate);
  let slack: Ready | undefined;
  const tally: Record<string, number> = {};
  while (sent < MAX_DM_REMINDERS_PER_MORNING) {
    ensureHeadroom(deps, DM_NUDGE_COST);
    const c = await deps.records.nextDue(user, now, runDate);
    if (!c) break;
    slack ??= await ready(user, deps);
    // A missing scope skips the whole job, rows untouched (ADR-024). No token,
    // or a refused one, holds each row, and a row held long enough lapses.
    if (!slack.ok && slack.reason === "missing-scopes") return report("skipped", slack.note);
    const action = await remind(deps, c, on, slack.ok ? slack : null, now, runDate);
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
  // Its switch turned off since — a toggle that raced the night's read, say:
  // lapsed, silently.
  if (!on.has(featureOf(c.kind))) return lapse();
  if (c.nudges >= postsAllowed(c.snoozes)) return lapse();
  if (!slack) return hold("no usable token of their own");
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

  // The reminder in full the first time and at a ⏳'s check-back; otherwise
  // the short follow-up.
  const full = c.nudges === 0 || c.state === "snoozed";
  const promisedAt = msOf(at.ts);
  const due = commitmentDueAt(promisedAt, promise.deadline);
  const byLabel = due.stated ? dayLabel(dueDayOf(due.dueAt), etDayOf(now)) : null;
  const promisedLabel = dayLabel(etDayOf(promisedAt), etDayOf(now));
  let body: string;
  if (c.kind === "made") {
    body = full
      ? reminderText({ promiser: c.ownerId, what: promise.what, deadlineLabel: byLabel, promisedLabel, permalink: c.permalink })
      : madeFollowUpText(c.ownerId, c.permalink);
  } else {
    body = full
      ? madeToText({ name: await deps.bot.userName(promise.promiser), what: promise.what, byLabel, promisedLabel, permalink: c.permalink })
      : madeToFollowUpText(c.ownerId, c.permalink);
  }
  const action = c.nudges === 0 ? "nudged" : "followed-up";
  if (deps.dryRun) return action;

  // ⏳ is offered only while it can still bring a check-back.
  const legend = maySnooze(c.snoozes)
    ? c.kind === "made" ? REMINDER_LEGEND : MADE_TO_LEGEND
    : c.kind === "made" ? MADE_LAST_LEGEND : MADE_TO_LAST_LEGEND;
  // The owner's DM with uno-bot, top level: never a thread, never anyone else.
  const dm = await deps.bot.dmChannel(c.ownerId);
  if (!dm) return hold("the owner's DM with uno-bot could not be opened");
  const posted = await deps.bot.post(dm, { text: body, blocks: reminderBlocks(body, legend) });
  if (!posted.ok || !posted.ts) return hold("Slack refused the post");
  await settle({
    state: "nudged",
    nudges: c.nudges + 1,
    holds: 0,
    remindedOn: runDate,
    dueAt: rearmedDueAt(now),
    reminderChannel: dm,
    ...(c.nudges === 0 ? { nudgeTs: posted.ts } : { followupTs: posted.ts }),
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
  const c = await deps.records.byReminderTs(r.channel, r.messageTs);
  if (!c) return false;
  if (!answer || r.userId !== c.ownerId || !LIVE_STATES.includes(c.state)) return true;
  const now = deps.now();
  let ack: string;
  if (answer === "soon") {
    // Twice at most; each one is a check-back the morning will make.
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

type Ready = { ok: true; api: OwnerSlack; url: string } | { ok: false; reason: Exclude<DmAccess, { ok: true }>["reason"]; note: string };

/** The owner's reads when their token can run the job; otherwise why not,
 *  logged once. */
async function ready(user: string, deps: Common): Promise<Ready> {
  const access = await accessOf(user, deps.ownerSlack);
  if (access.ok) return access;
  let note = "no connected token";
  if (access.reason === "refused") note = "the token was refused or is not theirs";
  if (access.reason === "missing-scopes") note = `the token lacks ${access.missing.join(", ")}`;
  log(deps, `[dm-watch] ${user}: ${note}, job skipped`);
  return { ok: false, reason: access.reason, note };
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
