// Card follow-ups (Follow through F3–F5), a week at a time: the end of day
// keeps a to-do or a card, the weekday morning run settles it on its evidence
// or asks its owner, and the answer stages a proposal card.
//
// Everything runs against fakes: a Roadmap of plain objects, recorded model
// replies, a recording Slack, and the in-memory commitment store.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { fakeProvider } from "../src/agent/providers/fake";
import { SubrequestBudgetError } from "../src/net";
import type { ScheduledJob } from "../src/scheduled/runs";
import { runSweepJob, type SweepThread } from "../src/sweep/index";
import { chainReplyHandlers, runMessageJob } from "../src/slack/message-job";
import type { SlackMessageEvent } from "../src/slack/types";
import { sweepHooks, threadHooks } from "../src/scheduled/jobs";
import { replyHandlerAt, replyHandlersFor } from "../src/slack/events";
import { toActiveCard } from "../src/follow-through/notion";
import type { Env } from "../src/types";
import {
  answerReminder,
  cardTodoId,
  commitmentThreadHook,
  createInMemoryCommitmentStore,
  footerLabels,
  MAX_CARD_REMINDERS_PER_PERSON,
  modelCommitmentDetector,
  runCommitmentNudges,
  setSelfReminder,
  type CommitmentRecord,
  type InMemoryCommitmentStore,
  type NudgeDeps,
} from "../src/commitments/index";
import {
  answerCardFollowUp,
  cardFollowUps,
  draftCard,
  followThroughProposal,
  FOLLOW_THROUGH_CARD_TTL_MS,
  FOLLOW_THROUGH_KEY,
  handleCardReply,
  handleCardReplySafely,
  namedOwner,
  cardTodoNoteHook,
  cardTodoThreadHook,
  matchesTodo,
  modelCardTodoDetector,
  recordNoteCardTodos,
  recordThreadCardTodos,
  runCardFollowThroughScan,
  type ActiveCard,
  type AnswerDeps,
  type CardProposal,
  type DueDeps,
  type FollowThroughConfig,
  type ScanDeps,
} from "../src/follow-through/index";
import { at, BOT, DESIGN, NOTES_DB, notionPage, sweepHarness, ts, UNIVERSAL, UNO_BOT, utcDay } from "./helpers/sweep-harness";

const SCAN: ScheduledJob = { key: "card-follow-through", kind: "card-follow-through" };
const NUDGE: ScheduledJob = { key: "commitment-nudge", kind: "commitment-nudge" };
const DAY = 24 * 60 * 60 * 1000;

const LEAD = "U0LEAD";
const MAYA = "U0MAYA";
const BEA = "U0BEA";
const ADE = "U0ADE";
const CONFIG: FollowThroughConfig = { plusDesign: DESIGN, plusUniversal: UNIVERSAL, unoBot: UNO_BOT, botUserId: BOT };

const ROOT = ts(29, 13); // Tue 2026-09-29, 09:00 ET
const TODO = ts(29, 15);
const EOD = at(29, 22);

function card(over: Partial<ActiveCard> = {}): ActiveCard {
  return {
    pageId: "p1",
    url: "https://www.notion.so/p1",
    title: "Facelift — last stage",
    designStatus: "WIP",
    pillars: ["Tutor"],
    contributors: [],
    creatorId: "n-bea",
    lastEditedAt: EOD - 8 * DAY,
    archived: false,
    ...over,
  };
}

/** A small Roadmap and directory. */
/** The Roadmap's Design Status options today, in the schema's order. */
const STATUSES = ["Need PRD / Under Playground", "Ready for Design", "WIP", "Under Review", "Under Dev", "Shipped", "Archived"];

function roadmap(
  opts: { cards?: ActiveCard[]; comments?: Record<string, number | null>; titles?: string[]; pillars?: string[]; statuses?: string[]; bot?: string } = {},
) {
  const cards = new Map((opts.cards ?? []).map((c) => [c.pageId, c] as const));
  /** The follow-up reply marks, as KV would hold them. */
  const marks = new Set<string>();
  const slackByName: Record<string, string> = { "Bea Ruiz": BEA, "Maya Chen": MAYA, "Ade Obi": ADE };
  const nameByNotion: Record<string, string> = { "n-bea": "Bea Ruiz", "n-maya": "Maya Chen", "n-lead": "Lead Person" };
  const notionBySlack: Record<string, string> = { [MAYA]: "n-maya", [BEA]: "n-bea" };
  return {
    cards,
    marks,
    reads: {
      activeCards: async () => ({ cards: [...cards.values()], truncated: false }),
      card: async (id: string) => cards.get(id) ?? null,
      lastCommentAt: async (id: string) => opts.comments?.[id] ?? null,
      titlesMatching: async () => opts.titles ?? [],
      pillarOptions: async () => opts.pillars ?? ["Tutor", "Universal"],
      statusOptions: async () => opts.statuses ?? STATUSES,
      botUserId: async () => opts.bot ?? null,
    },
    people: {
      slackIdForName: async (name: string) => slackByName[name] ?? null,
      slackIdForNotionUser: async (id: string) => slackByName[nameByNotion[id] ?? ""] ?? null,
      notionUserForSlack: async (id: string) => notionBySlack[id] ?? null,
    },
  };
}

function scanDeps(store: InMemoryCommitmentStore, rm: ReturnType<typeof roadmap>, now = EOD): ScanDeps {
  return { reads: rm.reads, people: rm.people, store, config: CONFIG, now: () => now, runDate: utcDay(now) };
}

/** A morning's Slack, and the commitment job with the card handler. */
function morning(store: InMemoryCommitmentStore, rm: ReturnType<typeof roadmap>, now: number) {
  const posts: Array<{ channel: string; threadTs: string | null; text: string; ts: string }> = [];
  const marked: string[] = [];
  let seq = 0;
  const due: DueDeps = {
    reads: rm.reads,
    slack: {
      permalink: async (channel, t) => `https://plus.slack.com/archives/${channel}/p${t.replace(".", "")}`,
      async post(to, message) {
        seq += 1;
        const posted = { channel: to.channel, threadTs: to.threadTs, text: message.text, ts: `${now / 1000}.${String(seq).padStart(6, "0")}` };
        posts.push(posted);
        return { ok: true, ts: posted.ts };
      },
    },
    store,
    markThread: async (channel, t) => void marked.push(`${channel}:${t}`),
    markReplyThread: async (channel, t) => void rm.marks.add(`${channel}:${t}`),
    config: CONFIG,
  };
  const deps: NudgeDeps = {
    slack: {
      replies: async () => ({ messages: [] }),
      history: async () => ({ messages: [] }),
      permalink: async () => null,
      post: async () => ({ ok: false }),
      update: async () => true,
    },
    sources: { read: async () => null },
    judge: { judge: async () => ({ ok: true, done: false, evidenceTs: [] }) },
    store,
    markThread: async () => {},
    config: { unoBot: UNO_BOT, botUserId: BOT },
    now: () => now,
    runDate: utcDay(now),
    cards: cardFollowUps(due),
  };
  return { run: () => runCommitmentNudges(NUDGE, deps), posts, marked };
}

/** The answer side: what was staged, edited and said. */
function answers(store: InMemoryCommitmentStore, rm: ReturnType<typeof roadmap>, config: FollowThroughConfig = CONFIG, clock = { now: at(32, 15) }) {
  const staged: CardProposal[] = [];
  const edits: Array<{ ts: string; text: string; footer: string }> = [];
  const said: Array<{ threadTs: string; text: string }> = [];
  const deps: AnswerDeps = {
    store,
    reads: rm.reads,
    people: rm.people,
    async update(_channel, t, message) {
      const footer = footerLabels(message.blocks);
      edits.push({ ts: t, text: message.text, footer });
      return true;
    },
    async post(to, text) {
      said.push({ threadTs: to.threadTs, text });
    },
    async stage(p) {
      staged.push(p);
      return true;
    },
    markReplyThread: async (channel, t) => void rm.marks.add(`${channel}:${t}`),
    isReplyThread: async (channel, t) => rm.marks.has(`${channel}:${t}`),
    config,
    now: () => clock.now,
  };
  return { deps, staged, edits, said, clock };
}

const mentions = (text: string) => [...text.matchAll(/<@(U[A-Z0-9]+)>/g)].map((m) => m[1]);
const only = (store: InMemoryCommitmentStore): CommitmentRecord => {
  assert.equal(store.rows.size, 1);
  return [...store.rows.values()][0]!;
};

