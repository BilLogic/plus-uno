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
import { proposalCardBlocks, renderProposalCard } from "../src/slack/proposal-render";
import { stageSweepCard } from "../src/sweep/run";
import type { DriftDetector } from "../src/sweep/detector";
import type { CaptureDetector } from "../src/sweep/capture-detector";
import type { SweepSlackMessage } from "../src/sweep/run";
import type { SweepSource } from "../src/sweep/finding";
import { createInMemoryThreadState, mayConfirm, type PendingProposal } from "../src/thread-state/index";
import { createInMemoryProposalEventLog } from "../src/usage/index";
import {
  accessOf,
  CAPTURE_FEATURE,
  createInMemoryDmWatchRecords,
  DM_WATCH_LABELS,
  dmWatchHomeBlocks,
  positionScope,
  runDmCapturePost,
  runDmCaptureRead,
  runDmPromiseRead,
  setDmWatch,
  type DmCaptureFinding,
  type DmCapturePostDeps,
  type DmCaptureReadDeps,
  type DmWatchFeature,
  type InMemoryDmWatchRecords,
  type OwnerSlack,
} from "../src/dm-watch/index";
import { at, BOT, notionPage, ts } from "./helpers/sweep-harness";

const MAYA = "U0MAYA";
const BEA = "U0BEA";
const KAI = "U0KAI";
const DM_BEA = "D0BEA";
const URL = "https://plus.slack.com/";
const ON_AT = at(28, 15);
const EOD = at(29, 22);
const WED = at(30, 14);
const THU = at(31, 14);
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

interface World {
  records: InMemoryDmWatchRecords;
  tokens: Set<string>;
  calls: string[];
  messages: Map<string, SweepSlackMessage[]>;
  kv: Map<string, DmCaptureFinding[]>;
  progress: Map<string, { latest: string }>;
  logs: string[];
  posts: { channel: string; text: string; ts: string }[];
  staged: PendingProposal[];
  threadState: ReturnType<typeof createInMemoryThreadState>;
  events: ReturnType<typeof createInMemoryProposalEventLog>;
  detected: { channelKind: string; channel: string }[];
  headroom: { subrequests: number; d1Queries: number };
}

