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
  throughDirectory,
  type ActiveCard,
  type AnswerDeps,
  type CardProposal,
  type DueDeps,
  type FollowThroughConfig,
  type FollowUpHandOff,
  type ScanDeps,
  followUpsForSweep,
  handOffIn,
} from "../src/follow-through/index";
import { STALE_CARDS_SECTION } from "../src/sweep/sections";
import { at, BOT, DESIGN, drift, msg, NOTES_DB, notionPage, reply, sweepHarness, ts, UNIVERSAL, UNO_BOT, utcDay } from "./helpers/sweep-harness";
import { createInMemoryRunnerStorage } from "../src/runner/storage";
import { recordingViews } from "./helpers/recording-slack";
import { gapNotes, type GapNotes, type StoredTeamRoles } from "../src/usage/index";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";
import type { GateVerdict } from "../src/gate/index";
import { createInMemoryThreadState, type PendingProposal, type ThreadState } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import { runReviewDecision, type ReviewDoorDeps } from "../src/slack/review-door";
import { currentReport, itemProposal } from "../src/slack/decision-cards";
import { ANSWER_ON_CARD } from "../src/follow-through/copy";
import { notified } from "./helpers/notified";

const SCAN: ScheduledJob = { key: "card-follow-through", kind: "card-follow-through" };
const NUDGE: ScheduledJob = { key: "commitment-nudge", kind: "commitment-nudge" };
const DAY = 24 * 60 * 60 * 1000;

const LEAD = "U0LEAD";
const MAYA = "U0MAYA";
const BEA = "U0BEA";
const ADE = "U0ADE";
const TOOLKIT = "C0TOOLKIT";
const CONFIG: FollowThroughConfig = { plusDesign: DESIGN, plusUniversal: UNIVERSAL, plusToolkit: TOOLKIT, unoBot: UNO_BOT, botUserId: BOT };

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
      // A known name is searched as given; otherwise the Notion user's name is read.
      slackIdForNotionUser: async (id: string, name?: string) => slackByName[name ?? nameByNotion[id] ?? ""] ?? null,
      notionUserForSlack: async (id: string) => notionBySlack[id] ?? null,
    },
  };
}

function scanDeps(store: InMemoryCommitmentStore, rm: ReturnType<typeof roadmap>, now = EOD): ScanDeps {
  return { reads: rm.reads, people: rm.people, store, config: CONFIG, now: () => now, runDate: utcDay(now) };
}

/** A posted message's cards, as Slack would draw them. */
type Card = { title: { text: string }; subtitle?: { text: string }; body: { text: string }; actions: Array<{ text: { text: string }; url?: string; action_id?: string }> };

/** The cards a message holds: one, or a carousel's. */
function cardsOf(blocks: unknown[]): Card[] {
  return (blocks as Array<{ type: string; elements?: Card[] }>).flatMap((b) => (b.type === "card" ? [b as unknown as Card] : b.type === "carousel" ? (b.elements ?? []) : []));
}

/** A morning's Slack, and the commitment job with the card handler. The
 *  thread store is the in-memory one, so a card's Review can be decided. */
function morning(
  store: InMemoryCommitmentStore,
  rm: ReturnType<typeof roadmap>,
  now: number,
  opts: { threadState?: ThreadState; failStage?: (p: PendingProposal) => boolean; meter?: NudgeDeps["meter"]; gaps?: GapNotes; handOff?: FollowUpHandOff; weeklyHandOff?: FollowUpHandOff } = {},
) {
  const posts: Array<{ channel: string; threadTs: string | null; text: string; blocks: unknown[]; cards: Card[]; ts: string }> = [];
  const edits: Array<{ ts: string; text: string; cards: Card[] }> = [];
  const marked: string[] = [];
  const staged: PendingProposal[] = [];
  const threadState = opts.threadState ?? createInMemoryThreadState({ now: () => now });
  let seq = 0;
  const due: DueDeps = {
    reads: rm.reads,
    people: rm.people,
    slack: {
      permalink: async (channel, t) => `https://plus.slack.com/archives/${channel}/p${t.replace(".", "")}`,
      async post(to, message) {
        seq += 1;
        const posted = { channel: to.channel, threadTs: to.threadTs, text: message.text, blocks: message.blocks, cards: cardsOf(message.blocks), ts: `${now / 1000}.${String(seq).padStart(6, "0")}` };
        posts.push(posted);
        return { ok: true, ts: posted.ts };
      },
      async edit(_channel, t, message) {
        edits.push({ ts: t, text: message.text, cards: cardsOf(message.blocks) });
      },
    },
    reports: threadState,
    async stage(p) {
      if (opts.failStage?.(p)) throw new Error("ThreadState refused it");
      staged.push(p);
      await threadState.putProposal(p);
    },
    store,
    markThread: async (channel, t) => void marked.push(`${channel}:${t}`),
    config: CONFIG,
    ...(opts.gaps ? { gaps: opts.gaps } : {}),
    ...(opts.handOff ? { handOff: opts.handOff } : {}),
    ...(opts.weeklyHandOff ? { weeklyHandOff: opts.weeklyHandOff } : {}),
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
    ...(opts.meter ? { meter: opts.meter } : {}),
  };
  return { run: () => runCommitmentNudges(NUDGE, deps), cards: deps.cards!, due, posts, edits, marked, staged, threadState };
}

/**
 * Every live row asked the way a follow-up was asked before the shared card:
 * a question with its own buttons, its body kept by its ts, and an F4
 * question's thread marked for replies. What a tap, a reaction or a typed
 * reply on such a message still answers.
 */
async function askedBefore(store: InMemoryCommitmentStore, rm: ReturnType<typeof roadmap>, opts: { at?: number; followUp?: boolean } = {}) {
  const at_ = opts.at ?? at(30, 13);
  let seq = 0;
  for (const row of [...store.rows.values()]) {
    seq += 1;
    const posted = `${at_ / 1000}.${String(seq).padStart(6, "0")}`;
    const asked = opts.followUp ? { nudges: 2, nudgeTs: `${at_ / 1000 - 7 * 86400}.${String(seq).padStart(6, "0")}`, followupTs: posted } : { nudges: 1, nudgeTs: posted };
    await store.update(row.id, { state: "nudged", remindedOn: utcDay(at_), dueAt: at_ + 7 * DAY, ...asked });
    const text = await store.text(row.id);
    await store.saveText(row.id, { ...text!, bodies: { ...text!.bodies, [posted]: "the question as it was posted" } }, at_ + 30 * DAY);
    if (row.kind === "card_unowned") rm.marks.add(`${row.channel}:${asked.nudgeTs}`);
  }
}

/**
 * A decision sent from one card's Review pop-up, through the review door: what
 * it ran, and the report's message as the door redrew it.
 *
 * @param edits - Picks kept on the card under Edit fields, carried to Approve
 */
async function review(
  threadState: ThreadState,
  posted: { ts: string },
  id: string,
  decision: "confirm" | "cancel",
  opts: { userId?: string; edits?: Record<string, string>; choice?: string } = {},
) {
  const ran: GateVerdict[] = [];
  const redrawn: Card[][] = [];
  const deps: ReviewDoorDeps = {
    threadState,
    views: recordingViews({ alreadyOpen: ["V1"] }).client,
    delivery: () => recordingDelivery(),
    applyVerdict: async (v) => {
      ran.push(v);
      return [{ toolName: v.execute?.toolName ?? "", ok: true, result: "{}", message: "Updated." }];
    },
    updateCard: async (_channel, _ts, message) => void redrawn.push(cardsOf(message.blocks ?? [])),
    restage: async () => {},
    revise: async () => {},
    fieldOptions: async (source) => (source.property === "Design Status" ? STATUSES : ["Tutor", "Universal"]),
  };
  const messageTs = itemProposal(posted.ts, id).proposalTs;
  for (const [key, value] of Object.entries(opts.edits ?? {})) await threadState.keepPick(messageTs, opts.userId ?? ADE, key, value);
  await runReviewDecision(
    {
      viewId: "V1",
      channel: DESIGN,
      messageTs,
      userId: opts.userId ?? ADE,
      decision,
      ...(opts.choice ? { choice: opts.choice } : {}),
    },
    deps,
  );
  return { ran, redrawn };
}

