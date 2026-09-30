// Card follow-ups (Follow through F3–F5), a week at a time: the end of day
// keeps a to-do or a card, the weekday morning run settles it on its evidence
// or asks its owner, and the answer stages a proposal card.
//
// Everything runs against fakes: a Roadmap of plain objects, recorded model
// replies, a recording Slack, and the in-memory commitment store.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { fakeProvider } from "../src/agent/providers/fake";
import type { ScheduledJob } from "../src/scheduled/runs";
import type { SweepThread } from "../src/sweep/index";
import {
  answerReminder,
  createInMemoryCommitmentStore,
  runCommitmentNudges,
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
  handleCardOwnerReply,
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
import { at, BOT, DESIGN, ts, UNIVERSAL, UNO_BOT } from "./helpers/sweep-harness";

const SCAN: ScheduledJob = { key: "card-follow-through", kind: "card-follow-through" };
const NUDGE: ScheduledJob = { key: "commitment-nudge", kind: "commitment-nudge" };
const DAY = 24 * 60 * 60 * 1000;

const LEAD = "U0LEAD";
const MAYA = "U0MAYA";
const BEA = "U0BEA";
const ADE = "U0ADE";
const CONFIG: FollowThroughConfig = { plusDesign: DESIGN, plusUniversal: UNIVERSAL, unoBot: UNO_BOT, botUserId: BOT };

const ROOT = ts(29, 14); // Tue 2026-09-29, 10:00 ET
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
function roadmap(opts: { cards?: ActiveCard[]; comments?: Record<string, number | null>; titles?: string[]; pillars?: string[] } = {}) {
  const cards = new Map((opts.cards ?? []).map((c) => [c.pageId, c] as const));
  const slackByName: Record<string, string> = { "Bea Ruiz": BEA, "Maya Chen": MAYA, "Ade Obi": ADE };
  const nameByNotion: Record<string, string> = { "n-bea": "Bea Ruiz", "n-maya": "Maya Chen", "n-lead": "Lead Person" };
  const notionBySlack: Record<string, string> = { [MAYA]: "n-maya", [BEA]: "n-bea" };
  return {
    cards,
    reads: {
      activeCards: async () => ({ cards: [...cards.values()], truncated: false }),
      card: async (id: string) => cards.get(id) ?? null,
      lastCommentAt: async (id: string) => opts.comments?.[id] ?? null,
      titlesMatching: async () => opts.titles ?? [],
      pillarOptions: async () => opts.pillars ?? ["Tutor", "Universal"],
    },
    people: {
      slackIdForName: async (name: string) => slackByName[name] ?? null,
      slackIdForNotionUser: async (id: string) => slackByName[nameByNotion[id] ?? ""] ?? null,
      notionUserForSlack: async (id: string) => notionBySlack[id] ?? null,
    },
  };
}

function scanDeps(store: InMemoryCommitmentStore, rm: ReturnType<typeof roadmap>, now = EOD): ScanDeps {
  return { reads: rm.reads, people: rm.people, store, config: CONFIG, now: () => now };
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
    cards: cardFollowUps(due),
  };
  return { run: () => runCommitmentNudges(NUDGE, deps), posts, marked };
}