// ── F3 ───────────────────────────────────────────────────────────────────────

const todoThread: SweepThread = {
  channel: DESIGN,
  channelKind: "public",
  rootTs: ROOT,
  messages: [
    { ts: ROOT, user: BEA, text: "Facelift review notes are in the doc." },
    { ts: TODO, user: BEA, text: "<@U0MAYA> can you create a card for the facelift last stage?" },
  ],
};

async function keptTodo(store = createInMemoryCommitmentStore(), reply?: string) {
  const provider = fakeProvider({
    generateReplies: [
      reply ?? JSON.stringify({ todos: [{ message_ts: TODO, assignee: MAYA, what: "the facelift last stage", confidence: 0.9 }] }),
    ],
  });
  const rows = await recordThreadCardTodos(todoThread, ts(29, 0), {
    detector: modelCardTodoDetector(provider),
    store,
    config: CONFIG,
    now: () => EOD,
    runDate: utcDay(EOD),
  });
  return { store, rows, provider };
}

describe("F3: a to-do to make a card", () => {
  it("is kept as a card to-do due at the end of the second working day, mentioning its assignee", async () => {
    const { store } = await keptTodo();
    const row = only(store);
    assert.equal(row.kind, "card_todo");
    assert.equal(row.promiserId, MAYA);
    assert.equal(row.threadTs, ROOT);
    // Said Tuesday, due at the end of Thursday in New York.
    assert.equal(new Date(row.dueAt).toISOString(), "2026-10-02T04:00:00.000Z");
    assert.equal(store.texts.get(row.id)?.text.what, "the facelift last stage");
  });

  it("with a matching card by its due date, becomes auto_done and sends nothing", async () => {
    const { store } = await keptTodo();
    const rm = roadmap({ titles: ["Facelift kickoff", "Facelift — last stage polish"] });
    const m = morning(store, rm, at(32, 13)); // Fri 09:00 ET
    const report = await m.run();
    assert.equal(only(store).state, "auto_done");
    assert.equal(m.posts.length, 0);
    assert.match(report.summary, /1 auto_done/);
  });

  it("with no card, gets one offer in its thread, and its ✅ stages the drafted card", async () => {
    const { store } = await keptTodo();
    const rm = roadmap({ titles: ["Facelift kickoff"] });
    const m = morning(store, rm, at(32, 13));
    await m.run();
    assert.equal(m.posts.length, 1);
    const [offer] = m.posts;
    assert.equal(offer!.channel, DESIGN);
    assert.equal(offer!.threadTs, ROOT);
    assert.match(offer!.text, /Want me to draft a Roadmap card for the facelift last stage\?/);
    assert.deepEqual(mentions(offer!.text), [MAYA]);
    assert.equal(only(store).state, "nudged");

    // The same morning again posts nothing more.
    await morning(store, rm, at(32, 13, 30)).run();

    const a = answers(store, rm);
    const row = only(store);
    await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "white_check_mark", userId: MAYA }, a.deps);
    assert.equal(a.staged.length, 1);
    const [op] = a.staged[0]!.card.operations;
    assert.equal(op!.toolName, "notion_create");
    assert.equal(op!.input.surface, "prd");
    assert.equal(op!.input.title, "The facelift last stage");
    assert.equal(a.staged[0]!.threadTs, ROOT);
    assert.ok(a.staged[0]!.confirmers.includes(MAYA));
    assert.equal(only(store).state, "done");
    assert.match(a.edits[0]!.footer, /draft card is in this thread/);
  });

  it("🙅 from the assignee drops it; from anyone else changes nothing", async () => {
    const { store } = await keptTodo();
    const rm = roadmap();
    await morning(store, rm, at(32, 13)).run();
    const row = only(store);
    const a = answers(store, rm);
    await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "no_good", userId: ADE }, a.deps);
    assert.equal(only(store).state, "nudged");
    await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "no_good", userId: MAYA }, a.deps);
    assert.equal(only(store).state, "dropped");
    assert.equal(a.staged.length, 0);
  });

  it("follows up once, a week on, then lapses", async () => {
    const { store } = await keptTodo();
    const rm = roadmap();
    const first = morning(store, rm, at(32, 13));
    await first.run();
    // Two working days on is too soon: one message a card a week.
    const early = morning(store, rm, at(36, 13));
    await early.run();
    assert.equal(early.posts.length, 0);
    const second = morning(store, rm, at(42, 13)); // Mon Oct 12, the first morning past a week
    await second.run();
    assert.equal(second.posts.length, 1);
    assert.match(second.posts[0]!.text, /Still want that card drafted\?/);
    const third = morning(store, rm, at(50, 13));
    await third.run();
    assert.equal(third.posts.length, 0);
    assert.equal(only(store).state, "lapsed");
  });

  it("a running note's to-do with nobody named mentions the note's takers, in #plus-design", async () => {
    const store = createInMemoryCommitmentStore();
    await recordNoteCardTodos(
      {
        pageId: "note1",
        url: "https://www.notion.so/note1",
        meetingAt: at(29, 17),
        takers: [BEA, ADE],
        todos: [{ blockId: "b1", assignee: null, what: "the booking empty states" }],
      },
      { store, config: CONFIG, now: () => EOD, runDate: utcDay(EOD) },
    );
    const row = only(store);
    assert.equal(row.channel, DESIGN);
    assert.equal(row.threadTs, "");
    const m = morning(store, roadmap(), at(32, 13));
    await m.run();
    assert.equal(m.posts.length, 1);
    assert.equal(m.posts[0]!.threadTs, null);
    assert.deepEqual(mentions(m.posts[0]!.text), [BEA, ADE]);
    assert.ok(!mentions(m.posts[0]!.text).includes(LEAD));
    assert.match(m.posts[0]!.text, /the running note/);
  });

  it("a drafted card's pillar is exact-matched against the Roadmap's options", async () => {
    const row = { id: "x", channel: UNIVERSAL, threadTs: ROOT } as CommitmentRecord;
    const text = { what: "the token audit", bodies: {} };
    const withIt = await draftCard(row, text, { reads: roadmap({ pillars: ["Tutor", "Universal"] }).reads, config: CONFIG });
    assert.deepEqual(withIt.operations[0]!.input.properties, { product_pillar: "Universal" });
    const without = await draftCard(row, text, { reads: roadmap({ pillars: ["universal (DS)"] }).reads, config: CONFIG });
    assert.equal(without.operations[0]!.input.properties, undefined);
    const elsewhere = await draftCard({ ...row, channel: DESIGN }, text, { reads: roadmap().reads, config: CONFIG });
    assert.equal(elsewhere.operations[0]!.input.properties, undefined);
  });

  it("the matching rule wants the to-do's own words", () => {
    assert.equal(matchesTodo("facelift last stage", "Facelift — last stage polish"), true);
    assert.equal(matchesTodo("facelift last stage", "Facelift kickoff"), false);
    assert.equal(matchesTodo("booking", "Booking flow"), true);
    assert.equal(matchesTodo("a card", "Anything"), false);
  });
});

// ── F4 and F5 ────────────────────────────────────────────────────────────────

