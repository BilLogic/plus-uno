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
  commitmentThreadHook,
  createInMemoryCommitmentStore,
  modelCommitmentDetector,
  modelEvidenceJudge,
  REMINDER_LEGEND,
  REMINDER_REACTIONS,
  runCommitmentNudges,
  type NudgeDeps,
  type CommitmentRecord,
  type InMemoryCommitmentStore,
  type ReminderMessage,
} from "../src/commitments/index";
import { at, BOT, DESIGN, msg, sweepHarness, ts, UNO_BOT } from "./helpers/sweep-harness";

const NUDGE: ScheduledJob = { key: "commitment-nudge", kind: "commitment-nudge" };
const EOD: ScheduledJob = { key: `sweep:${DESIGN}`, kind: "sweep-channel", channel: DESIGN };

const BEA = "U0BEA";
const MAYA = "U0MAYA";
const ROOT = ts(29, 14); // Tue 2026-09-29, 10:00 ET
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
async function sweptPromise(opts: { store?: InMemoryCommitmentStore; channel?: string; reply?: string } = {}) {
  const store = opts.store ?? createInMemoryCommitmentStore();
  const channel = opts.channel ?? DESIGN;
  const provider = fakeProvider({ generateReplies: [opts.reply ?? promiseReply()] });
  const h = sweepHarness({
    channels: {
      [channel]: {
        kind: "public",
        history: [msg(BEA, ROOT, "Where are the updated reflection screens?", { reply_count: 1, latest_reply: PROMISE })],
        threads: {
          [ROOT]: [
            msg(BEA, ROOT, "Where are the updated reflection screens?"),
            msg(MAYA, PROMISE, "Still polishing. I'll share the Figma link by Thu."),
          ],
        },
      },
    },
    now: at(29, 22),
  });
  h.deps.onThread = commitmentThreadHook({
    detector: modelCommitmentDetector(provider),
    store,
    config: { unoBot: UNO_BOT },
    now: () => h.clock.now,
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
    },
    sources: { read: async () => null },
    judge: modelEvidenceJudge(judge),
    store: opts.store,
    markThread: async (channel, t) => void marked.push(`${channel}:${t}`),
    config: { unoBot: UNO_BOT, botUserId: BOT },
    meter: { headroom: () => opts.headroom ?? { subrequests: Infinity, d1Queries: Infinity } },
    now: () => clock.now,
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
    // "by Thu", said on Tuesday: the end of Thursday in New York.
    assert.equal(new Date(row.dueAt).toISOString(), "2026-10-02T04:00:00.000Z");
    assert.equal(row.deadlineAt, row.dueAt);
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
  it("does nothing before a commitment is due", async () => {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(31, 14) }); // Thu 14:00: due tonight
    const report = await m.run();
    assert.equal(report.summary, "nothing due");
    assert.equal(m.posts.length, 0);
  });

  it("completion evidence makes it auto_done, and nothing is posted", async () => {
    const { store } = await sweptPromise();
    const link = msg(MAYA, ts(30, 18), "Here you go: <https://www.figma.com/file/abc/Reflection|Figma>");
    const m = mornings({
      store,
      now: at(32, 14), // Fri 2026-10-02 14:00
      thread: [msg(BEA, ROOT, "Where are the screens?"), msg(MAYA, PROMISE, "I'll share it by Thu."), link],
      judgeReplies: [JSON.stringify({ done: true, evidence_ts: [link.ts], confidence: 0.9 })],
    });
    const report = await m.run();
    assert.deepEqual(report.actions.map((a) => a.action), ["auto_done"]);
    assert.equal(only(store).state, "auto_done");
    assert.equal(m.posts.length, 0);
    // The judge saw the promise and what came after it.
    assert.match(m.judge.generated[0]!.prompt, /share the Figma link/);
    assert.ok(m.judge.generated[0]!.prompt.includes(link.ts));
  });

  it("a due commitment gets exactly one nudge, in its thread, mentioning only the promiser", async () => {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(32, 14) });
    await m.run();
    // The same morning's job again — a retried alarm — posts nothing more.
    await m.run();
    assert.equal(m.posts.length, 1);
    const [nudge] = m.posts;
    assert.equal(nudge!.channel, DESIGN);
    assert.equal(nudge!.threadTs, ROOT);
    assert.deepEqual(mentions(nudge!.text), [MAYA]);
    assert.equal(
      nudge!.text,
      `Hey <@${MAYA}>, you said you'd share the Figma link for the reflection screens by Thu. I haven't spotted it yet, so I'm checking in. <https://plus.slack.com/archives/${DESIGN}/p${PROMISE.replace(".", "")}|Original message>`,
    );
    assert.deepEqual((nudge!.blocks[1] as { elements: { text: string }[] }).elements[0]!.text, REMINDER_LEGEND);
    const row = only(store);
    assert.equal(row.state, "nudged");
    assert.equal(row.nudges, 1);
    assert.equal(row.nudgeTs, nudge!.ts);
    // No later messages: no judge call spent.
    assert.equal(m.judge.generated.length, 0);
    // The thread is marked, so the team's replies there don't start turns.
    assert.deepEqual(m.marked, [`${DESIGN}:${ROOT}`]);
  });

  it("with no stated deadline, the nudge names the day of the promise", async () => {
    const { store } = await sweptPromise({ reply: promiseReply({ deadline: null }) });
    // Tue + two working days: due Thursday night, nudged Friday.
    const m = mornings({ store, now: at(32, 14) });
    await m.run();
    assert.match(m.posts[0]!.text, new RegExp(`^Hey <@${MAYA}>, on Tue you said you'd share the Figma link for the reflection screens\\. Did it happen\\?`));
  });

  it("no answer brings one follow-up, then the commitment lapses", async () => {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(32, 14) });
    await m.run(); // Fri: the nudge
    m.clock.now = at(33 + 2, 14); // Mon: re-armed to Tuesday night, not due
    await m.run();
    assert.equal(m.posts.length, 1);
    m.clock.now = at(37, 14); // Wed: the follow-up
    await m.run();
    assert.equal(m.posts.length, 2);
    assert.equal(m.posts[1]!.text, `<@${MAYA}> Still on your list? A reaction is all I need.`);
    assert.equal(m.posts[1]!.threadTs, ROOT);
    assert.equal(only(store).followupTs, m.posts[1]!.ts);
    m.clock.now = at(42, 14); // the Monday after: lapsed, silently
    const report = await m.run();
    assert.deepEqual(report.actions.map((a) => a.action), ["lapsed"]);
    assert.equal(only(store).state, "lapsed");
    assert.equal(m.posts.length, 2);
  });

  it("sends nothing outside the weekday 14:00 UTC run", async () => {
    const { store } = await sweptPromise();
    for (const now of [at(32, 22), at(32, 15), at(33, 14), at(34, 14)]) {
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
    assert.match(report.actions[0]!.text ?? "", /you said you'd share the Figma link/);
    assert.equal(m.posts.length, 0);
    assert.equal(only(store).state, "open");
  });

  it("stops as the budget does before a commitment it cannot finish, having written nothing", async () => {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(32, 14), headroom: { subrequests: 4, d1Queries: 40 } });
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
    const m = mornings({ store, now: at(32, 14) });
    const report = await m.run();
    assert.deepEqual(report.actions.map((a) => a.action), ["refused"]);
    assert.equal(m.posts.length, 0);
  });
});

