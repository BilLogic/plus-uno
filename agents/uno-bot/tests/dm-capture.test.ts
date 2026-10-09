// DM Capture: a person who turned on "Catch decisions from my DMs" has their
// own DMs read, with their own token, for drift and undocumented answers, and
// the fix offered to them alone, on a card in their DM with uno-bot that only
// they can confirm.
//
// Everything runs against fakes: the owner's own-token reads, a Notion page, a
// drift detector that answers when a DM links the page, the in-memory DM watch
// records, an in-memory KV queue, the real card renderer, and an in-memory
// ThreadState the card is staged in. Mon 2026-09-28 Maya turns the switch on;
// Tue 29th the DM is written and read at the end of the day; Wed 30th is the
// morning.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { SubrequestBudgetError } from "../src/net";
import { planRun, type ScheduledJob } from "../src/scheduled/runs";
import { DECISION_REVIEW_ACTION_PREFIX, MAX_REPORT_ITEMS, type ReportMessage } from "../src/slack/decision-cards";
import { MAX_FAILED_NIGHTS, stageSweepCard, sweepCardState } from "../src/sweep/run";
import type { DriftDetector } from "../src/sweep/detector";
import type { CaptureDetector } from "../src/sweep/capture-detector";
import type { SweepSlackMessage } from "../src/sweep/run";
import type { SourceSearch } from "../src/sweep/search";
import { createInMemoryThreadState, mayConfirm, type PendingProposal } from "../src/thread-state/index";
import { createInMemoryProposalEventLog } from "../src/usage/index";
import { createInMemoryCommitmentStore, fewShotExamples } from "../src/commitments/index";
import {
  accessOf,
  CAPTURE_FEATURE,
  createInMemoryDmWatchRecords,
  DM_CARD_NOT_STAGED,
  DM_CARD_SWITCHED_OFF,
  DM_WATCH_LABELS,
  dmWatchHomeBlocks,
  dropDmCapture,
  positionScope,
  quotesDm,
  runDmCapturePost,
  runDmCaptureRead,
  runDmPromiseRead,
  setDmWatch,
  type DmCaptureFinding,
  type DmCapturePostDeps,
  type DmCaptureReadDeps,
  type DmHolds,
  type DmWatchFeature,
  type InMemoryDmWatchRecords,
  type OwnerSlack,
  withdrawFixes,
} from "../src/dm-watch/index";
import { at, BOT, notionPage, ts } from "./helpers/sweep-harness";
import { harness, request } from "./helpers/turn-harness";
import { runTurn } from "../src/turn/index";
import { resultMetadataFor } from "../src/agent/resolve-proposal";

const MAYA = "U0MAYA";
const BEA = "U0BEA";
const KAI = "U0KAI";
const DM_BEA = "D0BEA";
const URL = "https://plus.slack.com/";
const ON_AT = at(28, 15);
const EOD = at(29, 22);
const WED = at(30, 13);
const THU = at(31, 13);
const PAGE = notionPage("5a1e5a1e5a1e5a1e5a1e5a1e5a1e5a1e", { title: "Launch plan <!channel>" });
const DECIDED = ts(29, 17);
const SECRET = "the launch moved to November 1, keep it between us";

const readJob = (user: string): ScheduledJob => ({ key: `dm-capture-read:${user}`, kind: "dm-capture-read", user });
const postJob = (user: string): ScheduledJob => ({ key: `dm-capture-post:${user}`, kind: "dm-capture-post", user });

function dmMessages(): SweepSlackMessage[] {
  return [
    { ts: ts(29, 16, 55), user: MAYA, text: `where are we on launch? ${PAGE.url}` },
    { ts: DECIDED, user: BEA, text: SECRET },
  ];
}

interface Post {
  channel: string;
  text: string;
  blocks: unknown[];
  ts: string;
  tag: string;
  payload: Record<string, string>;
}

interface World {
  records: InMemoryDmWatchRecords;
  tokens: Set<string>;
  calls: string[];
  messages: Map<string, SweepSlackMessage[]>;
  kv: Map<string, DmCaptureFinding[]>;
  progress: Map<string, { latest: string }>;
  logs: string[];
  posts: Post[];
  removed: string[];
  withdrawn: { ts: string; ids: string[] | null; text: string }[];
  edits: { ts: string; message: ReportMessage }[];
  staged: PendingProposal[];
  clock: { now: number };
  threadState: ReturnType<typeof createInMemoryThreadState>;
  events: ReturnType<typeof createInMemoryProposalEventLog>;
  detected: { channel: string; firstTs: string }[];
  /** Detector windows the budget still covers; past them the meter says no. */
  windows: number;
  /** Page URLs whose read throws, with the status Notion answers. */
  broken: Map<string, number>;
  holds: Map<string, DmHolds>;
  /** The detector's replacement quotes the DM. */
  quoting: boolean;
  /** Run inside the detector — a switch turned off mid-run, say. */
  onDetect?: () => Promise<void>;
}

function world(): World {
  const clock = { now: ON_AT };
  return {
    records: createInMemoryDmWatchRecords(),
    tokens: new Set([MAYA, KAI]),
    calls: [],
    messages: new Map([[DM_BEA, dmMessages()]]),
    kv: new Map(),
    progress: new Map(),
    logs: [],
    posts: [],
    removed: [],
    withdrawn: [],
    edits: [],
    staged: [],
    clock,
    threadState: createInMemoryThreadState({ now: () => clock.now }),
    events: createInMemoryProposalEventLog(),
    detected: [],
    windows: Infinity,
    broken: new Map(),
    holds: new Map(),
    quoting: false,
  };
}

/** Each person's own token reads their own DMs: Maya has one with Bea; Kai
 *  has none worth reading. */
