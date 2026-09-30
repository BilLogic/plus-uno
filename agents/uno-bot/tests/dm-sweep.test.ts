// DMs with uno-bot as a source: the end-of-day `sweep-dms` job reads each 1:1
// DM uno-bot answered in, and everything it finds goes back only into that DM
// at the next weekday morning run — a question it could not answer (F6), a
// disagreement it noticed (C6), a decision told to it (C7). The one way out of
// a DM is the ✅ on the raise card, and it posts a reworded note.
//
// Whole days, in memory: the sweep harness's fake Slack and sources, the real
// drift and capture detectors over recorded replies, the real DM hook over a
// recorded DM detector, the in-memory commitment store, and the real morning
// commitment job with the DM handler.
import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import { fakeProvider, type FakeProvider } from "../src/agent/providers/fake";
import {
  answerReminder,
  createInMemoryCommitmentStore,
  runCommitmentNudges,
  type InMemoryCommitmentStore,
  type NudgeDeps,
} from "../src/commitments/index";
import {
  activeDms,
  answerDmAsk,
  DM_ASK_EVENT,
  DM_RAISE_EVENT,
  raiseSlot,
  dmAsksDue,
  dmThreadHook,
  modelDmDetector,
  RAISE_TOOL,
  raiseId,
} from "../src/dm-sweep/index";
import { runSweepJob, shadowedByPrivate, type PendingFinding, type SweepSource } from "../src/sweep/index";
import type { ScheduledJob } from "../src/scheduled/runs";
import type { PendingProposal } from "../src/thread-state/index";
import { renderProposalCard } from "../src/slack/proposal-render";
import { resolveSignal } from "../src/gate/index";
import { SWEEP_CARD_EVENT } from "../src/sweep/cards";
import { at, BOT, DESIGN, msg, notionPage, sweepHarness, ts, UNIVERSAL, type FakeChannel } from "./helpers/sweep-harness";

const DMS: ScheduledJob = { key: "sweep:dms", kind: "sweep-dms" };
const SWEEP_POST: ScheduledJob = { key: "sweep-post", kind: "sweep-post" };
const NUDGE: ScheduledJob = { key: "commitment-nudge", kind: "commitment-nudge" };
const MAYA = "U0MAYA";
const DM = "D0MAYA";
const OLD = "2026-09-01T10:00:00.000Z";

const bot = (when: string, text: string, over: Record<string, unknown> = {}) =>
  msg(BOT, when, text, { bot_id: "B0UNO", ...over });

const dmReply = (o: {
  unanswered?: Array<Record<string, unknown>>;
  disagreements?: Array<Record<string, unknown>>;
  decisions?: Array<Record<string, unknown>>;
}) => JSON.stringify({ unanswered: o.unanswered ?? [], disagreements: o.disagreements ?? [], decisions: o.decisions ?? [] });

/** One DM world: the sweep over a DM channel, the DM hook, and mornings. */
function world(opts: {
  dm: FakeChannel;
  dmReplies: string[];
  sweepReplies?: string[];
  sources?: SweepSource[];
  now: number;
  extraChannels?: Record<string, FakeChannel>;
}) {
  const store = createInMemoryCommitmentStore();
  // Recorded DM detector replies, in call order; a case may add the next
  // night's before running it.
  const dmReplies = [...opts.dmReplies];
  const baseProvider = fakeProvider();
  const dmProvider: FakeProvider = {
    ...baseProvider,
    async generate(prompt) {
      (baseProvider.generated as unknown[]).push(prompt);
      return { ok: true, model: "recorded", text: dmReplies.shift() ?? "" };
    },
  };
  const h = sweepHarness({
    channels: { [DM]: opts.dm, ...(opts.extraChannels ?? {}) },
    sources: opts.sources ?? [],
    detectorReplies: opts.sweepReplies ?? [],
    capture: true,
    now: opts.now,
  });
  h.deps.dms = async () => [{ channel: DM, person: MAYA }];
  h.deps.onDmThread = dmThreadHook({
    detector: modelDmDetector(dmProvider),
    store,
    now: () => h.clock.now,
    get runDate() {
      return new Date(h.clock.now).toISOString().slice(0, 10);
    },
  });

  // Every morning post, anywhere, and what it carried.
  const posts: Array<{ channel: string; threadTs: string; text: string; ts: string; metadata?: unknown }> = [];
  const updates: Array<{ channel: string; ts: string; text: string; blocks: unknown[] }> = [];
  const staged: PendingProposal[] = [];
  let seq = 0;
  const nextTs = () => `${Math.floor(h.clock.now / 1000)}.${String(500000 + ++seq)}`;
  const dm = dmAsksDue({
    store,
    slack: {
      async post(to, message) {
        const posted = { channel: to.channel, threadTs: to.threadTs, text: message.text, ts: nextTs(), metadata: message.metadata };
        posts.push(posted);
        return { ok: true, ts: posted.ts };
      },
      async postCard(to, card, metadata) {
        const text = renderProposalCard(card).text;
        const posted = { channel: to.channel, threadTs: to.threadTs, text, ts: nextTs(), metadata };
        posts.push(posted);
        return { ok: true, ts: posted.ts, text };
      },
    },
    threadState: {
      async putProposal(p) {
        staged.push(p);
        return h.threadState.putProposal(p);
      },
    },
    proposalEvents: h.proposalEvents,
    channels: { plusDesign: DESIGN, plusUniversal: UNIVERSAL, unoBot: "C0UNOBOT" },
  });
  const nudgeDeps: NudgeDeps = {
    slack: {
      replies: async () => assert.fail("a DM ask reads no thread in the morning"),
      history: async () => assert.fail("a DM ask reads no channel in the morning"),
      permalink: async () => null,
      post: async () => assert.fail("a DM row is posted by its own handler"),
      async update(channel, messageTs, message) {
        updates.push({ channel, ts: messageTs, ...message });
        return true;
      },
    },
    sources: { read: async () => null },
    judge: { judge: async () => assert.fail("a DM ask is never judged") },
    store,
    markThread: async () => assert.fail("a DM thread is never marked"),
    config: { unoBot: "C0UNOBOT", botUserId: BOT },
    now: () => h.clock.now,
    get runDate() {
      return new Date(h.clock.now).toISOString().slice(0, 10);
    },
    dm,
  };
  const react = (messageTs: string, glyph: string, userId = MAYA) =>
    answerReminder(
      { channel: DM, messageTs, glyph, userId, messageAuthorId: BOT },
      {
        store,
        dm: answerDmAsk({ store, update: nudgeDeps.slack.update, now: () => h.clock.now }),
        update: nudgeDeps.slack.update,
        botUserId: async () => BOT,
        now: () => h.clock.now,
      },
    );
  return {
    h,
    store,
    dmProvider,
    dmReplies,
    posts,
    updates,
    staged,
    react,
    endOfDay: () => runSweepJob(DMS, h.deps),
    morning: async () => {
      const cards = await runSweepJob(SWEEP_POST, h.deps);
      const asks = await runCommitmentNudges(NUDGE, nudgeDeps);
      return { cards, asks };
    },
    /** Every channel anything was posted in, sweep cards and asks alike. */
    postedIn: () => [...new Set([...h.posted.map((p) => p.channel), ...posts.map((p) => p.channel)])],
  };
}