/** Words a card must not teach: a reaction gate, or a word to type. */
const GATE_WORDS = /✅|⛔|white_check_mark|no_entry|`drop|\bdrop \d|\bskip\b|\byes\b|\breply\b|\breact/i;

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

  it("with no card, gets one card in its thread, whose Review holds the drafted card and files it on anyone's Approve", async () => {
    const { store } = await keptTodo();
    const rm = roadmap({ titles: ["Facelift kickoff"] });
    const m = morning(store, rm, at(32, 13));
    await m.run();
    assert.equal(m.posts.length, 1);
    const [offer] = m.posts;
    assert.equal(offer!.channel, DESIGN);
    assert.equal(offer!.threadTs, ROOT);
    assert.equal(messageBlocksRefusal(offer!.blocks), null);
    assert.match(offer!.text, /^<@U0MAYA>, a to-do to make a Roadmap card came up, and I couldn't find the card\./);
    assert.deepEqual(notified(offer!), [MAYA], "the person asked is pinged from the main text");
    assert.deepEqual(mentions(offer!.text), [MAYA]);
    const [c] = offer!.cards;
    assert.equal(c!.title.text, "The facelift last stage");
    assert.equal(c!.subtitle!.text, "<@U0MAYA> · from this thread");
    assert.equal(c!.body.text, "No Roadmap card found for this. Review holds the drafted card.");
    assert.deepEqual(c!.actions.map((x) => x.text.text), ["Review", "Open source"]);
    assert.equal(c!.actions[1]!.url, `https://plus.slack.com/archives/${DESIGN}/p${TODO.replace(".", "")}`);
    const row = only(store);
    assert.equal(row.state, "nudged");
    assert.equal(row.nudgeTs, offer!.ts);

    // Review holds the drafted card, staged in the to-do's thread for anyone.
    assert.equal(m.staged.length, 1);
    const [op] = m.staged[0]!.operations!;
    assert.equal(op!.toolName, "notion_create");
    assert.equal(op!.input.surface, "prd");
    assert.equal(op!.input.title, "The facelift last stage");
    assert.equal(m.staged[0]!.threadTs, ROOT);
    assert.equal(m.staged[0]!.confirmers, undefined);
    assert.doesNotMatch(m.staged[0]!.proposalText, GATE_WORDS);
    // Posted into the team's own thread, it marks that thread: the replies
    // there are the team talking to each other, so only an @mention engages.
    assert.deepEqual(m.marked, [`${DESIGN}:${ROOT}`]);

    // The same morning again posts nothing more.
    const again = morning(store, rm, at(32, 13, 30));
    await again.run();
    assert.equal(again.posts.length, 0);

    const { ran, redrawn } = await review(m.threadState, offer!, row.id, "confirm", { userId: ADE });
    assert.equal(ran.length, 1);
    assert.equal(ran[0]!.execute?.operations?.[0]?.toolName, "notion_create");
    assert.match(redrawn.at(-1)![0]!.subtitle!.text, /^Approved by <@U0ADE>/);
  });

  it("rejected in Review, is dropped: no follow-up a week on", async () => {
    const { store } = await keptTodo();
    const rm = roadmap();
    const m = morning(store, rm, at(32, 13));
    await m.run();
    const { ran } = await review(m.threadState, m.posts[0]!, only(store).id, "cancel", { userId: MAYA });
    assert.ok(!ran.some((v) => v.execute), "nothing runs");
    const later = morning(store, rm, at(42, 13), { threadState: m.threadState });
    await later.run();
    assert.equal(later.posts.length, 0);
    assert.equal(only(store).state, "dropped");
  });

  it("posted before the shared card: 🙅 from the assignee drops it; from anyone else changes nothing", async () => {
    const { store } = await keptTodo();
    const rm = roadmap();
    await askedBefore(store, rm, { at: at(32, 13) });
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
    assert.match(second.posts[0]!.text, /^<@U0MAYA>, checking in once more on this to-do\./);
    assert.equal(second.posts[0]!.threadTs, ROOT);
    assert.deepEqual(second.posts[0]!.cards[0]!.actions.map((x) => x.text.text), ["Review", "Open source"]);
    assert.equal(only(store).followupTs, second.posts[0]!.ts);
    const third = morning(store, rm, at(50, 13));
    await third.run();
    assert.equal(third.posts.length, 0);
    assert.equal(only(store).state, "lapsed");
  });

  it("found in a test channel's thread, is asked in that thread, never in a team channel", async () => {
    const SANDBOX = "C0SANDBOX";
    const store = createInMemoryCommitmentStore();
    const provider = fakeProvider({
      generateReplies: [JSON.stringify({ todos: [{ message_ts: TODO, assignee: MAYA, what: "the facelift last stage", confidence: 0.9 }] })],
    });
    await recordThreadCardTodos({ ...todoThread, channel: SANDBOX }, ts(29, 0), {
      detector: modelCardTodoDetector(provider),
      store,
      config: CONFIG,
      now: () => EOD,
      runDate: utcDay(EOD),
    });
    const rm = roadmap({ titles: ["Facelift kickoff"] });
    const m = morning(store, rm, at(32, 13));
    await m.run();
    assert.deepEqual(m.posts.map((p) => [p.channel, p.threadTs]), [[SANDBOX, ROOT]]);
    // A week on, its one follow-up stays in the same thread.
    const later = morning(store, rm, at(39, 13));
    await later.run();
    assert.ok(later.posts.every((p) => p.channel === SANDBOX && p.threadTs === ROOT));
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
    const [c] = m.posts[0]!.cards;
    assert.equal(c!.subtitle!.text, "<@U0BEA> <@U0ADE> · from the running note");
    assert.match(m.posts[0]!.text, /\n• <@U0BEA> — .*\n• <@U0ADE> — /, "one bullet per taker");
    assert.deepEqual(c!.actions.map((x) => [x.text.text, x.url]), [["Review", undefined], ["Open source", "https://www.notion.so/note1"]]);
  });

  it("a drafted card's pillar is exact-matched against the Roadmap's options", async () => {
    const row = { id: "x", channel: UNIVERSAL, threadTs: ROOT } as CommitmentRecord;
    const text = { what: "the token audit", bodies: {} };
    const withIt = await draftCard(row, text, { reads: roadmap({ pillars: ["Tutor", "Universal"] }).reads, config: CONFIG });
    assert.deepEqual(withIt.operations[0]!.input.properties, { product_pillar: "Universal" });
    const without = await draftCard(row, text, { reads: roadmap({ pillars: ["universal (DS)"] }).reads, config: CONFIG });
    assert.equal(without.operations[0]!.input.properties, undefined);
    const toolkit = await draftCard({ ...row, channel: TOOLKIT }, text, { reads: roadmap({ pillars: ["Toolkit", "Universal"] }).reads, config: CONFIG });
    assert.deepEqual(toolkit.operations[0]!.input.properties, { product_pillar: "Toolkit" }, "a team channel's to-do takes its team's pillar");
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
    assert.match(m.posts[0]!.text, /^<@U0BEA>, a Roadmap card has been worked for over a week with no Contributor\./);
    assert.deepEqual(notified(m.posts[0]!), [BEA]);
    assert.deepEqual(mentions(m.posts[0]!.text), [BEA]);
    const [c] = m.posts[0]!.cards;
    assert.equal(c!.title.text, "Facelift — last stage");
    assert.equal(c!.subtitle!.text, "<@U0BEA> · WIP · no Contributor for a week");
    assert.deepEqual(c!.actions.map((x) => [x.text.text, x.url]), [["Review", undefined], ["Open card", "https://www.notion.so/p1"]]);
    // Posted at the channel's top, it starts a thread that is uno-bot's own:
    // nothing is marked, so a reply there engages uno-bot with no @mention.
    assert.deepEqual(m.marked, []);
    // The card says what each answer does.
    assert.equal(c!.body.text, "Who should take it? Assign makes the person asked its Contributor. Leave it sets nobody, and I won't ask again until the card changes.");
    // Review offers Assign the person asked, or Leave it; Assign sets them.
    assert.deepEqual(m.staged[0]!.operations, [
      { toolName: "notion_update", input: { page_url: "https://www.notion.so/p1", properties: { Contributor: "n-bea" } } },
    ]);
    assert.deepEqual(m.staged[0]!.choices!.map((x) => [x.value, x.label, x.verdict]), [
      ["assign", "Assign <@U0BEA>", "confirm"],
      ["leave", "Leave it", "cancel"],
    ]);
    const { ran, redrawn } = await review(m.threadState, m.posts[0]!, only(store).id, "confirm", { userId: MAYA, choice: "assign" });
    assert.deepEqual(ran[0]!.execute?.input.properties, { Contributor: "n-bea" });
    assert.equal(redrawn.at(-1)![0]!.subtitle!.text, "Assigned <@U0BEA> · <@U0MAYA>");
  });

  it("Leave it sets nobody, says so on the card, and is not asked again", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(30, 13));
    await m.run();
    const { ran, redrawn } = await review(m.threadState, m.posts[0]!, only(store).id, "cancel", { userId: BEA, choice: "leave" });
    assert.ok(!ran.some((v) => v.execute), "nothing runs");
    assert.equal(redrawn.at(-1)![0]!.subtitle!.text, "Left unassigned · <@U0BEA>");
    assert.equal(redrawn.at(-1)![0]!.body.text, "No Contributor set. Not asked again until the card changes.");
    const weekOn = morning(store, rm, at(39, 13), { threadState: m.threadState });
    await weekOn.run();
    assert.equal(weekOn.posts.length, 0);
    assert.equal(only(store).state, "dropped");
  });

  it("whose creator has no Notion match, posts no card and is checked again the next morning", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    rm.people.notionUserForSlack = async () => null;
    const m = morning(store, rm, at(30, 13));
    await m.run();
    assert.equal(m.posts.length, 0);
    assert.equal(only(store).state, "open");
    assert.equal(only(store).holds, 1);
    rm.people.notionUserForSlack = async () => "n-bea";
    const next = morning(store, rm, at(31, 13));
    await next.run();
    assert.equal(next.posts.length, 1);
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

  it("posted before the shared card: a reply naming exactly one person stages the Contributor change; the row settles only once the card shows it", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    await askedBefore(store, rm);
    const question = { ts: only(store).nudgeTs! };
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

  it("a proposal nobody applies lets the follow-up ask again, in its thread, on the shared card", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(30, 13));
    await m.run();
    const later = morning(store, rm, at(39, 13), { threadState: m.threadState }); // a week on, the card still unowned
    await later.run();
    assert.equal(later.posts.length, 1);
    assert.equal(later.posts[0]!.threadTs, m.posts[0]!.ts);
    assert.match(later.posts[0]!.text, /^<@U0BEA>, checking in once more on this card\./);
    assert.deepEqual(later.posts[0]!.cards[0]!.actions.map((x) => x.text.text), ["Review", "Open card"]);
    // Its own thread still: asking again there marks nothing either.
    assert.deepEqual(later.marked, []);
  });

  it("posted before the shared card: \"me\" names the replier; two people, or uno-bot, name nobody", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    await askedBefore(store, rm);
    const a = answers(store, rm);
    const reply = (user: string, text: string) => handleCardReply({ channel: DESIGN, threadTs: only(store).nudgeTs!, user, text }, a.deps);
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

  it("posted before the shared card: only someone the question asked may name the owner", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    await askedBefore(store, rm);
    const a = answers(store, rm);
    const thread = only(store).nudgeTs!;
    // The card's creator (Bea) was asked; Maya and Ade were not.
    assert.equal(await handleCardReply({ channel: DESIGN, threadTs: thread, user: MAYA, text: "I'll take it" }, a.deps), false);
    assert.equal(await handleCardReply({ channel: DESIGN, threadTs: thread, user: ADE, text: "<@U0MAYA>" }, a.deps), false);
    assert.equal(a.staged.length, 0);
  });

  it("on the shared card, a reply naming someone is the thread's own", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(30, 13));
    await m.run();
    assert.equal(rm.marks.size, 0, "no thread is marked for typed answers");
    // Even in a thread an older question marked, the card takes no typed answer.
    rm.marks.add(`${DESIGN}:${m.posts[0]!.ts}`);
    const a = answers(store, rm);
    assert.equal(await handleCardReply({ channel: DESIGN, threadTs: m.posts[0]!.ts, user: BEA, text: "<@U0MAYA>" }, a.deps), false);
    assert.equal(a.staged.length, 0);
  });

  it("with uno-bot's own id unknown, no mention names an owner", () => {
    assert.equal(namedOwner("<@U0MAYA>", BEA, null), null);
    assert.equal(namedOwner("me", BEA, null), BEA);
  });

  it("posted before the shared card: a named person with no Notion match gets a plain answer and no card", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    await askedBefore(store, rm);
    const a = answers(store, rm);
    assert.equal(await handleCardReply({ channel: DESIGN, threadTs: only(store).nudgeTs!, user: BEA, text: "<@U0ADE> maybe" }, a.deps), true);
    assert.equal(a.staged.length, 0);
    assert.match(a.said[0]!.text, /can't match <@U0ADE>/);
    assert.equal(only(store).state, "nudged");
  });
});

