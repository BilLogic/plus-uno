// "Remind me": read in the turn, kept as a `self_reminder` commitment, posted
// back in the same DM or thread at the right weekday morning run, and answered
// with 🙌 or ⏳.
//
// Everything runs against fakes: a small Slack for the mornings, the in-memory
// commitment store, and a fixed clock. Tue 2026-09-29 is the day it is asked.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { ScheduledJob } from "../src/scheduled/runs";
import {
  answerReminder,
  channelKindFor,
  createInMemoryCommitmentStore,
  parseReminderWhen,
  runCommitmentNudges,
  SELF_REMINDER_LAST_CHOICES,
  SELF_REMINDER_CHOICES,
  footerLabels,
  setSelfReminder,
  snoozedRunAt,
  ONE_PER_MESSAGE,
  type InMemoryCommitmentStore,
  type NudgeDeps,
  type ReminderMessage,
  type ReminderPlace,
} from "../src/commitments/index";
import { at, BOT, DESIGN, ts, UNO_BOT, utcDay } from "./helpers/sweep-harness";

const NUDGE: ScheduledJob = { key: "commitment-nudge", kind: "commitment-nudge" };
const MAYA = "U0MAYA";
const DM = "D0MAYA";
const ASKED = at(29, 18); // Tue 2026-09-29, 2 pm ET
const ASK_TS = ts(29, 18);

const iso = (ms: number) => new Date(ms).toISOString();

describe("reading the time", () => {
  // [said, when it is said, the morning run it names]
  const placed: Array<[string, number, string]> = [
    ["Thu", ASKED, "2026-10-01T13:00:00.000Z"],
    ["Thursday", ASKED, "2026-10-01T13:00:00.000Z"],
    ["on Thursday", ASKED, "2026-10-01T13:00:00.000Z"],
    ["this Thu", ASKED, "2026-10-01T13:00:00.000Z"],
    ["Mon", ASKED, "2026-10-05T13:00:00.000Z"],
    ["tomorrow", ASKED, "2026-09-30T13:00:00.000Z"],
    ["tomorrow morning", ASKED, "2026-09-30T13:00:00.000Z"],
    ["Thu at 3pm", ASKED, "2026-10-01T13:00:00.000Z"],
    ["thursday at 3", ASKED, "2026-10-01T13:00:00.000Z"],
    ["Thu at 3:30", ASKED, "2026-10-01T13:00:00.000Z"],
    ["in 2 days", ASKED, "2026-10-01T13:00:00.000Z"],
    ["in two days", ASKED, "2026-10-01T13:00:00.000Z"],
    ["2 days from now", ASKED, "2026-10-01T13:00:00.000Z"],
    ["in a week", ASKED, "2026-10-06T13:00:00.000Z"],
    ["next week", ASKED, "2026-10-05T13:00:00.000Z"],
    // From a Friday: calendar days land on the weekend and move to Monday;
    // working days skip it.
    ["in 2 days", at(32, 18), "2026-10-05T13:00:00.000Z"],
    ["in 2 working days", at(32, 18), "2026-10-06T13:00:00.000Z"],
    ["tomorrow", at(32, 18), "2026-10-05T13:00:00.000Z"],
    // Dates, and a Saturday date moved to Monday.
    ["Oct 8", ASKED, "2026-10-08T13:00:00.000Z"],
    ["10/8", ASKED, "2026-10-08T13:00:00.000Z"],
    ["2026-10-15", ASKED, "2026-10-15T13:00:00.000Z"],
    ["Oct 3", ASKED, "2026-10-05T13:00:00.000Z"],
    // Today, while its run is still ahead.
    ["today", at(29, 12), "2026-09-29T13:00:00.000Z"],
  ];
  for (const [said, now, runAt] of placed) {
    it(`places "${said}" at ${runAt}`, () => {
      const when = parseReminderWhen(said, now);
      assert.ok(when.ok, `asked instead: ${"ask" in when ? when.ask : ""}`);
      assert.equal(iso(when.runAt), runAt);
    });
  }

  // [said, when it is said, what the question must name]
  const asked: Array<[string, number, RegExp]> = [
    ["next Thursday", ASKED, /Thu Oct 1.*Thu Oct 8/],
    ["Tuesday", ASKED, /Today, or next Tue Oct 6/],
    ["today", ASKED, /already gone/],
    ["2026-09-01", ASKED, /passed/],
    // A date with no year that has passed rolls to next year only when close.
    ["9/1", ASKED, /Sep 1 has passed this year\. Did you mean Sep 1, 2027/],
    ["later", ASKED, /When should I remind you/],
    ["soon", ASKED, /When should I remind you/],
    ["", ASKED, /When should I remind you/],
  ];
  for (const [said, now, question] of asked) {
    it(`asks one question about "${said}"`, () => {
      const when = parseReminderWhen(said, now);
      assert.equal(when.ok, false);
      assert.match("ask" in when ? when.ask : "", question);
    });
  }

  it("places a reminder at 09:00 ET on both sides of the 1 Nov 2026 change", () => {
    const thuOct29 = at(59, 18); // Thu 2026-10-29, 2 pm EDT
    const fri = parseReminderWhen("Fri", thuOct29);
    assert.ok(fri.ok);
    assert.equal(iso(fri.runAt), "2026-10-30T13:00:00.000Z");
    const mon = parseReminderWhen("Mon", thuOct29);
    assert.ok(mon.ok);
    assert.equal(iso(mon.runAt), "2026-11-02T14:00:00.000Z");
    // Today at 13:30 UTC on Mon 2 Nov is 8:30 EST: its 9 am run is still ahead.
    const today = parseReminderWhen("today", Date.UTC(2026, 10, 2, 13, 30));
    assert.ok(today.ok);
    assert.equal(iso(today.runAt), "2026-11-02T14:00:00.000Z");
    // A ⏳ on Thu 29 Oct moves it two working days out: Mon 2 Nov, 09:00 EST.
    assert.equal(iso(snoozedRunAt(thuOct29)), "2026-11-02T14:00:00.000Z");
  });

  it("a date with no year rolled into next year, close by, is placed and named with its year", async () => {
    const dec20 = at(111, 18); // Sun 2026-12-20
    const when = parseReminderWhen("1/5", dec20);
    assert.ok(when.ok && when.rolledYear);
    assert.equal(iso(when.runAt), "2027-01-05T14:00:00.000Z"); // 09:00 EST
    const store = createInMemoryCommitmentStore();
    const result = await setSelfReminder({ when: "1/5", what: "renew the license" }, dmPlace, { store, now: () => dec20 });
    assert.ok(result.ok);
    assert.equal(result.confirm, "Got it, Jan 5, 2027 9 am ET.");
  });

  it("names a place's kind fail-closed", () => {
    assert.equal(channelKindFor("C1", "channel"), "public");
    assert.equal(channelKindFor("C1", "group"), "private");
    assert.equal(channelKindFor("G1", "mpim"), "group-dm");
    assert.equal(channelKindFor("D1"), "dm");
    assert.equal(channelKindFor("C1"), "private");
    assert.equal(channelKindFor("C1", "something-new"), "private");
  });
});