function ownerSlack(w: World) {
  return async (user: string): Promise<OwnerSlack | null> => {
    if (!w.tokens.has(user)) return null;
    return {
      async identity() {
        w.calls.push(`${user} auth.test`);
        return { scopes: ["im:read", "im:history"], url: URL, userId: user };
      },
      async ims() {
        w.calls.push(`${user} users.conversations`);
        return { channels: user === MAYA ? [{ id: DM_BEA, user: BEA }, { id: "D0UNO", user: BOT }] : [] };
      },
      async history(channel, range) {
        w.calls.push(`${user} history:${channel}`);
        const all = (w.messages.get(channel) ?? [])
          .filter((m) => {
            const t = Number(m.ts);
            if (range.oldest && !(t > Number(range.oldest))) return false;
            if (range.latest && (range.inclusive ? t > Number(range.latest) : t >= Number(range.latest))) return false;
            return true;
          })
          .sort((a, b) => Number(b.ts) - Number(a.ts));
        return { messages: all.slice(0, range.limit), hasMore: all.length > range.limit };
      },
    };
  };
}

/** Drift on the page's first block when a window says "November", on its
 *  second when it says "owner is now Kai" — each only with the page read. */
function detector(w: World): DriftDetector {
  return {
    async detect({ thread, sources }) {
      w.windows -= 1;
      w.detected.push({ channel: thread.channel, firstTs: thread.messages[0]!.ts });
      await w.onDetect?.();
      const source = sources.find((s) => s.url === PAGE.url);
      if (!source) return { ok: true, findings: [] };
      const findings = [];
      const november = thread.messages.find((m) => m.text.includes("November"));
      if (november) {
        const block = source.blocks[0]!;
        findings.push({
          source,
          blockId: block.id,
          lastEditedTime: block.lastEditedTime,
          original: block.text,
          sourceSays: "Launch is October 15.",
          threadSays: "Launch moved to November 1.",
          replacement: w.quoting ? `Launch date: ${SECRET}` : "Launch date: November 1",
          evidenceTs: [november.ts],
          claimedBy: november.user,
          confidence: 0.9,
        });
      }
      const owner = thread.messages.find((m) => m.text.includes("owner is now Kai"));
      if (owner) {
        const block = source.blocks[1]!;
        findings.push({
          source,
          blockId: block.id,
          lastEditedTime: block.lastEditedTime,
          original: block.text,
          sourceSays: "The design team owns it.",
          threadSays: "Kai owns it now.",
          replacement: "Owner: Kai",
          evidenceTs: [owner.ts],
          claimedBy: owner.user,
          confidence: 0.9,
        });
      }
      return { ok: true, findings };
    },
  };
}

const noAnswers: Pick<CaptureDetector, "answers"> = { answers: async () => ({ ok: true, answers: [] }) };

function common(w: World, now: number) {
  w.clock.now = now;
  return {
    runDate: new Date(now).toISOString().slice(0, 10),
    records: w.records,
    queue: {
      load: async (owner: string) => (w.kv.get(owner) ?? []).map((f) => ({ ...f })),
      save: async (owner: string, list: DmCaptureFinding[]) => void w.kv.set(owner, list.map((f) => ({ ...f }))),
      clear: async (owner: string) => void w.kv.delete(owner),
    },
    // Reads (one subrequest) always fit; a detector window (twelve) only while
    // `windows` lasts.
    meter: { headroom: () => (w.windows > 0 ? { subrequests: Infinity, d1Queries: Infinity } : { subrequests: 3, d1Queries: 50 }) },
    now: () => now,
    log: (line: string) => w.logs.push(line),
  };
}

function readDeps(w: World, now = EOD): DmCaptureReadDeps {
  return {
    ...common(w, now),
    ownerSlack: ownerSlack(w),
    botUserId: BOT,
    progress: {
      get: async (k) => w.progress.get(k) ?? null,
      set: async (k, v) => void w.progress.set(k, v),
      clear: async (k) => void w.progress.delete(k),
    },
    sources: {
      async read(url) {
        const status = w.broken.get(url);
        if (status) throw new Error(`Notion ${status} ${status === 404 ? "object_not_found" : "service_unavailable"}: no`);
        return url === PAGE.url ? PAGE : null;
      },
    },
    holds: {
      load: async (owner) => ({ ...(w.holds.get(owner) ?? {}) }),
      save: async (owner, holds) => void w.holds.set(owner, { ...holds }),
    },
    surfaces: {},
    detector: detector(w),
    capture: noAnswers,
  };
}

/** Take a report's items back, as `dm-watch/env.ts` does: each retired, and
 *  the cards it took out of reach say why. No ids: a card from before the
 *  shared card, retired whole. */
function withdraw(w: World) {
  return async (_channel: string, ts: string, ids: readonly string[] | null, text: string) => {
    w.withdrawn.push({ ts, ids: ids ? [...ids] : null, text });
    if (!ids) {
      await w.threadState.retireProposal(ts);
      return;
    }
    const message = await withdrawFixes(w.threadState, ts, ids, text);
    if (message) w.edits.push({ ts, message });
  };
}

function postDeps(w: World, now = WED, over: Partial<DmCapturePostDeps> = {}): DmCapturePostDeps {
  return {
    ...common(w, now),
    bot: {
      dmChannel: async (user) => `D-UNO-${user}`,
      async post(channel, message) {
        const posted = `${now / 1000}.00000${w.posts.length + 1}`;
        w.posts.push({ channel, text: message.text, blocks: message.blocks, ts: posted, tag: message.metadata.event_type, payload: message.metadata.event_payload });
        return { ok: true, ts: posted };
      },
      async edit(_channel, ts, message) {
        w.edits.push({ ts, message });
      },
      withdraw: withdraw(w),
      async remove(_channel, ts, ids) {
        w.removed.push(ts);
        for (const id of ids) await w.threadState.retireProposal(`${ts}#${id}`);
      },
      async findPosted(channel, cardKey) {
        const hit = w.posts.find((p) => p.channel === channel && p.payload.card_key === cardKey && !w.removed.includes(p.ts));
        return hit ? { ts: hit.ts, digest: hit.payload.digest ?? "" } : null;
      },
    },
    reports: w.threadState,
    async stage(proposal) {
      w.staged.push(proposal);
      await stageSweepCard(proposal, { threadState: w.threadState, proposalEvents: w.events }, now, "dm");
    },
    liveCards: (channel) => w.threadState.getProposalsByChannel(channel),
    cardState: (proposalTs) => sweepCardState(proposalTs, { threadState: w.threadState, proposalEvents: w.events }),
    ...over,
  };
}

