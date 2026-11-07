// Commitment reminders, a week at a time: the end-of-day sweep reads a
// promise, the weekday morning run checks for completion and nudges the
// promiser in the promise's thread, and the promiser answers with a reaction.
//
// Everything runs against fakes: the sweep harness's Slack workspace for the
// end of day, a small Slack of its own for the mornings, recorded model
// replies, and the in-memory commitment store.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { fakeProvider } from "../src/agent/providers/fake";
import { SubrequestBudgetError } from "../src/net";
import { GATE_RESERVED } from "../src/gate/reactions";
import { resolveSignal, runReactionDoor } from "../src/gate/index";
import { createInMemoryThreadState, type PendingProposal } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import type { ScheduledJob } from "../src/scheduled/runs";
import { runSweepJob, type SweepSlackMessage } from "../src/sweep/index";
import {
  answerReminder,
  answerReminderPress,
  commitmentThreadHook,
  createInMemoryCommitmentStore,
  modelCommitmentDetector,
  modelEvidenceJudge,
  REMINDER_CHOICES,
  footerLabels,
  REMINDER_REACTIONS,
  runCommitmentNudges,
  eitherDoor,
  pressPromise,
  reactPromise,
  submitPromiseView,
  promiseViewErrors,
  PROMISE_DATE_BLOCK,
  PROMISE_DATE_ACTION,
  PROMISE_DROP_BLOCK,
  PROMISE_DROP_ACTION,
  PROMISE_DATE_CALLBACK_ID,
  PROMISE_DROP_CALLBACK_ID,
  THREAD_LABEL,
  type PromiseDoorDeps,
  type NudgeDeps,
  type CommitmentRecord,
  type InMemoryCommitmentStore,
  type ReminderMessage,
} from "../src/commitments/index";
import { at, BOT, DESIGN, msg, sweepHarness, ts, UNO_BOT, utcDay } from "./helpers/sweep-harness";

/** A person's DM with uno-bot, in the fakes. */
const dmOf = (user: string) => `D${user.slice(1)}`;
const NAMES: Record<string, string> = { U0BEA: "Bea", U0MAYA: "Maya" };

const NUDGE: ScheduledJob = { key: "commitment-nudge", kind: "commitment-nudge" };
const EOD: ScheduledJob = { key: `sweep:${DESIGN}`, kind: "sweep-channel", channel: DESIGN };

const BEA = "U0BEA";
const MAYA = "U0MAYA";
const ROOT = ts(29, 13); // Tue 2026-09-29, 09:00 ET
const PROMISE = ts(29, 15); // Tue 11:00 ET

const promiseReply = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    commitments: [
      {
        message_ts: PROMISE,
        promiser: MAYA,
        requester: BEA,
        what: "share the Figma link for the reflection screens",
        deadline: "Thu",
        confidence: 0.9,
        ...over,
      },
    ],
  });

/** The promise, read by Tuesday's end-of-day sweep. */
async function sweptPromise(
  opts: { store?: InMemoryCommitmentStore; channel?: string; reply?: string; later?: SweepSlackMessage[]; now?: number; promiseTs?: string; rootTs?: string } = {},
) {
  const promiseTs = opts.promiseTs ?? PROMISE;
  const root = opts.rootTs ?? ROOT;
  const store = opts.store ?? createInMemoryCommitmentStore();
  const channel = opts.channel ?? DESIGN;
  const provider = fakeProvider({ generateReplies: [opts.reply ?? promiseReply()] });
  const later = opts.later ?? [];
  const latest = later.at(-1)?.ts ?? promiseTs;
  const h = sweepHarness({
    channels: {
      [channel]: {
        kind: "public",
        history: [msg(BEA, root, "Where are the updated reflection screens?", { reply_count: 1 + later.length, latest_reply: latest })],
        threads: {
          [root]: [
            msg(BEA, root, "Where are the updated reflection screens?"),
            msg(MAYA, promiseTs, "Still polishing. I'll share the Figma link by Thu."),
            ...later,
          ],
        },
      },
    },
    now: opts.now ?? at(29, 22),
  });
  h.deps.onThread = commitmentThreadHook({
    detector: modelCommitmentDetector(provider),
    store,
    config: { unoBot: UNO_BOT },
    now: () => h.clock.now,
    get runDate() {
      return h.deps.runDate;
    },
  });
  const job = channel === DESIGN ? EOD : { ...EOD, key: `sweep:${channel}`, channel };
  const report = await runSweepJob(job, h.deps);
  return { store, provider, h, report };
}