function world(): World {
  return {
    records: createInMemoryDmWatchRecords(),
    tokens: new Set([MAYA, KAI]),
    calls: [],
    messages: new Map([[DM_BEA, dmMessages()]]),
    kv: new Map(),
    progress: new Map(),
    logs: [],
    posts: [],
    staged: [],
    threadState: createInMemoryThreadState(),
    events: createInMemoryProposalEventLog(),
    detected: [],
    headroom: { subrequests: Infinity, d1Queries: Infinity },
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

/** Drift whenever a window links the page and says "November". */
function detector(w: World): DriftDetector {
  return {
    async detect({ thread, sources }) {
      w.detected.push({ channelKind: thread.channelKind, channel: thread.channel });
      const said = thread.messages.find((m) => m.text.includes("November"));
      const source = sources.find((s) => s.url === PAGE.url);
      if (!said || !source) return { ok: true, findings: [] };
      const block = source.blocks[0]!;
      return {
        ok: true,
        findings: [
          {
            source,
            blockId: block.id,
            lastEditedTime: block.lastEditedTime,
            original: block.text,
            sourceSays: "Launch is October 15.",
            threadSays: "Launch moved to November 1.",
            replacement: "Launch date: November 1",
            evidenceTs: [said.ts],
            claimedBy: said.user,
            confidence: 0.9,
          },
        ],
      };
    },
  };
}

const noAnswers: Pick<CaptureDetector, "answers"> = { answers: async () => ({ ok: true, answers: [] }) };

function common(w: World, now: number) {
  return {
    runDate: new Date(now).toISOString().slice(0, 10),
    records: w.records,
    queue: {
      load: async (owner: string) => (w.kv.get(owner) ?? []).map((f) => ({ ...f })),
      save: async (owner: string, list: DmCaptureFinding[]) => void w.kv.set(owner, list.map((f) => ({ ...f }))),
      clear: async (owner: string) => void w.kv.delete(owner),
    },
    meter: { headroom: () => w.headroom },
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
    sources: { read: async (url) => (url === PAGE.url ? PAGE : null) },
    surfaces: {},
    detector: detector(w),
    capture: noAnswers,
  };
}

function postDeps(w: World, now = WED): DmCapturePostDeps {
  let n = 0;
  return {
    ...common(w, now),
    bot: {
      dmChannel: async (user) => `D-UNO-${user}`,
      async post(channel, message) {
        n += 1;
        const posted = `${now / 1000}.00000${n}`;
        w.posts.push({ channel, text: message.text, ts: posted });
        return { ok: true, ts: posted };
      },
      withdraw: async () => undefined,
    },
    render(card) {
      const rendered = renderProposalCard(card);
      return { text: rendered.text, blocks: rendered.blocks ?? proposalCardBlocks(rendered.text) };
    },
    async stage(proposal) {
      w.staged.push(proposal);
      await stageSweepCard(proposal, { threadState: w.threadState, proposalEvents: w.events }, now, "dm");
    },
    cardLive: async (proposalTs) => (await w.threadState.getProposalByTs(proposalTs)).state === "found",
  };
}

async function turnOn(w: World, user: string, features: DmWatchFeature[], now = ON_AT) {
  return (
    await setDmWatch(user, features, {
      records: w.records,
      access: (u) => accessOf(u, ownerSlack(w)),
      now: () => now,
      dropCapture: async (u) => void w.kv.delete(u),
    })
  ).on;
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
});

describe("a DM finding", () => {
  it("is kept as a permalink, a target and a state — no quote, no id of the other person, no message text", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    const report = await runDmCaptureRead(readJob(MAYA), readDeps(w));
    assert.equal(report.outcome, "handled");
    assert.deepEqual(w.detected, [{ channelKind: "dm", channel: DM_BEA }], "uno-bot's own DM is never read");
    const queued = w.kv.get(MAYA) ?? [];
    assert.equal(queued.length, 1);
    const f = queued[0]!;
    assert.equal(f.permalink, `https://plus.slack.com/archives/${DM_BEA}/p${DECIDED.replace(".", "")}`);
    assert.equal(f.target.url, PAGE.url);
    assert.equal(f.blockId, PAGE.blocks[0]!.id);
    assert.equal(f.state, "queued");
    const stored = JSON.stringify(queued);
    assert.ok(!stored.includes(BEA), "no id of the other person");
    assert.ok(!stored.includes("November 1, keep it"), "no quote of the DM");
    assert.ok(!stored.includes("Launch moved to"), "no summary of the DM");
    // Its own read positions, beside the promise jobs' (which stay unread).
    assert.deepEqual(Object.keys(await w.records.positions(positionScope(MAYA, CAPTURE_FEATURE))), [DM_BEA]);
    assert.deepEqual(await w.records.positions(MAYA), {});
    assert.deepEqual(w.records.rows(), [], "no promise row");
  });

  it("reaches only the owner's DM with uno-bot, on a card only the owner can confirm", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    const report = await runDmCapturePost(postJob(MAYA), postDeps(w));
    assert.equal(report.outcome, "handled");

    assert.deepEqual(w.posts.map((p) => p.channel), [`D-UNO-${MAYA}`]);
    const card = w.posts[0]!;
    assert.ok(card.text.includes("from your DMs"));
    assert.ok(card.text.includes(`archives/${DM_BEA}/p`), "the DM is linked");
    assert.ok(!card.text.includes("keep it between us"), "never quoted");
    assert.ok(!card.text.includes(BEA), "the other person is never named or mentioned");
    assert.ok(!card.text.includes("<!channel>"), "a page title pings nobody");

    assert.equal(w.staged.length, 1);
    const staged = w.staged[0]!;
    assert.equal(staged.channel, `D-UNO-${MAYA}`);
    assert.deepEqual(staged.confirmers, [MAYA]);
    assert.ok(mayConfirm(staged, MAYA));
    assert.ok(!mayConfirm(staged, BEA), "the other person in the DM cannot confirm");
    assert.ok(!mayConfirm(staged, KAI));
    assert.equal((await w.threadState.getProposalByTs(card.ts)).state, "found");
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

  it("gets one card at a time, and a fix already carded is not offered again", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    await runDmCapturePost(postJob(MAYA), postDeps(w));
    // Bea says it again the next day: the same fix, re-read.
    w.messages.get(DM_BEA)!.push({ ts: ts(30, 16), user: BEA, text: "reminder: November 1 it is" });
    await runDmCaptureRead(readJob(MAYA), readDeps(w, at(30, 22)));
    assert.equal(w.kv.get(MAYA)?.length, 1);
    const report = await runDmCapturePost(postJob(MAYA), postDeps(w, THU));
    assert.match(report.summary, /still live|nothing due/);
    assert.equal(w.posts.length, 1);
  });

  it("never appears in a channel card, a few-shot block or another person's job", async () => {
    const w = world();
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
    assert.ok(w.staged.every((p) => p.channel.startsWith("D-UNO-") && p.threadTs === p.proposalTs));
    // Nothing it read became a promise row, which is where the detector's
    // few-shot examples come from.
    assert.deepEqual(w.records.rows(), []);
  });

  it("turning the switch off drops what it found and where it had read to, and the morning posts nothing", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE, "promises_made"]);
    await runDmCaptureRead(readJob(MAYA), readDeps(w));
    assert.equal(w.kv.get(MAYA)?.length, 1);
    await turnOn(w, MAYA, ["promises_made"], at(30, 9));
    assert.equal(w.kv.has(MAYA), false);
    assert.deepEqual(await w.records.positions(positionScope(MAYA, CAPTURE_FEATURE)), {});
    const report = await runDmCapturePost(postJob(MAYA), postDeps(w));
    assert.equal(report.outcome, "skipped");
    assert.deepEqual(w.posts, []);
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

  it("a budget stop keeps what was done and the night's stopping point; the retry finishes", async () => {
    const w = world();
    await turnOn(w, MAYA, [CAPTURE_FEATURE]);
    w.headroom = { subrequests: 3, d1Queries: 50 };
    await assert.rejects(runDmCaptureRead(readJob(MAYA), readDeps(w)), SubrequestBudgetError);
    assert.equal(w.kv.has(MAYA), false);
    assert.equal(w.progress.size, 1, "tonight's stopping point is kept for the retry");
    w.headroom = { subrequests: Infinity, d1Queries: Infinity };
    await runDmCaptureRead(readJob(MAYA), readDeps(w, EOD + 60_000));
    assert.equal(w.kv.get(MAYA)?.length, 1);
    assert.equal(w.progress.size, 0);
  });
});