const dmPlace: ReminderPlace = { channel: DM, channelKind: "dm", threadTs: ASK_TS, messageTs: ASK_TS, userId: MAYA };

async function asked(
  store: InMemoryCommitmentStore,
  when = "Thu",
  place: ReminderPlace = dmPlace,
  what = "Review the PRD for reflections",
) {
  return setSelfReminder({ when, what }, place, { store, unoBot: UNO_BOT, now: () => ASKED });
}

describe("setting a reminder in the turn", () => {
  it("keeps a self_reminder row due at the morning run, the summary in the text store, and confirms in one line", async () => {
    const store = createInMemoryCommitmentStore();
    const result = await asked(store);
    assert.deepEqual(result, { ok: true, confirm: "Got it, Thu 9 am ET.", runAt: "2026-10-01T13:00:00.000Z" });
    const row = store.rows.get(`${DM}:${ASK_TS}`)!;
    assert.equal(row.kind, "self_reminder");
    assert.equal(row.channelKind, "dm");
    assert.equal(row.promiserId, MAYA);
    assert.equal(row.requesterId, MAYA);
    assert.equal(row.threadTs, ASK_TS);
    assert.equal(row.state, "open");
    assert.equal(iso(row.dueAt), "2026-10-01T13:00:00.000Z");
    assert.equal(store.texts.get(row.id)?.text.what, "review the PRD for reflections");
  });

  it("an ambiguous time keeps nothing and hands back the question", async () => {
    const store = createInMemoryCommitmentStore();
    const result = await asked(store, "next Thu");
    assert.equal(result.ok, false);
    assert.ok("ask" in result);
    assert.equal(store.rows.size, 0);
    assert.equal(store.texts.size, 0);
  });

  it("the same reminder set again from the same message moves it and starts it over", async () => {
    const store = createInMemoryCommitmentStore();
    await asked(store, "Thu");
    await store.update(`${DM}:${ASK_TS}`, { state: "snoozed", nudges: 1, snoozes: 1 });
    const again = await asked(store, "Mon", dmPlace, "review the PRD for reflections.");
    assert.ok(again.ok);
    assert.equal(store.rows.size, 1);
    const row = [...store.rows.values()][0]!;
    assert.equal(iso(row.dueAt), "2026-10-05T13:00:00.000Z");
    assert.equal(row.state, "open");
    assert.equal(row.nudges, 0);
    assert.equal(row.snoozes, 0);
  });

  it("a second, different reminder from the same message is refused in one line and changes nothing", async () => {
    const store = createInMemoryCommitmentStore();
    await asked(store, "Thu");
    const second = await asked(store, "Mon", dmPlace, "book the usability room");
    assert.deepEqual(second, { ok: false, error: ONE_PER_MESSAGE });
    const row = [...store.rows.values()][0]!;
    assert.equal(iso(row.dueAt), "2026-10-01T13:00:00.000Z");
    assert.equal(store.texts.get(row.id)?.text.what, "review the PRD for reflections");
  });

  it("strips bare URLs and linkable domains from what the reminder repeats", async () => {
    const store = createInMemoryCommitmentStore();
    await asked(store, "Thu", dmPlace, "check https://evil.example/login and www.bad.io then evil.com/x before the review");
    const what = store.texts.get(`${DM}:${ASK_TS}`)!.text.what;
    assert.doesNotMatch(what, /https?:|www\.|evil\.com|bad\.io|evil\.example/);
    assert.match(what, /before the review/);
  });

  it("is never set in #uno-bot", async () => {
    const store = createInMemoryCommitmentStore();
    const result = await asked(store, "Thu", { ...dmPlace, channel: UNO_BOT, channelKind: "public" });
    assert.equal(result.ok, false);
    assert.ok("error" in result && /uno-bot/.test(result.error));
    assert.equal(store.rows.size, 0);
  });

  it("needs something to remind about", async () => {
    const store = createInMemoryCommitmentStore();
    const result = await asked(store, "Thu", dmPlace, "  ");
    assert.equal(result.ok, false);
    assert.equal(store.rows.size, 0);
  });
});