/** A morning's Slack: the promise's thread, the channel, and what was posted. */
function mornings(opts: {
  store: InMemoryCommitmentStore;
  now: number;
  thread?: SweepSlackMessage[];
  history?: SweepSlackMessage[];
  judgeReplies?: string[];
  headroom?: { subrequests: number; d1Queries: number };
  dryRun?: boolean;
  /** The promise's thread cannot be read — archived, deleted, the bot removed. */
  unreadable?: boolean;
}) {
  const clock = { now: opts.now };
  const thread = opts.thread ?? [msg(BEA, ROOT, "Where are the updated reflection screens?"), msg(MAYA, PROMISE, "I'll share it by Thu.")];
  const history = opts.history ?? [];
  const judge = fakeProvider({ generateReplies: opts.judgeReplies ?? [] });
  const posts: Array<{ channel: string; threadTs: string | null; ts: string } & ReminderMessage> = [];
  const updates: Array<{ channel: string; ts: string } & ReminderMessage> = [];
  const marked: string[] = [];
  let seq = 0;
  const deps: NudgeDeps = {
    slack: {
      async replies(_channel, rootTs) {
        if (opts.unreadable) return null;
        return { messages: rootTs === ROOT ? [...thread, ...posts.filter((p) => p.threadTs === ROOT).map((p) => ({ ts: p.ts, bot_id: "B0BOT", text: p.text }))] : [] };
      },
      async history(_channel, oldest) {
        return { messages: history.filter((m) => Number(m.ts) > Number(oldest)) };
      },
      async permalink(channel, messageTs) {
        return `https://plus.slack.com/archives/${channel}/p${messageTs.replace(".", "")}`;
      },
      async post(to, message) {
        seq += 1;
        const posted = { channel: to.channel, threadTs: to.threadTs, ts: `${clock.now / 1000}.${String(seq).padStart(6, "0")}`, ...message };
        posts.push(posted);
        return { ok: true, ts: posted.ts };
      },
      async update(channel, messageTs, message) {
        updates.push({ channel, ts: messageTs, ...message });
        return true;
      },
      dmChannel: async (user) => dmOf(user),
      userName: async (user) => NAMES[user] ?? null,
    },
    sources: { read: async () => null },
    judge: modelEvidenceJudge(judge),
    store: opts.store,
    markThread: async (channel, t) => void marked.push(`${channel}:${t}`),
    config: { unoBot: UNO_BOT, botUserId: BOT },
    meter: { headroom: () => opts.headroom ?? { subrequests: Infinity, d1Queries: Infinity } },
    now: () => clock.now,
    get runDate() {
      return utcDay(clock.now);
    },
    ...(opts.dryRun ? { dryRun: true } : {}),
  };
  const run = () => runCommitmentNudges(NUDGE, deps);
  return { deps, run, posts, updates, marked, judge, clock };
}

const only = (store: InMemoryCommitmentStore): CommitmentRecord => {
  assert.equal(store.rows.size, 1);
  return [...store.rows.values()][0]!;
};

const mentions = (text: string) => [...text.matchAll(/<@(U[A-Z0-9]+)>/g)].map((m) => m[1]);

type Card = { title: { text: string }; subtitle: { text: string }; body: { text: string }; actions?: Array<{ action_id: string; text: { text: string }; value: string }> };
/** A posted message's promise cards, as Slack would show them. */
function cardsOf(blocks: unknown[]): Card[] {
  return (blocks as Array<{ type: string; elements?: Card[] }>).flatMap((b) => (b.type === "carousel" ? b.elements! : b.type === "card" ? [b as unknown as Card] : []));
}
const labels = (c: Card) => (c.actions ?? []).map((a) => a.text.text);
const PROMISE_LINK = `https://plus.slack.com/archives/${DESIGN}/p${PROMISE.replace(".", "")}`;

/** The promise door over a morning's fakes: a message read back is the one
 *  posted, with every edit since. */
function promiseDoor(m: ReturnType<typeof mornings>, store: InMemoryCommitmentStore, over: Partial<PromiseDoorDeps> = {}) {
  const opened: Array<Record<string, unknown>> = [];
  const deps: PromiseDoorDeps = {
    store,
    async message(_channel, ts) {
      const edited = m.updates.filter((u) => u.ts === ts).at(-1);
      return edited?.blocks ?? m.posts.find((p) => p.ts === ts)?.blocks ?? null;
    },
    update: m.deps.slack.update,
    async openView(_trigger, view) {
      opened.push(view);
      return true;
    },
    now: () => m.clock.now,
    ...over,
  };
  return { deps, opened };
}

describe("the end of day reads a promise", () => {
  it("keeps it as an open row due at the end of the day it names, and posts nothing", async () => {
    const { store, provider, h, report } = await sweptPromise();
    assert.equal(report.outcome, "handled");
    const row = only(store);
    assert.equal(row.id, `${DESIGN}:${PROMISE}`);
    assert.equal(row.state, "open");
    assert.equal(row.threadTs, ROOT);
    assert.equal(row.promiserId, MAYA);
    assert.equal(row.requesterId, BEA);
    // "by Thu", said on Tuesday: due at the end of Thursday in New York, and
    // first reminded by the heads-up on Wednesday's 9:00 ET run.
    assert.equal(new Date(row.deadlineAt!).toISOString(), "2026-10-02T04:00:00.000Z");
    assert.equal(new Date(row.dueAt).toISOString(), "2026-09-30T13:00:00.000Z");
    // The summary waits in the text store, never on the row.
    assert.equal(store.texts.get(row.id)?.text.what, "share the Figma link for the reflection screens");
    assert.equal(provider.generated.length, 1);
    assert.equal(h.posted.length, 0);
  });

  it("keeps a promise read again in the state it has reached", async () => {
    const { store } = await sweptPromise();
    await store.update(`${DESIGN}:${PROMISE}`, { state: "done" });
    await sweptPromise({ store });
    assert.equal(only(store).state, "done");
  });

  it("never keeps a promise read in #uno-bot", async () => {
    const { store } = await sweptPromise({ channel: UNO_BOT });
    assert.equal(store.rows.size, 0);
  });

  it("a reply that is not JSON keeps nothing, and the drift sweep goes on", async () => {
    const { store, report } = await sweptPromise({ reply: "not json at all" });
    assert.equal(store.rows.size, 0);
    assert.equal(report.outcome, "handled");
  });
});