describe("F4: an active card with no owner", () => {
  it("gets one message to its creator in #plus-design, never the lead", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    const report = await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    assert.equal(report.rows.length, 1);
    const row = only(store);
    assert.equal(row.kind, "card_unowned");
    assert.equal(row.promiserId, BEA);
    assert.equal(row.channel, DESIGN);
    assert.equal(row.cardId, "p1");
    const m = morning(store, rm, at(30, 13));
    await m.run();
    assert.equal(m.posts.length, 1);
    assert.equal(m.posts[0]!.channel, DESIGN);
    assert.equal(m.posts[0]!.threadTs, null);
    assert.match(m.posts[0]!.text, /Who should take <https:\/\/www\.notion\.so\/p1\|Facelift — last stage>\?/);
    assert.deepEqual(mentions(m.posts[0]!.text), [BEA]);
    // Its thread is marked, so the team's replies there are not turns.
    assert.deepEqual(m.marked, [`${DESIGN}:${m.posts[0]!.ts}`]);
  });

  it("is not kept before a week has passed, nor again the same night", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card({ lastEditedAt: EOD - 3 * DAY })] });
    assert.equal((await runCardFollowThroughScan(SCAN, scanDeps(store, rm))).rows.length, 0);
    rm.cards.set("p1", card());
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    assert.equal((await runCardFollowThroughScan(SCAN, scanDeps(store, rm))).rows.length, 0);
    assert.equal(store.rows.size, 1);
  });

  it("with no creator anyone can find in Slack, asks nobody", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card({ creatorId: "n-ghost" })] });
    const report = await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    assert.equal(store.rows.size, 0);
    assert.match(report.summary, /no creator found in Slack/);
  });

  it("settles on its own when a Contributor is set by the morning", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    rm.cards.set("p1", card({ contributors: [{ id: "n-maya", name: "Maya Chen" }] }));
    const m = morning(store, rm, at(30, 13));
    await m.run();
    assert.equal(m.posts.length, 0);
    assert.equal(only(store).state, "auto_done");
  });

  it("a reply naming exactly one person stages the Contributor change; the row settles only once the card shows it", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(30, 13));
    await m.run();
    const question = m.posts[0]!;
    assert.ok(rm.marks.has(`${DESIGN}:${question.ts}`), "the question's thread takes replies");
    const a = answers(store, rm);
    const handled = await handleCardReply({ channel: DESIGN, threadTs: question.ts, user: BEA, text: "<@U0MAYA> is taking it" }, a.deps);
    assert.equal(handled, true);
    assert.equal(a.staged.length, 1);
    const p = a.staged[0]!;
    assert.deepEqual(p.card.operations, [
      { toolName: "notion_update", input: { page_url: "https://www.notion.so/p1", properties: { Contributor: "n-maya" } } },
    ]);
    assert.equal(p.threadTs, question.ts);
    assert.equal(p.channelKind, "public");
    assert.equal(p.slot, `follow-through:${only(store).id}`);
    assert.deepEqual(new Set(p.confirmers), new Set([BEA, MAYA]));
    // Staged is not applied: the row stays live until the card shows a Contributor.
    assert.equal(only(store).state, "nudged");
    rm.cards.set("p1", card({ contributors: [{ id: "n-maya", name: "Maya Chen" }], lastEditedAt: at(31, 12) }));
    await morning(store, rm, at(39, 13)).run();
    assert.equal(only(store).state, "auto_done");
  });

  it("a proposal nobody applies lets the follow-up ask again", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(30, 13));
    await m.run();
    await handleCardReply({ channel: DESIGN, threadTs: m.posts[0]!.ts, user: BEA, text: "<@U0MAYA>" }, answers(store, rm).deps);
    const later = morning(store, rm, at(39, 13)); // a week on, the card still unowned
    await later.run();
    assert.equal(later.posts.length, 1);
    assert.match(later.posts[0]!.text, /This card still has no Contributor/);
  });

  it("\"me\" names the replier; two people, or uno-bot, name nobody", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(30, 13));
    await m.run();
    const a = answers(store, rm);
    const reply = (user: string, text: string) => handleCardReply({ channel: DESIGN, threadTs: m.posts[0]!.ts, user, text }, a.deps);
    assert.equal(await reply(BEA, "<@U0MAYA> or <@U0ADE>?"), false);
    assert.equal(await reply(BEA, `<@${BOT}> <@U0MAYA>`), false);
    assert.equal(await reply(BEA, "someone should"), false);
    assert.equal(a.staged.length, 0);
    assert.equal(await reply(BEA, "I'll take it"), true);
    assert.equal((a.staged[0]!.card.operations[0]!.input.properties as Record<string, string>).Contributor, "n-bea");
    assert.equal(namedOwner("mine", MAYA, BOT), MAYA);
    assert.equal(namedOwner("me!", MAYA, BOT), MAYA);
    assert.equal(namedOwner("not me", MAYA, BOT), null);
  });

  it("only someone the question asked may name the owner", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(30, 13));
    await m.run();
    const a = answers(store, rm);
    // The card's creator (Bea) was asked; Maya and Ade were not.
    assert.equal(await handleCardReply({ channel: DESIGN, threadTs: m.posts[0]!.ts, user: MAYA, text: "I'll take it" }, a.deps), false);
    assert.equal(await handleCardReply({ channel: DESIGN, threadTs: m.posts[0]!.ts, user: ADE, text: "<@U0MAYA>" }, a.deps), false);
    assert.equal(a.staged.length, 0);
  });

  it("with uno-bot's own id unknown, no mention names an owner", () => {
    assert.equal(namedOwner("<@U0MAYA>", BEA, null), null);
    assert.equal(namedOwner("me", BEA, null), BEA);
  });

  it("a named person with no Notion match gets a plain answer and no card", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(30, 13));
    await m.run();
    const a = answers(store, rm);
    assert.equal(await handleCardReply({ channel: DESIGN, threadTs: m.posts[0]!.ts, user: BEA, text: "<@U0ADE> maybe" }, a.deps), true);
    assert.equal(a.staged.length, 0);
    assert.match(a.said[0]!.text, /can't match <@U0ADE>/);
    assert.equal(only(store).state, "nudged");
  });
});