async function turnOn(w: World, user: string, features: DmWatchFeature[], now = ON_AT) {
  return (
    await setDmWatch(user, features, {
      records: w.records,
      access: (u) => accessOf(u, ownerSlack(w)),
      now: () => now,
      dropCapture: (u) =>
        dropDmCapture(u, {
          queue: common(w, now).queue,
          liveCards: (channel) => w.threadState.getProposalsByChannel(channel),
          withdraw: withdraw(w),
        }),
    })
  ).on;
}

/** Maya's live cards in her DM with uno-bot. */
const liveIn = (w: World) => w.threadState.getProposalsByChannel(`D-UNO-${MAYA}`);

interface Card {
  type: "card";
  title: { text: string };
  subtitle?: { text: string };
  body: { text: string };
  actions: Array<{ text: { text: string }; action_id?: string; url?: string }>;
}

/** A message's cards: one `card`, or a carousel's. */
function cardsIn(blocks: unknown[]): Card[] {
  return (blocks as Array<{ type: string; elements?: Card[] }>).flatMap((b) =>
    b.type === "card" ? [b as unknown as Card] : b.type === "carousel" ? (b.elements ?? []) : [],
  );
}

/** Words of the old gate, which a decision card never carries. */
const GATE_WORDS = /✅|⛔|:white_check_mark:|:no_entry:|\bdrop \d|`drop|reply `|One ✅/;

/** `n` findings like the first queued one, each on a block of its own. */
function moreFindings(w: World, n: number): DmCaptureFinding[] {
  const first = w.kv.get(MAYA)![0]!;
  return Array.from({ length: n }, (_, i) => ({
    ...first,
    id: `${DM_BEA}:extra-${i + 1}`,
    blockId: `extra-${i + 1}`,
    driftAt: first.driftAt + i + 1,
  }));
}

describe("the switch", () => {
  it("is a third Home-tab checkbox, off by default, with its own words", () => {
    assert.equal(DM_WATCH_LABELS[CAPTURE_FEATURE], "Catch decisions from my DMs");
    const text = JSON.stringify(dmWatchHomeBlocks([]));
    assert.ok(text.includes("Catch decisions from my DMs"));
    assert.ok(!text.includes("initial_options"), "nothing is ticked until the person ticks it");
  });

  it("off: no DM is read, and nothing is queued", async () => {
    const w = world();
    await turnOn(w, MAYA, ["promises_made"]);
    w.calls.length = 0;
    const report = await runDmCaptureRead(readJob(MAYA), readDeps(w));
    assert.equal(report.outcome, "skipped");
    assert.deepEqual(w.calls, []);
    assert.deepEqual([...w.kv.keys()], []);
  });

  it("no token of their own: it stays off, and a switch left on reads nothing", async () => {
    const w = world();
    w.tokens.delete(MAYA);
    assert.deepEqual(await turnOn(w, MAYA, [CAPTURE_FEATURE]), []);
    await w.records.setSwitch(MAYA, CAPTURE_FEATURE, true, { now: ON_AT, readThrough: (ON_AT / 1000).toFixed(6) });
    const report = await runDmCaptureRead(readJob(MAYA), readDeps(w));
    assert.equal(report.outcome, "skipped");
    assert.deepEqual(w.calls, []);
    assert.deepEqual(w.logs, [`[dm-watch] ${MAYA}: no connected token, job skipped`]);
    assert.deepEqual(w.detected, []);
  });

  it("plans its two jobs only for the people who turned it on", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await turnOn(w, KAI, ["promises_made"]);
    const capturers = await w.records.watchers([CAPTURE_FEATURE]);
    const promisers = await w.records.watchers(["promises_made", "promises_to_me"]);
    const eod = planRun("end-of-day", EOD, [], undefined, promisers, capturers).jobs.filter((j) => j.user);
    assert.deepEqual(eod.map((j) => j.key), [`dm-promise-read:${KAI}`, `dm-capture-read:${MAYA}`]);
    const morning = planRun("morning", WED, [], undefined, promisers, capturers).jobs.filter((j) => j.user);
    assert.deepEqual(morning.map((j) => j.key), [`dm-promise-nudge:${KAI}`, `dm-capture-post:${MAYA}`]);
  });

  it("turning it off withdraws a live card — Review can no longer decide it — and drops what it found", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    await runDmCapturePost(postJob(MAYA), postDeps(w));
    assert.equal((await liveIn(w)).length, 1);
    await turnOn(w, MAYA, [], at(30, 15));
    const id = `${DM_BEA}:${PAGE.blocks[0]!.id}`;
    assert.deepEqual(w.withdrawn, [{ ts: w.posts[0]!.ts, ids: [id], text: DM_CARD_SWITCHED_OFF }]);
    assert.deepEqual(await liveIn(w), []);
    assert.equal(w.kv.has(MAYA), false);
    // The card says why, with nothing left to review.
    const entry = (await w.threadState.getReport(w.posts[0]!.ts))?.entries[0];
    assert.deepEqual(entry?.state, { kind: "not-staged", note: DM_CARD_SWITCHED_OFF });
  });

  it("turning it off still withdraws a card posted before the shared card", async () => {
    const w = world();
    w.kv.set(MAYA, [{ ...({} as DmCaptureFinding), id: "x", state: "proposed", cardChannel: "D-UNO", proposalTs: "1.1" }]);
    const legacy = { sweepRun: "2026-09-30", proposalTs: "1.1", threadTs: "1.1", replyTs: "1.1" } as PendingProposal;
    await dropDmCapture(MAYA, { queue: common(w, WED).queue, liveCards: async () => [legacy], withdraw: withdraw(w) });
    assert.deepEqual(w.withdrawn, [{ ts: "1.1", ids: null, text: DM_CARD_SWITCHED_OFF }]);
  });

  it("turned off mid-read: nothing of the run is kept", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    w.onDetect = () => w.records.setSwitch(MAYA, CAPTURE_FEATURE, false, { now: EOD, readThrough: "0" });
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    assert.equal(w.kv.has(MAYA), false);
    assert.deepEqual(await w.records.positions(positionScope(MAYA, CAPTURE_FEATURE)), {});
  });

  it("turned off while the card posts: the card is withdrawn and nothing is kept", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    const deps = postDeps(w);
    const stage = deps.stage;
    const report = await runDmCapturePost(postJob(MAYA), {
      ...deps,
      async stage(p) {
        await stage(p);
        await w.records.setSwitch(MAYA, CAPTURE_FEATURE, false, { now: WED, readThrough: "0" });
      },
    });
    assert.equal(report.outcome, "skipped");
    assert.deepEqual(w.withdrawn.map((x) => [x.ts, x.text]), [[w.posts[0]!.ts, DM_CARD_SWITCHED_OFF]]);
    assert.deepEqual(await liveIn(w), []);
    assert.equal(w.kv.has(MAYA), false);
  });
});