describe("the morning run", () => {
  it("gives a heads-up the working day before, then nothing until the morning after it's due", async () => {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(30, 13) }); // Wed 09:00 ET: due Thursday
    await m.run();
    assert.equal(m.posts.length, 1);
    const [card] = cardsOf(m.posts[0]!.blocks);
    assert.equal(card!.title.text, "Share the Figma link for the reflection screens");
    assert.equal(card!.subtitle.text, "Due tomorrow, Thu Oct 1");
    assert.deepEqual(labels(card!), ["New date", "On track", "Done"]);
    const row = only(store);
    assert.equal(row.nudges, 0, "a heads-up is not one of the check-ins");
    assert.equal(new Date(row.dueAt).toISOString(), "2026-10-02T13:00:00.000Z", "the check-in: Friday's run");
    m.clock.now = at(31, 13); // Thu: due tonight
    assert.equal((await m.run()).summary, "nothing due");
    assert.equal(m.posts.length, 1);
  });

  it("completion evidence makes it auto_done, and nothing is posted", async () => {
    const { store } = await sweptPromise();
    const link = msg(MAYA, ts(30, 18), "Here you go: <https://www.figma.com/file/abc/Reflection|Figma>");
    const m = mornings({
      store,
      now: at(32, 13), // Fri 2026-10-02 09:00 ET
      thread: [msg(BEA, ROOT, "Where are the screens?"), msg(MAYA, PROMISE, "I'll share it by Thu."), link],
      judgeReplies: [JSON.stringify({ answer: "done", reason: null, evidence_ts: [link.ts], confidence: 0.9 })],
    });
    const report = await m.run();
    assert.deepEqual(report.actions.map((a) => a.action), ["auto_done"]);
    assert.equal(only(store).state, "auto_done");
    assert.equal(m.posts.length, 0);
    // The judge saw the promise and what came after it.
    assert.match(m.judge.generated[0]!.prompt, /share the Figma link/);
    assert.ok(m.judge.generated[0]!.prompt.includes(link.ts));
  });

  it("a due commitment gets exactly one card, in its promiser's DM with uno-bot, mentioning no one", async () => {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(32, 13) });
    await m.run();
    // The same morning's job again — a retried alarm — posts nothing more.
    await m.run();
    assert.equal(m.posts.length, 1);
    const [nudge] = m.posts;
    // In the promiser's DM with uno-bot, top level: never the team's thread.
    assert.equal(nudge!.channel, dmOf(MAYA));
    assert.equal(nudge!.threadTs, null);
    assert.deepEqual(mentions(nudge!.text), []);
    assert.equal(nudge!.text, "• 1 promise due or overdue.\n• Share the Figma link for the reflection screens: Overdue, was due Thu Oct 1");
    const [card] = cardsOf(nudge!.blocks);
    assert.equal(card!.subtitle.text, "Overdue, was due Thu Oct 1");
    assert.equal(card!.body.text, `You told Bea you'd share the Figma link for the reflection screens. <${PROMISE_LINK}|${THREAD_LABEL}>, on Tue.`);
    assert.deepEqual(labels(card!), ["Drop it", "New date", "Done"]);
    const row = only(store);
    assert.equal(row.state, "nudged");
    assert.equal(row.nudges, 1);
    assert.equal(row.nudgeTs, nudge!.ts);
    assert.equal(m.judge.generated.length, 1, "the judge is asked even of silence: a call's moment can pass in it");
    // Nothing went into the team's thread, so there is nothing to mark.
    assert.deepEqual(m.marked, []);
  });

  it("a promise with no thread to answer in posts nothing at the channel's top, and marks nothing", async () => {
    const { store } = await sweptPromise();
    // A reminder only ever answers in the promise's own thread, the team's,
    // which it marks (above). A row with no thread has nowhere to go.
    const row = only(store);
    store.rows.set(row.id, { ...row, threadTs: "" });
    const m = mornings({ store, now: at(32, 13) });
    await m.run();
    assert.equal(m.posts.length, 0);
    assert.deepEqual(m.marked, []);
  });

  it("with no stated deadline, the card asks for a date", async () => {
    const { store } = await sweptPromise({ reply: promiseReply({ deadline: null }) });
    // No date: the Monday run at least two working days on asks for one.
    const m = mornings({ store, now: at(35, 13) });
    await m.run();
    const [card] = cardsOf(m.posts[0]!.blocks);
    assert.equal(card!.subtitle.text, "Set a date");
    assert.deepEqual(labels(card!), ["Drop it", "Pick a date", "Done"]);
    assert.match(card!.body.text, /Pick a date and I'll remind you the day before\. <[^>]+>, last Tue\.$/);
    assert.match(m.posts[0]!.text, /^• 1 promise needs a date\./);
  });

  it("no answer brings one follow-up, then the commitment lapses", async () => {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(32, 13) });
    await m.run(); // Fri: the nudge
    m.clock.now = at(33 + 2, 13); // Mon: re-armed to Tuesday night, not due
    await m.run();
    assert.equal(m.posts.length, 1);
    m.clock.now = at(37, 13); // Wed: the follow-up
    await m.run();
    assert.equal(m.posts.length, 2);
    assert.equal(cardsOf(m.posts[1]!.blocks)[0]!.subtitle.text, "Overdue, was due Thu Oct 1");
    assert.equal(m.posts[1]!.channel, dmOf(MAYA));
    assert.equal(only(store).followupTs, m.posts[1]!.ts);
    m.clock.now = at(42, 13); // the Monday after: lapsed, silently
    const report = await m.run();
    assert.deepEqual(report.actions.map((a) => a.action), ["lapsed"]);
    assert.equal(only(store).state, "lapsed");
    assert.equal(m.posts.length, 2);
  });

  it("sends nothing outside the weekday 09:00 ET run", async () => {
    const { store } = await sweptPromise();
    for (const now of [at(32, 22), at(32, 15), at(33, 13), at(34, 13)]) {
      const m = mornings({ store, now });
      const report = await m.run();
      assert.equal(report.outcome, "skipped");
      assert.equal(m.posts.length, 0);
    }
    assert.equal(only(store).state, "open");
  });

  it("a rehearsal shows the nudge it would post, and posts and keeps nothing", async () => {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(32, 18), dryRun: true });
    const report = await m.run();
    assert.deepEqual(report.actions.map((a) => a.action), ["nudged"]);
    assert.match(report.actions[0]!.text ?? "", /Share the Figma link for the reflection screens: Overdue/);
    assert.equal(m.posts.length, 0);
    assert.equal(only(store).state, "open");
  });

  it("stops as the budget does before a commitment it cannot finish, having written nothing", async () => {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(32, 13), headroom: { subrequests: 4, d1Queries: 40 } });
    await assert.rejects(m.run(), SubrequestBudgetError);
    assert.equal(m.posts.length, 0);
    assert.equal(only(store).checkedOn, null);
  });

  it("never posts in #uno-bot", async () => {
    const store = createInMemoryCommitmentStore();
    const { store: swept } = await sweptPromise();
    const row = only(swept);
    await store.addCommitments([{ ...row, id: `${UNO_BOT}:${PROMISE}`, channel: UNO_BOT }]);
    await store.saveText(`${UNO_BOT}:${PROMISE}`, { what: "share it", bodies: {} }, Infinity);
    const m = mornings({ store, now: at(32, 13) });
    const report = await m.run();
    assert.deepEqual(report.actions.map((a) => a.action), ["refused"]);
    assert.equal(m.posts.length, 0);
  });
});