/** The answer side: what was staged, edited and said. */
function answers(store: InMemoryCommitmentStore, rm: ReturnType<typeof roadmap>, config: FollowThroughConfig = CONFIG) {
  const staged: CardProposal[] = [];
  const edits: Array<{ ts: string; text: string; footer: string }> = [];
  const said: string[] = [];
  const deps: AnswerDeps = {
    store,
    reads: rm.reads,
    people: rm.people,
    async update(_channel, t, message) {
      const footer = (message.blocks[1] as { elements: { text: string }[] }).elements[0]!.text;
      edits.push({ ts: t, text: message.text, footer });
      return true;
    },
    async post(_to, text) {
      said.push(text);
    },
    async stage(p) {
      staged.push(p);
      return true;
    },
    config,
    now: () => at(32, 15),
  };
  return { deps, staged, edits, said };
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
    const m = morning(store, rm, at(32, 14)); // Fri 10:00 ET
    const report = await m.run();
    assert.equal(only(store).state, "auto_done");
    assert.equal(m.posts.length, 0);
    assert.match(report.summary, /1 auto_done/);
  });

  it("with no card, gets one offer in its thread, and its ✅ stages the drafted card", async () => {
    const { store } = await keptTodo();
    const rm = roadmap({ titles: ["Facelift kickoff"] });
    const m = morning(store, rm, at(32, 14));
    await m.run();
    assert.equal(m.posts.length, 1);
    const [offer] = m.posts;
    assert.equal(offer!.channel, DESIGN);
    assert.equal(offer!.threadTs, ROOT);
    assert.match(offer!.text, /Want me to draft the card for the facelift last stage\?/);
    assert.deepEqual(mentions(offer!.text), [MAYA]);
    assert.equal(only(store).state, "nudged");

    // The same morning again posts nothing more.
    await morning(store, rm, at(32, 14, 30)).run();

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
    await morning(store, rm, at(32, 14)).run();
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
    const first = morning(store, rm, at(32, 14));
    await first.run();
    // Two working days on is too soon: one message a card a week.
    const early = morning(store, rm, at(36, 14));
    await early.run();
    assert.equal(early.posts.length, 0);
    const second = morning(store, rm, at(42, 14)); // Mon Oct 12, the first morning past a week
    await second.run();
    assert.equal(second.posts.length, 1);
    assert.match(second.posts[0]!.text, /Still want that card drafted\?/);
    const third = morning(store, rm, at(50, 14));
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
      { store, config: CONFIG, now: () => EOD },
    );
    const row = only(store);
    assert.equal(row.channel, DESIGN);
    assert.equal(row.threadTs, "");
    const m = morning(store, roadmap(), at(32, 14));
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
    const m = morning(store, rm, at(30, 14));
    await m.run();
    assert.equal(m.posts.length, 1);
    assert.equal(m.posts[0]!.channel, DESIGN);
    assert.equal(m.posts[0]!.threadTs, null);
    assert.match(m.posts[0]!.text, /Who's taking <https:\/\/www\.notion\.so\/p1\|Facelift — last stage>\?/);
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
    const m = morning(store, rm, at(30, 14));
    await m.run();
    assert.equal(m.posts.length, 0);
    assert.equal(only(store).state, "auto_done");
  });

  it("a reply naming someone stages the Contributor change; ✅ on that card applies it", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(30, 14));
    await m.run();
    const question = m.posts[0]!;
    const a = answers(store, rm);
    const handled = await handleCardOwnerReply({ channel: DESIGN, threadTs: question.ts, user: BEA, text: "<@U0MAYA> is taking it" }, a.deps);
    assert.equal(handled, true);
    assert.equal(a.staged.length, 1);
    const p = a.staged[0]!;
    assert.deepEqual(p.card.operations, [
      { toolName: "notion_update", input: { page_url: "https://www.notion.so/p1", properties: { Contributor: "n-maya" } } },
    ]);
    assert.equal(p.threadTs, question.ts);
    assert.deepEqual(new Set(p.confirmers), new Set([BEA, MAYA]));
    assert.equal(only(store).state, "done");

    // A reply in any other thread is not this job's.
    assert.equal(await handleCardOwnerReply({ channel: DESIGN, threadTs: "1.1", user: BEA, text: "<@U0MAYA> yes" }, a.deps), false);
  });

  it("a named person with no Notion match gets a plain answer and no card", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(30, 14));
    await m.run();
    const a = answers(store, rm);
    assert.equal(await handleCardOwnerReply({ channel: DESIGN, threadTs: m.posts[0]!.ts, user: BEA, text: "<@U0ADE> maybe" }, a.deps), true);
    assert.equal(a.staged.length, 0);
    assert.match(a.said[0]!, /can't match <@U0ADE>/);
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
    const m = morning(store, rm, at(30, 14));
    await m.run();
    assert.equal(m.posts[0]!.channel, UNIVERSAL);
    assert.match(m.posts[0]!.text, /Still moving\?/);
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

  it("🙌 stages the configured status change; unset, it is only recorded", async () => {
    for (const doneStatus of ["Ready for QA", undefined]) {
      const store = createInMemoryCommitmentStore();
      const rm = roadmap({ cards: [stuck()] });
      await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
      await morning(store, rm, at(30, 14)).run();
      const row = only(store);
      const a = answers(store, rm, { ...CONFIG, ...(doneStatus ? { doneStatus } : {}) });
      // Not the Contributor: nothing happens.
      await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "raised_hands", userId: BEA }, a.deps);
      assert.equal(only(store).state, "nudged");
      await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "raised_hands", userId: MAYA }, a.deps);
      assert.equal(only(store).state, "done");
      if (doneStatus) {
        assert.deepEqual(a.staged[0]!.card.operations[0]!.input, { page_url: "https://www.notion.so/p1", properties: { "Design Status": "Ready for QA" } });
      } else {
        assert.equal(a.staged.length, 0);
      }
    }
  });

  it("settles on its own when someone comments before the morning", async () => {
    const store = createInMemoryCommitmentStore();
    const comments: Record<string, number | null> = {};
    const rm = roadmap({ cards: [stuck()], comments });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    comments.p1 = at(30, 12);
    const m = morning(store, rm, at(30, 14));
    await m.run();
    assert.equal(m.posts.length, 0);
    assert.equal(only(store).state, "auto_done");
  });

  it("one message a card a week: a card asked about days ago is not kept again", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    await morning(store, rm, at(30, 14)).run();
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
    const m = morning(store, rm, at(30, 14));
    await m.run();
    assert.equal(m.posts.length, 0);
    // The ports hold no Notion comment write at all: a follow-up is a Slack post.
    assert.equal(only(store).state, "lapsed");
  });

  it("a follow-through card is staged in its own slot, for 72 h, confirmable by its confirmers", () => {
    const p = followThroughProposal(
      { card: { kind: "confirm", verb: "v", fields: [], caveats: [], operations: [{ toolName: "notion_update", input: {} }] }, channel: DESIGN, threadTs: "1.2", confirmers: [MAYA] },
      { ts: "1.3", text: "card" },
    );
    assert.equal(p.ttlMs, FOLLOW_THROUGH_CARD_TTL_MS);
    assert.equal(p.ttlMs, 72 * 60 * 60 * 1000);
    assert.equal(p.supersedeKey, FOLLOW_THROUGH_KEY);
    assert.deepEqual(p.confirmers, [MAYA]);
    assert.equal(p.replyTs, "1.2");
    assert.equal(p.requesterUserId, "");
  });

  it("a ✅ on a card follow-up is the follow-up's, never the gate's", async () => {
    const { store } = await keptTodo();
    await morning(store, roadmap(), at(32, 14)).run();
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
    const m = morning(store, rm, at(30, 14));
    await m.run();
    // All three are Bea's to answer: two this morning, the third waits.
    assert.equal(m.posts.length, 2);
  });
});