describe("a DM finding", () => {
  it("is kept as a permalink, a target and a state — no quote, no id of the other person, no message text", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    const report = await runDmCaptureRead(readJob(MAYA), readDeps(w));
    assert.equal(report.outcome, "handled");
    assert.deepEqual(w.detected.map((d) => d.channel), [DM_BEA], "uno-bot's own DM is never read");
    const queued = w.kv.get(MAYA) ?? [];
    assert.equal(queued.length, 1);
    const f = queued[0]!;
    assert.equal(f.permalink, `https://plus.slack.com/archives/${DM_BEA}/p${DECIDED.replace(".", "")}`);
    assert.equal(f.target.url, PAGE.url);
    assert.equal(f.blockId, PAGE.blocks[0]!.id);
    assert.equal(f.state, "queued");
    const stored = JSON.stringify(queued);
    assert.ok(!stored.includes(BEA), "no id of the other person");
    assert.ok(!stored.includes("Launch moved to"), "no summary of the DM");
    // No field repeats five of the DM's words in a row.
    const dm = dmMessages().map((m) => m.text ?? "");
    for (const text of [f.replacement, f.sourceSays, f.original]) assert.ok(!quotesDm(text, f.original, dm), text);
    // Its own read positions, beside the promise jobs' (which stay unread).
    assert.deepEqual(Object.keys(await w.records.positions(positionScope(MAYA, CAPTURE_FEATURE))), [DM_BEA]);
    assert.deepEqual(await w.records.positions(MAYA), {});
    assert.deepEqual(w.records.rows(), [], "no promise row");
  });

  it("an edit that quotes the DM is dropped", async () => {
    const w = world();
    w.quoting = true;
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    assert.equal(w.kv.has(MAYA), false);
    assert.ok(quotesDm(`Launch date: ${SECRET}`, PAGE.blocks[0]!.text, [SECRET]));
    // The page's own words, repeated in the DM, are the page's, not a quote.
    assert.ok(!quotesDm("Launch date: October 15 for everyone", "Launch date: October 15 for everyone", ["launch date october 15 for everyone"]));
  });

  it("reaches only the owner's DM with uno-bot, on a card only the owner can confirm", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    const report = await runDmCapturePost(postJob(MAYA), postDeps(w));
    assert.equal(report.outcome, "handled");

    assert.deepEqual(w.posts.map((p) => p.channel), [`D-UNO-${MAYA}`]);
    const card = w.posts[0]!;
    const whole = JSON.stringify([card.text, card.blocks]);
    assert.ok(!whole.includes("keep it between us"), "never quoted");
    assert.ok(!whole.includes(BEA), "the other person is never named or mentioned");
    assert.ok(!card.text.includes("<!channel>"), "a page title pings nobody");
    assert.equal(card.tag, "uno_sweep_card", "tagged, so the DM's own reads take it as uno-bot's post");

    assert.equal(w.staged.length, 1);
    const staged = w.staged[0]!;
    assert.equal(staged.channel, `D-UNO-${MAYA}`);
    assert.deepEqual(staged.confirmers, [MAYA]);
    assert.ok(mayConfirm(staged, MAYA));
    assert.ok(!mayConfirm(staged, BEA), "the other person in the DM cannot confirm");
    assert.ok(!mayConfirm(staged, KAI));
    // One item of the report: its own proposal, keyed by the message and its id.
    const id = `${DM_BEA}:${PAGE.blocks[0]!.id}`;
    assert.deepEqual(staged.item, { messageTs: card.ts, id });
    assert.equal((await w.threadState.getProposalByTs(`${card.ts}#${id}`)).state, "found");
    assert.deepEqual(staged.operations, [
      {
        toolName: "notion_update",
        input: { page_url: PAGE.url, replace: [{ block_id: PAGE.blocks[0]!.id, last_edited_time: PAGE.blocks[0]!.lastEditedTime, content: "Launch date: November 1" }] },
      },
    ]);
    // The usage record's staged row names no channel: it is a DM.
    const events = w.events.events();
    assert.deepEqual(events.map((e) => [e.event, e.channelId]), [["staged", null]]);
    assert.equal(w.kv.get(MAYA)?.[0]?.state, "proposed");
  });

  it("posts as the shared card: a parent line, then the page with Review, Open page and Open DM", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    await runDmCapturePost(postJob(MAYA), postDeps(w));
    const post = w.posts[0]!;
    const id = `${DM_BEA}:${PAGE.blocks[0]!.id}`;
    assert.ok(
      post.text.startsWith(`Your DMs settled something that <${PAGE.url}|Launch plan &lt;!channel&gt;> still states the old way.`),
      post.text,
    );
    const cards = cardsIn(post.blocks);
    assert.equal(cards.length, 1);
    const [card] = cards;
    assert.equal(card!.title.text, "Launch plan !channel");
    assert.equal(card!.subtitle?.text, "Your DM · Sep 29");
    assert.equal(card!.body.text, "Page says “Launch date: October 15” · decision says “Launch date: November 1”");
    assert.deepEqual(
      card!.actions.map((a) => [a.text.text, a.action_id ?? a.url]),
      [
        ["Review", `${DECISION_REVIEW_ACTION_PREFIX}${id}`],
        ["Open page", PAGE.url],
        ["Open DM", `https://plus.slack.com/archives/${DM_BEA}/p${DECIDED.replace(".", "")}`],
      ],
    );
  });

  it("says nothing of the old gate: no ✅, ⛔ or `drop N`, on the card or in Review", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    await runDmCapturePost(postJob(MAYA), postDeps(w));
    const post = w.posts[0]!;
    assert.doesNotMatch(JSON.stringify([post.text, post.blocks]), GATE_WORDS);
    assert.doesNotMatch(w.staged[0]!.proposalText, GATE_WORDS);
  });

  it("Review shows the drafted change: the page, what it says, the edit, and a link to the DM — never its words", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    await runDmCapturePost(postJob(MAYA), postDeps(w));
    const text = w.staged[0]!.proposalText;
    assert.ok(text.includes(`<${PAGE.url}|Launch plan &lt;!channel&gt;>`), text);
    assert.ok(text.includes("Launch is October 15."), "what the page says");
    assert.ok(text.includes("“Launch date: October 15” → “Launch date: November 1”"), "the edit");
    assert.ok(text.includes(`archives/${DM_BEA}/p`), "the DM, linked");
    assert.ok(!text.includes("keep it between us"), "never quoted");
  });

  it("a card that does not stage says so, with nothing to review, and its fix waits for the next card", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    await runDmCapturePost(postJob(MAYA), postDeps(w, WED, { stage: async () => { throw new Error("Durable Object reset"); } }));
    assert.equal(w.edits.length, 1);
    const [card] = cardsIn(w.edits[0]!.message.blocks);
    assert.equal(card!.subtitle?.text, DM_CARD_NOT_STAGED);
    assert.deepEqual(card!.actions.map((a) => a.text.text), ["Open page", "Open DM"]);
    assert.equal(w.kv.get(MAYA)?.[0]?.state, "queued");
  });

  it(`shows at most ${MAX_REPORT_ITEMS} cards; the parent counts the rest, which wait for the next card`, async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    w.kv.set(MAYA, [...w.kv.get(MAYA)!, ...moreFindings(w, MAX_REPORT_ITEMS)]);
    await runDmCapturePost(postJob(MAYA), postDeps(w));
    const post = w.posts[0]!;
    assert.equal(cardsIn(post.blocks).length, MAX_REPORT_ITEMS);
    assert.ok(post.text.includes(`Showing ${MAX_REPORT_ITEMS} of ${MAX_REPORT_ITEMS + 1}`), post.text);
    assert.equal(w.staged.length, MAX_REPORT_ITEMS);
    assert.deepEqual(
      w.kv.get(MAYA)?.map((f) => f.state),
      [...Array<string>(MAX_REPORT_ITEMS).fill("proposed"), "queued"],
    );
  });

  it("waits while a card is live, and a carded fix is not offered again", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    await runDmCapturePost(postJob(MAYA), postDeps(w));
    const card = w.staged[0]!;
    // A new decision the next day, and the same fix said again.
    w.messages.get(DM_BEA)!.push(
      { ts: ts(30, 16), user: BEA, text: `and the owner is now Kai ${PAGE.url}` },
      { ts: ts(30, 16, 5), user: BEA, text: "reminder: November 1 it is" },
    );
    await runDmCaptureRead(readJob(MAYA), readDeps(w, at(30, 22)));
    const queued = w.kv.get(MAYA) ?? [];
    assert.deepEqual(queued.map((f) => [f.blockId, f.state]), [
      [PAGE.blocks[0]!.id, "proposed"],
      [PAGE.blocks[1]!.id, "queued"],
    ]);
    const report = await runDmCapturePost(postJob(MAYA), postDeps(w, THU));
    assert.match(report.summary, /still live/);
    assert.equal(w.posts.length, 1);
    // Once it is decided, the new fix gets its card.
    await w.threadState.retireProposal(card.proposalTs);
    await runDmCapturePost(postJob(MAYA), postDeps(w, at(32, 13)));
    assert.equal(w.posts.length, 2);
  });

  it("several fixes: a carousel, each fix its own proposal with its own one write", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    w.messages.get(DM_BEA)!.push({ ts: ts(29, 17, 5), user: BEA, text: `and the owner is now Kai ${PAGE.url}` });
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    await runDmCapturePost(postJob(MAYA), postDeps(w));
    const post = w.posts[0]!;
    assert.ok(post.text.startsWith("Your DMs settled 2 things your pages don't say yet."), post.text);
    assert.equal((post.blocks as Array<{ type: string }>).at(-1)?.type, "carousel");
    assert.deepEqual(
      cardsIn(post.blocks).map((c) => c.body.text),
      ["Page says “Launch date: October 15” · decision says “Launch date: November 1”", "Page says “Owner: design team” · decision says “Owner: Kai”"],
    );
    assert.deepEqual(w.staged.map((p) => p.operations?.length), [1, 1]);
    assert.deepEqual(w.kv.get(MAYA)?.map((f) => f.state), ["proposed", "proposed"]);
  });

  it("never appears in a channel card, a few-shot block or another person's job", async () => {
    const w = world();
    const commitments = createInMemoryCommitmentStore();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await turnOn(w, KAI, [CAPTURE_FEATURE]);
    // Kai's job first, then Maya's, then both mornings.
    await runDmCaptureRead(readJob(KAI), readDeps(w));
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    assert.deepEqual([...w.kv.keys()], [MAYA], "only the owner's queue holds it");
    assert.ok(!w.calls.some((c) => c.startsWith(`${KAI} history:${DM_BEA}`)), "Kai's token never reads Maya's DM");
    const kai = await runDmCapturePost(postJob(KAI), postDeps(w));
    assert.equal(kai.summary, "nothing due");
    await runDmCapturePost(postJob(MAYA), postDeps(w));
    // One post, in Maya's DM with uno-bot — no channel, no thread, no #uno-bot.
    assert.deepEqual(w.posts.map((p) => p.channel), [`D-UNO-${MAYA}`]);
    assert.ok(w.staged.every((p) => p.channel.startsWith("D-UNO-") && p.threadTs === p.item?.messageTs));
    // The thread commitment store — where the detector's few-shot examples
    // come from — holds nothing of it, and gives no example for either DM.
    assert.equal(commitments.rows.size, 0);
    assert.equal(commitments.texts.size, 0);
    const examples = fewShotExamples({ store: commitments, config: {} as never });
    assert.deepEqual(await examples(DM_BEA), []);
    assert.deepEqual(await examples(`D-UNO-${MAYA}`), []);
    assert.deepEqual(w.records.rows(), [], "nor a DM promise row");
  });
});