describe("F5: a stuck card", () => {
  const stuck = (over: Partial<ActiveCard> = {}) =>
    card({ designStatus: "Under Review", contributors: [{ id: "n-maya", name: "Maya Chen" }], lastEditedAt: EOD - 22 * DAY, ...over });

  it("mentions its Contributor; a Universal card lands in #plus-universal", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck({ pillars: ["Universal"] })] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const row = only(store);
    assert.equal(row.kind, "card_stale");
    assert.equal(row.channel, UNIVERSAL);
    const m = morning(store, rm, at(30, 13));
    await m.run();
    assert.equal(m.posts[0]!.channel, UNIVERSAL);
    assert.match(m.posts[0]!.text, /Is it still moving\?/);
    assert.match(m.posts[0]!.text, /\*Under Review\*/);
    assert.deepEqual(mentions(m.posts[0]!.text), [MAYA]);
  });

  it("with a recent comment is not flagged", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck()], comments: { p1: EOD - 2 * DAY } });
    assert.equal((await runCardFollowThroughScan(SCAN, scanDeps(store, rm))).rows.length, 0);
  });

  it("any other card lands in #plus-design", async () => {
    const store = createInMemoryCommitmentStore();
    await runCardFollowThroughScan(SCAN, scanDeps(store, roadmap({ cards: [stuck()] })));
    assert.equal(only(store).channel, DESIGN);
  });

  it("a card out of an active status is never flagged", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck({ designStatus: "Shipped" }), card({ pageId: "p2", designStatus: "wip" })] });
    assert.equal((await runCardFollowThroughScan(SCAN, scanDeps(store, rm))).rows.length, 0);
  });

  /** A stuck card asked about, and its owner's reaction. */
  async function answered(glyph: string) {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    await morning(store, rm, at(30, 13)).run();
    const row = only(store);
    const a = answers(store, rm);
    await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph, userId: MAYA }, a.deps);
    const reply = (user: string, text: string) => handleCardReply({ channel: DESIGN, threadTs: row.nudgeTs!, user, text }, a.deps);
    return { store, row, a, reply };
  }

  it("🙌 lists the card's live Design Status options, likely first, and stages nothing yet", async () => {
    const { store, row, a } = await answered("raised_hands");
    assert.equal(only(store).state, "done");
    assert.equal(a.staged.length, 0);
    assert.equal(a.said.length, 1);
    assert.equal(a.said[0]!.threadTs, row.nudgeTs);
    // Shipped and Under Dev lead; the card's own status (Under Review) is left out.
    assert.match(a.said[0]!.text, /^<@U0MAYA> Which Design Status should <https:\/\/www\.notion\.so\/p1\|Facelift — last stage> move to\?/);
    assert.match(a.said[0]!.text, /\n1\. Shipped\n2\. Under Dev\n3\. Need PRD \/ Under Playground\n4\. Ready for Design\n5\. WIP\n6\. Archived$/);
    assert.match(a.edits[0]!.footer, /Pick the card's new Design Status/);
  });

  it("🙌 then \"Shipped\" stages the move", async () => {
    const { a, reply, row } = await answered("raised_hands");
    assert.equal(await reply(MAYA, "Shipped"), true);
    assert.equal(a.staged.length, 1);
    assert.deepEqual(a.staged[0]!.card.operations, [
      { toolName: "notion_update", input: { page_url: "https://www.notion.so/p1", properties: { "Design Status": "Shipped" } } },
    ]);
    assert.equal(a.staged[0]!.threadTs, row.nudgeTs);
    assert.deepEqual(a.staged[0]!.confirmers, [MAYA]);
    // Picked once: a second pick is the thread's own conversation.
    assert.equal(await reply(MAYA, "Archived"), false);
    assert.equal(a.staged.length, 1);
  });

  it("🙅 then \"2\" stages the move to option 2", async () => {
    const { a, reply } = await answered("no_good");
    // For a drop, Archived leads, then the schema's order.
    assert.match(a.said[0]!.text, /\n1\. Archived\n2\. Need PRD \/ Under Playground\n/);
    assert.equal(await reply(MAYA, "2"), true);
    assert.deepEqual(a.staged[0]!.card.operations[0]!.input.properties, { "Design Status": "Need PRD / Under Playground" });
  });

  it("an unknown value stages nothing, and gets the options again on one line — once", async () => {
    const { a, reply } = await answered("raised_hands");
    assert.equal(await reply(MAYA, "Ready for QA"), true);
    assert.equal(a.staged.length, 0);
    assert.equal(a.said.length, 2);
    assert.equal(a.said[1]!.text, "That isn't one of the card's Design Status options. Reply with one of: 1. Shipped · 2. Under Dev · 3. Need PRD / Under Playground · 4. Ready for Design · 5. WIP · 6. Archived");
    // After one re-post, an ordinary reply is the thread's own.
    assert.equal(await reply(MAYA, "hmm, let me check"), false);
    assert.equal(a.said.length, 2);
    // A pick still counts.
    assert.equal(await reply(MAYA, "under dev"), true);
    assert.equal((a.staged[0]!.card.operations[0]!.input.properties as Record<string, string>)["Design Status"], "Under Dev");
  });

  it("the choice closes with its 72 h: a later pick is the thread's own", async () => {
    const { a, reply } = await answered("raised_hands");
    a.clock.now += 73 * 60 * 60 * 1000;
    assert.equal(await reply(MAYA, "Shipped"), false);
    assert.equal(a.staged.length, 0);
  });

  it("only the owner's reply counts", async () => {
    const { a, reply } = await answered("raised_hands");
    assert.equal(await reply(BEA, "Shipped"), false);
    assert.equal(await reply(BEA, "1"), false);
    assert.equal(a.staged.length, 0);
    assert.equal(a.said.length, 1);
  });

  it("a reaction from anyone but the owner lists nothing", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    await morning(store, rm, at(30, 13)).run();
    const row = only(store);
    const a = answers(store, rm);
    await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "raised_hands", userId: BEA }, a.deps);
    assert.equal(only(store).state, "nudged");
    assert.equal(a.said.length, 0);
  });

  it("settles on its own when someone comments before the morning", async () => {
    const store = createInMemoryCommitmentStore();
    const comments: Record<string, number | null> = {};
    const rm = roadmap({ cards: [stuck()], comments });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    comments.p1 = at(30, 12);
    const m = morning(store, rm, at(30, 13));
    await m.run();
    assert.equal(m.posts.length, 0);
    assert.equal(only(store).state, "auto_done");
  });

  it("one message a card a week: a card asked about days ago is not kept again", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    await morning(store, rm, at(30, 13)).run();
    const row = only(store);
    await store.update(row.id, { state: "done", resolvedAt: at(30, 15) });
    // Edited since, and stuck again by its own clock — but asked two days ago.
    rm.cards.set("p1", stuck({ lastEditedAt: at(30, 16) - 22 * DAY + DAY }));
    assert.equal((await runCardFollowThroughScan(SCAN, scanDeps(store, rm, at(32, 22)))).rows.length, 0);
  });
});

describe("shared rules", () => {
  it("nothing is posted in #uno-bot, and nothing goes to Notion but a proposal card", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    await store.update(only(store).id, { channel: UNO_BOT } as never);
    const m = morning(store, rm, at(30, 13));
    await m.run();
    assert.equal(m.posts.length, 0);
    // The ports hold no Notion comment write at all: a follow-up is a Slack post.
    assert.equal(only(store).state, "lapsed");
  });

  it("a follow-through card is staged in its own slot, for 72 h, confirmable by its confirmers", () => {
    const p = followThroughProposal(
      {
        card: { kind: "confirm", verb: "v", fields: [], caveats: [], operations: [{ toolName: "notion_update", input: {} }] },
        channel: DESIGN,
        channelKind: "public",
        threadTs: "1.2",
        confirmers: [MAYA],
        slot: "follow-through:card:p1",
      },
      { ts: "1.3", text: "card" },
    );
    assert.equal(p.ttlMs, FOLLOW_THROUGH_CARD_TTL_MS);
    assert.equal(p.ttlMs, 72 * 60 * 60 * 1000);
    assert.equal(p.supersedeKey, "follow-through:card:p1");
    assert.ok(p.supersedeKey!.startsWith(FOLLOW_THROUGH_KEY));
    assert.deepEqual(p.confirmers, [MAYA]);
    assert.equal(p.replyTs, "1.2");
    assert.equal(p.requesterUserId, "");
  });

  it("a ✅ on a card follow-up is the follow-up's, never the gate's", async () => {
    const { store } = await keptTodo();
    await morning(store, roadmap(), at(32, 13)).run();
    const row = only(store);
    const seen: string[] = [];
    const handled = await answerReminder(
      { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "white_check_mark", userId: MAYA },
      { store, update: async () => true, botUserId: async () => BOT, now: () => at(32, 15), cards: async (c) => void seen.push(c.id) },
    );
    assert.equal(handled, true);
    assert.deepEqual(seen, [row.id]);
  });

  it("the per-person cap counts card follow-ups beside promises", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({
      cards: [card({ pageId: "a" }), card({ pageId: "b", lastEditedAt: EOD - 9 * DAY }), card({ pageId: "c", lastEditedAt: EOD - 10 * DAY })],
    });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(30, 13));
    await m.run();
    // All three are Bea's to answer: two this morning, the third waits.
    assert.equal(m.posts.length, 2);
  });
});

// ── Review fixes ─────────────────────────────────────────────────────────────

describe("beside \"remind me\"", () => {
  it("a self_reminder still posts in the morning with the card handler on, and its 🙌 still marks it done", async () => {
    const store = createInMemoryCommitmentStore();
    const place = { channel: "D0MAYA", channelKind: "dm" as const, threadTs: ts(29, 18), messageTs: ts(29, 18), userId: MAYA };
    const set = await setSelfReminder({ when: "Thu", what: "review the PRD" }, place, { store, now: () => at(29, 18) });
    assert.ok(set.ok);
    const posts: Array<{ channel: string; ts: string }> = [];
    const seen: string[] = [];
    const deps: NudgeDeps = {
      slack: {
        replies: async () => ({ messages: [] }),
        history: async () => ({ messages: [] }),
        permalink: async () => null,
        async post(to) {
          const posted = { channel: to.channel, ts: `${posts.length + 1}.000001` };
          posts.push(posted);
          return { ok: true, ts: posted.ts };
        },
        update: async () => true,
      },
      sources: { read: async () => null },
      judge: { judge: async () => ({ ok: true, done: false, evidenceTs: [] }) },
      store,
      markThread: async () => {},
      config: { unoBot: UNO_BOT, botUserId: BOT },
      now: () => at(31, 13),
      runDate: utcDay(at(31, 13)),
      cards: { due: async (c) => (seen.push(c.id), { id: c.id, action: "auto_done" }) },
    };
    await runCommitmentNudges(NUDGE, deps);
    assert.deepEqual(seen, [], "no self_reminder reaches the card handler");
    assert.equal(posts.length, 1);
    assert.equal(posts[0]!.channel, "D0MAYA");
    const row = [...store.rows.values()][0]!;
    assert.equal(row.kind, "self_reminder");
    const cardsSaw: string[] = [];
    const handled = await answerReminder(
      { channel: "D0MAYA", messageTs: posts[0]!.ts, glyph: "raised_hands", userId: MAYA },
      { store, update: async () => true, botUserId: async () => BOT, now: () => at(31, 15), cards: async (c) => void cardsSaw.push(c.id) },
    );
    assert.equal(handled, true);
    assert.deepEqual(cardsSaw, []);
    assert.equal([...store.rows.values()][0]!.state, "done");
  });
});

