// DM Capture: a person who turned on "Catch decisions from my DMs" has their
// own DMs read, with their own token, for Capture's two questions — a decision
// a Notion page still states the old way (drift), and an answer no page has
// written down — and the edit offered to them, and only them, in their DM with
// uno-bot.
//
// TWO ENTRY POINTS, one module:
//
//   `runDmCaptureRead` — the end-of-day `dm-capture-read` job, one per person
//   with the switch on. Switch off, or no token of their own: no DM is read.
//   It lists and reads the person's DMs as the promise read does (`./run.ts`:
//   the scope check, the DM list, forward reading, `detectorWindows`), under
//   its OWN read positions (`positionScope`), so turning it on never skips a
//   message the promise jobs already read, and the reverse. A window with a
//   Notion link, a page named without one, or an answered question goes to
//   the sweep's drift and answer detectors, with the pages read as the sweep
//   reads them (`sweep/surfaces.ts`, `sweep/search.ts`). What they find is
//   queued for the morning. It posts nothing.
//
//   `runDmCapturePost` — the weekday morning `dm-capture-post` job, one per
//   person. The findings whose morning has come go on ONE proposal card in the
//   person's DM with uno-bot, staged as a sweep card with `confirmers:
//   [owner]`: only they can ✅ it. Never #uno-bot, a thread, a channel card,
//   or anyone else's job. One live card at a time; a quiet day posts nothing.
//
// WHAT IS KEPT (ADR-030, ADR-032). Nothing in D1 but the switch and the read
// positions. A finding waits in KV (`DmCaptureQueue`), with an expiry: its
// permalink, its target (the page and the block), its state, and the edit the
// card shows. No quote of the DM, no id of the other person, and no message
// text: the card links the message instead of quoting it.
//
// THE BUDGET. One job per person, each on its own alarm and fresh budget. A
// window starts only when what is left covers it (`DM_CAPTURE_COST`). A stop
// saves the findings, then the positions of the DMs finished, and rethrows;
// the runner runs the job again on a fresh budget, which keeps the night's
// stopping point and skips the DMs already read.
//
// Every dependency is injected (tests/dm-capture.test.ts). `Env` enters in
// `./capture-env.ts`.

import { isSubrequestBudgetError, rethrowIfBudget } from "../net";
import { SWEEP_KEY, type PendingProposal } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import type { JobContext, ScheduledJob } from "../scheduled/runs";
import { escapeSlackText } from "../slack/mrkdwn";
import { isMorningRunTime } from "../commitments/due";
import { changedSpan, itemOperation, MAX_ITEMS_PER_CARD, SWEEP_CARD_MARK, SWEEP_CARD_TTL_MS } from "../sweep/cards";
import type { CaptureDetector } from "../sweep/capture-detector";
import type { DriftDetector } from "../sweep/detector";
import { classifyLink, linksIn, type FindingAddition, type FindingTarget, type SweepMessage, type SweepSource, type TargetKind } from "../sweep/finding";
import { MAX_SOURCES_PER_THREAD } from "../sweep/run";
import { postableAt } from "../sweep/schedule";
import { findBySearch, looksAnswered, namedThings, questionQuery, type SourceSearch } from "../sweep/search";
import { readUsable, searchGate, type SurfaceConfig } from "../sweep/surfaces";
import {
  detectorWindows,
  ensureHeadroom,
  listIms,
  MAX_DMS_PER_NIGHT,
  MAX_IM_PAGES,
  permalinkOf,
  readForward,
  ready,
  type OwnerSlack,
  type ReadProgress,
} from "./run";
import { CAPTURE_FEATURE, positionScope, type DmReadPosition, type DmWatchRecords } from "./store";

/** What one window may spend: two model calls, the pages it reads and
 *  searches for, and what a stop saves. */
export const DM_CAPTURE_COST = { subrequests: 12, d1Queries: 2 };
/** What the morning card may spend: the bot DM, the post, the staging and its
 *  record, a withdraw held back, and the queue. */
export const DM_CAPTURE_POST_COST = { subrequests: 6, d1Queries: 3 };