describe("the morning post", () => {
  it("a budget stop after the post deletes the card before rethrowing; the retry posts afresh", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    await assert.rejects(
      runDmCapturePost(postJob(MAYA), postDeps(w, WED, { stage: async () => { throw new SubrequestBudgetError(1); } })),
      SubrequestBudgetError,
    );
    assert.deepEqual(w.removed, [w.posts[0]!.ts]);
    assert.equal(w.kv.get(MAYA)?.[0]?.state, "queued");
    await runDmCapturePost(postJob(MAYA), postDeps(w, WED + 60_000));
    assert.equal(w.posts.length, 2);
    assert.equal((await liveIn(w)).length, 1);
    assert.equal(w.kv.get(MAYA)?.[0]?.proposalTs, w.posts[1]!.ts);
  });

  it("a card an earlier try left up unstaged is found by its tag and staged as it is", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    const first = postDeps(w);
    await assert.rejects(
      runDmCapturePost(postJob(MAYA), {
        ...first,
        bot: { ...first.bot, remove: async () => { throw new SubrequestBudgetError(1); } },
        stage: async () => { throw new SubrequestBudgetError(1); },
      }),
      SubrequestBudgetError,
    );
    assert.equal(w.posts.length, 1);
    await runDmCapturePost(postJob(MAYA), postDeps(w, WED + 60_000));
    assert.equal(w.posts.length, 1, "no second card");
    assert.deepEqual(w.staged.map((p) => p.item?.messageTs), [w.posts[0]!.ts]);
    assert.equal(w.kv.get(MAYA)?.[0]?.state, "proposed");
  });
});