describe("F5: a stuck card", () => {
  const stuck = (over: Partial<ActiveCard> = {}) =>
    card({ designStatus: "Under Review", contributors: [{ id: "n-maya", name: "Maya Chen" }], lastEditedAt: EOD - 22 * DAY, ...over });

  it("a card lands in its pillar's team channel, and in #plus-design when the pillar has none", async () => {
    for (const [pillars, channel] of [
      [["Toolkit"], TOOLKIT],
      [["Tutoring"], DESIGN],
    ] as const) {
      const store = createInMemoryCommitmentStore();
      await runCardFollowThroughScan(SCAN, scanDeps(store, roadmap({ cards: [stuck({ pillars: [...pillars] })] })));
      assert.equal(only(store).channel, channel, pillars[0]);
    }
  });

  it("mentions its Contributor; a Universal card lands in #plus-universal", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck({ pillars: ["Universal"] })] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const row = only(store);
    assert.equal(row.kind, "card_stale");
    assert.equal(row.channel, UNIVERSAL);
    const m = morning(store, rm, at(35, 13));
    await m.run();
    assert.equal(m.posts[0]!.channel, UNIVERSAL);
    assert.match(m.posts[0]!.text, /^<@U0MAYA>, checking in on a Roadmap card that has gone quiet\./);
    assert.deepEqual(notified(m.posts[0]!), [MAYA]);
    assert.deepEqual(mentions(m.posts[0]!.text), [MAYA]);
    const [c] = m.posts[0]!.cards;
    assert.equal(c!.title.text, "Facelift — last stage");
    assert.equal(c!.subtitle!.text, "<@U0MAYA> · Under Review · no comments for 3 weeks");
    assert.equal(c!.body.text, "Is it still moving? Done moves it to Under Dev or another status, Still on it checks again in 3 weeks, Drop it archives it.");
    // Two buttons: Review and Open card. No one-tap Still on it.
    assert.deepEqual(c!.actions.map((x) => [x.text.text, x.url]), [["Review", undefined], ["Open card", "https://www.notion.so/p1"]]);
  });

  /** A stuck card asked about on the shared card, with a clock its thread store shares. */
  async function stuckOnCard() {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const clock = { now: at(35, 13) };
    const threadState = createInMemoryThreadState({ now: () => clock.now });
    const m = morning(store, rm, clock.now, { threadState });
    await m.run();
    /** The morning at `when`, on the same thread store. */
    const on = async (when: number) => {
      clock.now = when;
      const later = morning(store, rm, when, { threadState });
      await later.run();
      return later;
    };
    return { store, rm, m, threadState, on };
  }

  it("Review offers Done, Still on it and Drop it; Done writes the board's next status by default, or the one picked", async () => {
    const { store, m, threadState } = await stuckOnCard();
    // Under Review's next on the board is Under Dev, not Shipped.
    assert.deepEqual(m.staged[0]!.operations, [
      { toolName: "notion_update", input: { page_url: "https://www.notion.so/p1", properties: { "Design Status": "Under Dev" } } },
    ]);
    assert.deepEqual(m.staged[0]!.choices!.map((x) => [x.value, x.label, x.verdict]), [
      ["done", "Done", "confirm"],
      ["still", "Still on it", "cancel"],
      ["drop", "Drop it", "confirm"],
    ]);
    const { ran, redrawn } = await review(threadState, m.posts[0]!, only(store).id, "confirm", { userId: BEA, choice: "done", edits: { "0.properties.Design Status": "Shipped" } });
    assert.deepEqual(ran[0]!.execute?.input.properties, { "Design Status": "Shipped" });
    assert.equal(redrawn.at(-1)![0]!.subtitle!.text, "Done · <@U0BEA>");
  });

  it("Drop it archives the card, whatever the select says", async () => {
    const { store, m, threadState } = await stuckOnCard();
    const { ran, redrawn } = await review(threadState, m.posts[0]!, only(store).id, "confirm", { userId: ADE, choice: "drop", edits: { "0.properties.Design Status": "Shipped" } });
    assert.deepEqual(ran[0]!.execute?.input.properties, { "Design Status": "Archived" });
    assert.equal(redrawn.at(-1)![0]!.subtitle!.text, "Dropped · <@U0ADE>");
    assert.equal(redrawn.at(-1)![0]!.body.text, "Written: moved to Archived.");
  });

  it("Still on it writes nothing, and the card says when it is checked again: three weeks from the card", async () => {
    const { store, m, threadState, on } = await stuckOnCard();
    const { ran, redrawn } = await review(threadState, m.posts[0]!, only(store).id, "cancel", { userId: BEA, choice: "still" });
    assert.ok(!ran.some((v) => v.execute), "nothing runs");
    assert.equal(redrawn.at(-1)![0]!.subtitle!.text, "Still on it · <@U0BEA>");
    assert.equal(redrawn.at(-1)![0]!.body.text, "Nothing written. Checked again Oct 26.");
    const weekOn = await on(at(44, 13));
    assert.equal(weekOn.posts.length, 0);
    assert.equal(only(store).state, "snoozed");
    assert.equal(only(store).dueAt, at(35, 13) + 21 * DAY);
  });

  it("Still on it twice snoozes twice, then the row lapses", async () => {
    const { store, m, threadState, on } = await stuckOnCard();
    await review(threadState, m.posts[0]!, only(store).id, "cancel", { userId: MAYA, choice: "still" });
    await on(at(44, 13));
    assert.equal(only(store).snoozes, 1);
    // Three weeks from the first card, unmoved: the follow-up asks, in its thread.
    const second = await on(at(56, 13));
    assert.equal(second.posts.length, 1);
    assert.equal(second.posts[0]!.threadTs, m.posts[0]!.ts);
    await review(threadState, second.posts[0]!, only(store).id, "cancel", { userId: MAYA, choice: "still" });
    // A week on, its follow-up's answer is read, not lapsed over.
    await on(at(64, 14));
    assert.equal(only(store).state, "snoozed");
    assert.equal(only(store).snoozes, 2);
    assert.equal(only(store).dueAt, at(56, 13) + 21 * DAY);
    const last = await on(at(77, 14)); // 9 am ET, after the clocks change
    assert.equal(last.posts.length, 0);
    assert.equal(only(store).state, "lapsed");
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

  /** A stuck card asked about before the shared card, and its owner's reaction. */
  async function answered(glyph: string) {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    await askedBefore(store, rm);
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
    await askedBefore(store, rm);
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
    comments.p1 = at(35, 12);
    const m = morning(store, rm, at(35, 13));
    await m.run();
    assert.equal(m.posts.length, 0);
    assert.equal(only(store).state, "auto_done");
  });

  it("one message a card a week: a card asked about days ago is not kept again", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    await morning(store, rm, at(35, 13)).run();
    const row = only(store);
    await store.update(row.id, { state: "done", resolvedAt: at(35, 15) });
    // Edited since, and stuck again by its own clock — but asked two days ago.
    rm.cards.set("p1", stuck({ lastEditedAt: at(35, 16) - 22 * DAY + DAY }));
    assert.equal((await runCardFollowThroughScan(SCAN, scanDeps(store, rm, at(37, 22)))).rows.length, 0);
  });
});