describe("answers", () => {
  /** A commitment nudged on Friday morning, and the reaction door's deps. */
  async function nudged() {
    const { store } = await sweptPromise();
    const m = mornings({ store, now: at(32, 14) });
    await m.run();
    const reminderTs = m.posts[0]!.ts;
    const react = (glyph: string, userId = MAYA, messageTs = reminderTs) =>
      answerReminder(
        { channel: DESIGN, messageTs, glyph, userId, messageAuthorId: BOT },
        {
          store,
          update: m.deps.slack.update,
          botUserId: async () => BOT,
          now: () => m.clock.now,
        },
      );
    return { store, m, reminderTs, react };
  }

  const table: Array<[string, string, CommitmentRecord["state"], string]> = [
    ["🙌", "raised_hands", "done", "Nice, marked done."],
    ["⏳", "hourglass_flowing_sand", "snoozed", "Got it. I'll check back Wed."],
    ["🙅", "no_good", "dropped", "Noted. I won't ask again."],
    ["🤔", "thinking_face", "not_promise", "My mistake, thanks. I'll read that kind of message better next time."],
  ];
  for (const [glyph, name, state, ack] of table) {
    it(`${glyph} sets ${state} and replaces the legend in place`, async () => {
      const { store, m, reminderTs, react } = await nudged();
      assert.equal(await react(name), true);
      assert.equal(only(store).state, state);
      assert.equal(m.updates.length, 1);
      const [edit] = m.updates;
      assert.equal(edit!.ts, reminderTs);
      // The body stays as posted; only the context line changes, and no new
      // message is posted.
      assert.equal(edit!.text, m.posts[0]!.text);
      assert.deepEqual(edit!.blocks[0], m.posts[0]!.blocks[0]);
      assert.equal((edit!.blocks[1] as { elements: { text: string }[] }).elements[0]!.text, ack);
      assert.equal(m.posts.length, 1);
    });
  }

  it("⏳ re-arms due_at two working days out, and is capped at two", async () => {
    const { store, m, react } = await nudged();
    await react("hourglass_flowing_sand"); // Fri: due Tuesday night
    let row = only(store);
    assert.equal(new Date(row.dueAt).toISOString(), "2026-10-07T04:00:00.000Z");
    assert.equal(row.snoozes, 1);
    assert.equal(row.nudges, 0);
    // Wednesday: the check-in comes back as a first reminder.
    m.clock.now = at(37, 14);
    await m.run();
    assert.equal(m.posts.length, 2);
    const second = m.posts[1]!.ts;
    assert.equal(await react("hourglass_flowing_sand", MAYA, second), true);
    assert.equal(only(store).snoozes, 2);
    m.clock.now = at(42, 14);
    await m.run();
    const third = m.posts[2]!.ts;
    const edits = m.updates.length;
    // A third ⏳ changes nothing.
    assert.equal(await react("hourglass_flowing_sand", MAYA, third), true);
    row = only(store);
    assert.equal(row.snoozes, 2);
    assert.equal(row.state, "nudged");
    assert.equal(m.updates.length, edits);
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