describe("the morning post, retried", () => {
  it("a card the owner approved after the earlier try staged it is recorded, never staged again or deleted", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    const first = postDeps(w);
    // Staged, then the queue's record of it fails.
    await assert.rejects(
      runDmCapturePost(postJob(MAYA), { ...first, queue: { ...first.queue, save: async () => { throw new SubrequestBudgetError(1); } } }),
      SubrequestBudgetError,
    );
    const card = w.posts[0]!.ts;
    // Maya approves it in Review: its proposal is claimed.
    assert.equal(await w.threadState.claimProposal(w.staged[0]!.proposalTs), true);
    await runDmCapturePost(postJob(MAYA), postDeps(w, WED + 60_000));
    assert.equal(w.staged.length, 1, "not staged again");
    assert.deepEqual(w.removed, [], "not deleted");
    assert.equal(w.posts.length, 1);
    assert.deepEqual(w.kv.get(MAYA)?.map((f) => [f.state, f.proposalTs]), [["proposed", card]]);
  });

  it("turning the switch off still drops the queue when a card will not withdraw", async () => {
    const w = world();
    w.kv.set(MAYA, [{ ...({} as DmCaptureFinding), id: "x", state: "proposed", cardChannel: "D-UNO", proposalTs: "1.1" }]);
    await dropDmCapture(MAYA, {
      queue: common(w, WED).queue,
      liveCards: async () => [{ sweepRun: "2026-09-30", proposalTs: "1.1", threadTs: "1.1", replyTs: "1.1" } as PendingProposal],
      withdraw: async () => {
        throw new Error("Slack said no");
      },
    });
    assert.equal(w.kv.has(MAYA), false);
  });
});