const rowsOf = (store: InMemoryCommitmentStore) => [...store.rows.values()];

// ── F6 ───────────────────────────────────────────────────────────────────────

describe("F6: a question uno-bot could not answer", () => {
  const root = msg(MAYA, ts(29, 15), "What's the tutor ratio for the spring pilot?", { reply_count: 1, latest_reply: ts(29, 15, 1) });
  const miss = bot(ts(29, 15, 1), "I couldn't find the tutor ratio for the spring pilot in anything I can read.", { thread_ts: root.ts });
  const missed = dmReply({ unanswered: [{ answer_ts: miss.ts, what: "the tutor ratio for the spring pilot", confidence: 0.9 }] });

  it("gets exactly one follow-up, next morning, in that DM thread, and is kept with no text on the record", async () => {
    const w = world({ dm: { kind: "dm", history: [root], threads: { [root.ts]: [root, miss] } }, dmReplies: [missed], now: at(29, 22) });
    const report = await w.endOfDay();
    assert.equal(report.kind, "sweep-dms");
    assert.equal(w.h.reads.some((r) => r.startsWith("info")), false, "a DM's kind is never asked of Slack");
    assert.equal(w.postedIn().length, 0, "the end of day posts nothing");
    const [row] = rowsOf(w.store);
    assert.equal(row!.kind, "dm_unanswered");
    assert.equal(row!.channelKind, "dm", "the record's surface flag");
    assert.equal(row!.promiserId, MAYA);
    assert.equal(JSON.stringify(row).includes("tutor ratio"), false, "no message text on the row");

    w.h.clock.now = at(30, 14, 5); // Wed, 10:05 ET
    await w.morning();
    assert.equal(w.posts.length, 1);
    const ask = w.posts[0]!;
    assert.equal(ask.channel, DM);
    assert.equal(ask.threadTs, root.ts);
    assert.equal(ask.text, "Yesterday I couldn't find the tutor ratio for the spring pilot. Did you get it?");
    assert.deepEqual(ask.metadata, { event_type: DM_ASK_EVENT, event_payload: { id: row!.id } });

    // Unanswered by its next due date (Monday's run), it lapses: asked once.
    for (const day of [31, 32, 35]) {
      w.h.clock.now = at(day, 14, 5);
      await w.morning();
    }
    assert.equal(w.posts.length, 1, "never a second ask");
    assert.equal(w.store.rows.get(row!.id)!.state, "lapsed");
  });

  it("a sourced answer gets none", async () => {
    const sourced = bot(ts(29, 15, 1), "It's 1 tutor to 4 students — the Spring Pilot PRD says so: <https://www.notion.so/aaaa|Spring Pilot PRD>", {
      thread_ts: root.ts,
    });
    const w = world({ dm: { kind: "dm", history: [root], threads: { [root.ts]: [root, sourced] } }, dmReplies: [dmReply({})], now: at(29, 22) });
    await w.endOfDay();
    assert.equal(rowsOf(w.store).length, 0);
    w.h.clock.now = at(30, 14, 5);
    await w.morning();
    assert.equal(w.postedIn().length, 0);
  });

  it("🙅 on the ask drops it, in place and with no new ping", async () => {
    const w = world({ dm: { kind: "dm", history: [root], threads: { [root.ts]: [root, miss] } }, dmReplies: [missed], now: at(29, 22) });
    await w.endOfDay();
    w.h.clock.now = at(30, 14, 5);
    await w.morning();
    const ask = w.posts[0]!;
    assert.equal(await w.react(ask.ts, "white_check_mark"), true, "a ✅ on the ask is the ask's, and does nothing");
    assert.equal(w.updates.length, 0);
    assert.equal(await w.react(ask.ts, "no_good"), true);
    const [row] = rowsOf(w.store);
    assert.equal(row!.state, "dropped");
    assert.equal(w.updates.length, 1);
    assert.equal(w.posts.length, 1);
  });

  it("a reply with the answer and a link stages a placement proposal in that DM", async () => {
    const pilot = notionPage("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", {
      title: "Spring Pilot PRD",
      blocks: [
        { id: "h-staffing", lastEditedTime: OLD, text: "Staffing", type: "heading_2" },
        { id: "b-staffing-1", lastEditedTime: OLD, text: "Tutors are recruited from the fall cohort." },
      ],
    });
    const dm: FakeChannel = { kind: "dm", history: [root], threads: { [root.ts]: [root, miss] } };
    // Tonight's read, then Wednesday night's, which finds nothing new of its kinds.
    const w = world({ dm, dmReplies: [missed, dmReply({})], sources: [pilot], now: at(29, 22) });
    await w.endOfDay();
    w.h.clock.now = at(30, 14, 5);
    await w.morning();
    const ask = w.posts[0]!;
    const [row] = rowsOf(w.store);

    // Wednesday: Maya replies under the ask.
    const askMessage = bot(ask.ts, ask.text, {
      thread_ts: root.ts,
      metadata: { event_type: DM_ASK_EVENT, event_payload: { id: row!.id } },
    });
    const answer = msg(MAYA, ts(30, 16), `Priya says 1 tutor to 4 students, it's for the <${pilot.url}|pilot PRD>`, { thread_ts: root.ts });
    dm.threads![root.ts] = [root, miss, askMessage, answer];
    root.latest_reply = answer.ts;
    w.h.clock.now = at(30, 22);
    w.h.replies.push(
      JSON.stringify({
        answers: [
          {
            question_ts: root.ts,
            answer_ts: [answer.ts],
            answered_by: MAYA,
            documented: false,
            source_url: pilot.url,
            section_block_id: "h-staffing",
            new_section: null,
            text: "The pilot runs at 1 tutor to 4 students.",
            confidence: 0.9,
          },
        ],
      }),
    );
    await w.endOfDay();
    assert.equal(w.store.rows.get(row!.id)!.state, "done", "the ask is answered");

    w.h.clock.now = at(31, 14, 5);
    await w.morning();
    assert.equal(w.h.posted.length, 1, "one placement card");
    const card = w.h.posted[0]!;
    assert.equal(card.channel, DM);
    assert.equal(card.threadTs, root.ts);
    assert.match(card.text, /Spring Pilot PRD/);
    const proposal = w.h.staged[0]!;
    assert.deepEqual(proposal.confirmers, [MAYA], "only the person the DM is with can confirm it");
    const items = await w.h.store.itemsOnCard(w.h.posted[0]!.cardKey);
    assert.deepEqual(items.map((i) => i.surface), ["dm"], "the item carries the DM surface flag");
    assert.deepEqual(w.postedIn(), [DM]);
  });
});