describe("replies under a follow-up", () => {
  it("a short reply in an unmarked thread costs no D1 read", async () => {
    const store = createInMemoryCommitmentStore();
    let reads = 0;
    const counted = { ...store, byReminderTs: async (t: string) => (reads++, store.byReminderTs(t)) };
    const a = answers(store, roadmap());
    const handled = await handleCardReply({ channel: DESIGN, threadTs: "1790700000.000100", user: MAYA, text: "Shipped" }, { ...a.deps, store: counted });
    assert.equal(handled, false);
    assert.equal(reads, 0);
  });

  it("a D1 error in the card handler never runs a turn", async () => {
    const rm = roadmap();
    rm.marks.add(`${DESIGN}:1790700000.000100`);
    const a = answers(createInMemoryCommitmentStore(), rm);
    const broken = { ...a.deps.store, byReminderTs: async () => Promise.reject(new Error("D1_ERROR: no such table")) };
    const event = { type: "message", channel: DESIGN, thread_ts: "1790700000.000100", ts: "1790700100.000100", user: MAYA, text: "Shipped" } as SlackMessageEvent;
    let turns = 0;
    const outcome = await runMessageJob(event, {
      claim: async () => "claimed",
      markDone: async () => {},
      ...chainReplyHandlers([
        { name: "follow-through", candidate: () => true, handle: () => handleCardReplySafely({ channel: DESIGN, threadTs: event.thread_ts!, user: MAYA, text: "Shipped" }, { ...a.deps, store: broken }) },
      ]),
      engages: async () => false,
      turn: async () => void turns++,
    });
    assert.equal(outcome, "handled");
    assert.equal(turns, 0);
  });

  it("the reply chain tries each fitting handler in order, and a throw reaches the job, which runs the turn", async () => {
    const tried: string[] = [];
    const event = { type: "message", channel: DESIGN, ts: "1.1", user: MAYA, text: "x" } as SlackMessageEvent;
    const chain = chainReplyHandlers([
      { name: "a", candidate: () => true, handle: async () => (tried.push("a"), false) },
      { name: "b", candidate: () => false, handle: async () => (tried.push("b"), true) },
      { name: "c", candidate: () => true, handle: async () => (tried.push("c"), true) },
      { name: "d", candidate: () => true, handle: async () => (tried.push("d"), true) },
    ]);
    assert.equal(chain.disputeCandidate(event), true);
    assert.equal(await chain.dispute(event), true);
    assert.deepEqual(tried, ["a", "c"]);
    const throwing = chainReplyHandlers([{ name: "ds-precedence", candidate: () => true, handle: async () => Promise.reject(new Error("Slack down")) }]);
    await assert.rejects(throwing.dispute(event), /Slack down/);
    let turns = 0;
    await runMessageJob(event, {
      claim: async () => "claimed",
      markDone: async () => {},
      ...throwing,
      engages: async () => false,
      turn: async () => void turns++,
    });
    assert.equal(turns, 1, "as on main: a DS revision that throws leaves the reply to the turn");
  });

  it("the job tries only the handler the message was queued for, and none when it was queued for none", async () => {
    const tried: string[] = [];
    const handlers = [
      { name: "ds-precedence", candidate: () => true, handle: async () => (tried.push("ds"), false) },
      { name: "follow-through", candidate: () => true, handle: async () => (tried.push("card"), true) },
    ];
    const event = { type: "message", channel: DESIGN, thread_ts: "1.0", ts: "1.1", user: MAYA, text: "Shipped" } as SlackMessageEvent;
    assert.equal(await chainReplyHandlers(handlers, "follow-through").dispute(event), true);
    assert.deepEqual(tried, ["card"]);
    assert.equal(chainReplyHandlers(handlers, null).disputeCandidate(event), false);
    // Queued before the choice rode on the job: every fitting handler, by shape.
    assert.equal(chainReplyHandlers(handlers).disputeCandidate(event), true);
  });

  it("a job queued for a handler this code does not have tries every fitting handler, then the engagement check", async () => {
    const tried: string[] = [];
    const handlers = [
      { name: "ds-precedence", candidate: () => false, handle: async () => (tried.push("ds"), false) },
      { name: "follow-through", candidate: () => true, handle: async () => (tried.push("card"), false) },
    ];
    const event = { type: "message", channel: DESIGN, thread_ts: "1.0", ts: "1.1", user: MAYA, text: "Shipped" } as SlackMessageEvent;
    let engaged = 0;
    let turns = 0;
    await runMessageJob(event, {
      claim: async () => "claimed",
      markDone: async () => {},
      ...chainReplyHandlers(handlers, "from-a-later-version"),
      engages: async () => (engaged++, false),
      turn: async () => void turns++,
    });
    assert.deepEqual(tried, ["card"]);
    assert.equal(engaged, 1, "the reply takes the engagement check");
    assert.equal(turns, 0, "and runs no turn it would not have had");
  });

  it("an unmarked short reply is queued for no handler, and its job makes no extra claim or engagement check", async () => {
    const kv = { get: async () => null, put: async () => {} };
    const env = { PLUS_DESIGN_CHANNEL_ID: DESIGN, USAGE_DB: {}, HARNESS_KV: kv } as unknown as Env;
    const event = { type: "message", channel: DESIGN, thread_ts: "1790700000.000100", ts: "1790700100.000100", user: MAYA, text: "Shipped" } as SlackMessageEvent;
    const reply = await replyHandlerAt(env, event);
    assert.equal(reply, null);
    const claims: string[] = [];
    let engaged = 0;
    let turns = 0;
    await runMessageJob(event, {
      claim: async (key) => (claims.push(key), "claimed"),
      markDone: async () => {},
      ...chainReplyHandlers(replyHandlersFor(env), reply),
      engages: async () => (engaged++, true),
      turn: async () => void turns++,
    });
    assert.deepEqual(claims, [`msg:${DESIGN}:1790700100.000100`], "no dispute claim");
    assert.equal(engaged, 0, "the dispatch already asked");
    assert.equal(turns, 1);
  });

  it("a budget stop in the card handler runs no turn in a thread that does not otherwise engage", async () => {
    const rm = roadmap();
    rm.marks.add(`${DESIGN}:1790700000.000100`);
    const a = answers(createInMemoryCommitmentStore(), rm);
    const stopping = { ...a.deps.store, byReminderTs: async () => Promise.reject(new SubrequestBudgetError(1)) };
    const event = { type: "message", channel: DESIGN, thread_ts: "1790700000.000100", ts: "1790700100.000100", user: MAYA, text: "Shipped" } as SlackMessageEvent;
    let turns = 0;
    await runMessageJob(event, {
      claim: async () => "claimed",
      markDone: async () => {},
      ...chainReplyHandlers(
        [{ name: "follow-through", candidate: () => true, handle: () => handleCardReplySafely({ channel: DESIGN, threadTs: event.thread_ts!, user: MAYA, text: "Shipped" }, { ...a.deps, store: stopping }) }],
        "follow-through",
      ),
      engages: async () => false,
      turn: async () => void turns++,
    });
    assert.equal(turns, 0);
  });

  it("reaches a new card past fifty asked and untouched ones, in one D1 read", async () => {
    const store = createInMemoryCommitmentStore();
    const old = Array.from({ length: 50 }, (_, i) => card({ pageId: `old${i}`, lastEditedAt: EOD - (30 + i) * DAY }));
    const rm = roadmap({ cards: old });
    for (const c of old) {
      await store.addCommitments([
        { id: `card:${c.pageId}:unowned:${c.lastEditedAt}`, kind: "card_unowned", channel: DESIGN, channelKind: "public", threadTs: "", messageTs: "", promiserId: BEA, requesterId: null, deadlineAt: null, dueAt: 0, state: "lapsed", nudges: 2, snoozes: 0, confidence: 1, promisedAt: c.lastEditedAt, detectedAt: EOD - 20 * DAY, runDate: "2026-09-09", nudgeTs: null, followupTs: null, checkedOn: null, holds: 0, remindedOn: "2026-09-16", resolvedAt: 1, cardId: c.pageId },
      ]);
    }
    rm.cards.set("fresh", card({ pageId: "fresh", lastEditedAt: EOD - 8 * DAY }));
    let lookups = 0;
    const counted = { ...store, latestForCards: async (ids: readonly string[]) => (lookups++, store.latestForCards(ids)) };
    const report = await runCardFollowThroughScan(SCAN, { ...scanDeps(store, rm), store: counted });
    assert.deepEqual(report.rows.map((r) => r.cardId), ["fresh"]);
    assert.equal(lookups, 1);
  });

  it("never asks about a card uno-bot's own integration created", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card({ creatorId: "n-unobot" })], bot: "n-unobot" });
    assert.equal((await runCardFollowThroughScan(SCAN, scanDeps(store, rm))).rows.length, 0);
  });

  it("a budget stop between the wording and the row leaves no row without wording", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    const stopping = { ...store, addCommitments: async () => Promise.reject(new SubrequestBudgetError(1)) };
    await assert.rejects(runCardFollowThroughScan(SCAN, { ...scanDeps(store, rm), store: stopping }), SubrequestBudgetError);
    assert.equal(store.rows.size, 0);
    assert.equal(store.texts.size, 1, "the wording is there, and expires on its own");
  });

  it("F4 passes over the queue states: Ready for Design and Need PRD", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({
      cards: [card({ pageId: "q1", designStatus: "Ready for Design" }), card({ pageId: "q2", designStatus: "Need PRD / Under Playground" }), card({ pageId: "w", designStatus: "Under Review" })],
    });
    const report = await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    assert.deepEqual(report.rows.map((r) => r.cardId), ["w"]);
  });

  it("at most two new card questions a channel each morning", async () => {
    const store = createInMemoryCommitmentStore();
    const creators = ["n-bea", "n-maya", "n-bea"];
    const rm = roadmap({ cards: creators.map((creatorId, i) => card({ pageId: `c${i}`, creatorId, lastEditedAt: EOD - (8 + i) * DAY })) });
    // Three different people would each be asked, so the person cap is not what holds the third.
    rm.people.slackIdForNotionUser = async (id: string) => ({ "n-bea": BEA, "n-maya": MAYA })[id] ?? null;
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    assert.equal(store.rows.size, 3);
    const m = morning(store, rm, at(30, 13));
    await m.run();
    assert.equal(m.posts.length, 2);
  });
});