describe("a fix on the card, held to the sweep's rules", () => {
  /** Maya's fix, posted and staged on Wednesday morning. */
  async function postedFix() {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    await runDmCapturePost(postJob(MAYA), postDeps(w));
    return { w, fix: w.staged[0]! };
  }

  it("is a sweep card with its own slot: no fix on the card replaces another", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    w.messages.get(DM_BEA)!.push({ ts: ts(29, 17, 5), user: BEA, text: `and the owner is now Kai ${PAGE.url}` });
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    await runDmCapturePost(postJob(MAYA), postDeps(w));
    assert.deepEqual(w.staged.map((p) => p.sweepRun), ["2026-09-30", "2026-09-30"]);
    assert.equal(new Set(w.staged.map((p) => p.supersedeKey)).size, 2);
    assert.equal((await liveIn(w)).length, 2, "both stay live");
  });

  it("a Needs changes revision that adds a write past the drafted edit is refused, and the fix stays", async () => {
    const { w, fix } = await postedFix();
    const extra = {
      page_url: PAGE.url,
      replace: [{ block_id: PAGE.blocks[1]!.id, last_edited_time: PAGE.blocks[1]!.lastEditedTime, content: "Owner: Bea" }],
    };
    const h = harness({
      replies: [{ text: "Revised.", toolCalls: [{ name: "notion_update", args: { ...(fix.input as object), replace: [...(fix.input.replace as unknown[]), ...extra.replace] } }] }],
    });
    await h.threadState.putProposal(fix);
    const outcome = await runTurn(request({ text: "also make Bea the owner", pending: fix, userId: MAYA, channel: fix.channel }), h.deps);
    assert.equal(outcome.disposition, "asked");
    assert.equal((await h.threadState.getProposalByTs(fix.proposalTs)).state, "found");
    assert.equal(w.staged.length, 1);
  });

  it("a typed `drop 1` under the card decides nothing: the fix is decided in Review", async () => {
    const { fix } = await postedFix();
    const h = harness({ replies: [{ text: "Press Review on the card to decide it." }] });
    await h.threadState.putProposal(fix);
    const outcome = await runTurn(request({ text: "drop 1", pending: fix, userId: MAYA, channel: fix.channel }), h.deps);
    assert.notEqual(outcome.disposition, "staged");
    assert.equal((await h.threadState.getProposalByTs(fix.proposalTs)).state, "found");
  });

  it("a decided fix posts its result with the sweep's tag, so the DM's reads take it as uno-bot's", async () => {
    const { fix } = await postedFix();
    assert.deepEqual(resultMetadataFor(fix), { metadata: { event_type: "uno_sweep_card", event_payload: { role: "result" } } });
  });
});

describe("the morning post, when Slack or the run falls short", () => {
  it("cards Slack refuses step down to plain text, with a Review per fix", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    const deps = postDeps(w);
    await runDmCapturePost(postJob(MAYA), {
      ...deps,
      bot: {
        ...deps.bot,
        async post(channel, message) {
          if (cardsIn(message.blocks).length) return { ok: false, refused: true };
          return deps.bot.post(channel, message);
        },
      },
    });
    assert.equal(w.posts.length, 1);
    const blocks = JSON.stringify(w.posts[0]!.blocks);
    const id = `${DM_BEA}:${PAGE.blocks[0]!.id}`;
    assert.ok(blocks.includes(`${DECISION_REVIEW_ACTION_PREFIX}${id}`), "Review still opens the fix");
    assert.ok(blocks.includes(`archives/${DM_BEA}/p`), "the DM, linked");
    assert.doesNotMatch(blocks, GATE_WORDS);
    assert.equal(w.staged.length, 1);
    assert.equal(w.kv.get(MAYA)?.[0]?.state, "proposed");
  });

  it("turned off when every fix failed to stage: each card says it was withdrawn", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    const report = await runDmCapturePost(postJob(MAYA), postDeps(w, WED, {
      async stage() {
        await w.records.setSwitch(MAYA, CAPTURE_FEATURE, false, { now: WED, readThrough: "0" });
        throw new Error("Durable Object reset");
      },
    }));
    assert.equal(report.outcome, "skipped");
    const [card] = cardsIn(w.edits.at(-1)!.message.blocks);
    assert.equal(card!.subtitle?.text, DM_CARD_SWITCHED_OFF);
    assert.deepEqual(card!.actions.map((a) => a.text.text), ["Open page", "Open DM"]);
    assert.equal(w.kv.has(MAYA), false);
  });

  it("a budget stop partway marks the cards it never staged, so no Review is left without a fix behind it", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    w.messages.get(DM_BEA)!.push({ ts: ts(29, 17, 5), user: BEA, text: `and the owner is now Kai ${PAGE.url}` });
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    const deps = postDeps(w);
    await assert.rejects(
      runDmCapturePost(postJob(MAYA), {
        ...deps,
        async stage(p) {
          if (w.staged.length) throw new SubrequestBudgetError(1);
          await deps.stage(p);
        },
      }),
      SubrequestBudgetError,
    );
    assert.deepEqual(w.removed, [], "the staged fix stays up");
    const cards = cardsIn(w.edits.at(-1)!.message.blocks);
    assert.deepEqual(cards.map((c) => c.actions[0]!.text.text), ["Review", "Open page"]);
    assert.equal(cards[1]!.subtitle?.text, DM_CARD_NOT_STAGED);
    assert.deepEqual(w.kv.get(MAYA)?.map((f) => f.state), ["proposed", "queued"]);
  });
});