// ── C7 ───────────────────────────────────────────────────────────────────────

describe("C7: a decision told to uno-bot", () => {
  const recap = notionPage("cccccccccccccccccccccccccccccccc", {
    title: "Weekly Recap PRD",
    blocks: [{ id: "b-cadence", lastEditedTime: OLD, text: "The recap goes out daily." }],
    text: "The recap goes out daily.",
  });
  const said = (text: string) => {
    const root = msg(MAYA, ts(29, 15), text, { reply_count: 1, latest_reply: ts(29, 15, 1) });
    const answer = bot(ts(29, 15, 1), `Noted. The <${recap.url}|Weekly Recap PRD> still says daily.`, { thread_ts: root.ts });
    return { root, answer, dm: { kind: "dm" as const, history: [root], threads: { [root.ts]: [root, answer] } } };
  };

  it("yields a proposal card in that DM only", async () => {
    const t = said("We decided the recap goes weekly, not daily.");
    const w = world({
      dm: t.dm,
      dmReplies: [dmReply({ decisions: [{ message_ts: t.root.ts, confidence: 0.9 }] })],
      sweepReplies: [
        JSON.stringify({
          findings: [
            {
              source_url: recap.url,
              block_id: "b-cadence",
              source_says: "The recap goes out daily.",
              thread_says: "The recap goes weekly.",
              replacement: "The recap goes out weekly.",
              evidence_ts: [t.root.ts],
              claimed_by: null,
              confidence: 0.9,
            },
          ],
        }),
      ],
      sources: [recap],
      now: at(29, 22),
    });
    await w.endOfDay();
    assert.deepEqual(w.h.sourceReads, [recap.url], "the PRD uno-bot linked in its answer is read");
    w.h.clock.now = at(30, 14, 5);
    await w.morning();
    assert.equal(w.h.posted.length, 1);
    assert.equal(w.h.posted[0]!.channel, DM);
    assert.equal(w.h.posted[0]!.threadTs, t.root.ts);
    assert.deepEqual(w.h.staged[0]!.confirmers, [MAYA]);
    assert.equal(w.h.staged[0]!.sweepShare, undefined, "a DM's card offers no share");
    assert.deepEqual(w.postedIn(), [DM]);
  });

  it("an opinion runs no drift read and posts nothing", async () => {
    const t = said("I think the recap should probably be weekly.");
    const w = world({ dm: t.dm, dmReplies: [dmReply({})], sources: [recap], now: at(29, 22) });
    await w.endOfDay();
    assert.equal(w.h.provider.generated.length, 0, "no drift detector call");
    assert.equal(w.h.sourceReads.length, 0);
    w.h.clock.now = at(30, 14, 5);
    await w.morning();
    assert.equal(w.postedIn().length, 0);
  });
});