/** One finding from a person's DMs, as the queue keeps it until its card. */
export interface DmCaptureFinding {
  /** `<DM>:<block id>`, or `<DM>:add:<block id>` for an added answer. */
  id: string;
  ownerId: string;
  /** The first new message that says it — linked on the card, never quoted. */
  permalink: string;
  target: FindingTarget;
  /** The block it replaces, or the block an added answer goes in after, and
   *  the stamp the read saw on it (ADR-029). */
  blockId: string;
  lastEditedTime: string;
  /** The block's text as read, and what the page says, in brief — the page's
   *  words, not the DM's. Empty for an added answer. */
  original: string;
  sourceSays: string;
  /** What the edit writes. */
  replacement: string;
  add?: FindingAddition;
  /** `queued` until its card posts; `proposed` once it has, so the same fix
   *  is not offered again while the queue remembers it. */
  state: "queued" | "proposed";
  detectedAt: number;
  driftAt: number;
  /** The card it went out on, and when. */
  proposalTs?: string;
  postedAt?: number;
}

/** The KV queue, one list per person. */
export interface DmCaptureQueue {
  load(ownerId: string): Promise<DmCaptureFinding[]>;
  save(ownerId: string, findings: DmCaptureFinding[]): Promise<void>;
  clear(ownerId: string): Promise<void>;
}

interface Common extends Pick<JobContext, "runDate"> {
  records: DmWatchRecords;
  queue: DmCaptureQueue;
  meter?: { headroom(): { subrequests: number; d1Queries: number } };
  now(): number;
  /** Reads and detects as a real run does, and writes and posts nothing. */
  dryRun?: boolean;
  log?(line: string): void;
}

export type DmCaptureReadDeps = Common & {
  ownerSlack(userId: string): Promise<OwnerSlack | null>;
  botUserId: string | null;
  progress: ReadProgress;
  sources: { read(url: string, kind: TargetKind): Promise<SweepSource | null> };
  surfaces: SurfaceConfig;
  detector: DriftDetector;
  capture: Pick<CaptureDetector, "answers">;
  /** Absent, nothing is searched. */
  search?: SourceSearch;
};

export type DmCapturePostDeps = Common & {
  bot: {
    /** The owner's DM with uno-bot. */
    dmChannel(userId: string): Promise<string | null>;
    post(channel: string, message: { text: string; blocks: unknown[] }): Promise<{ ok: boolean; ts?: string }>;
    /** Say on a posted card that it did not go through. */
    withdraw(channel: string, ts: string): Promise<void>;
  };
  render(card: ProposalCard): { text: string; blocks: unknown[] };
  /** Stage the card, as a sweep card is staged (`stageSweepCard`). */
  stage(proposal: PendingProposal): Promise<void>;
  /** Whether a card this job posted is still live in ThreadState. */
  cardLive(proposalTs: string): Promise<boolean>;
};

export interface DmCaptureReport {
  kind: "dm-capture-read" | "dm-capture-post";
  key: string;
  outcome: "handled" | "skipped";
  note: string | null;
  summary: string;
  /** A dry run's card, for the rehearsal. */
  text?: string;
}

// ── End of day ───────────────────────────────────────────────────────────────

/**
 * The end-of-day `dm-capture-read` job for `job.user`.
 *
 * @throws A budget stop, after saving what was found and the DMs finished
 */