describe("stuck cards are weekly: asked on Monday's morning", () => {
  const MONDAY = at(35, 13); // Mon 2026-10-05, 09:00 ET
  const stuck = (over: Partial<ActiveCard> = {}) =>
    card({ designStatus: "Under Review", contributors: [{ id: "n-maya", name: "Maya Chen" }], lastEditedAt: EOD - 22 * DAY, ...over });

  it("a stuck card found on a Tuesday night waits through Friday, and is asked on Monday's morning", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    for (const day of [30, 31, 32]) {
      const m = morning(store, rm, at(day, 13));
      await m.run();
      assert.equal(m.posts.length, 0, `nothing on ${utcDay(at(day, 13))}`);
      assert.equal(only(store).state, "open", "carried, not dropped");
      assert.equal(only(store).nudges, 0);
    }
    const monday = morning(store, rm, MONDAY);
    await monday.run();
    assert.equal(monday.posts.length, 1);
    assert.equal(only(store).state, "nudged");
    assert.equal(only(store).nudgeTs, monday.posts[0]!.ts);
  });

  it("an unowned card is asked on any weekday morning, while a stuck one beside it waits for Monday", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card({ pageId: "a" }), stuck({ pageId: "b" })] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(30, 13));
    await m.run();
    assert.equal(m.posts.length, 1);
    assert.equal(m.posts[0]!.cards.length, 1);
    const rows = [...store.rows.values()];
    assert.equal(rows.find((r) => r.kind === "card_unowned")!.state, "nudged");
    assert.equal(rows.find((r) => r.kind === "card_stale")!.state, "open");
  });

  it("its one follow-up keeps its rhythm: in its thread, five working days on, whatever the weekday", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [stuck()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const monday = morning(store, rm, MONDAY);
    await monday.run();
    const nextMonday = morning(store, rm, at(42, 13));
    await nextMonday.run();
    assert.equal(nextMonday.posts.length, 0, "not yet: five working days run to the end of next Monday");
    const tuesday = morning(store, rm, at(43, 13));
    await tuesday.run();
    assert.equal(tuesday.posts.length, 1);
    assert.equal(tuesday.posts[0]!.threadTs, monday.posts[0]!.ts);
    assert.equal(only(store).nudges, 2);
  });

  it("on Monday, all of one person's stuck cards are in the section, past the two-a-person cap; their unowned cards keep it", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({
      cards: [
        ...[0, 1, 2, 3].map((i) => stuck({ pageId: `s${i}`, title: `Stuck ${i}`, lastEditedAt: EOD - (22 + i) * DAY })),
        // Three Maya created with nobody on them: daily asks, two a morning.
        ...[0, 1, 2].map((i) => card({ pageId: `u${i}`, creatorId: "n-maya", lastEditedAt: EOD - (8 + i) * DAY })),
      ],
    });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const storage = createInMemoryRunnerStorage();
    const mon = morning(store, rm, MONDAY, { handOff: handOffIn(storage), weeklyHandOff: handOffIn(storage, STALE_CARDS_SECTION) });
    await mon.run();
    const day = utcDay(MONDAY);
    const [weekly] = await followUpsForSweep(mon.due, MONDAY, day, { weekly: true }).waiting();
    assert.deepEqual(weekly!.cards.map((c) => c.item.title).sort(), ["Stuck 0", "Stuck 1", "Stuck 2", "Stuck 3"]);
    assert.ok(weekly!.cards.every((c) => c.person === MAYA));
    const [daily] = await followUpsForSweep(mon.due, MONDAY, day).waiting();
    assert.equal(daily!.cards.length, MAX_CARD_REMINDERS_PER_PERSON, "the daily asks keep the cap");
  });

  it("on Monday, a channel's stuck cards are handed off as one whole section, past the two-a-channel cap", async () => {
    const store = createInMemoryCommitmentStore();
    const people = [
      { id: "n-maya", name: "Maya Chen" },
      { id: "n-bea", name: "Bea Ruiz" },
      { id: "n-ade", name: "Ade Obi" },
    ];
    const rm = roadmap({
      cards: [card({ pageId: "a" }), ...people.map((p, i) => stuck({ pageId: `s${i}`, title: `Stuck ${i}`, contributors: [p], lastEditedAt: EOD - (22 + i) * DAY }))],
    });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const storage = createInMemoryRunnerStorage();
    const handOff = handOffIn(storage);
    const weeklyHandOff = handOffIn(storage, STALE_CARDS_SECTION);

    // Wednesday: the unowned card is handed to the daily section; nothing weekly.
    const wed = morning(store, rm, at(30, 13), { handOff, weeklyHandOff });
    await wed.run();
    const wedDay = utcDay(at(30, 13));
    assert.equal(await followUpsForSweep(wed.due, at(30, 13), wedDay, { weekly: true }).waiting().then((w) => w.length), 0);
    const [daily] = await followUpsForSweep(wed.due, at(30, 13), wedDay).waiting();
    assert.equal(daily!.cards.length, 1);
    assert.ok(!daily!.whole);

    const mon = morning(store, rm, MONDAY, { handOff, weeklyHandOff });
    await mon.run();
    const day = utcDay(MONDAY);
    const weekly = await followUpsForSweep(mon.due, MONDAY, day, { weekly: true }).waiting();
    assert.equal(weekly.length, 1, "one section a place");
    assert.equal(weekly[0]!.source, STALE_CARDS_SECTION);
    assert.equal(weekly[0]!.channel, DESIGN);
    assert.equal(weekly[0]!.whole, true);
    assert.deepEqual(weekly[0]!.cards.map((c) => c.item.title).sort(), ["Stuck 0", "Stuck 1", "Stuck 2"]);
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

  it("on the shared card, a tap or a reaction answers nothing: Review does", async () => {
    const { store } = await keptTodo();
    const rm = roadmap();
    await morning(store, rm, at(32, 13)).run();
    const row = only(store);
    const a = answers(store, rm);
    for (const via of ["button", "reaction"] as const) {
      assert.deepEqual(await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "white_check_mark", userId: MAYA, via }, a.deps), {
        refused: ANSWER_ON_CARD,
      });
    }
    assert.equal(a.staged.length, 0);
    assert.equal(only(store).state, "nudged");
  });

  it("no card teaches a gate: no ✅ or ⛔, nothing to type", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card(), card({ pageId: "p2", designStatus: "Under Review", contributors: [{ id: "n-maya", name: "Maya Chen" }], lastEditedAt: EOD - 22 * DAY })] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    await keptTodo(store);
    const m = morning(store, rm, at(32, 13));
    await m.run();
    // Bea's and Maya's cards share the channel's one message; the to-do is in its thread.
    assert.equal(m.posts.length, 2);
    for (const p of m.posts) {
      assert.equal(messageBlocksRefusal(p.blocks), null);
      assert.doesNotMatch(JSON.stringify(p.blocks), GATE_WORDS);
      assert.doesNotMatch(p.text, GATE_WORDS);
    }
    for (const p of m.staged) assert.doesNotMatch(p.proposalText, GATE_WORDS);
  });

  it("posted before the shared card: a ✅ on a card follow-up is the follow-up's, never the gate's", async () => {
    const { store } = await keptTodo();
    await askedBefore(store, roadmap(), { at: at(32, 13) });
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
    // All three are Bea's to answer: two this morning, in one carousel; the third waits.
    assert.equal(m.posts.length, 1);
    assert.equal(m.posts[0]!.cards.length, 2);
    assert.equal([...store.rows.values()].filter((r) => r.state === "nudged").length, 2);
  });

  it("cards group by place: a channel's cards from one morning share one carousel, and another channel's go in a message of their own", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({
      cards: [
        // Bea's: one she created with no Contributor, one she is stuck on.
        card({ pageId: "a" }),
        card({ pageId: "b", designStatus: "Under Review", contributors: [{ id: "n-bea", name: "Bea Ruiz" }], lastEditedAt: EOD - 22 * DAY }),
        // Maya's, a Universal card: #plus-universal.
        card({ pageId: "c", pillars: ["Universal"], designStatus: "Under Review", contributors: [{ id: "n-maya", name: "Maya Chen" }], lastEditedAt: EOD - 23 * DAY }),
      ],
    });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(35, 13));
    await m.run();
    assert.equal(m.posts.length, 2);
    const bea = m.posts.find((p) => mentions(p.text).includes(BEA))!;
    const maya = m.posts.find((p) => mentions(p.text).includes(MAYA))!;
    assert.match(bea.text, /^Checking in on 2 Roadmap cards\.\n• <@U0BEA> — /);
    assert.equal((bea.blocks as Array<{ type: string }>).at(-1)!.type, "carousel");
    assert.deepEqual(bea.cards.map((c) => c.actions.map((x) => x.text.text)), [["Review", "Open card"], ["Review", "Open card"]]);
    assert.equal(maya.cards.length, 1);
    // Each card is its own proposal, on its own message.
    assert.equal(m.staged.length, 3);
    for (const row of store.rows.values()) {
      const posted = row.cardId === "c" ? maya : bea;
      assert.equal(row.nudgeTs, posted.ts);
      assert.ok(m.staged.some((p) => p.item?.messageTs === posted.ts && p.item.id === row.id));
    }
  });

  it("a card that did not stage says so, offers no Review, and comes back the next morning", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card()] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const m = morning(store, rm, at(30, 13), { failStage: () => true });
    await m.run();
    const [c] = m.edits.at(-1)!.cards;
    assert.equal(c!.subtitle!.text, "Didn't go through, so it comes back tomorrow morning");
    assert.deepEqual(c!.actions.map((x) => x.text.text), ["Open card"]);
    assert.equal(only(store).state, "open");
    const next = morning(store, rm, at(31, 13));
    await next.run();
    assert.equal(next.posts.length, 1);
    assert.equal(next.staged.length, 1);
    assert.equal(only(store).state, "nudged");
  });
});