// ── C6 ───────────────────────────────────────────────────────────────────────

describe("C6: a disagreement uno-bot noticed while answering", () => {
  const root = msg(MAYA, ts(29, 15), "What's our warning colour? I need it for the alert banner mock.", {
    reply_count: 1,
    latest_reply: ts(29, 15, 1),
  });
  const answer = bot(ts(29, 15, 1), "Figma's library has warning at #FFB020, but the code's token is #715C00 — the two disagree.", {
    thread_ts: root.ts,
  });
  const noticed = dmReply({
    disagreements: [{ answer_ts: answer.ts, topic: "the warning colour", sources: ["Figma", "the code"], design_system: true, confidence: 0.9 }],
  });

  async function raised() {
    const w = world({ dm: { kind: "dm", history: [root], threads: { [root.ts]: [root, answer] } }, dmReplies: [noticed], now: at(29, 22) });
    await w.endOfDay();
    w.h.clock.now = at(30, 14, 5);
    await w.morning();
    return w;
  }

  it("produces one morning card in that DM, whose ✅ would post a reworded summary in the right channel", async () => {
    const w = await raised();
    assert.equal(w.posts.length, 1);
    const card = w.posts[0]!;
    assert.equal(card.channel, DM);
    assert.equal(card.threadTs, root.ts);
    assert.match(card.text, /Yesterday I noticed Figma and the code disagree on the warning colour\. Want me to post a note about it in #plus-universal\?/);

    const proposal = w.staged[0]!;
    assert.equal(proposal.channel, DM);
    assert.deepEqual(proposal.confirmers, [MAYA]);
    assert.equal(proposal.supersedeKey, raiseSlot(rowsOf(w.store)[0]!.id));
    assert.deepEqual(card.metadata, { event_type: DM_RAISE_EVENT, event_payload: { id: rowsOf(w.store)[0]!.id } }, "tagged as uno-bot's own post");
    assert.equal(proposal.operations!.length, 1);
    const op = proposal.operations![0]!;
    assert.equal(op.toolName, RAISE_TOOL);
    assert.equal(op.input.channel, UNIVERSAL, "the design system's rung");
    const note = String(op.input.text);
    assert.match(note, /Figma and the code disagree on the warning colour/);
    // No quote, no requester.
    assert.equal(note.includes(MAYA), false);
    assert.equal(/<@/.test(note), false);
    assert.equal(note.includes("alert banner"), false);
    assert.equal(note.includes("#FFB020"), false);
    // Staged by the Worker, the DM never named on the record.
    const events = w.h.proposalEvents.events().filter((e) => e.proposalId === proposal.proposalTs);
    assert.equal(events.length, 1);
    assert.equal(events[0]!.channelId, null);
    // Nothing reached a channel: the ✅ has not happened.
    assert.deepEqual(w.postedIn(), [DM]);
  });

  it("goes to #plus-design when it is not about the design system, and is asked about once", async () => {
    const w = world({
      dm: { kind: "dm", history: [root], threads: { [root.ts]: [root, answer] } },
      dmReplies: [
        dmReply({
          disagreements: [{ answer_ts: answer.ts, topic: "the launch date", sources: ["the PRD", "the Roadmap card"], design_system: false, confidence: 0.9 }],
        }),
      ],
      now: at(29, 22),
    });
    await w.endOfDay();
    w.h.clock.now = at(30, 14, 5);
    await w.morning();
    assert.equal(w.staged[0]!.operations![0]!.input.channel, DESIGN);
    w.h.clock.now = at(31, 14, 5);
    await w.morning();
    w.h.clock.now = at(32, 14, 5);
    await w.morning();
    assert.equal(w.posts.length, 1);
  });

  it("drops a topic that repeats the person's words", async () => {
    const quoting = dmReply({
      disagreements: [
        { answer_ts: answer.ts, topic: "I need it for the alert banner mock", sources: ["Figma", "the code"], design_system: true, confidence: 0.9 },
      ],
    });
    const w = world({ dm: { kind: "dm", history: [root], threads: { [root.ts]: [root, answer] } }, dmReplies: [quoting], now: at(29, 22) });
    await w.endOfDay();
    assert.equal(rowsOf(w.store).length, 0);
  });
});

// ── Nothing leaves the DM ────────────────────────────────────────────────────

describe("nothing from a DM reaches a channel without the person's ✅", () => {
  it("a whole week of all three kinds posts only in the DM", async () => {
    const recap = notionPage("dddddddddddddddddddddddddddddddd", {
      title: "Recap PRD",
      blocks: [{ id: "b-1", lastEditedTime: OLD, text: "The recap goes out daily." }],
    });
    const r1 = msg(MAYA, ts(29, 15), "What's the tutor ratio?", { reply_count: 1, latest_reply: ts(29, 15, 1) });
    const a1 = bot(ts(29, 15, 1), "I couldn't find it.", { thread_ts: r1.ts });
    const r2 = msg(MAYA, ts(29, 16), "We decided the recap goes weekly.", { reply_count: 1, latest_reply: ts(29, 16, 1) });
    const a2 = bot(ts(29, 16, 1), `Noted — <${recap.url}|Recap PRD> says daily. Also Figma and code disagree on warning.`, { thread_ts: r2.ts });
    const w = world({
      dm: { kind: "dm", history: [r1, r2], threads: { [r1.ts]: [r1, a1], [r2.ts]: [r2, a2] } },
      dmReplies: [
        dmReply({ unanswered: [{ answer_ts: a1.ts, what: "the tutor ratio", confidence: 0.9 }] }),
        dmReply({
          decisions: [{ message_ts: r2.ts, confidence: 0.9 }],
          disagreements: [{ answer_ts: a2.ts, topic: "the warning colour", sources: ["Figma", "the code"], design_system: true, confidence: 0.9 }],
        }),
      ],
      sweepReplies: [
        JSON.stringify({
          findings: [
            {
              source_url: recap.url,
              block_id: "b-1",
              source_says: "daily",
              thread_says: "weekly",
              replacement: "The recap goes out weekly.",
              evidence_ts: [r2.ts],
              claimed_by: null,
              confidence: 0.9,
            },
          ],
        }),
      ],
      sources: [recap],
      now: at(29, 22),
    });
    await w.endOfDay();
    for (const day of [30, 31, 32]) {
      w.h.clock.now = at(day, 14, 5);
      await w.morning();
    }
    assert.equal(w.h.posted.length, 1, "the C7 card");
    assert.equal(w.posts.length, 2, "the F6 ask and the C6 card");
    assert.deepEqual(w.postedIn(), [DM]);
    // The one staged operation aimed outside the DM is the raise card's, and it
    // runs only on a ✅ from Maya.
    const outward = [...w.h.staged, ...w.staged].filter((p) => (p.operations ?? []).some((op) => op.input.channel && op.input.channel !== DM));
    assert.equal(outward.length, 1);
    assert.equal(outward[0]!.operations![0]!.toolName, RAISE_TOOL);
    assert.deepEqual(outward[0]!.confirmers, [MAYA]);
  });

  it("a DM finding never shadows a channel's copy of the same fix", () => {
    const base = (channel: string, channelKind: "public" | "dm"): PendingFinding =>
      ({
        id: `${channel}:1.0:b-1`,
        target: { url: "https://www.notion.so/x", kind: "notion", writable: true, title: "X", pillars: [] },
        blockId: "b-1",
        evidence: { channel, channelKind, threadTs: "1.0", messageTs: ["1.0"], permalinks: [] },
      }) as unknown as PendingFinding;
    const pub = base(DESIGN, "public");
    assert.deepEqual(shadowedByPrivate([pub], [pub, base(DM, "dm")]), []);
  });

  it("the channel sweep still never reads a DM", async () => {
    const root = msg(MAYA, ts(29, 15), "hi");
    const h = sweepHarness({ channels: { [DM]: { kind: "dm", history: [root] } }, now: at(29, 22) });
    const report = await runSweepJob({ key: `sweep:${DM}`, kind: "sweep-channel", channel: DM }, h.deps);
    assert.equal(report.outcome, "skipped");
    assert.equal(h.reads.some((r) => r.startsWith("history")), false);
  });

  it("the DM job skips without its reader, and passes over an id that is not a DM", async () => {
    const h = sweepHarness({ channels: {}, now: at(29, 22) });
    assert.equal((await runSweepJob(DMS, h.deps)).outcome, "skipped");
    h.deps.dms = async () => [{ channel: "C0PUBLIC", person: MAYA }];
    h.deps.onDmThread = async () => ({ decision: false, answered: false });
    const report = await runSweepJob(DMS, h.deps);
    assert.equal(report.threads, 0);
    assert.equal(h.reads.length, 0);
  });
});

describe("the DM list", () => {
  it("is read off the usage record in one query: assistant turns, no test traffic, each DM once", async () => {
    const sent: Array<{ sql: string; values: unknown[] }> = [];
    const db = {
      prepare(sql: string) {
        return {
          bind(...values: unknown[]) {
            sent.push({ sql, values });
            return {
              async all<T>() {
                return { results: [{ channel: DM, person: MAYA }, { channel: DM, person: MAYA }, { channel: "C0X", person: "U0X" }] as T[] };
              },
            };
          },
        };
      },
    };
    assert.deepEqual(await activeDms(db, 1000), [{ channel: DM, person: MAYA }]);
    assert.equal(sent.length, 1);
    assert.match(sent[0]!.sql, /surface = 'assistant'/);
    assert.match(sent[0]!.sql, /test_traffic = 0/);
    assert.equal(sent[0]!.values[0], 1000);
  });
});

// ── Review fixes ─────────────────────────────────────────────────────────────

describe("uno-bot never reads its own posts back as new", () => {
  // A fresh root each case: the cases move its latest reply.
  let root = msg(MAYA, ts(29, 15), "What's our warning colour?", { reply_count: 1, latest_reply: ts(29, 15, 1) });
  beforeEach(() => {
    root = msg(MAYA, ts(29, 15), "What's our warning colour?", { reply_count: 1, latest_reply: ts(29, 15, 1) });
  });
  const answer = bot(ts(29, 15, 1), "Figma has warning at #FFB020, but the code's token is #715C00, so they disagree.", { thread_ts: root.ts });
  const warning = { topic: "the warning colour", sources: ["Figma", "the code"], design_system: true, confidence: 0.9 };

  it("a ⛔'d raise card is never offered again: its own post that night is context, not an answer", async () => {
    const dm: FakeChannel = { kind: "dm", history: [root], threads: { [root.ts]: [root, answer] } };
    const w = world({ dm, dmReplies: [dmReply({ disagreements: [{ answer_ts: answer.ts, ...warning }] })], now: at(29, 22) });
    await w.endOfDay();
    w.h.clock.now = at(30, 14, 5);
    await w.morning();
    const card = w.posts[0]!;
    const proposal = w.staged[0]!;
    const no = await resolveSignal(
      { kind: "reaction", messageTs: proposal.proposalTs, channel: DM, thread: proposal.replyTs!, glyph: "no_entry", userId: MAYA },
      { threadState: w.h.threadState },
    );
    assert.equal(no.outcome, "won");
    assert.equal(no.execute, undefined, "⛔ posts nothing");
    // The card, as Slack returns it that night: uno-bot's, tagged, and the
    // newest thing in the thread — worded just like a disagreement.
    dm.threads![root.ts] = [root, answer, bot(card.ts, card.text, { thread_ts: root.ts, metadata: card.metadata as never })];
    root.latest_reply = card.ts;
    w.h.clock.now = at(30, 22);
    await w.endOfDay();
    assert.equal(w.dmProvider.generated.length, 1, "nothing new in the thread, so no second read");
    for (const day of [31, 32, 35]) {
      w.h.clock.now = at(day, 14, 5);
      await w.morning();
    }
    assert.equal(w.posts.length, 1, "never offered again");
  });

  it("the same disagreement said again in the thread is one offer", async () => {
    const dm: FakeChannel = { kind: "dm", history: [root], threads: { [root.ts]: [root, answer] } };
    const later = msg(MAYA, ts(30, 16), "Which one should I use?", { thread_ts: root.ts });
    const again = bot(ts(30, 16, 1), "Still the same: Figma and the code disagree on the warning colour.", { thread_ts: root.ts });
    const w = world({
      dm,
      dmReplies: [
        dmReply({ disagreements: [{ answer_ts: answer.ts, ...warning }] }),
        dmReply({ disagreements: [{ answer_ts: again.ts, ...warning, topic: "The warning colour." }] }),
      ],
      now: at(29, 22),
    });
    await w.endOfDay();
    dm.threads![root.ts] = [root, answer, later, again];
    root.latest_reply = again.ts;
    w.h.clock.now = at(30, 22);
    await w.endOfDay();
    assert.equal(w.dmProvider.generated.length, 2);
    assert.equal(rowsOf(w.store).length, 1);
  });

  it("a ⛔'d C7 card is never proposed again", async () => {
    const recap = notionPage("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", {
      title: "Recap PRD",
      blocks: [{ id: "b-1", lastEditedTime: OLD, text: "The recap goes out daily." }],
    });
    const r = msg(MAYA, ts(29, 15), "We decided the recap goes weekly.", { reply_count: 1, latest_reply: ts(29, 15, 1) });
    const a = bot(ts(29, 15, 1), `Noted: the <${recap.url}|Recap PRD> says daily.`, { thread_ts: r.ts });
    const dm: FakeChannel = { kind: "dm", history: [r], threads: { [r.ts]: [r, a] } };
    const finding = JSON.stringify({
      findings: [
        { source_url: recap.url, block_id: "b-1", source_says: "daily", thread_says: "weekly", replacement: "The recap goes out weekly.", evidence_ts: [r.ts], claimed_by: null, confidence: 0.9 },
      ],
    });
    const w = world({ dm, dmReplies: [dmReply({ decisions: [{ message_ts: r.ts, confidence: 0.9 }] })], sweepReplies: [finding], sources: [recap], now: at(29, 22) });
    await w.endOfDay();
    w.h.clock.now = at(30, 14, 5);
    await w.morning();
    assert.equal(w.h.posted.length, 1);
    const posted = w.h.posted[0]!;
    const staged = w.h.staged[0]!;
    await resolveSignal(
      { kind: "reaction", messageTs: staged.proposalTs, channel: DM, thread: staged.replyTs ?? staged.threadTs, glyph: "no_entry", userId: MAYA },
      { threadState: w.h.threadState },
    );
    for (const item of await w.h.store.itemsOnCard(posted.cardKey)) await w.h.store.updateItem(item.itemId, { status: "dropped" });
    dm.threads![r.ts] = [r, a, bot(posted.ts, posted.text, { thread_ts: r.ts, metadata: { event_type: SWEEP_CARD_EVENT, event_payload: { card_key: posted.cardKey } } })];
    r.latest_reply = posted.ts;
    w.h.clock.now = at(30, 22);
    await w.endOfDay();
    assert.equal(w.dmProvider.generated.length, 1, "uno-bot's own card is no new message");
    w.h.clock.now = at(31, 14, 5);
    await w.morning();
    assert.equal(w.h.posted.length, 1, "never proposed again");
  });

  it("one raise a thread; raises in two threads each hold their own slot", async () => {
    const both = bot(ts(29, 15, 1), "Figma and the code disagree on warning, and the PRD and the card disagree on the launch date.", { thread_ts: root.ts });
    const root2 = msg(MAYA, ts(29, 16), "When do we launch?", { reply_count: 1, latest_reply: ts(29, 16, 1) });
    const other = bot(ts(29, 16, 1), "The PRD says Oct 15, the Roadmap card says Nov 1.", { thread_ts: root2.ts });
    const launch = { topic: "the launch date", sources: ["the PRD", "the Roadmap card"], design_system: false, confidence: 0.9 };
    const w = world({
      dm: { kind: "dm", history: [root, root2], threads: { [root.ts]: [root, both], [root2.ts]: [root2, other] } },
      dmReplies: [
        dmReply({ disagreements: [{ answer_ts: both.ts, ...warning }, { answer_ts: both.ts, ...launch, sources: ["Figma", "Storybook"] }] }),
        dmReply({ disagreements: [{ answer_ts: other.ts, ...launch }] }),
      ],
      now: at(29, 22),
    });
    await w.endOfDay();
    assert.equal(rowsOf(w.store).length, 2, "one a thread");
    w.h.clock.now = at(30, 14, 5);
    await w.morning();
    assert.equal(w.staged.length, 2);
    for (const p of w.staged) assert.equal((await w.h.threadState.getProposalByTs(p.proposalTs)).state, "found");
  });

  it("a ⛔'d raise is not offered again for 14 days, however the topic is reworded, in its thread or a new one", async () => {
    const dm: FakeChannel = { kind: "dm", history: [root], threads: { [root.ts]: [root, answer] } };
    const w = world({ dm, dmReplies: [dmReply({ disagreements: [{ answer_ts: answer.ts, ...warning }] })], now: at(29, 22) });
    await w.endOfDay();
    w.h.clock.now = at(30, 14, 5);
    await w.morning();
    const proposal = w.staged[0]!;
    await resolveSignal(
      { kind: "reaction", messageTs: proposal.proposalTs, channel: DM, thread: proposal.replyTs!, glyph: "no_entry", userId: MAYA },
      { threadState: w.h.threadState },
    );
    // That day: asked again in the same thread, and in a new one; uno-bot says
    // it again in other words, naming the sources a little differently.
    const again = msg(MAYA, ts(30, 14, 30), "so which is right?", { thread_ts: root.ts });
    const reworded = bot(ts(30, 14, 31), "The warning token differs: Figma says #FFB020, code says #715C00.", { thread_ts: root.ts });
    dm.threads![root.ts] = [root, answer, again, reworded];
    root.latest_reply = reworded.ts;
    const root2 = msg(MAYA, ts(30, 15), "What hex is warning?", { reply_count: 1, latest_reply: ts(30, 15, 1) });
    const fresh = bot(ts(30, 15, 1), "Figma and the codebase disagree on the warning token.", { thread_ts: root2.ts });
    dm.history.push(root2);
    dm.threads![root2.ts] = [root2, fresh];
    w.dmReplies.push(
      dmReply({ disagreements: [{ answer_ts: reworded.ts, ...warning, topic: "the warning token", sources: ["the code", "Figma"] }] }),
      dmReply({ disagreements: [{ answer_ts: fresh.ts, ...warning, topic: "the warning token hex", sources: ["figma", "Code"] }] }),
    );
    w.h.clock.now = at(30, 22);
    await w.endOfDay();
    assert.equal(w.dmProvider.generated.length, 3, "both threads were read");
    assert.equal(rowsOf(w.store).length, 1, "no second raise");
    for (const day of [31, 32, 35, 36]) {
      w.h.clock.now = at(day, 14, 5);
      await w.morning();
    }
    assert.equal(w.posts.length, 1, "no new card");
  });

  /** Offer the warning raise tonight, ⛔ it tomorrow morning, and open a new
   *  thread that afternoon whose answer the detector reads as `later`. */
  async function vetoThenAsk(later: Array<Record<string, unknown>>) {
    const dm: FakeChannel = { kind: "dm", history: [root], threads: { [root.ts]: [root, answer] } };
    const w = world({ dm, dmReplies: [dmReply({ disagreements: [{ answer_ts: answer.ts, ...warning }] })], now: at(29, 22) });
    await w.endOfDay();
    w.h.clock.now = at(30, 14, 5);
    await w.morning();
    const proposal = w.staged[0]!;
    await resolveSignal(
      { kind: "reaction", messageTs: proposal.proposalTs, channel: DM, thread: proposal.replyTs!, glyph: "no_entry", userId: MAYA },
      { threadState: w.h.threadState },
    );
    const root2 = msg(MAYA, ts(30, 15), "What hex is warning, and when do we launch?", { reply_count: 1, latest_reply: ts(30, 15, 1) });
    const reply = bot(ts(30, 15, 1), "The Figma library and the codebase disagree on warning; the PRD and the Roadmap card disagree on the date.", { thread_ts: root2.ts });
    dm.history.push(root2);
    dm.threads![root2.ts] = [root2, reply];
    w.dmReplies.push(dmReply({ disagreements: later.map((d) => ({ answer_ts: reply.ts, ...d })) }));
    w.h.clock.now = at(30, 22);
    await w.endOfDay();
    return { w, root2 };
  }

  it("a ⛔'d raise stays quiet when a later answer names the sources differently", async () => {
    const { w } = await vetoThenAsk([{ ...warning, topic: "the warning token", sources: ["the Figma library", "the codebase"] }]);
    assert.equal(rowsOf(w.store).length, 1, "the Figma library is Figma, the codebase is the code");
  });

  it("a new pair behind a quiet one in the same answer is raised", async () => {
    const launch = { topic: "the launch date", sources: ["the PRD", "the Roadmap card"], design_system: false, confidence: 0.9 };
    const { w, root2 } = await vetoThenAsk([{ ...warning, sources: ["Figma file", "the repo"] }, launch]);
    const rows = rowsOf(w.store);
    assert.equal(rows.length, 2);
    const added = rows.find((r) => r.threadTs === root2.ts)!;
    assert.equal(added.id, raiseId(DM, ["the PRD", "the Roadmap card"], root2.ts), "the launch date, not the quiet warning colour");
  });
});

describe("a DM ask waits behind a person's own asks", () => {
  it("two DM asks and a \"remind me\" due: the \"remind me\" goes out this morning, first", async () => {
    const store = createInMemoryCommitmentStore();
    const base = {
      channel: DM,
      channelKind: "dm" as const,
      threadTs: ts(29, 15),
      messageTs: ts(29, 15, 1),
      promiserId: MAYA,
      requesterId: MAYA,
      deadlineAt: null,
      state: "open" as const,
      nudges: 0,
      snoozes: 0,
      confidence: 0.9,
      promisedAt: at(29, 15),
      detectedAt: at(29, 22),
      runDate: "2026-09-29",
      nudgeTs: null,
      followupTs: null,
      checkedOn: null,
      holds: 0,
      remindedOn: null,
      resolvedAt: null,
    };
    await store.addCommitments([
      { ...base, id: `${DM}:a:unanswered`, kind: "dm_unanswered", dueAt: at(29, 22) },
      { ...base, id: `${DM}:b:unanswered`, kind: "dm_unanswered", threadTs: ts(29, 16), dueAt: at(29, 22) },
      { ...base, id: `${DM}:c:raise`, kind: "dm_disagreement", threadTs: ts(29, 17), dueAt: at(29, 22) },
      { ...base, id: `${DM}:self`, kind: "self_reminder", dueAt: at(30, 14) },
    ]);
    for (const id of [`${DM}:a:unanswered`, `${DM}:b:unanswered`, `${DM}:self`]) await store.saveText(id, { what: "the ratio", bodies: {} }, at(60, 0));
    await store.saveText(`${DM}:c:raise`, { what: "the warning colour", bodies: {}, raise: { sources: ["Figma", "the code"], to: "plus-universal" } }, at(60, 0));
    const now = at(30, 14, 5);
    const order: string[] = [];
    const nudges = await runCommitmentNudges(NUDGE, {
      slack: {
        replies: async () => null,
        history: async () => null,
        permalink: async () => null,
        async post(_to, message) {
          order.push(`self: ${message.text}`);
          return { ok: true, ts: "1.1" };
        },
        update: async () => true,
      },
      sources: { read: async () => null },
      judge: { judge: async () => ({ ok: true, done: false, evidenceTs: [] }) },
      store,
      markThread: async () => {},
      config: { unoBot: "C0UNOBOT", botUserId: BOT },
      now: () => now,
      runDate: "2026-09-30",
      dm: {
        async due(c) {
          order.push(`dm: ${c.id}`);
          await store.update(c.id, { state: "nudged", nudges: 1, remindedOn: "2026-09-30", checkedOn: "2026-09-30" });
          return { id: c.id, action: "nudged" };
        },
      },
    });
    assert.ok(order[0]!.startsWith("self: "), `the "remind me" first: ${order.join(" | ")}`);
    assert.equal(order.filter((o) => o.startsWith("dm: ")).length, 2, "the DM asks spend their own budget of two");
    assert.equal(nudges.actions.length, 3);
  });
});