describe("reading", () => {
  it("keeps its own positions: a promise read the same night leaves the DM unread for Capture", async () => {
    const w = world();
    await turnOn(w, MAYA, ["promises_made", CAPTURE_FEATURE]);
    await runDmPromiseRead({ key: `dm-promise-read:${MAYA}`, kind: "dm-promise-read", user: MAYA }, {
      ...readDeps(w),
      detector: { detect: async () => ({ ok: true, commitments: [] }) },
    });
    assert.deepEqual(Object.keys(await w.records.positions(MAYA)), [DM_BEA]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    assert.equal(w.kv.get(MAYA)?.length, 1, "Capture still read the messages the promise job had read");
  });

  it("a linked page that fails to read holds the DM there; the next night finds the decision", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    w.broken.set(PAGE.url, 503);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    assert.equal(w.kv.has(MAYA), false);
    assert.deepEqual(await w.records.positions(positionScope(MAYA, CAPTURE_FEATURE)), {}, "not read past the window");
    w.broken.clear();
    await runDmCaptureRead(readJob(MAYA), readDeps(w, at(30, 22)));
    assert.equal(w.kv.get(MAYA)?.length, 1);
  });

  it("a page the integration cannot open (a 404) is set aside at once: the DM is not held, and its decisions are found", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    const unshared = "https://www.notion.so/0badbeef0badbeef0badbeef0badbeef";
    w.broken.set(unshared, 404);
    w.messages.get(DM_BEA)!.unshift({ ts: ts(29, 16, 50), user: BEA, text: `old notes ${unshared}` });
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    assert.equal(w.kv.get(MAYA)?.length, 1, "the decision on the page it can open is found");
    assert.ok(Number((await w.records.positions(positionScope(MAYA, CAPTURE_FEATURE)))[DM_BEA]?.through) >= Number(DECIDED), "read through");
    assert.deepEqual(w.holds.get(MAYA) ?? {}, {});
    // A later decision in the same DM, still beside the unopenable link.
    w.messages.get(DM_BEA)!.push({ ts: ts(30, 16), user: BEA, text: `and the owner is now Kai ${PAGE.url} ${unshared}` });
    await runDmCaptureRead(readJob(MAYA), readDeps(w, at(30, 22)));
    assert.deepEqual(w.kv.get(MAYA)?.map((f) => f.blockId), [PAGE.blocks[0]!.id, PAGE.blocks[1]!.id]);
  });

  it(`a page that keeps failing (a 503) holds the DM for ${MAX_FAILED_NIGHTS} nights at most, then is set aside`, async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    w.broken.set(PAGE.url, 503);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    // A retry the same night counts no second night.
    await runDmCaptureRead(readJob(MAYA), readDeps(w, EOD + 60_000));
    assert.deepEqual(w.holds.get(MAYA), { [DM_BEA]: { nights: 1, runDate: "2026-09-29" } });
    assert.deepEqual(await w.records.positions(positionScope(MAYA, CAPTURE_FEATURE)), {}, "held");
    await runDmCaptureRead(readJob(MAYA), readDeps(w, at(30, 22)));
    assert.ok(Number((await w.records.positions(positionScope(MAYA, CAPTURE_FEATURE)))[DM_BEA]?.through) >= Number(DECIDED), "released: read on");
    assert.deepEqual(w.holds.get(MAYA) ?? {}, {});
    assert.ok(w.logs.some((l) => l.includes("set aside")));
  });

  it("a page named without a link is searched for in Notion only — the DM's words never reach GitHub", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    w.messages.set(DM_BEA, [{ ts: DECIDED, user: BEA, text: "the booking flow PRD should say November 1 now" }]);
    const searched: string[] = [];
    const search: SourceSearch = {
      notion: async (q) => (searched.push(`notion:${q}`), []),
      github: async (q) => (searched.push(`github:${q}`), []),
    };
    await runDmCaptureRead(readJob(MAYA), { ...readDeps(w), search });
    assert.ok(searched.some((s) => s.startsWith("notion:")), "the name was searched for");
    assert.deepEqual(searched.filter((s) => s.startsWith("github:")), []);
  });

  it("a budget stop keeps what was done and the night's stopping point; the retry finishes", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    w.windows = 0;
    await assert.rejects(runDmCaptureRead(readJob(MAYA), readDeps(w)), SubrequestBudgetError);
    assert.equal(w.kv.has(MAYA), false);
    assert.equal(w.progress.size, 1, "tonight's stopping point is kept for the retry");
    w.windows = Infinity;
    await runDmCaptureRead(readJob(MAYA), readDeps(w, EOD + 60_000));
    assert.equal(w.kv.get(MAYA)?.length, 1);
    assert.equal(w.progress.size, 0);
  });

  it("a budget stop mid-DM keeps the window done, and the retry reads on from it", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    const filler = (i: number) => `${"status notes ".repeat(95)}#${i}`;
    const long: SweepSlackMessage[] = [
      { ts: ts(29, 16, 0), user: BEA, text: `launch is November 1 now ${PAGE.url} ${filler(0)}` },
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ ts: ts(29, 16, i), user: i % 2 ? MAYA : BEA, text: filler(i) })),
      { ts: ts(29, 16, 9), user: BEA, text: `and the owner is now Kai ${PAGE.url}` },
    ];
    w.messages.set(DM_BEA, long);
    w.windows = 1;
    await assert.rejects(runDmCaptureRead(readJob(MAYA), readDeps(w)), SubrequestBudgetError);
    assert.deepEqual(w.kv.get(MAYA)?.map((f) => f.blockId), [PAGE.blocks[0]!.id], "the first window's finding is kept");
    const through = (await w.records.positions(positionScope(MAYA, CAPTURE_FEATURE)))[DM_BEA]?.through;
    assert.ok(through && Number(through) > Number(long[0]!.ts) && Number(through) < Number(long.at(-1)!.ts), "the position is past the first window only");
    const seen = w.detected.length;
    w.windows = Infinity;
    await runDmCaptureRead(readJob(MAYA), readDeps(w, EOD + 60_000));
    assert.deepEqual(w.kv.get(MAYA)?.map((f) => f.blockId), [PAGE.blocks[0]!.id, PAGE.blocks[1]!.id]);
    assert.equal(w.detected.length, seen + 1, "only the window not yet read");
    assert.ok(Number(w.detected.at(-1)!.firstTs) > Number(long[0]!.ts), "the first window is not read again");
  });
});