describe("one message, one row", () => {
  it("\"I'll file a card for X\" is kept once, as a card to-do, not also as a promise", async () => {
    const store = createInMemoryCommitmentStore();
    const FILE = ts(29, 16);
    const thread: SweepThread = {
      channel: DESIGN,
      channelKind: "public",
      rootTs: ROOT,
      messages: [
        { ts: ROOT, user: BEA, text: "The tutor filters need tracking." },
        { ts: FILE, user: MAYA, text: "I'll file a card for the tutor filters by Thu." },
      ],
    };
    const cardHook = cardTodoThreadHook({
      detector: modelCardTodoDetector(fakeProvider({ generateReplies: [JSON.stringify({ todos: [{ message_ts: FILE, assignee: MAYA, what: "the tutor filters", confidence: 0.9 }] })] })),
      store,
      config: CONFIG,
      now: () => EOD,
      runDate: utcDay(EOD),
    });
    const promiseHook = commitmentThreadHook({
      detector: modelCommitmentDetector(
        fakeProvider({ generateReplies: [JSON.stringify({ commitments: [{ message_ts: FILE, promiser: MAYA, requester: null, what: "file a card for the tutor filters", deadline: "Thu", confidence: 0.9 }] })] }),
      ),
      store,
      config: { unoBot: UNO_BOT },
      now: () => EOD,
      runDate: utcDay(EOD),
    });
    await cardHook(thread, ts(29, 0));
    await promiseHook(thread, ts(29, 0));
    assert.deepEqual([...store.rows.keys()], [cardTodoId(DESIGN, FILE)]);
  });
});

describe("F3 answers", () => {
  it("only ✅ drafts: 👍 does not", async () => {
    const { store } = await keptTodo();
    await morning(store, roadmap(), at(32, 13)).run();
    const row = only(store);
    const a = answers(store, roadmap());
    await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "+1", userId: MAYA }, a.deps);
    assert.equal(a.staged.length, 0);
    assert.equal(only(store).state, "nudged");
  });

  it("someone who posted in the thread may ask for the draft; an outsider may not", async () => {
    const { store } = await keptTodo();
    await morning(store, roadmap(), at(32, 13)).run();
    const row = only(store);
    const a = answers(store, roadmap());
    await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "white_check_mark", userId: ADE }, a.deps);
    assert.equal(a.staged.length, 0);
    await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "white_check_mark", userId: BEA }, a.deps);
    assert.equal(a.staged.length, 1);
    assert.deepEqual(new Set(a.staged[0]!.confirmers), new Set([MAYA, BEA]));
  });

  it("two drafts in one thread stand side by side, each in its own slot", async () => {
    const store = createInMemoryCommitmentStore();
    const SECOND = ts(29, 17);
    const thread: SweepThread = { ...todoThread, messages: [...todoThread.messages, { ts: SECOND, user: BEA, text: "and make a card for the booking empty states" }] };
    await recordThreadCardTodos(thread, ts(29, 0), {
      detector: modelCardTodoDetector(
        fakeProvider({
          generateReplies: [
            JSON.stringify({
              todos: [
                { message_ts: TODO, assignee: MAYA, what: "the facelift last stage", confidence: 0.9 },
                { message_ts: SECOND, assignee: null, what: "the booking empty states", confidence: 0.9 },
              ],
            }),
          ],
        }),
      ),
      store,
      config: CONFIG,
      now: () => EOD,
      runDate: utcDay(EOD),
    });
    const rm = roadmap();
    await morning(store, rm, at(32, 13)).run();
    const a = answers(store, rm);
    for (const row of store.rows.values()) {
      await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "white_check_mark", userId: BEA }, a.deps);
    }
    assert.equal(a.staged.length, 2);
    assert.equal(a.staged[0]!.threadTs, a.staged[1]!.threadTs);
    assert.notEqual(a.staged[0]!.slot, a.staged[1]!.slot);
  });

  it("a private channel's draft is staged as a private place's", async () => {
    const store = createInMemoryCommitmentStore();
    await recordThreadCardTodos({ ...todoThread, channelKind: "private" }, ts(29, 0), {
      detector: modelCardTodoDetector(fakeProvider({ generateReplies: [JSON.stringify({ todos: [{ message_ts: TODO, assignee: MAYA, what: "the facelift last stage", confidence: 0.9 }] })] })),
      store,
      config: CONFIG,
      now: () => EOD,
      runDate: utcDay(EOD),
    });
    await morning(store, roadmap(), at(32, 13)).run();
    const row = only(store);
    const a = answers(store, roadmap());
    await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "white_check_mark", userId: MAYA }, a.deps);
    assert.equal(a.staged[0]!.channelKind, "private");
  });
});

describe("running notes", () => {
  const NOTE_ID = "cccccccccccccccccccccccccccccccc";
  const noteRow = (over: Record<string, unknown> = {}) => ({
    id: NOTE_ID,
    url: `https://www.notion.so/${NOTE_ID}`,
    title: "Design sync 2026-09-29",
    lastEditedTime: "2026-09-29T20:00:00.000Z",
    parentDatabaseId: NOTES_DB,
    properties: {},
    people: { "Note Takers": ["Bea Note"] },
    ...over,
  });
  const notePage = () =>
    notionPage(NOTE_ID, {
      title: "Design sync",
      pillars: [],
      contributors: [],
      blocks: [{ id: "n-todo", lastEditedTime: "2026-09-29T20:00:00.000Z", text: "Bill to create a card for the facelift last stage" }],
    });

  it("the notes job hands a team note's new entries and takers to the card to-do hook", async () => {
    const h = sweepHarness({ channels: {}, sources: [notePage()], capture: true, notion: { notes: [noteRow()] }, people: { "Bea Note": BEA }, now: at(29, 22) });
    const got: Array<{ pageId: string; entries: Array<{ id: string; text: string }>; takers: string[] }> = [];
    h.deps.onNote = async (note) => void got.push(note);
    await runSweepJob({ key: "sweep:notes", kind: "sweep-notes" }, h.deps);
    assert.equal(got.length, 1);
    assert.equal(got[0]!.pageId, NOTE_ID);
    assert.deepEqual(got[0]!.entries.map((e) => e.id), ["n-todo"]);
    assert.deepEqual(got[0]!.takers, [BEA]);
  });

  it("a 1:1 note never reaches the card to-do hook", async () => {
    const h = sweepHarness({
      channels: {},
      sources: [notePage()],
      capture: true,
      notion: { notes: [noteRow({ title: "Bea / Bill 1:1" })] },
      people: { "Bea Note": BEA },
      now: at(29, 22),
    });
    let called = 0;
    h.deps.onNote = async () => void called++;
    await runSweepJob({ key: "sweep:notes", kind: "sweep-notes" }, h.deps);
    assert.equal(called, 0);
  });

  it("a note's to-do names its assignee when the name is one Slack member, else the takers", async () => {
    for (const [assignee, expected] of [["Maya Chen", [MAYA]], ["Somebody", [BEA, ADE]]] as const) {
      const store = createInMemoryCommitmentStore();
      const hook = cardTodoNoteHook({
        detector: modelCardTodoDetector(fakeProvider({ generateReplies: [JSON.stringify({ todos: [{ message_ts: "1.000000", assignee, what: "the facelift last stage", confidence: 0.9 }] })] })),
        store,
        people: roadmap().people,
        config: CONFIG,
        now: () => EOD,
        runDate: utcDay(EOD),
      });
      await hook({ pageId: NOTE_ID, url: `https://www.notion.so/${NOTE_ID}`, entries: [{ id: "n-todo", text: "Maya to create a card for the facelift last stage", at: at(29, 17) }], takers: [BEA, ADE] });
      const row = only(store);
      assert.equal(row.id, `note:${NOTE_ID}:n-todo`);
      assert.deepEqual([row.promiserId, ...(store.texts.get(row.id)!.text.mentions ?? [])], expected);
    }
  });
});