describe("answers", () => {
  /** A promise carded on Friday morning, and a reaction through the doors the
   *  gate tries first: the promise cards', then the thread reminders'. */
  async function nudged() {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(32, 13) });
    await m.run();
    const reminderTs = m.posts[0]!.ts;
    const { deps } = promiseDoor(m, store);
    const door = eitherDoor(
      (r) => reactPromise(r, deps),
      (r) => answerReminderPress(r, { store, update: m.deps.slack.update, botUserId: async () => BOT, now: () => m.clock.now }),
    )!;
    const react = async (glyph: string, userId = MAYA, messageTs = reminderTs) =>
      (await door({ channel: dmOf(MAYA), messageTs, glyph, userId, messageAuthorId: BOT })).claimed;
    return { store, m, reminderTs, react };
  }

  const table: Array<[string, string, CommitmentRecord["state"], string]> = [
    ["🙌", "raised_hands", "done", "Done"],
    ["⏳", "hourglass_flowing_sand", "snoozed", "Moved to Tue Oct 6"],
    ["🙅", "no_good", "dropped", "Dropped"],
    ["🤔", "thinking_face", "not_promise", "Not a promise, won't track"],
  ];
  for (const [glyph, name, state, outcome] of table) {
    it(`${glyph} on a one-card message sets ${state}, and the card says "${outcome}"`, async () => {
      const { store, m, reminderTs, react } = await nudged();
      assert.equal(await react(name), true);
      assert.equal(only(store).state, state);
      assert.equal(m.updates.length, 1);
      const [edit] = m.updates;
      assert.equal(edit!.ts, reminderTs);
      const [card] = cardsOf(edit!.blocks);
      assert.equal(card!.subtitle.text, outcome);
      assert.equal(card!.actions, undefined, "its buttons go");
      assert.equal(card!.body.text, cardsOf(m.posts[0]!.blocks)[0]!.body.text, "the body keeps the promise");
      assert.equal(m.posts.length, 1, "no new message");
    });
  }

  it("a reaction on a message of several cards says to use the buttons, and changes nothing", async () => {
    const { store: swept } = await sweptPromise();
    const base = only(swept);
    const store = createInMemoryCommitmentStore();
    for (const thread of [ts(29, 13, 1), ts(29, 13, 2)]) {
      await store.addCommitments([{ ...base, id: `${DESIGN}:${thread}`, threadTs: thread, messageTs: thread }]);
      await store.saveText(`${DESIGN}:${thread}`, { what: `task ${thread}`, bodies: {} }, Infinity);
    }
    const m = mornings({ store, now: at(32, 13) });
    await m.run();
    assert.equal(cardsOf(m.posts[0]!.blocks).length, 2);
    const outcome = await reactPromise({ channel: dmOf(MAYA), messageTs: m.posts[0]!.ts, glyph: "raised_hands", userId: MAYA }, promiseDoor(m, store).deps);
    assert.deepEqual(outcome, { claimed: true, refused: "This message has more than one promise, so use a card's buttons to say which one." });
    assert.deepEqual([...store.rows.values()].map((r) => r.state), ["nudged", "nudged"]);
  });

  it("⏳ re-arms due_at two working days out, and is capped at two", async () => {
    const { store, m, react } = await nudged();
    await react("hourglass_flowing_sand"); // Fri: due Tuesday night
    let row = only(store);
    assert.equal(new Date(row.deadlineAt!).toISOString(), "2026-10-07T04:00:00.000Z");
    assert.equal(new Date(row.dueAt).toISOString(), "2026-10-07T13:00:00.000Z");
    assert.equal(row.snoozes, 1);
    m.clock.now = at(37, 13); // Wed
    await m.run();
    const followUp = m.posts[1]!.ts;
    assert.equal(await react("hourglass_flowing_sand", MAYA, followUp), true);
    row = only(store);
    assert.equal(row.snoozes, 2);
    const due = row.dueAt;
    const edits = m.updates.length;
    // A third ⏳ changes nothing.
    assert.equal(await react("hourglass_flowing_sand", MAYA, followUp), true);
    row = only(store);
    assert.equal(row.snoozes, 2);
    assert.equal(row.dueAt, due);
    assert.equal(m.updates.length, edits);
  });

  it("a ⏳ moves the date but adds no check-in: the reminder and one follow-up, then lapsed", async () => {
    const { store, m, react } = await nudged();
    await react("hourglass_flowing_sand"); // Fri
    m.clock.now = at(37, 13); // Wed: the follow-up, not a second first reminder
    const report = await m.run();
    assert.deepEqual(report.actions.map((a) => a.action), ["followed-up"]);
    assert.equal(m.posts.length, 2);
    assert.equal(cardsOf(m.posts[1]!.blocks)[0]!.subtitle.text, "Overdue, was due Tue Oct 6");
    await react("hourglass_flowing_sand", MAYA, m.posts[1]!.ts);
    m.clock.now = at(42, 13); // the Monday after: due again, and spent
    const later = await m.run();
    assert.deepEqual(later.actions.map((a) => a.action), ["lapsed"]);
    assert.equal(m.posts.length, 2);
  });

  it("every reminder a commitment posted stays answerable", async () => {
    const { store, m, reminderTs, react } = await nudged();
    await react("hourglass_flowing_sand"); // Fri, on the first card
    m.clock.now = at(37, 13);
    await m.run(); // the follow-up
    assert.notEqual(m.posts[1]!.ts, reminderTs);
    // 🙌 on the FIRST message, its card already answered, still lands.
    assert.equal(await react("raised_hands", MAYA, reminderTs), true);
    assert.equal(only(store).state, "done");
  });

  it("✅ on a reminder does nothing, and never reaches the gate", async () => {
    const { store, m, react } = await nudged();
    assert.equal(await react("white_check_mark"), true);
    assert.equal(only(store).state, "nudged");
    assert.equal(m.updates.length, 0);
  });

  it("someone other than the promiser changes nothing", async () => {
    const { store, m, react } = await nudged();
    assert.equal(await react("raised_hands", BEA), true);
    assert.equal(only(store).state, "nudged");
    assert.equal(m.updates.length, 0);
  });

  it("a reaction on anything but a reminder is not the reminder's", async () => {
    const { react } = await nudged();
    assert.equal(await react("raised_hands", MAYA, "1790000000.000001"), false);
    assert.equal(await react("tada"), false);
  });

  it("the reminder's glyphs are none of the gate's", () => {
    for (const name of Object.keys(REMINDER_REACTIONS)) assert.equal(GATE_RESERVED.has(name), false, name);
  });
});