/** A morning's Slack and the job over the store. */
function mornings(store: InMemoryCommitmentStore, now: number) {
  const clock = { now };
  const posts: Array<{ channel: string; threadTs: string | null; ts: string } & ReminderMessage> = [];
  const updates: Array<{ channel: string; ts: string } & ReminderMessage> = [];
  const marked: string[] = [];
  let seq = 0;
  const deps: NudgeDeps = {
    slack: {
      // A "remind me" reads no evidence: any read is a failure of the test.
      replies: async () => assert.fail("a reminder reads no thread"),
      history: async () => assert.fail("a reminder reads no channel"),
      permalink: async (channel, messageTs) => `https://plus.slack.com/archives/${channel}/p${messageTs.replace(".", "")}`,
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
    judge: { judge: async () => assert.fail("a reminder is never judged") },
    store,
    markThread: async (channel, t) => void marked.push(`${channel}:${t}`),
    config: { unoBot: UNO_BOT, botUserId: BOT },
    now: () => clock.now,
    get runDate() {
      return utcDay(clock.now);
    },
  };
  const react = (messageTs: string, glyph: string, userId = MAYA, channel = DM) =>
    answerReminder(
      { channel, messageTs, glyph, userId, messageAuthorId: BOT },
      { store, update: deps.slack.update, botUserId: async () => BOT, now: () => clock.now },
    );
  return { run: () => runCommitmentNudges(NUDGE, deps), posts, updates, marked, clock, react };
}

const legendOf = (m: ReminderMessage) => footerLabels(m.blocks);
const mentions = (text: string) => [...text.matchAll(/<@(U[A-Z0-9]+)>/g)].map((m) => m[1]);

describe("delivering it", () => {
  it("waits for its morning, posts once in the same DM thread mentioning only the requester, and never twice", async () => {
    const store = createInMemoryCommitmentStore();
    await asked(store);
    const m = mornings(store, at(30, 13, 5)); // Wed: not yet
    assert.equal((await m.run()).summary, "nothing due");
    m.clock.now = at(31, 13, 5); // Thu's run
    await m.run();
    assert.equal(m.posts.length, 1);
    const post = m.posts[0]!;
    assert.equal(post.channel, DM);
    assert.equal(post.threadTs, ASK_TS);
    assert.deepEqual(mentions(post.text), [MAYA]);
    assert.match(post.text, /review the PRD for reflections/);
    assert.match(post.text, /Original message/);
    assert.equal(legendOf(post), SELF_REMINDER_CHOICES.map((c) => c.label).join(" · "));
    // The person invited uno-bot here: the thread is not marked.
    assert.deepEqual(m.marked, []);
    // A retried job the same morning, and the next morning: nothing more.
    await m.run();
    m.clock.now = at(32, 13, 5);
    await m.run();
    assert.equal(m.posts.length, 1);
  });

  it("goes back into the thread it was asked in", async () => {
    const store = createInMemoryCommitmentStore();
    const root = ts(29, 15);
    await asked(store, "Thu", { channel: DESIGN, channelKind: "public", threadTs: root, messageTs: ASK_TS, userId: MAYA });
    const m = mornings(store, at(31, 13, 5));
    await m.run();
    assert.equal(m.posts.length, 1);
    assert.equal(m.posts[0]!.channel, DESIGN);
    assert.equal(m.posts[0]!.threadTs, root);
  });

  it("unanswered, it lapses with no follow-up", async () => {
    const store = createInMemoryCommitmentStore();
    await asked(store);
    const m = mornings(store, at(31, 13, 5));
    await m.run();
    for (const day of [32, 35, 36, 37]) {
      m.clock.now = at(day, 13, 5);
      await m.run();
    }
    assert.equal(m.posts.length, 1);
    assert.equal([...store.rows.values()][0]!.state, "lapsed");
  });

  it("🙌 marks it done and replaces the legend in place", async () => {
    const store = createInMemoryCommitmentStore();
    await asked(store);
    const m = mornings(store, at(31, 13, 5));
    await m.run();
    m.clock.now = at(31, 15);
    assert.equal(await m.react(m.posts[0]!.ts, "raised_hands"), true);
    assert.equal([...store.rows.values()][0]!.state, "done");
    assert.equal(legendOf(m.updates[0]!), "Nice, marked done. Thanks for closing the loop.");
    assert.equal(m.updates[0]!.text, m.posts[0]!.text);
  });

  it("⏳ re-arms it two working days out, where it is posted once more, with 🙌 alone", async () => {
    const store = createInMemoryCommitmentStore();
    await asked(store);
    const m = mornings(store, at(31, 13, 5));
    await m.run();
    m.clock.now = at(31, 15); // Thu
    assert.equal(await m.react(m.posts[0]!.ts, "hourglass_flowing_sand"), true);
    const row = [...store.rows.values()][0]!;
    assert.equal(row.state, "snoozed");
    assert.equal(iso(row.dueAt), "2026-10-05T13:00:00.000Z"); // Mon's run
    assert.equal(legendOf(m.updates[0]!), "Got it. I'll remind you again Mon.");

    m.clock.now = at(32, 13, 5); // Fri: not yet
    await m.run();
    assert.equal(m.posts.length, 1);
    m.clock.now = at(35, 13, 5); // Mon
    await m.run();
    assert.equal(m.posts.length, 2);
    assert.equal(m.posts[1]!.threadTs, ASK_TS);
    assert.equal(legendOf(m.posts[1]!), SELF_REMINDER_LAST_CHOICES.map((c) => c.label).join(" · "));

    // A ⏳ on the last post changes nothing: no third post can follow it.
    assert.equal(await m.react(m.posts[1]!.ts, "hourglass_flowing_sand"), true);
    assert.equal([...store.rows.values()][0]!.state, "nudged");
    for (const day of [36, 37, 38, 39]) {
      m.clock.now = at(day, 13, 5);
      await m.run();
    }
    assert.equal(m.posts.length, 2);
    assert.equal([...store.rows.values()][0]!.state, "lapsed");
  });

  it("🙅, 🤔 and anyone else's reaction change nothing", async () => {
    const store = createInMemoryCommitmentStore();
    await asked(store);
    const m = mornings(store, at(31, 13, 5));
    await m.run();
    assert.equal(await m.react(m.posts[0]!.ts, "no_good"), true);
    assert.equal(await m.react(m.posts[0]!.ts, "thinking_face"), true);
    assert.equal(await m.react(m.posts[0]!.ts, "raised_hands", "U0BEA"), true);
    assert.equal([...store.rows.values()][0]!.state, "nudged");
    assert.equal(m.updates.length, 0);
  });

  it("counts toward the two reminders a person gets in a morning", async () => {
    const store = createInMemoryCommitmentStore();
    for (const n of [1, 2, 3]) {
      const t = ts(29, 18, n);
      await asked(store, "Thu", { ...dmPlace, threadTs: t, messageTs: t }, `thing ${n}`);
    }
    const m = mornings(store, at(31, 13, 5));
    await m.run();
    assert.equal(m.posts.length, 2);
    m.clock.now = at(32, 13, 5);
    await m.run();
    assert.equal(m.posts.length, 3);
  });
});