describe("wiring", () => {
  const env = { USAGE_DB: {}, HARNESS_KV: {} } as unknown as Env;

  it("the channel read feeds the thread hooks, the notes job the note hook, and no other sweep kind either", () => {
    const channel = sweepHooks(env, { key: "sweep:C0DESIGN", kind: "sweep-channel", channel: "C0DESIGN" }, { dryRun: false, runDate: utcDay(EOD) });
    assert.deepEqual(Object.keys(channel), ["onThread"]);
    const notes = sweepHooks(env, { key: "sweep:notes", kind: "sweep-notes" }, { dryRun: false, runDate: utcDay(EOD) });
    assert.deepEqual(Object.keys(notes), ["onNote"]);
    assert.deepEqual(sweepHooks(env, { key: "sweep:cards", kind: "sweep-cards" }, { dryRun: false, runDate: utcDay(EOD) }), {});
    assert.deepEqual(sweepHooks(env, { key: "sweep:group-dms", kind: "sweep-group-dms" }, { dryRun: false, runDate: utcDay(EOD) }), {});
  });

  it("with no usage database there are no hooks at all", () => {
    const bare = {} as Env;
    assert.deepEqual(sweepHooks(bare, { key: "sweep:C0DESIGN", kind: "sweep-channel", channel: "C0DESIGN" }, { dryRun: false, runDate: utcDay(EOD) }), {});
    assert.deepEqual(sweepHooks(bare, { key: "sweep:notes", kind: "sweep-notes" }, { dryRun: false, runDate: utcDay(EOD) }), {});
    assert.equal(threadHooks(bare, { dryRun: false, runDate: utcDay(EOD) }), undefined);
  });

  it("the message job tries a typed gate emoji in a DS precedence thread first, then a Figma decision's rewording, then the card follow-up reply — no typed answer to a drift card", () => {
    const handlers = replyHandlersFor({ PLUS_DESIGN_CHANNEL_ID: DESIGN, USAGE_DB: {}, HARNESS_KV: {} } as unknown as Env);
    assert.deepEqual(handlers.map((h) => h.name), ["ds-precedence", "figma-decisions", "follow-through"]);
    const card = handlers[2]!;
    const reply = { type: "message", channel: DESIGN, thread_ts: "1790700000.000100", ts: "1790700100.000100", user: MAYA, text: "Shipped" } as SlackMessageEvent;
    assert.equal(card.candidate(reply), true, "a short reply in a design thread is the card handler's to check");
    assert.equal(card.candidate({ ...reply, thread_ts: undefined }), false, "a top-level message is never a follow-up reply");
  });
});

// ── Re-review ────────────────────────────────────────────────────────────────

/** A card row due at `dueAt`, for the morning's budgets. */
function cardRow(id: string, over: Partial<CommitmentRecord> = {}): CommitmentRecord {
  return {
    id,
    kind: "card_stale",
    channel: DESIGN,
    channelKind: "public",
    threadTs: "",
    messageTs: "",
    promiserId: MAYA,
    requesterId: null,
    deadlineAt: null,
    dueAt: at(29, 22),
    state: "open",
    nudges: 0,
    snoozes: 0,
    confidence: 1,
    promisedAt: at(1, 12),
    detectedAt: at(29, 22),
    runDate: "2026-09-29",
    nudgeTs: null,
    followupTs: null,
    checkedOn: null,
    holds: 0,
    remindedOn: null,
    resolvedAt: null,
    cardId: id,
    ...over,
  };
}

/** A morning's commitment job over a quiet Slack, with a card handler. */
function quietMorning(store: InMemoryCommitmentStore, now: number, cards?: NudgeDeps["cards"]) {
  const posts: Array<{ channel: string; ts: string }> = [];
  const deps: NudgeDeps = {
    slack: {
      replies: async () => ({ messages: [] }),
      history: async () => ({ messages: [] }),
      permalink: async () => null,
      async post(to) {
        const posted = { channel: to.channel, ts: `${posts.length + 1}.000001` };
        posts.push(posted);
        return { ok: true, ts: posted.ts };
      },
      update: async () => true,
    },
    sources: { read: async () => null },
    judge: { judge: async () => ({ ok: true, done: false, evidenceTs: [] }) },
    store,
    markThread: async () => {},
    config: { unoBot: UNO_BOT, botUserId: BOT },
    now: () => now,
    runDate: utcDay(now),
    ...(cards ? { cards } : {}),
  };
  return { posts, run: () => runCommitmentNudges(NUDGE, deps) };
}

describe("the morning's two budgets", () => {
  it("a person with five card follow-ups and a \"remind me\" due gets the reminder this morning, and two card posts beside it", async () => {
    const store = createInMemoryCommitmentStore();
    await store.addCommitments([1, 2, 3, 4, 5].map((n) => cardRow(`card:c${n}`)));
    const place = { channel: "D0MAYA", channelKind: "dm" as const, threadTs: ts(29, 18), messageTs: ts(29, 18), userId: MAYA };
    const set = await setSelfReminder({ when: "Thu", what: "review the PRD" }, place, { store, now: () => at(29, 18) });
    assert.ok(set.ok);
    const asked: string[] = [];
    const m = quietMorning(store, at(31, 13), {
      async due(c, _now, runDate) {
        asked.push(c.id);
        await store.update(c.id, { state: "nudged", nudges: 1, checkedOn: runDate, remindedOn: runDate });
        return { id: c.id, action: "nudged" };
      },
    });
    await m.run();
    const reminder = [...store.rows.values()].find((r) => r.kind === "self_reminder")!;
    assert.equal(reminder.state, "nudged", "the reminder went out");
    assert.equal(m.posts[0]!.channel, "D0MAYA", "and before any card");
    assert.equal(asked.length, MAX_CARD_REMINDERS_PER_PERSON);
  });
});

describe("a kind this Worker does not know", () => {
  it("is held, and lapses after three held mornings like any other hold", async () => {
    const store = createInMemoryCommitmentStore();
    await store.addCommitments([cardRow("x:1", { kind: "card_future" as CommitmentRecord["kind"], cardId: null })]);
    for (const day of [1, 2, 5]) await quietMorning(store, Date.UTC(2026, 9, day, 13)).run();
    const row = [...store.rows.values()][0]!;
    assert.equal(row.state, "lapsed");
    assert.equal(row.holds, 3);
  });
});