describe("a card's buttons and pop-ups", () => {
  // A button press always answers whoever pressed it: a reaction can be left
  // unanswered, a tap that does nothing reads as a broken button.
  async function tapped(over: Partial<PromiseDoorDeps> = {}) {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(32, 13) });
    await m.run();
    const reminderTs = m.posts[0]!.ts;
    const { deps, opened } = promiseDoor(m, store, over);
    const button = (label: string) => cardsOf(m.posts[0]!.blocks)[0]!.actions!.find((a) => a.text.text === label)!;
    const press = (label: string, userId = MAYA) => {
      const b = button(label);
      return pressPromise({ channel: dmOf(MAYA), messageTs: reminderTs, userId, actionId: b.action_id, value: b.value, triggerId: "T1", blocks: m.posts[0]!.blocks }, deps);
    };
    const save = (view: Record<string, unknown>, values: Record<string, Record<string, unknown>>, userId = MAYA) =>
      submitPromiseView({ callbackId: view.callback_id as string, privateMetadata: view.private_metadata as string, state: { values } as never, userId }, deps);
    return { store, m, reminderTs, press, save, opened, deps };
  }

  it("Done settles it, and the card says so with its buttons gone", async () => {
    const { store, m, press } = await tapped();
    assert.deepEqual(await press("Done"), { claimed: true });
    assert.equal(only(store).state, "done");
    const [card] = cardsOf(m.updates[0]!.blocks);
    assert.deepEqual([card!.subtitle.text, card!.actions], ["Done", undefined]);
  });

  it("New date opens the date picker on the next working day after the due date; Save restarts the timeline", async () => {
    const { store, m, press, save, opened } = await tapped();
    assert.deepEqual(await press("New date"), { claimed: true });
    const view = opened[0]!;
    const picker = (view.blocks as Array<{ element: { initial_date: string } }>)[0]!.element;
    // Due Thu Oct 1, overdue on Fri Oct 2: the next working day is Mon Oct 5.
    assert.equal(picker.initial_date, "2026-10-05");
    assert.deepEqual(await save(view, { [PROMISE_DATE_BLOCK]: { [PROMISE_DATE_ACTION]: { selected_date: "2026-10-07" } } }), { claimed: true });
    const row = only(store);
    assert.equal(row.state, "open");
    assert.equal(row.nudges, 0, "a new date restarts the timeline");
    assert.equal(new Date(row.deadlineAt!).toISOString(), "2026-10-08T04:00:00.000Z");
    assert.equal(new Date(row.dueAt).toISOString(), "2026-10-06T13:00:00.000Z", "the heads-up, the working day before");
    assert.equal(cardsOf(m.updates.at(-1)!.blocks)[0]!.subtitle.text, "Moved to Wed Oct 7");
    m.clock.now = at(36, 13); // Tue: the heads-up
    await m.run();
    assert.equal(cardsOf(m.posts[1]!.blocks)[0]!.subtitle.text, "Due tomorrow, Wed Oct 7");
  });

  it("a date before today is refused under the picker", async () => {
    const { store, m, press, save, opened } = await tapped();
    await press("New date");
    const values = { [PROMISE_DATE_BLOCK]: { [PROMISE_DATE_ACTION]: { selected_date: "2026-10-01" } } };
    assert.deepEqual(promiseViewErrors({ callbackId: PROMISE_DATE_CALLBACK_ID, state: { values } as never }, m.clock.now), { [PROMISE_DATE_BLOCK]: "Pick today or a later day." });
    const outcome = await save(opened[0]!, values);
    assert.equal(outcome.claimed && outcome.refused, "Pick today or a later day.");
    assert.equal(only(store).state, "nudged");
  });

  it("Drop it offers its two choices; \"It wasn't a promise\" closes it as not a promise", async () => {
    const { store, m, press, save, opened } = await tapped();
    assert.deepEqual(await press("Drop it"), { claimed: true });
    const view = opened[0]!;
    assert.equal(view.callback_id, PROMISE_DROP_CALLBACK_ID);
    assert.deepEqual(await save(view, { [PROMISE_DROP_BLOCK]: { [PROMISE_DROP_ACTION]: { selected_option: { value: "not-a-promise" } } } }), { claimed: true });
    assert.equal(only(store).state, "not_promise", "the detector learns from it, as from 🤔");
    assert.equal(cardsOf(m.updates.at(-1)!.blocks)[0]!.subtitle.text, "Not a promise, won't track");
  });

  it("someone else's promise names whose it is, and changes nothing", async () => {
    const { store, m, press } = await tapped();
    const outcome = await press("Done", BEA);
    assert.equal(outcome.claimed && outcome.refused, `Only <@${MAYA}> can answer this reminder, so that tap changed nothing.`);
    assert.equal(only(store).state, "nudged");
    assert.equal(m.updates.length, 0);
  });

  it("a settled promise says it is settled", async () => {
    const { press } = await tapped();
    assert.deepEqual(await press("Done"), { claimed: true });
    const again = await press("Drop it");
    assert.equal(again.claimed && again.refused, "This one's already been answered, so that tap changed nothing.");
  });

  it("two answers at once: one lands, the other is told it was already answered", async () => {
    const { store, m, press } = await tapped();
    const [first, second] = await Promise.all([press("Done"), press("Done")]);
    assert.deepEqual([first, second].filter((o) => o.claimed && !o.refused), [{ claimed: true }]);
    assert.deepEqual([first, second].find((o) => o.claimed && o.refused), { claimed: true, refused: "This one's already been answered, so that tap changed nothing." });
    assert.equal(m.updates.length, 1);
    assert.equal(only(store).state, "done");
  });

  it("an answer whose message could not be redrawn still lands, and says it was recorded", async () => {
    const { store, press } = await tapped({ update: async () => false });
    assert.deepEqual(await press("Done"), { claimed: true, unedited: true });
    assert.equal(only(store).state, "done");
  });

  it("a store that fails says so, rather than passing for no card", async () => {
    const { store, press } = await tapped();
    store.get = async () => {
      throw new Error("D1 down");
    };
    assert.deepEqual(await press("Done"), { claimed: false, failed: true });
  });

  it("a button that is no promise card's is not the door's", async () => {
    const { deps, reminderTs } = await tapped();
    assert.deepEqual(await pressPromise({ channel: dmOf(MAYA), messageTs: reminderTs, userId: MAYA, actionId: "uno_reminder_raised_hands" }, deps), { claimed: false });
  });
});