export async function runDmCaptureRead(job: ScheduledJob, deps: DmCaptureReadDeps): Promise<DmCaptureReport> {
  const report = reporter("dm-capture-read", job);
  const user = job.user;
  if (!user) return report("skipped", "no user on the job");
  const on = (await deps.records.switches(user)).find((s) => s.feature === CAPTURE_FEATURE);
  if (!on) return report("skipped", "no switch on");
  const slack = await ready(user, deps);
  if (!slack.ok) return report("skipped", slack.note);

  const now = deps.now();
  const scope = positionScope(user, CAPTURE_FEATURE);
  const key = `dm-watch:capture-read:${user}:${deps.runDate}`;
  const saved = await deps.progress.get(key);
  const latest = saved?.latest ?? tsOf(now);
  if (!saved && !deps.dryRun) await deps.progress.set(key, { latest });

  const listed = await listIms(slack.api);
  if (!listed) return report("skipped", "the DM list could not be read");
  const people = listed.channels.filter((c) => c.user !== user && c.user !== deps.botUserId && c.user !== "USLACKBOT");
  const positions = await deps.records.positions(scope);
  const from = (id: string) => {
    const p = positions[id]?.through;
    return p && Number(p) > Number(on.readThrough) ? p : on.readThrough;
  };
  const doneTonight = people.filter((c) => Number(from(c.id)) >= Number(latest)).length;
  const waiting = people
    .filter((c) => Number(from(c.id)) < Number(latest))
    .sort((a, b) => Number(from(a.id)) - Number(from(b.id)) || a.id.localeCompare(b.id));
  const tonight = waiting.slice(0, Math.max(0, MAX_DMS_PER_NIGHT - doneTonight));
  const found: DmCaptureFinding[] = [];
  const finished: Record<string, DmReadPosition> = {};
  let read = 0;
  let unreadable = 0;
  // The findings first, then the positions past them — so a position never
  // moves past a finding that was not kept — and only while the switch is on.
  const save = async () => {
    if (deps.dryRun) return;
    if (!(await deps.records.switches(user)).some((s) => s.feature === CAPTURE_FEATURE)) return;
    if (found.length) await deps.queue.save(user, mergeQueued(await deps.queue.load(user), found));
    if (Object.keys(finished).length) await deps.records.savePositions(scope, finished);
  };
  try {
    for (const im of tonight) {
      const since = from(im.id);
      const got = await readForward(slack.api, im.id, { since, upTo: positions[im.id]?.upTo ?? null, latest }, deps);
      if (!got) {
        unreadable += 1;
        continue;
      }
      let stopped = false;
      for (const window of detectorWindows(got.messages, since)) {
        ensureHeadroom(deps, DM_CAPTURE_COST);
        const result = await findingsIn(window, { user, channel: im.id, url: slack.url, now }, deps);
        if (!result.ok) {
          stopped = true;
          break;
        }
        found.push(...result.findings);
        finished[im.id] = { through: window.through, upTo: got.upTo };
      }
      if (stopped) {
        unreadable += 1;
        continue;
      }
      if (Number(got.through) > Number(since) || got.upTo !== (positions[im.id]?.upTo ?? null)) finished[im.id] = { through: got.through, upTo: got.upTo };
      read += 1;
    }
  } catch (err) {
    if (isSubrequestBudgetError(err)) await save().catch(() => undefined);
    throw err;
  }
  await save();
  if (!deps.dryRun) await deps.progress.clear(key);
  const notes = [
    waiting.length > tonight.length ? `${waiting.length - tonight.length} DM(s) wait for another night` : "",
    listed.complete ? "" : `the DM list ran past ${MAX_IM_PAGES} pages, so later DMs were not listed`,
  ].filter(Boolean);
  return report(
    "handled",
    notes.length ? notes.join("; ") : null,
    `${read} DM(s) read, ${unreadable} unreadable or held; ${found.length} finding(s) ${deps.dryRun ? "would be queued" : "queued"}`,
  );
}

/**
 * One window's findings: the pages it links (Notion first) and, with search,
 * the page it names or the page its answer belongs on; then drift and
 * undocumented answers, each resting on at least one message new tonight.
 * Only a model that did not answer holds the DM; a page that will not read is
 * no page.
 */
async function findingsIn(
  window: { messages: SweepMessage[]; since: string },
  at: { user: string; channel: string; url: string; now: number },
  deps: DmCaptureReadDeps,
): Promise<{ ok: true; findings: DmCaptureFinding[] } | { ok: false }> {
  const none = { ok: true as const, findings: [] };
  const { messages } = window;
  const links = [...new Set(messages.flatMap((m) => linksIn(m.text)))].filter((url) => classifyLink(url) === "notion");
  const named = deps.search ? namedThings(messages.map((m) => m.text)) : [];
  const answered = looksAnswered(messages);
  if (!links.length && !named.length && !answered) return none;

  const sources: SweepSource[] = [];
  const add = async (url: string, searched: boolean) => {
    const source = await readUsable(deps.sources, deps.surfaces, url, "notion", searched).catch((err: unknown) => {
      rethrowIfBudget(err);
      return null;
    });
    if (source && !sources.some((s) => s.url === source.url)) sources.push(source);
  };
  for (const url of links.slice(0, MAX_SOURCES_PER_THREAD)) await add(url, false);
  if (deps.search && sources.length < MAX_SOURCES_PER_THREAD) {
    const question = answered && !sources.some((s) => s.writable) ? questionQuery(messages) : null;
    const hits = await findBySearch(deps.search, [...named, ...(question ? [question] : [])], new Set(links), searchGate(deps.surfaces));
    for (const hit of hits.filter((h) => h.kind === "notion")) {
      if (sources.length >= MAX_SOURCES_PER_THREAD) break;
      await add(hit.url, true);
    }
  }
  if (!sources.some((s) => s.writable)) return none;

  const thread = { channel: at.channel, channelKind: "dm" as const, rootTs: messages[0]!.ts, messages };
  const fresh = (evidence: readonly string[]) => evidence.filter((t) => Number(t) > Number(window.since)).sort((a, b) => Number(a) - Number(b));
  const findings: DmCaptureFinding[] = [];
  const base = (source: SweepSource, evidence: string[], allTs: string[]) => ({
    ownerId: at.user,
    permalink: permalinkOf(at.url, at.channel, evidence[0]!),
    target: {
      url: source.url,
      kind: source.kind,
      writable: source.writable,
      title: source.title,
      pillars: source.pillars,
      ...(source.foundBy ? { foundBy: source.foundBy } : {}),
    },
    state: "queued" as const,
    detectedAt: at.now,
    driftAt: Math.min(...allTs.map(msOf)),
  });

  if (links.length || named.length) {
    const detected = await deps.detector.detect({ thread, sources });
    if (!detected.ok) return { ok: false };
    for (const d of detected.findings) {
      const evidence = fresh(d.evidenceTs);
      if (!d.source.writable || !d.blockId || !d.lastEditedTime || !evidence.length) continue;
      findings.push({
        ...base(d.source, evidence, d.evidenceTs),
        id: `${at.channel}:${d.blockId}`,
        blockId: d.blockId,
        lastEditedTime: d.lastEditedTime,
        original: d.original,
        sourceSays: d.sourceSays,
        replacement: d.replacement,
      });
    }
  }
  if (answered) {
    const placed = await deps.capture.answers({ thread, sources });
    if (!placed.ok) return { ok: false };
    for (const a of placed.answers) {
      const evidence = fresh(a.evidenceTs);
      if (!evidence.length) continue;
      findings.push({
        ...base(a.source, evidence, a.evidenceTs),
        id: `${at.channel}:add:${a.anchorId}`,
        blockId: a.anchorId,
        lastEditedTime: a.anchorEditedTime,
        original: "",
        sourceSays: "",
        replacement: a.text,
        add: { section: a.section, newSection: a.newSection },
      });
    }
  }
  return { ok: true, findings };
}