// ── One card per follow-up ───────────────────────────────────────────────────

describe("one card per follow-up", () => {
  /** `n` to-dos for Maya in one #plus-design thread, kept at the end of day. */
  async function manyTodos(n: number) {
    const store = createInMemoryCommitmentStore();
    const asks = Array.from({ length: n }, (_, i) => ({ ts: ts(29, 15, i + 1), user: BEA, text: `<@U0MAYA> can you create a card for step ${i + 1}?` }));
    const thread: SweepThread = { channel: DESIGN, channelKind: "public", rootTs: ROOT, messages: [{ ts: ROOT, user: BEA, text: "Review notes." }, ...asks] };
    const reply = JSON.stringify({ todos: asks.map((m, i) => ({ message_ts: m.ts, assignee: MAYA, what: `step ${i + 1}`, confidence: 0.9 })) });
    await recordThreadCardTodos(thread, ts(29, 0), {
      detector: modelCardTodoDetector(fakeProvider({ generateReplies: [reply] })),
      store,
      config: CONFIG,
      now: () => EOD,
      runDate: utcDay(EOD),
    });
    assert.equal(store.rows.size, n);
    return store;
  }

  const oldestFirst = (store: InMemoryCommitmentStore) => [...store.rows.values()].sort((a, b) => a.promisedAt - b.promisedAt);

  /** Every live row due handed to the morning's card handler, oldest first, then
   *  the morning's post — past the per-person cap, which the job applies. */
  async function askAll(store: InMemoryCommitmentStore, m: ReturnType<typeof morning>, now: number) {
    const rows = oldestFirst(store).filter((r) => (r.state === "open" || r.state === "nudged") && r.dueAt <= now);
    const actions = [];
    for (const r of rows) actions.push(await m.cards.due(r, now, utcDay(now)));
    const flushed = await m.cards.flush!(now, utcDay(now));
    return actions.map((a) => flushed.find((f) => f.id === a.id) ?? a);
  }

  it("each follow-up is its own card, with its own Review and Open, staged as its own proposal", async () => {
    const store = await manyTodos(3);
    const m = morning(store, roadmap(), at(32, 13));
    await askAll(store, m, at(32, 13));
    assert.equal(m.posts.length, 1);
    const post = m.posts[0]!;
    assert.deepEqual(post.cards.map((c) => c.title.text), ["Step 1", "Step 2", "Step 3"]);
    for (const c of post.cards) {
      assert.deepEqual(c.actions.map((x) => x.text.text), ["Review", "Open source"]);
      assert.ok(c.actions[1]!.url);
    }
    assert.equal(new Set(post.cards.map((c) => c.actions[0]!.action_id)).size, 3);
    assert.equal(m.staged.length, 3);
    assert.equal(new Set(m.staged.map((p) => p.supersedeKey)).size, 3);
    for (const r of store.rows.values()) assert.ok(m.staged.some((p) => p.item?.id === r.id && p.item.messageTs === post.ts));
  });

  it("more than 10: 10 cards show, the parent says the rest come next, and the rest are asked the next morning", async () => {
    const store = await manyTodos(12);
    const m = morning(store, roadmap(), at(32, 13));
    const actions = await askAll(store, m, at(32, 13));
    assert.equal(m.posts.length, 1);
    assert.equal(m.posts[0]!.cards.length, 10);
    assert.match(m.posts[0]!.text.split("\n")[0]!, /Showing 10 of 12; the rest come in the next report\.$/);
    assert.equal(m.staged.length, 10);
    const rows = oldestFirst(store);
    assert.deepEqual(rows.map((r) => r.state), [...Array<string>(10).fill("nudged"), "open", "open"]);
    for (const r of rows.slice(10)) assert.equal(actions.find((a) => a.id === r.id)?.action, "held");
    // The next morning asks the two held back, on a report of their own.
    const next = morning(store, roadmap(), at(33, 13));
    await askAll(store, next, at(33, 13));
    assert.deepEqual(next.posts.flatMap((p) => p.cards.map((c) => c.title.text)), ["Step 11", "Step 12"]);
    assert.equal(oldestFirst(store).filter((r) => r.state === "nudged").length, 12);
  });

  it("deciding one card settles only that follow-up: the others stay open, Review and all", async () => {
    const store = await manyTodos(3);
    const m = morning(store, roadmap(), at(32, 13));
    await askAll(store, m, at(32, 13));
    const [first, second, third] = oldestFirst(store);
    const { ran, redrawn } = await review(m.threadState, m.posts[0]!, second!.id, "cancel", { userId: MAYA });
    assert.ok(!ran.some((v) => v.execute), "nothing runs");
    const cards = redrawn.at(-1)!;
    assert.equal(cards.length, 3);
    assert.match(cards[1]!.subtitle!.text, /^Rejected by <@U0MAYA>/);
    for (const i of [0, 2]) {
      assert.equal(cards[i]!.actions[0]!.text.text, "Review");
      assert.doesNotMatch(cards[i]!.subtitle!.text, /Rejected|Approved/);
    }
    for (const r of [first!, third!]) assert.equal((await m.threadState.getProposalByTs(itemProposal(m.posts[0]!.ts, r.id).proposalTs)).state, "found");
    // A week on: the rejected to-do is dropped; the two undecided are asked once more.
    const weekOn = morning(store, roadmap(), at(42, 13), { threadState: m.threadState });
    await askAll(store, weekOn, at(42, 13));
    assert.equal((await store.get(second!.id))!.state, "dropped");
    assert.deepEqual(weekOn.posts.flatMap((p) => p.cards.map((c) => c.title.text)), ["Step 1", "Step 3"]);
  });

  it("a report already live closes card by card: a decided card keeps its decision, an undecided one closes past 72 h", async () => {
    const store = await manyTodos(2);
    const clock = { now: at(32, 13) };
    const threadState = createInMemoryThreadState({ now: () => clock.now });
    const m = morning(store, roadmap(), clock.now, { threadState });
    await askAll(store, m, clock.now);
    const [first, second] = oldestFirst(store);
    const decided = await review(threadState, m.posts[0]!, first!.id, "confirm", { userId: MAYA });
    assert.match(decided.redrawn.at(-1)![0]!.subtitle!.text, /^Approved by <@U0MAYA>/);
    assert.equal(decided.redrawn.at(-1)![1]!.actions[0]!.text.text, "Review");
    // Past its 72 h, the report as it is redrawn: the undecided card closed, the decided one as it was.
    clock.now = at(32, 13) + FOLLOW_THROUGH_CARD_TTL_MS + 60_000;
    const cards = cardsOf((await currentReport(threadState, m.posts[0]!.ts, clock.now))!.blocks);
    assert.match(cards[0]!.subtitle!.text, /^Approved by <@U0MAYA>/);
    assert.equal(cards[1]!.subtitle!.text, "Closed, no decision");
    assert.deepEqual(cards[1]!.actions.map((x) => x.text.text), ["View", "Open source"]);
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

  it("a budget stop between holding the cards and posting them hands the rows back, so the retry posts them", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({ cards: [card({ pageId: "a" }), card({ pageId: "b", lastEditedAt: EOD - 9 * DAY })] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    // Headroom runs out at the check before the post: the start, one per
    // row, the empty read that ends the loop, then the flush.
    let checks = 0;
    const meter = { headroom: () => (++checks >= 5 ? { subrequests: 0, d1Queries: 1000 } : { subrequests: 1000, d1Queries: 1000 }) };
    const stopped = morning(store, rm, at(30, 13), { meter });
    await assert.rejects(stopped.run(), SubrequestBudgetError);
    assert.equal(stopped.posts.length, 0);
    for (const row of store.rows.values()) assert.equal(row.checkedOn, null, "handed back, not checked for today");
    const retry = morning(store, rm, at(30, 13, 5));
    await retry.run();
    assert.equal(retry.posts.length, 1);
    assert.equal(retry.posts[0]!.cards.length, 2);
  });

  it("at most two new card questions a channel each morning", async () => {
    const store = createInMemoryCommitmentStore();
    const creators = ["n-bea", "n-maya", "n-ade"];
    const rm = roadmap({ cards: creators.map((creatorId, i) => card({ pageId: `c${i}`, creatorId, lastEditedAt: EOD - (8 + i) * DAY })) });
    // Three different people would each be asked, so the person cap is not what holds the third.
    rm.people.slackIdForNotionUser = async (id: string) => ({ "n-bea": BEA, "n-maya": MAYA, "n-ade": ADE })[id] ?? null;
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    assert.equal(store.rows.size, 3);
    const m = morning(store, rm, at(30, 13));
    await m.run();
    // The two asked share the channel's one message, a bullet each.
    assert.equal(m.posts.length, 1);
    assert.equal(m.posts[0]!.cards.length, 2);
    assert.equal(new Set(mentions(m.posts[0]!.text)).size, 2);
    assert.equal([...store.rows.values()].filter((r) => r.state === "open").length, 1, "the third waits a morning");
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
    await askedBefore(store, roadmap(), { at: at(32, 13) });
    const row = only(store);
    const a = answers(store, roadmap());
    await answerCardFollowUp(row, { channel: DESIGN, messageTs: row.nudgeTs!, glyph: "+1", userId: MAYA }, a.deps);
    assert.equal(a.staged.length, 0);
    assert.equal(only(store).state, "nudged");
  });

  it("someone who posted in the thread may ask for the draft; an outsider may not", async () => {
    const { store } = await keptTodo();
    await askedBefore(store, roadmap(), { at: at(32, 13) });
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
    await askedBefore(store, rm, { at: at(32, 13) });
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
    await askedBefore(store, roadmap(), { at: at(32, 13) });
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
    await askedBefore(store, rm);
    return { store, rm, row: only(store), a: answers(store, rm) };
  }
  const stuck = (over: Partial<ActiveCard> = {}) =>
    card({ designStatus: "Under Review", contributors: [{ id: "n-maya", name: "Maya Chen" }], lastEditedAt: EOD - 22 * DAY, ...over });

  it("Drop it from someone the follow-up never asked drops a to-do, and the edit names them", async () => {
    const { store } = await keptTodo();
    const rm = roadmap();
    await askedBefore(store, rm, { at: at(32, 13) });
    const row = only(store);
    const a = answers(store, rm);
    assert.equal(await answerCardFollowUp(row, tap(row, "no_good", ADE), a.deps), undefined);
    assert.equal(only(store).state, "dropped");
    assert.equal(a.edits[0]!.footer, `Understood. I won't ask again. Answered by <@${ADE}>.`);
  });

  it("Draft it from anyone stages the draft, and they may confirm it beside the people named", async () => {
    const { store } = await keptTodo();
    await askedBefore(store, roadmap(), { at: at(32, 13) });
    const row = only(store);
    const a = answers(store, roadmap());
    await answerCardFollowUp(row, tap(row, "white_check_mark", ADE), a.deps);
    assert.equal(a.staged.length, 1);
    assert.deepEqual(new Set(a.staged[0]!.confirmers), new Set([MAYA, ADE]));
  });

  it("a tap on a follow-up already answered says so", async () => {
    const { store } = await keptTodo();
    await askedBefore(store, roadmap(), { at: at(32, 13) });
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
    await askedBefore(store, rm, { at: at(42, 13), followUp: true }); // the follow-up, as it was posted
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

describe("tagging through the Team Members directory", () => {
  const ZOE = "U0ZOE";
  /** The sync's Notion people map, as the directory hands it over. */
  const DIRECTORY = { "n-zoe": ZOE, "n-lead": LEAD };
  const withDirectory = (rm: ReturnType<typeof roadmap>) => ({ ...rm, people: throughDirectory(rm.people, async () => DIRECTORY) });

  it("a Contributor the directory maps is tagged without a name search; one it does not is searched by name", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = withDirectory(
      roadmap({
        cards: [
          card({
            designStatus: "Under Review",
            lastEditedAt: EOD - 22 * DAY,
            contributors: [
              // "Zoe Park" matches nobody by name: only the directory knows her.
              { id: "n-zoe", name: "Zoe Park" },
              { id: "n-bea", name: "Bea Ruiz" },
            ],
          }),
        ],
      }),
    );
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    assert.equal(only(store).promiserId, ZOE);
    const m = morning(store, rm, at(35, 13));
    await m.run();
    assert.deepEqual(mentions(m.posts[0]!.text), [ZOE, BEA]);
  });

  it("a Contributor still unmatched is logged by name and named on the card, never dropped silently", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = withDirectory(
      roadmap({
        cards: [
          card({
            designStatus: "Under Review",
            lastEditedAt: EOD - 22 * DAY,
            contributors: [
              { id: "n-maya", name: "Maya Chen" },
              { id: "n-kai", name: "Kai Lo" },
            ],
          }),
        ],
      }),
    );
    const report = await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    assert.ok(report.notes.some((n) => n.includes("Kai Lo")), report.summary);
    const m = morning(store, rm, at(35, 13));
    await m.run();
    assert.deepEqual(mentions(m.posts[0]!.text), [MAYA]);
    assert.equal(m.posts[0]!.cards[0]!.subtitle!.text, "<@U0MAYA> · Under Review · no comments for 3 weeks · not found in Slack: Kai Lo");
    assert.match(m.posts[0]!.text, /\n• Kai Lo — /, "named on their own bullet, not tagged");
    assert.deepEqual(notified(m.posts[0]!), [MAYA]);
  });

  /** The lead's notes about Team Members gaps, over a stored map and 30-day marks kept across mornings. */
  function leadNotes(opts: { lead?: string | null; stored?: StoredTeamRoles; stop?: boolean } = {}) {
    const notes: Array<{ to: string; text: string }> = [];
    const marks = new Set<string>();
    const gaps = gapNotes({
      lead: opts.lead === undefined ? LEAD : opts.lead,
      // Kai Lo's row matched him in Slack, and has no Notion Person.
      read: async () => opts.stored ?? { at: EOD, roles: {}, gaps: [], noNotionPerson: ["Kai Lo"] },
      marks: { has: async (key) => marks.has(key), put: async (key) => void marks.add(key) },
      dm: async (to, text) => {
        if (opts.stop) throw new SubrequestBudgetError(1);
        notes.push({ to, text });
        return { ok: true };
      },
    });
    return { notes, gaps };
  }

  /** A stale card with Maya, whom the directory knows, and Kai Lo, whom nothing does. */
  async function kaiUnmatched() {
    const store = createInMemoryCommitmentStore();
    const rm = withDirectory(
      roadmap({
        cards: [
          card({
            designStatus: "Under Review",
            lastEditedAt: EOD - 22 * DAY,
            contributors: [
              { id: "n-maya", name: "Maya Chen" },
              { id: "n-kai", name: "Kai Lo" },
            ],
          }),
        ],
      }),
    );
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    return { store, rm };
  }

  it("a follow-up that could not tag someone notes it to the lead once: their name and the column to fill", async () => {
    const { store, rm } = await kaiUnmatched();
    const lead = leadNotes();
    const m = morning(store, rm, at(35, 13), { gaps: lead.gaps });
    await m.run();
    assert.equal(m.posts.length, 1);
    assert.equal(lead.notes.length, 1);
    assert.equal(lead.notes[0]!.to, LEAD);
    assert.match(lead.notes[0]!.text, /Kai Lo/);
    assert.match(lead.notes[0]!.text, /Notion Person/);
    assert.doesNotMatch(lead.notes[0]!.text, /n-kai|Maya|U0MAYA|Under Review/, "no ids, and nothing of the card");
    // The follow-up a week on, still unable to tag Kai: no second note within 30 days.
    const later = morning(store, rm, at(43, 13), { gaps: lead.gaps });
    await later.run();
    assert.equal(later.posts.length, 1, "the follow-up a week on posted");
    assert.equal(lead.notes.length, 1);
  });

  it("someone whose row matched no one in Slack is noted for the row's Slack ID", async () => {
    const { store, rm } = await kaiUnmatched();
    const lead = leadNotes({ stored: { at: EOD, roles: {}, gaps: ["kai lo"] } });
    await morning(store, rm, at(35, 13), { gaps: lead.gaps }).run();
    assert.equal(lead.notes.length, 1);
    assert.match(lead.notes[0]!.text, /Slack ID/);
  });

  it("someone with no in-scope row, or whose row has both cells, is not noted", async () => {
    // A guest or a Past Collaborator is on neither list; nor is a row with its Slack ID and Notion Person.
    const { store, rm } = await kaiUnmatched();
    const lead = leadNotes({ stored: { at: EOD, roles: {}, gaps: ["Gus Hale"], noNotionPerson: ["Ana Pérez"] } });
    const m = morning(store, rm, at(35, 13), { gaps: lead.gaps });
    await m.run();
    assert.equal(m.posts.length, 1);
    assert.deepEqual(lead.notes, []);
  });

  it("a budget stop during the note never posts the follow-up twice", async () => {
    const { store, rm } = await kaiUnmatched();
    const stopping = leadNotes({ stop: true });
    const stopped = morning(store, rm, at(35, 13), { gaps: stopping.gaps });
    await assert.rejects(stopped.run(), SubrequestBudgetError);
    assert.equal(stopped.posts.length, 1);
    const retry = morning(store, rm, at(35, 13, 5), { gaps: leadNotes().gaps });
    await retry.run();
    assert.equal(retry.posts.length, 0, "the retry posts nothing again");
    assert.equal(only(store).state, "nudged");
  });

  it("an unowned card whose creator could not be tagged notes nobody: there is no row to name", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = withDirectory(roadmap({ cards: [card({ creatorId: "n-unknown" })] }));
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const lead = leadNotes();
    const m = morning(store, rm, at(35, 13), { gaps: lead.gaps });
    await m.run();
    assert.equal(m.posts.length, 0);
    assert.deepEqual(lead.notes, []);
  });

  it("with LEAD_USER_ID unset, a follow-up that could not tag someone notes nobody", async () => {
    const { store, rm } = await kaiUnmatched();
    const lead = leadNotes({ lead: null });
    const m = morning(store, rm, at(35, 13), { gaps: lead.gaps });
    await m.run();
    assert.equal(m.posts.length, 1);
    assert.deepEqual(lead.notes, []);
  });

  it("a follow-up that tagged everyone notes nobody", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = withDirectory(roadmap({ cards: [card({ designStatus: "Under Review", lastEditedAt: EOD - 22 * DAY, contributors: [{ id: "n-maya", name: "Maya Chen" }] })] }));
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const lead = leadNotes();
    await morning(store, rm, at(35, 13), { gaps: lead.gaps }).run();
    assert.deepEqual(lead.notes, []);
  });

  it("a nameless Contributor still unmatched is logged by id, never shown on the card", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = withDirectory(
      roadmap({
        cards: [
          card({
            designStatus: "Under Review",
            lastEditedAt: EOD - 22 * DAY,
            contributors: [
              { id: "n-maya", name: "Maya Chen" },
              { id: "n-nameless", name: "" },
            ],
          }),
        ],
      }),
    );
    const report = await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    assert.ok(report.notes.some((n) => n.includes("n-nameless")), report.summary);
    const m = morning(store, rm, at(35, 13));
    await m.run();
    assert.equal(m.posts[0]!.cards[0]!.subtitle!.text, "<@U0MAYA> · Under Review · no comments for 3 weeks");
    assert.doesNotMatch(JSON.stringify(m.posts[0]!.blocks), /n-nameless/);
  });

  it("a card with nobody matched is passed over, with every name in the run's notes", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = withDirectory(
      roadmap({
        cards: [
          card({
            designStatus: "Under Review",
            lastEditedAt: EOD - 22 * DAY,
            contributors: [
              { id: "n-kai", name: "Kai Lo" },
              { id: "n-ivy", name: "Ivy Jun" },
            ],
          }),
        ],
      }),
    );
    const report = await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    assert.equal(store.rows.size, 0);
    assert.ok(report.notes.some((n) => n.includes("Kai Lo") && n.includes("Ivy Jun")), report.summary);
  });

  it("an unowned card's creator the directory maps is the one asked", async () => {
    const store = createInMemoryCommitmentStore();
    const rm = withDirectory(roadmap({ cards: [card({ creatorId: "n-zoe" })] }));
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    assert.equal(only(store).promiserId, ZOE);
  });
});

// ── One message a channel ────────────────────────────────────────────────────

describe("the morning's one message a channel", () => {
  const SWEEP_POST: ScheduledJob = { key: "sweep-post", kind: "sweep-post" };
  const STARTER = "U0STARTER";

  /**
   * `n` fixes on one page, settled in a #plus-design thread the starter
   * opened and queued for the top of the channel — where a fix the Roadmap
   * or the running notes recorded goes — ready for the morning at `now`.
   */
  async function fixesAtTop(n: number, now: number) {
    const blocks = Array.from({ length: n }, (_, i) => ({ id: `blk-${String(i).padStart(2, "0")}`, lastEditedTime: "2026-09-01T10:00:00.000Z", text: `Line ${i}` }));
    const page = notionPage("cccccccccccccccccccccccccccccccc", { blocks });
    const root = msg(STARTER, ts(29, 15), `Update on this: <${page.url}|page>`, { reply_count: 1, latest_reply: ts(29, 16) });
    const answer = msg(ADE, ts(29, 16), "Agreed — Nov 1.", { thread_ts: root.ts });
    const h = sweepHarness({
      channels: { [DESIGN]: { kind: "public", history: [root], threads: { [root.ts]: [root, answer] } } },
      sources: [page],
      detectorReplies: n ? [reply(...blocks.map((b) => drift({ source: page, block: b.id, evidence: [answer.ts], replacement: `${b.text} (fixed)` })))] : [],
      now: EOD,
    });
    await runSweepJob({ key: `sweep:${DESIGN}`, kind: "sweep-channel", channel: DESIGN }, h.deps);
    const queued = await h.store.pendingFindings();
    assert.equal(queued.length, n);
    await h.store.addFindings(queued.map((f) => ({ ...f, evidence: { ...f.evidence, threadTs: null } })));
    h.clock.now = now;
    return h;
  }

  /** Bea's quiet cards in #plus-design, kept at the end of day: one she
   *  created with no Contributor, and, with `two`, one she is stuck on. */
  async function beasCards(two = false) {
    const store = createInMemoryCommitmentStore();
    const rm = roadmap({
      cards: [
        card({ pageId: "a" }),
        ...(two ? [card({ pageId: "b", designStatus: "Under Review", contributors: [{ id: "n-bea", name: "Bea Ruiz" }], lastEditedAt: EOD - 22 * DAY })] : []),
      ],
    });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    return { store, rm };
  }

  /** The morning: the commitment job hands the channel's cards off, then the
   *  sweep's post puts them up. */
  async function morningOf(store: InMemoryCommitmentStore, rm: ReturnType<typeof roadmap>, h: ReturnType<typeof sweepHarness>, now: number) {
    const stage = handOffIn(createInMemoryRunnerStorage());
    const m = morning(store, rm, now, { handOff: stage, threadState: h.threadState });
    const nudged = await m.run();
    assert.equal(m.posts.length, 0, "the commitment job posts none of a channel's top cards");
    assert.ok(nudged.actions.length > 0);
    h.deps.sections = [followUpsForSweep(m.due, now, utcDay(now))];
    await runSweepJob(SWEEP_POST, h.deps);
    return { m, stage };
  }

  const head = (text: string) => text.split("\n").filter((l) => l.startsWith("• <@"));

  it("a fix and a quiet card for one channel go up as one message: a bullet a person, one carousel", async () => {
    const now = at(30, 13);
    const { store, rm } = await beasCards();
    const h = await fixesAtTop(1, now);
    const { m, stage } = await morningOf(store, rm, h, now);

    assert.equal(h.posted.length + m.posts.length, 1, "one top-level message");
    const [post] = h.posted;
    assert.equal(post!.channel, DESIGN);
    assert.equal(post!.threadTs, null);
    assert.deepEqual(post!.text.split("\n").slice(0, 2), [
      `• <@${STARTER}>, a thread settled something that *Page cccc* still states the old way.`,
      `• <@${BEA}>, a Roadmap card has been worked for over a week with no Contributor.`,
    ]);
    // Each person is mentioned once, in the bullets: what Slack notifies from
    // (a card's subtitle notifies nobody).
    for (const who of [STARTER, BEA]) assert.equal(mentions(post!.text).filter((x) => x === who).length, 1);
    const blocks = post!.blocks as Array<{ type: string }>;
    assert.equal(blocks.at(-1)!.type, "carousel");
    assert.deepEqual(cardsOf(post!.blocks).map((c) => c.actions[0]!.text.text), ["Review", "Review"]);

    // Each card keeps its own proposal on the one message.
    assert.equal(h.staged.length, 1);
    assert.equal(m.staged.length, 1);
    assert.equal(m.staged[0]!.item?.messageTs, post!.ts);
    const row = only(store);
    assert.equal(row.state, "nudged");
    assert.equal(row.nudgeTs, post!.ts);
    assert.deepEqual(await h.store.pendingFindings(), []);
    assert.equal((await stage.places(utcDay(now))).size, 0, "the hand-off is spent");
  });

  it("a morning with only the cards posts them as the sweep's one message, as they read before", async () => {
    const now = at(30, 13);
    const { store, rm } = await beasCards();
    const h = await fixesAtTop(0, now);
    const { m } = await morningOf(store, rm, h, now);
    assert.equal(m.posts.length, 0, "the sweep's post puts them up");
    assert.equal(h.posted.length, 1);
    assert.match(h.posted[0]!.text, /^<@U0BEA>, a Roadmap card has been worked for over a week with no Contributor\./);
    assert.equal(m.staged.length, 1);
    assert.equal(m.staged[0]!.item?.messageTs, h.posted[0]!.ts);
    assert.equal(only(store).nudgeTs, h.posted[0]!.ts);
  });

  it("past ten cards: ten show, filled round-robin, and each bullet says how many wait", async () => {
    const now = at(35, 13);
    const { store, rm } = await beasCards(true);
    const h = await fixesAtTop(12, now);
    const { m } = await morningOf(store, rm, h, now);

    assert.equal(h.posted.length + m.posts.length, 1);
    const [post] = h.posted;
    const cards = cardsOf(post!.blocks);
    assert.equal(cards.length, 10);
    const lines = head(post!.text);
    assert.equal(lines.length, 2);
    assert.match(lines[0]!, /^• <@U0STARTER>, .* Here are 8; 4 more come in the next report\.$/);
    assert.match(lines[1]!, /^• <@U0BEA>, checking in on 2 Roadmap cards\.$/);
    // Grouped by person, in bullet order: the starter's eight, then Bea's two.
    assert.deepEqual(cards.slice(8).map((c) => c.actions[1]!.text.text), ["Open card", "Open card"]);
    assert.equal(h.staged.length, 8);
    assert.equal((await h.store.pendingFindings()).length, 4, "the fixes past ten stay queued");
    assert.equal(m.staged.length, 2);
    assert.deepEqual([...store.rows.values()].map((r) => r.nudgeTs), [post!.ts, post!.ts]);
  });

  it("a stop after the shared post: the retry stages what it showed, and posts nothing again", async () => {
    const now = at(30, 13);
    const { store, rm } = await beasCards();
    const h = await fixesAtTop(1, now);
    const stage = handOffIn(createInMemoryRunnerStorage());
    const m = morning(store, rm, now, { handOff: stage, threadState: h.threadState });
    await m.run();
    h.deps.sections = [followUpsForSweep(m.due, now, utcDay(now))];
    // Slack took the post; the job heard nothing back.
    h.faults.post = new SubrequestBudgetError(38);
    await assert.rejects(runSweepJob(SWEEP_POST, h.deps), SubrequestBudgetError);
    assert.equal(h.posted.length, 1);
    assert.equal(m.staged.length, 0);
    assert.equal(only(store).state, "open", "not asked until it is staged");

    h.deps.sections = [followUpsForSweep(m.due, now, utcDay(now))];
    await runSweepJob(SWEEP_POST, h.deps);
    assert.equal(h.posted.length + m.posts.length, 1, "nothing goes up twice");
    const [post] = h.posted;
    assert.equal(h.staged.length, 1);
    assert.equal(m.staged.length, 1);
    assert.equal(m.staged[0]!.item?.messageTs, post!.ts);
    assert.equal(only(store).nudgeTs, post!.ts);
    assert.equal((await stage.places(utcDay(now))).size, 0);
  });

  it("Monday's stuck cards go up whole, beside a fix and an unowned card, on the channel's one message", async () => {
    const now = at(35, 13); // Mon 2026-10-05, 09:00 ET
    const store = createInMemoryCommitmentStore();
    const stuck = (i: number, who: { id: string; name: string }) =>
      card({ pageId: `s${i}`, title: `Stuck ${i}`, designStatus: "Under Review", contributors: [who], lastEditedAt: EOD - (22 + i) * DAY });
    const rm = roadmap({ cards: [card({ pageId: "a" }), stuck(0, { id: "n-maya", name: "Maya Chen" }), stuck(1, { id: "n-ade", name: "Ade Obi" }), stuck(2, { id: "n-maya", name: "Maya Chen" })] });
    await runCardFollowThroughScan(SCAN, scanDeps(store, rm));
    const h = await fixesAtTop(1, now);
    const storage = createInMemoryRunnerStorage();
    const m = morning(store, rm, now, { handOff: handOffIn(storage), weeklyHandOff: handOffIn(storage, STALE_CARDS_SECTION), threadState: h.threadState });
    await m.run();
    assert.equal(m.posts.length, 0);
    const day = utcDay(now);
    h.deps.sections = [followUpsForSweep(m.due, now, day), followUpsForSweep(m.due, now, day, { weekly: true })];
    await runSweepJob(SWEEP_POST, h.deps);

    assert.equal(h.posted.length, 1, "one top-level message");
    const titles = cardsOf(h.posted[0]!.blocks).map((c) => c.title.text);
    assert.equal(titles.length, 5);
    assert.deepEqual(titles.filter((t) => t.startsWith("Stuck")).sort(), ["Stuck 0", "Stuck 1", "Stuck 2"], "the weekly section shows whole");
    assert.equal(m.staged.length, 4);
    assert.ok([...store.rows.values()].every((r) => r.state === "nudged" && r.nudgeTs === h.posted[0]!.ts));
    assert.equal(await storage.get(`${STALE_CARDS_SECTION}:${day}`), undefined, "the weekly hand-off is spent");
  });

  it("the hand-off keeps a morning's places under one key: merged by row, claimed, given back, cleared", async () => {
    const now = at(35, 13);
    const { store, rm } = await beasCards(true);
    const storage = createInMemoryRunnerStorage();
    const kept: FollowUpHandOff = handOffIn(storage);
    const m = morning(store, rm, now, { handOff: kept });
    await m.run();
    const day = utcDay(now);
    const [place] = [...(await kept.places(day)).values()];
    assert.equal(place!.group.asked.length, 2);
    // A retried commitment job adds its rows again: each is kept once.
    await kept.put(day, { ...place!.group, asked: [place!.group.asked[0]!] });
    assert.equal((await kept.places(day)).get(DESIGN)!.group.asked.length, 2);

    await kept.claim(day, DESIGN, `${day}:x:y`);
    assert.equal((await kept.places(day)).get(DESIGN)!.claimedBy, `${day}:x:y`);
    await kept.unclaim(day, `${day}:x:y`);
    assert.equal((await kept.places(day)).get(DESIGN)!.claimedBy, undefined);

    await kept.clear(day, DESIGN);
    assert.equal(await storage.get(`follow-ups:${day}`), undefined, "an empty morning leaves no key");
  });
});