describe("a promise said again", () => {
  const REPLY = ts(32 + 0, 16); // Fri 2026-10-02 12:00 ET, under the reminder

  it("a reply under a reminder adds no row, and a later day it names moves the date as a ⏳", async () => {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(32, 13) });
    await m.run(); // Fri: the reminder
    const reply = msg(MAYA, REPLY, "Sorry! Will do by Wed.");
    await sweptPromise({
      store,
      later: [reply],
      now: at(32, 22),
      reply: promiseReply({ message_ts: REPLY, deadline: "Wed", what: "share the Figma link" }),
    });
    const row = only(store);
    assert.equal(row.id, `${DESIGN}:${PROMISE}`);
    assert.equal(row.state, "snoozed");
    assert.equal(row.snoozes, 1);
    // "by Wed", said on Friday: due at the end of Wednesday the 7th; the new
    // date restarts the timeline, so Tuesday's run gives the heads-up.
    assert.equal(new Date(row.deadlineAt!).toISOString(), "2026-10-08T04:00:00.000Z");
    assert.equal(new Date(row.dueAt).toISOString(), "2026-10-06T13:00:00.000Z");
    // Two check-ins at most: Friday's, then Thursday's after the heads-up, then the lapse.
    m.clock.now = at(36, 13); // Tue 6th: the heads-up
    await m.run();
    m.clock.now = at(38, 13); // Thu 8th: the check-in
    await m.run();
    m.clock.now = at(42, 13);
    await m.run();
    m.clock.now = at(44, 13);
    await m.run();
    assert.equal(m.posts.length, 3);
    assert.equal(cardsOf(m.posts[1]!.blocks)[0]!.subtitle.text, "Due tomorrow, Wed Oct 7");
    assert.equal(cardsOf(m.posts[2]!.blocks)[0]!.subtitle.text, "Overdue, was due Wed Oct 7");
    assert.equal(only(store).state, "lapsed");
  });

  it("said again with no later day, it changes nothing", async () => {
    const { store } = await sweptPromise();
    const before = only(store);
    await sweptPromise({
      store,
      later: [msg(MAYA, ts(30, 16), "yep, on it")],
      now: at(30, 22),
      reply: promiseReply({ message_ts: ts(30, 16), deadline: null }),
    });
    assert.deepEqual(only(store), before);
  });
});