/** Tonight's findings into the queue: a newer read of a queued one replaces
 *  it; a fix already carded — the same page and block — is not queued again. */
export function mergeQueued(queue: readonly DmCaptureFinding[], added: readonly DmCaptureFinding[]): DmCaptureFinding[] {
  const carded = new Set(queue.filter((f) => f.state === "proposed").map(fixKey));
  const byId = new Map(queue.map((f) => [f.id, f] as const));
  for (const f of added) {
    const had = byId.get(f.id);
    if (carded.has(fixKey(f)) || had?.state === "proposed") continue;
    byId.set(f.id, f);
  }
  return [...byId.values()];
}

function fixKey(f: Pick<DmCaptureFinding, "target" | "blockId" | "add">): string {
  return `${f.target.url}#${f.add ? "add:" : ""}${f.blockId}`;
}

// ── Morning ──────────────────────────────────────────────────────────────────

/**
 * The weekday morning `dm-capture-post` job for `job.user`: one card, in their
 * DM with uno-bot, only they can confirm.
 *
 * @throws A budget stop before the card starts — the runner defers
 */
export async function runDmCapturePost(job: ScheduledJob, deps: DmCapturePostDeps): Promise<DmCaptureReport> {
  const report = reporter("dm-capture-post", job);
  const user = job.user;
  if (!user) return report("skipped", "no user on the job");
  const now = deps.now();
  if (!deps.dryRun && !isMorningRunTime(now)) return report("skipped", "outside the weekday morning run");
  if (!(await deps.records.switches(user)).some((s) => s.feature === CAPTURE_FEATURE)) {
    // Turned off since the night read: nothing it found is offered.
    if (!deps.dryRun) await deps.queue.clear(user);
    return report("skipped", "no switch on");
  }
  const queue = await deps.queue.load(user);
  const last = queue.filter((f) => f.state === "proposed" && f.proposalTs && (f.postedAt ?? 0) + SWEEP_CARD_TTL_MS > now);
  for (const ts of new Set(last.map((f) => f.proposalTs!))) {
    if (await deps.cardLive(ts)) return report("handled", null, "a card is still live — the rest waits");
  }
  const due = queue
    .filter((f) => f.state === "queued" && f.ownerId === user && postableAt(f.detectedAt) <= now)
    .sort((a, b) => a.driftAt - b.driftAt || a.id.localeCompare(b.id))
    .slice(0, MAX_ITEMS_PER_CARD);
  if (!due.length) return report("handled", null, "nothing due");

  const card = dmCaptureCard(due);
  const rendered = deps.render(card);
  if (deps.dryRun) return { ...report("handled", null, `would post 1 card holding ${due.length} fix(es)`), text: rendered.text };
  ensureHeadroom(deps, DM_CAPTURE_POST_COST);
  // The owner's DM with uno-bot, top level: never a thread, a channel or
  // anyone else.
  const dm = await deps.bot.dmChannel(user);
  if (!dm) return report("handled", "the owner's DM with uno-bot could not be opened — kept for tomorrow");
  const posted = await deps.bot.post(dm, rendered);
  if (!posted.ok || !posted.ts) return report("handled", "Slack refused the post — kept for tomorrow");
  const proposal = dmCaptureProposal(card, { owner: user, channel: dm, ts: posted.ts, text: rendered.text, runDate: deps.runDate });
  try {
    await deps.stage(proposal);
  } catch (err) {
    if (isSubrequestBudgetError(err)) throw err;
    await deps.bot.withdraw(dm, posted.ts).catch(rethrowIfBudget);
    return report("handled", `posted but not staged (${err instanceof Error ? err.message : String(err)}) — withdrawn, kept for tomorrow`);
  }
  const ids = new Set(due.map((f) => f.id));
  await deps.queue.save(
    user,
    queue.map((f) => (ids.has(f.id) ? { ...f, state: "proposed" as const, proposalTs: posted.ts, postedAt: now } : f)),
  );
  return report("handled", null, `posted 1 card holding ${due.length} fix(es)`);
}