describe("the nightly scan's skip marks", () => {
  it("fifty cards with nobody to ask and one new card: a budget stop keeps its marks, the retry reads none of them again and reaches the new card", async () => {
    const store = createInMemoryCommitmentStore();
    const ghosts = Array.from({ length: 50 }, (_, i) => card({ pageId: `g${String(i).padStart(2, "0")}`, creatorId: "n-ghost", lastEditedAt: EOD - (40 - i / 10) * DAY }));
    const rm = roadmap({ cards: [...ghosts, card({ pageId: "fresh", lastEditedAt: EOD - 8 * DAY })] });
    const looked: string[] = [];
    const people = { ...rm.people, slackIdForNotionUser: async (id: string) => (looked.push(id), rm.people.slackIdForNotionUser(id)) };
    let marks: Record<string, number> = {};
    const skips = { read: async () => ({ ...marks }), write: async (m: Record<string, number>) => void (marks = { ...m }) };
    let left = 40;
    const meter = { headroom: () => ({ subrequests: left--, d1Queries: 40 }) };
    await assert.rejects(runCardFollowThroughScan(SCAN, { ...scanDeps(store, rm), people, skips, meter }), SubrequestBudgetError);
    const firstRun = looked.length;
    assert.ok(firstRun > 0 && firstRun < 50);
    assert.equal(Object.keys(marks).length, firstRun, "every card passed over is marked");
    looked.length = 0;
    const report = await runCardFollowThroughScan(SCAN, { ...scanDeps(store, rm), people, skips });
    assert.equal(looked.length, 51 - firstRun, "the marked cards are not read again");
    assert.deepEqual(report.rows.map((r) => r.cardId), ["fresh"]);
    looked.length = 0;
    await runCardFollowThroughScan(SCAN, { ...scanDeps(store, rm), people, skips });
    assert.equal(looked.length, 0, "the next night reads none of them either");
  });

  it("a stale card with a recent comment is passed over until the comment is three weeks old", async () => {
    const store = createInMemoryCommitmentStore();
    const stale = card({ contributors: [{ id: "n-maya", name: "Maya Chen" }], lastEditedAt: EOD - 30 * DAY });
    const commented = EOD - 2 * DAY;
    const rm = roadmap({ cards: [stale], comments: { p1: commented } });
    let marks: Record<string, number> = {};
    const skips = { read: async () => ({ ...marks }), write: async (m: Record<string, number>) => void (marks = { ...m }) };
    await runCardFollowThroughScan(SCAN, { ...scanDeps(store, rm), skips });
    assert.deepEqual(Object.values(marks), [commented + 21 * DAY]);
  });
});

describe("a card's Contributors", () => {
  it("keep each id beside its own name, whatever has no name", () => {
    const row = {
      id: "p1",
      url: "https://www.notion.so/p1",
      title: "Card",
      lastEditedTime: "2026-09-20T12:00:00.000Z",
      parentDatabaseId: null,
      properties: {},
      people: { Contributor: ["Maya Chen"] },
      persons: { Contributor: [{ id: "n-bot", name: "" }, { id: "n-maya", name: "Maya Chen" }] },
      values: {},
      createdById: null,
    };
    assert.deepEqual(toActiveCard(row).contributors, [
      { id: "n-bot", name: "" },
      { id: "n-maya", name: "Maya Chen" },
    ]);
  });
});

// ── Button taps ──────────────────────────────────────────────────────────────
//
// A tap is a deliberate answer, so anyone may give one; a reaction can be a
// casual "seen", so it still counts only from the people asked. A tap that
// changes nothing says why.

describe("a tap on a card follow-up's buttons", () => {
  const tap = (row: CommitmentRecord, glyph: string, userId: string, messageTs = row.nudgeTs!) =>
    ({ channel: DESIGN, messageTs, glyph, userId, via: "button" as const });

  async function stuckAsked() {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    await morning(store, rm, at(30, 13)).run();
    return { store, rm, row: only(store), a: answers(store, rm) };
  }
  const stuck = (over: Partial<ActiveCard> = {}) =>
    card({ designStatus: "Under Review", contributors: [{ id: "n-maya", name: "Maya Chen" }], lastEditedAt: EOD - 22 * DAY, ...over });

  it("Drop it from someone the follow-up never asked drops a to-do, and the edit names them", async () => {
    const { store } = await keptTodo();
    const rm = roadmap();
    await morning(store, rm, at(32, 13)).run();
    const row = only(store);
    const a = answers(store, rm);
    assert.equal(await answerCardFollowUp(row, tap(row, "no_good", ADE), a.deps), undefined);
    assert.equal(only(store).state, "dropped");
    assert.equal(a.edits[0]!.footer, `Understood. I won't ask again. Answered by <@${ADE}>.`);
  });

  it("Draft it from anyone stages the draft, and they may confirm it beside the people named", async () => {
    const { store } = await keptTodo();
    await morning(store, roadmap(), at(32, 13)).run();
    const row = only(store);
    const a = answers(store, roadmap());
    await answerCardFollowUp(row, tap(row, "white_check_mark", ADE), a.deps);
    assert.equal(a.staged.length, 1);
    assert.deepEqual(new Set(a.staged[0]!.confirmers), new Set([MAYA, ADE]));
  });

  it("a tap on a follow-up already answered says so", async () => {
    const { store } = await keptTodo();
    await morning(store, roadmap(), at(32, 13)).run();
    const a = answers(store, roadmap());
    await answerCardFollowUp(only(store), tap(only(store), "no_good", MAYA), a.deps);
    assert.deepEqual(await answerCardFollowUp(only(store), tap(only(store), "white_check_mark", ADE), a.deps), {
      refused: "This one's already been answered, so that tap changed nothing.",
    });
    assert.equal(a.staged.length, 0);
  });

  it("two answers at once: one lands, the other is told it was already answered", async () => {
    const { store, row, a } = await stuckAsked();
    const results = await Promise.all([
      answerCardFollowUp(row, tap(row, "no_good", ADE), a.deps),
      answerCardFollowUp(row, tap(row, "hourglass_flowing_sand", BEA), a.deps),
    ]);
    assert.equal(results.filter((r) => r === undefined).length, 1);
    assert.deepEqual(results.find((r) => r !== undefined), { refused: "This one's already been answered, so that tap changed nothing." });
    assert.equal(a.edits.length, 1);
    assert.notEqual(only(store).state, "nudged");
  });

  it("a stuck card's Done from anyone lists the options for them; their pick counts, a bystander's does not, and the last edit still names them", async () => {
    const { store, row, a } = await stuckAsked();
    await answerCardFollowUp(row, tap(row, "raised_hands", BEA), a.deps);
    assert.equal(only(store).state, "done");
    assert.match(a.said[0]!.text, /^<@U0BEA> Which Design Status/);
    assert.equal(a.edits[0]!.footer, `Nice. Pick the card's new Design Status in this thread. Answered by <@${BEA}>.`);
    const reply = (user: string, text: string) => handleCardReply({ channel: DESIGN, threadTs: row.nudgeTs!, user, text }, a.deps);
    assert.equal(await reply(ADE, "Shipped"), false);
    assert.equal(a.staged.length, 0);
    assert.equal(await reply(BEA, "Shipped"), true);
    assert.equal(a.staged.length, 1);
    assert.ok(a.staged[0]!.confirmers.includes(BEA));
    assert.equal(a.edits.at(-1)!.footer, `Thanks. The status change is in this thread; a ✅ there applies it. Answered by <@${BEA}>.`);
  });

  it("Still on it from anyone on the follow-up a week on snoozes it, and names them", async () => {
    const { store, rm } = await stuckAsked();
    await morning(store, rm, at(42, 13)).run(); // the first morning past a week
    const row = only(store);
    assert.ok(row.followupTs);
    const a = answers(store, rm);
    await answerCardFollowUp(row, tap(row, "hourglass_flowing_sand", ADE, row.followupTs!), a.deps);
    assert.equal(only(store).state, "snoozed");
    assert.equal(a.edits[0]!.ts, row.followupTs);
    assert.equal(a.edits[0]!.footer, `Got it. I'll leave it be for now. Answered by <@${ADE}>.`);
  });

  it("Still on it past the snooze cap says it can't be put off again", async () => {
    const { store, row, a } = await stuckAsked();
    await store.update(row.id, { snoozes: 2 });
    assert.deepEqual(await answerCardFollowUp(only(store), tap(row, "hourglass_flowing_sand", MAYA), a.deps), {
      refused: "This can't be put off again, so that tap changed nothing.",
    });
    assert.equal(only(store).state, "nudged");
  });

  it("an answer whose message could not be edited still lands, and says it was recorded", async () => {
    const { store, row, a } = await stuckAsked();
    a.deps.update = async () => false;
    assert.deepEqual(await answerCardFollowUp(row, tap(row, "hourglass_flowing_sand", MAYA), a.deps), { unedited: true });
    assert.equal(only(store).state, "snoozed");
  });
});