describe("the morning's limits", () => {
  it("a row held three mornings running lapses", async () => {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(32, 13), unreadable: true });
    const seen: string[] = [];
    for (const day of [32, 35, 36]) {
      m.clock.now = at(day, 13);
      const report = await m.run();
      seen.push(...report.actions.map((a) => a.action));
    }
    assert.deepEqual(seen, ["held", "held", "lapsed"]);
    assert.equal(only(store).state, "lapsed");
    assert.equal(only(store).holds, 3);
    assert.equal(m.posts.length, 0);
  });

  it("a row that posts after a hold starts its count again", async () => {
    const { store } = await sweptPromise();
    const held = mornings({ store, now: at(32, 13), unreadable: true });
    await held.run();
    assert.equal(only(store).holds, 1);
    const m = mornings({ store, now: at(35, 13) });
    await m.run();
    assert.equal(m.posts.length, 1);
    assert.equal(only(store).holds, 0);
  });

  it("one promiser gets one message a morning of at most ten cards; the rest wait, and waiting is no hold", async () => {
    const { store: swept } = await sweptPromise();
    const base = only(swept);
    const store = createInMemoryCommitmentStore();
    const threads = Array.from({ length: 12 }, (_, i) => ts(29, 13, i + 1));
    for (const [i, thread] of threads.entries()) {
      const id = `${DESIGN}:${thread}`;
      await store.addCommitments([{ ...base, id, threadTs: thread, messageTs: thread, dueAt: base.dueAt + i }]);
      await store.saveText(id, { what: `task ${i + 1}`, bodies: {} }, Infinity);
    }
    const m = mornings({ store, now: at(32, 13) });
    await m.run();
    assert.equal(m.posts.length, 1);
    assert.equal(cardsOf(m.posts[0]!.blocks).length, 10);
    assert.equal(m.posts[0]!.channel, dmOf(MAYA));
    // A retried alarm the same morning still holds the cap.
    await m.run();
    assert.equal(m.posts.length, 1);
    for (const thread of threads.slice(10)) {
      const waiting = store.rows.get(`${DESIGN}:${thread}`)!;
      assert.equal(waiting.state, "open");
      assert.equal(waiting.checkedOn, null);
      assert.equal(waiting.holds, 0);
    }
    m.clock.now = at(35, 13); // Monday
    await m.run();
    assert.equal(m.posts.length, 2);
    assert.deepEqual(cardsOf(m.posts[1]!.blocks).map((c) => c.title.text), ["Task 11", "Task 12"]);
  });

  it("a stop before the message posts hands every held promise back to the next run", async () => {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(32, 13) });
    m.deps.slack.dmChannel = async () => {
      throw new SubrequestBudgetError(1);
    };
    await assert.rejects(m.run(), SubrequestBudgetError);
    assert.equal(only(store).checkedOn, null);
    assert.equal(m.posts.length, 0);
  });
});