/** The card, as data. Page words are escaped; the DM is linked, never quoted. */
export function dmCaptureCard(items: readonly DmCaptureFinding[]): ProposalCard {
  const n = items.length;
  const lines = [
    `:mag: **${SWEEP_CARD_MARK}** — from your DMs: you settled ${n === 1 ? "something" : `${n} things`} that a page doesn't say yet.`,
    "",
  ];
  items.forEach((item, i) => {
    const page = `<${item.target.url}|${escapeSlackText(flat(item.target.title) || "untitled")}>`;
    const where = `   - <${item.permalink}|where you said it>`;
    if (item.add) {
      const place = item.add.section
        ? `add under ${page} › *${escapeSlackText(flat(item.add.section))}*`
        : `add a new section *${escapeSlackText(flat(item.add.newSection ?? ""))}* to ${page}`;
      lines.push(`${i + 1}. ${place}`, `   - adds: “${escapeSlackText(flat(item.replacement))}”`, where);
      return;
    }
    const { before, after } = changedSpan(item.original, item.replacement);
    lines.push(
      `${i + 1}. ${page}`,
      `   - page says: “${escapeSlackText(flat(item.sourceSays))}”`,
      `   - change: “${escapeSlackText(before)}” → “${escapeSlackText(after)}”`,
      where,
    );
  });
  lines.push(
    "",
    `Only you can confirm. One ✅ applies ${n === 1 ? "it" : `all ${n}`}; reply \`drop 2\` to leave one out. ` +
      `Nothing from your DMs goes anywhere else. Expires in ${SWEEP_CARD_TTL_MS / 3_600_000} h, with no reminder.`,
  );
  const operations = items.map((item) =>
    itemOperation({ target: item.target, blockId: item.blockId, lastEditedTime: item.lastEditedTime, replacement: item.replacement, add: item.add }),
  );
  return {
    kind: "confirm",
    verb: n === 1 ? "apply this Notion fix" : `apply these ${n} Notion fixes`,
    lead: lines.join("\n"),
    fields: [],
    caveats: [],
    operations,
  };
}

/** The card as ThreadState stages it: a sweep card in the owner's DM with
 *  uno-bot, its own thread, that only the owner can resolve. */
export function dmCaptureProposal(
  card: ProposalCard,
  posted: { owner: string; channel: string; ts: string; text: string; runDate: string },
): PendingProposal {
  const operations = card.operations ?? [];
  const first = operations[0]!;
  return {
    operations,
    toolName: first.toolName,
    input: first.input,
    channel: posted.channel,
    threadTs: posted.ts,
    replyTs: posted.ts,
    userMsgTs: posted.ts,
    proposalTs: posted.ts,
    proposalText: posted.text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs: SWEEP_CARD_TTL_MS,
    confirmers: [posted.owner],
    sweepRun: posted.runDate,
    supersedeKey: SWEEP_KEY,
  };
}

// ── Shared ───────────────────────────────────────────────────────────────────

function reporter(kind: DmCaptureReport["kind"], job: ScheduledJob) {
  return (outcome: DmCaptureReport["outcome"], note: string | null, done?: string): DmCaptureReport => ({
    kind,
    key: job.key,
    outcome,
    note,
    summary: [done, note].filter(Boolean).join(" — ") || outcome,
  });
}

function flat(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function tsOf(ms: number): string {
  return (ms / 1000).toFixed(6);
}

function msOf(ts: string): number {
  return Math.round(Number(ts) * 1000);
}