describe("the reaction door", () => {
  const CARD_TS = "1790776800.900001";
  const card: PendingProposal = {
    toolName: "notion_create",
    input: { title: "Reflection redesign" },
    channel: DESIGN,
    threadTs: ROOT,
    replyTs: ROOT,
    userMsgTs: PROMISE,
    proposalTs: CARD_TS,
    proposalText: "(the staged card)",
    requesterUserId: BEA,
  };

  async function door(messageTs: string, glyph: string, reminderTs: string) {
    const threadState = createInMemoryThreadState();
    await threadState.putProposal(card);
    const delivery = recordingDelivery();
    const ran: unknown[] = [];
    const looked: string[] = [];
    await runReactionDoor(
      { channel: DESIGN, messageTs, glyph, userId: MAYA, messageAuthorId: BOT },
      {
        threadState,
        delivery: () => delivery,
        threadRootOf: async () => ROOT,
        botUserId: async () => BOT,
        applyVerdict: async (v) => void ran.push(v),
        restage: async () => {},
        reminder: async (r) => {
          looked.push(r.messageTs);
          return r.messageTs === reminderTs;
        },
      },
    );
    return { delivery, ran, looked, threadState };
  }

  it("✅ on a reminder never reaches the card in the same thread", async () => {
    const { delivery, ran, threadState } = await door("1790900000.000001", "white_check_mark", "1790900000.000001");
    assert.equal(ran.length, 0);
    assert.equal(delivery.gateNotes.length, 0);
    assert.equal((await threadState.getProposalByThread({ channel: DESIGN, thread: ROOT }))?.proposalTs, CARD_TS);
  });

  it("a reminder store that throws fails open: a card's ✅ still confirms", async () => {
    const store = createInMemoryCommitmentStore();
    store.byReminderTs = async () => {
      throw new Error("D1_ERROR: no such table: commitments");
    };
    const threadState = createInMemoryThreadState();
    await threadState.putProposal(card);
    const ran: unknown[] = [];
    await runReactionDoor(
      { channel: DESIGN, messageTs: CARD_TS, glyph: "white_check_mark", userId: MAYA, messageAuthorId: BOT },
      {
        threadState,
        delivery: () => recordingDelivery(),
        threadRootOf: async () => ROOT,
        botUserId: async () => BOT,
        applyVerdict: async (v) => void ran.push(v),
        restage: async () => {},
        reminder: (r) =>
          answerReminder(r, { store, update: async () => true, botUserId: async () => BOT, now: () => at(32, 15) }),
      },
    );
    assert.equal(ran.length, 1);
  });

  it("✅ on a proposal card still confirms", async () => {
    const { ran, looked } = await door(CARD_TS, "white_check_mark", "1790900000.000001");
    assert.deepEqual(looked, [CARD_TS]);
    assert.equal(ran.length, 1);
    // The same verdict the gate gives with no reminder look at all.
    const plain = await resolveSignal(
      { kind: "reaction", messageTs: CARD_TS, channel: DESIGN, thread: ROOT, glyph: "white_check_mark", userId: MAYA },
      { threadState: await (async () => {
        const s = createInMemoryThreadState();
        await s.putProposal(card);
        return s;
      })() },
    );
    assert.equal((ran[0] as { outcome: string }).outcome, plain.outcome);
  });
});

// ── One promise timeline, a whole week against fakes ─────────────────────────
// Each worked case, Made → Due → Heads-up → Check-in: the promise is read at
// the end of its day, then every weekday morning run for a week and a half,
// with the judge answering as the case says. Which mornings post is the
// timeline, with the one more check-in an unanswered one gets two working
// days on where it falls inside the window. Days are 2026-10-`n`, given as Sep days past 30 (Oct 5 is 35).

describe("one promise timeline, morning by morning", () => {
  const OPEN = JSON.stringify({ answer: "still_open", reason: null, evidence_ts: [], confidence: 0.9 });
  const PASSED = JSON.stringify({ answer: "no_longer_needed", reason: "time_passed", evidence_ts: [], confidence: 0.9 });
  const cases: Array<{ name: string; made: string; deadline: string | null; judge: string[]; posts: number[] }> = [
    { name: '"by Thu": Mon → Thu → Wed → Fri', made: ts(35, 15), deadline: "Thu", judge: [OPEN, OPEN, OPEN], posts: [37, 39, 43] },
    { name: '"tomorrow": Mon → Tue → Tue → Wed', made: ts(35, 15), deadline: "tomorrow", judge: [OPEN, OPEN, OPEN], posts: [36, 37, 39] },
    { name: '"by Mon": Fri → Mon → Mon → Tue', made: ts(39, 15), deadline: "Mon", judge: [OPEN, OPEN, OPEN], posts: [42, 43, 45] },
    { name: '"call at 1:30": Wed 12:07 → Wed 13:30 → none → none, its time passed', made: ts(37, 16, 7), deadline: "1:30", judge: [PASSED], posts: [] },
    { name: '"review next Tue": Wed → Tue → Mon → none, its time passed', made: ts(37, 15), deadline: "next Tue", judge: [OPEN, PASSED], posts: [42] },
    { name: '"update the PRD": Mon → none → none → next Monday, asking for a date', made: ts(35, 15), deadline: null, judge: [OPEN, OPEN], posts: [42, 44] },
  ];
  for (const c of cases) {
    it(c.name, async () => {
      const madeDay = Math.floor((Number(c.made) * 1000 - Date.UTC(2026, 8, 0)) / 86_400_000);
      const rootTs = `${Number(c.made) - 3600}.000000`;
      const { store } = await sweptPromise({ promiseTs: c.made, rootTs, now: at(madeDay, 22), reply: promiseReply({ message_ts: c.made, deadline: c.deadline }) });
      assert.equal(only(store).state, "open");
      const m = mornings({ store, now: at(madeDay + 1, 13), judgeReplies: c.judge, thread: [msg(BEA, rootTs, "Where are the updated reflection screens?"), msg(MAYA, c.made, "the promise")] });
      const posted: number[] = [];
      for (let day = madeDay + 1; day <= madeDay + 9; day++) {
        const wd = new Date(Date.UTC(2026, 8, day)).getUTCDay();
        if (wd === 0 || wd === 6) continue;
        m.clock.now = at(day, 13);
        const before = m.posts.length;
        await m.run();
        if (m.posts.length > before) posted.push(day);
      }
      assert.deepEqual(posted, c.posts);
    });
  }
});
