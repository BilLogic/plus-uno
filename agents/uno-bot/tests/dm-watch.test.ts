// DM watch: the Home-tab switches, the end-of-day read of a person's own DMs
// with their own token, the morning reminder in their DM with uno-bot, and the
// reactions that answer it.
//
// Everything runs against fakes: the owner's own-token reads, the bot's post,
// a detector that reads "PROMISE: what|deadline" markers, the in-memory store
// and a fixed clock. Mon 2026-09-28 Maya turns a switch on; Tue 29th the DMs
// are written and read at the end of the day; Thu Oct 1 and Fri Oct 2 are
// mornings.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { ScheduledJob } from "../src/scheduled/runs";
import { onScheduledFiring, planRun, type ScheduledRun } from "../src/scheduled/runs";
import { detectorChars, MAX_COMMITMENT_THREAD_CHARS, type CommitmentDetector, type EvidenceJudge } from "../src/commitments/detector";
import { footerLabels } from "../src/commitments/copy";
import type { SweepSlackMessage } from "../src/sweep/run";
import {
  accessOf,
  answerDmReminder,
  createInMemoryDmWatchRecords,
  detectorWindows,
  DM_WATCH_ACTION_ID,
  MADE_TO_LAST_CHOICES,
  MADE_TO_CHOICES,
  MAX_DMS_PER_NIGHT,
  parsePermalink,
  permalinkOf,
  runDmPromiseNudges,
  runDmPromiseRead,
  saveDmWatchAction,
  selectedFeatures,
  setDmWatch,
  type DmNudgeDeps,
  type DmReadDeps,
  type DmWatchFeature,
  type InMemoryDmWatchRecords,
  type OwnerSlack,
} from "../src/dm-watch/index";
import { homeView } from "../src/slack/home";
import { at, BOT, ts } from "./helpers/sweep-harness";

const MAYA = "U0MAYA";
const BEA = "U0BEA";
const DM_BEA = "D0BEA";
const URL = "https://plus.slack.com/";
const ON_AT = at(28, 15);
const EOD = at(29, 22);
const THU = at(31, 13);
const FRI = at(32, 13);
const READ: ScheduledJob = { key: `dm-promise-read:${MAYA}`, kind: "dm-promise-read", user: MAYA };
const NUDGE: ScheduledJob = { key: `dm-promise-nudge:${MAYA}`, kind: "dm-promise-nudge", user: MAYA };

const BEA_PROMISE = ts(29, 17);
const MAYA_PROMISE = ts(29, 17, 5);

/** The DM between Maya and Bea, oldest first. */
function dmMessages(): SweepSlackMessage[] {
  return [
    { ts: ts(29, 16, 55), user: MAYA, text: "can you send the tokens doc?" },
    { ts: BEA_PROMISE, user: BEA, text: "PROMISE: send the tokens doc|Wed" },
    { ts: MAYA_PROMISE, user: MAYA, text: "PROMISE: review the PRD" },
  ];
}

interface FakeSlack {
  api: OwnerSlack;
  calls: string[];
  messages: Map<string, SweepSlackMessage[]>;
  /** The DM list, as Slack pages it (200 a page). */
  ims: { id: string; user: string }[];
  /** auth.test says the token is refused. */
  refused: boolean;
}

function fakeSlack(scopes: string[] = ["im:read", "im:history", "search:read"]): FakeSlack {
  const calls: string[] = [];
  const messages = new Map<string, SweepSlackMessage[]>([
    [DM_BEA, dmMessages()],
    ["D0UNO", [{ ts: ts(29, 16), user: MAYA, text: "PROMISE: never read, uno-bot's own DM" }]],
  ]);
  const fake: FakeSlack = {
    calls,
    messages,
    ims: [{ id: DM_BEA, user: BEA }, { id: "D0UNO", user: BOT }],
    refused: false,
    api: {
      async identity() {
        calls.push("auth.test");
        return fake.refused ? null : { scopes, url: URL, userId: MAYA };
      },
      async ims(cursor) {
        calls.push("users.conversations");
        const from = Number(cursor ?? 0);
        const page = fake.ims.slice(from, from + 200);
        return from + 200 < fake.ims.length ? { channels: page, nextCursor: String(from + 200) } : { channels: page };
      },
      // Newest first, `limit` a page, the cursor an offset — as Slack pages.
      async history(channel, range) {
        calls.push(`history:${channel}`);
        const all = messages.get(channel) ?? [];
        const inRange = all
          .filter((m) => {
            const t = Number(m.ts);
            if (range.oldest && !(t > Number(range.oldest))) return false;
            if (range.latest && (range.inclusive ? t > Number(range.latest) : t >= Number(range.latest))) return false;
            return true;
          })
          .sort((a, b) => Number(b.ts) - Number(a.ts));
        const from = Number(range.cursor ?? 0);
        const page = inRange.slice(from, from + range.limit);
        const more = from + range.limit < inRange.length;
        return { messages: page, hasMore: more, ...(more ? { nextCursor: String(from + range.limit) } : {}) };
      },
    },
  };
  return fake;
}

/** Reads "PROMISE: what|deadline" in tonight's new messages. */
const detector: CommitmentDetector = {
  async detect({ thread, since }) {
    const commitments = thread.messages
      .filter((m) => Number(m.ts) > Number(since) && m.text.startsWith("PROMISE:"))
      .map((m) => {
        const [what, deadline] = m.text.slice("PROMISE:".length).trim().split("|");
        return { messageTs: m.ts, promiser: m.user, requester: null, what: what!, deadline: deadline ?? null, confidence: 0.9 };
      });
    return { ok: true, commitments };
  },
};

const notDone: EvidenceJudge = { judge: async () => ({ ok: true, done: false, evidenceTs: [] }) };

interface World {
  records: InMemoryDmWatchRecords;
  slack: FakeSlack;
  hasToken: boolean;
  logs: string[];
  posts: { channel: string; text: string; blocks: unknown[]; ts: string }[];
  progress: Map<string, { latest: string }>;
}

function world(over: Partial<Pick<World, "hasToken">> & { scopes?: string[] } = {}): World {
  return {
    records: createInMemoryDmWatchRecords(),
    slack: fakeSlack(over.scopes),
    hasToken: over.hasToken ?? true,
    logs: [],
    posts: [],
    progress: new Map(),
  };
}

function readDeps(w: World, now: number, runDate = new Date(now).toISOString().slice(0, 10)): DmReadDeps {
  return {
    runDate,
    records: w.records,
    ownerSlack: async (user) => (w.hasToken && user === MAYA ? w.slack.api : null),
    detector,
    botUserId: BOT,
    progress: {
      get: async (k) => w.progress.get(k) ?? null,
      set: async (k, v) => void w.progress.set(k, v),
      clear: async (k) => void w.progress.delete(k),
    },
    now: () => now,
    log: (line) => w.logs.push(line),
  };
}

function nudgeDeps(w: World, now: number, judge: EvidenceJudge = notDone): DmNudgeDeps {
  let n = 0;
  return {
    ...readDeps(w, now),
    judge,
    bot: {
      dmChannel: async (user) => `D-UNO-${user}`,
      async post(channel, message) {
        n += 1;
        const ts = `${now / 1000}.00000${n}`;
        w.posts.push({ channel, ...message, ts });
        return { ok: true, ts };
      },
      userName: async (id) => (id === BEA ? "Bea" : null),
    },
  };
}

const ownerSlackOf = (w: World) => async (user: string) => (w.hasToken && user === MAYA ? w.slack.api : null);

async function turnOn(w: World, features: DmWatchFeature[], now = ON_AT) {
  return (await setDmWatch(MAYA, features, { records: w.records, access: (u) => accessOf(u, ownerSlackOf(w)), now: () => now })).on;
}

describe("the switches", () => {
  for (const feature of ["promises_made", "promises_to_me"] as const) {
    it(`${feature} off: no DM is read`, async () => {
      const w = world();
      const report = await runDmPromiseRead(READ, readDeps(w, EOD));
      assert.equal(report.outcome, "skipped");
      assert.deepEqual(w.slack.calls, []);
      // On, then off again: still nothing read.
      await turnOn(w, [feature]);
      await turnOn(w, [], at(29, 12));
      w.slack.calls.length = 0;
      await runDmPromiseRead(READ, readDeps(w, EOD));
      assert.deepEqual(w.slack.calls, []);
    });

    it(`${feature} on with no token of their own: it stays off, and no DM is read`, async () => {
      const w = world({ hasToken: false });
      assert.deepEqual(await turnOn(w, [feature]), []);
      // Even a switch left on from before a disconnect reads nothing.
      await w.records.setSwitch(MAYA, feature, true, { now: ON_AT, readThrough: String(ON_AT / 1000) });
      const report = await runDmPromiseRead(READ, readDeps(w, EOD));
      assert.equal(report.outcome, "skipped");
      assert.deepEqual(w.slack.calls, []);
      assert.deepEqual(w.logs, [`[dm-watch] ${MAYA}: no connected token, job skipped`]);
    });
  }

  it("a missing scope on the live token skips the job with one log line, before any DM is read", async () => {
    const w = world({ scopes: ["im:read", "search:read"] });
    // Turned on before the token's grant narrowed.
    await w.records.setSwitch(MAYA, "promises_made", true, { now: ON_AT, readThrough: (ON_AT / 1000).toFixed(6) });
    const report = await runDmPromiseRead(READ, readDeps(w, EOD));
    assert.equal(report.outcome, "skipped");
    assert.deepEqual(w.slack.calls, ["auth.test"]);
    assert.deepEqual(w.logs, [`[dm-watch] ${MAYA}: the token lacks im:history, job skipped`]);
  });

  it("turning a switch off stops its future jobs and lapses its open DM promises silently", async () => {
    const w = world();
    await turnOn(w, ["promises_made", "promises_to_me"]);
    await runDmPromiseRead(READ, readDeps(w, EOD));
    assert.equal(w.records.rows().length, 2);
    assert.deepEqual(planRun("end-of-day", EOD, [], undefined, await w.records.watchers()).jobs.filter((j) => j.user).map((j) => j.key), [
      `dm-promise-read:${MAYA}`,
    ]);

    await turnOn(w, ["promises_made"], at(30, 12));
    const byKind = Object.fromEntries(w.records.rows().map((r) => [r.kind, r.state]));
    assert.deepEqual(byKind, { made: "open", made_to: "lapsed" });
    assert.deepEqual(w.posts, []);

    await turnOn(w, [], at(30, 12));
    assert.ok(w.records.rows().every((r) => r.state === "lapsed"));
    assert.deepEqual(w.posts, []);
    // No switch on: no job in either run.
    for (const name of ["end-of-day", "morning"] as const) {
      assert.deepEqual(planRun(name, THU, [], undefined, await w.records.watchers()).jobs.filter((j) => j.user), []);
    }
  });

  it("one job per person with a switch on, in both runs", async () => {
    const eod = planRun("end-of-day", EOD, [], undefined, [MAYA, BEA, MAYA]).jobs;
    assert.deepEqual(eod.filter((j) => j.kind === "dm-promise-read").map((j) => [j.key, j.user]), [
      [`dm-promise-read:${MAYA}`, MAYA],
      [`dm-promise-read:${BEA}`, BEA],
    ]);
    const morning = planRun("morning", THU, [], undefined, [MAYA]).jobs;
    assert.deepEqual(morning.filter((j) => j.kind === "dm-promise-nudge").map((j) => j.user), [MAYA]);
    // The purge stays last.
    assert.equal(morning.at(-1)?.kind, "usage-text-purge");
    assert.equal(eod.at(-1)?.kind, "proposal-expiry");
  });

  it("the firing reads the watchers only when a run starts, and a failed read keeps the run without DM jobs", async () => {
    let reads = 0;
    const runs: ScheduledRun[] = [];
    const fire = (time: number, watchers: () => Promise<readonly string[]>) =>
      onScheduledFiring(time, { enqueueRun: async (run) => void runs.push(run), dmWatchers: () => ((reads += 1), watchers()) });
    await fire(at(29, 15, 15), async () => [MAYA]);
    assert.equal(reads, 0);
    // Wed 00:00 ET: the end-of-day run that sweeps Tuesday.
    const midnight = at(30, 4);
    await fire(midnight, async () => [MAYA]);
    assert.deepEqual(runs.pop()?.jobs.filter((j) => j.user).map((j) => j.key), [`dm-promise-read:${MAYA}`]);
    await fire(midnight, async () => {
      throw new Error("D1 down");
    });
    const run = runs.pop();
    assert.ok(run && run.jobs.length > 0);
    assert.deepEqual(run.jobs.filter((j) => j.user), []);
  });
});

describe("the end-of-day read", () => {
  it("keeps a promise made in a DM as a row with the permalink, due_at and state — no summary, no id of the other person", async () => {
    const w = world();
    await turnOn(w, ["promises_made"]);
    const report = await runDmPromiseRead(READ, readDeps(w, EOD));
    assert.equal(report.outcome, "handled");
    const rows = w.records.rows();
    assert.equal(rows.length, 1);
    const row = rows[0]!;
    assert.equal(row.kind, "made");
    assert.equal(row.ownerId, MAYA);
    assert.equal(row.permalink, permalinkOf(URL, DM_BEA, MAYA_PROMISE));
    assert.deepEqual(parsePermalink(row.permalink), { channel: DM_BEA, ts: MAYA_PROMISE });
    assert.equal(row.state, "open");
    const stored = JSON.stringify(rows);
    assert.ok(!stored.includes(BEA), "no id of the other person");
    assert.ok(!stored.includes("review the PRD"), "no summary");
    // uno-bot's own DM with Maya is never read.
    assert.ok(!w.slack.calls.includes("history:D0UNO"));
    // The report carries counts, never words.
    assert.ok(!report.summary.includes("PRD"));
  });

  it("reads each DM once: the next night starts where this one ended", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    await runDmPromiseRead(READ, readDeps(w, EOD));
    assert.deepEqual(w.records.rows().map((r) => r.kind), ["made_to"]);
    w.slack.messages.get(DM_BEA)!.push({ ts: ts(30, 17), user: BEA, text: "PROMISE: share the Figma file" });
    await runDmPromiseRead(READ, readDeps(w, at(30, 22)));
    assert.equal(w.records.rows().length, 2);
    assert.deepEqual(await w.records.positions(MAYA), { [DM_BEA]: { through: (at(30, 22) / 1000).toFixed(6), upTo: null } });
  });

  it("a budget stop saves where it got to, and the retry picks up there", async () => {
    const w = world();
    await turnOn(w, ["promises_made"]);
    const deps = readDeps(w, EOD);
    await assert.rejects(runDmPromiseRead(READ, { ...deps, meter: { headroom: () => ({ subrequests: 0, d1Queries: 40 }) } }), /budget/);
    assert.deepEqual([...w.progress.values()], [{ latest: (EOD / 1000).toFixed(6) }]);
    await runDmPromiseRead(READ, deps);
    assert.equal(w.records.rows().length, 1);
    assert.equal(w.progress.size, 0);
  });
});

describe("the morning reminder", () => {
  it("a promise made to the person reaches only their DM with uno-bot, and nothing is ever sent to the promiser", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    await runDmPromiseRead(READ, readDeps(w, EOD));
    const report = await runDmPromiseNudges(NUDGE, nudgeDeps(w, THU));
    assert.equal(report.summary, "1 nudged");
    assert.equal(w.posts.length, 1);
    const post = w.posts[0]!;
    assert.equal(post.channel, `D-UNO-${MAYA}`);
    assert.match(post.text, /^Bea said they'd send the tokens doc by Wed\. I haven't spotted it yet\. Want to follow up\?/);
    assert.ok(!post.text.includes(`<@${BEA}>`), "the promiser is named, never mentioned");
    assert.equal(footerLabels(post.blocks), MADE_TO_CHOICES.map((c) => c.label).join(" · "));
    // The only writes the owner's token could make: none — its port has reads only.
    assert.deepEqual(Object.keys(w.slack.api).sort(), ["history", "identity", "ims"]);
    const row = w.records.rows()[0]!;
    assert.equal(row.state, "nudged");
    assert.ok(row.nudgeTs);
  });

  it("a promise the person made gets the thread reminder's words, when due, and one follow-up, then lapses", async () => {
    const w = world();
    await turnOn(w, ["promises_made"]);
    await runDmPromiseRead(READ, readDeps(w, EOD));
    // Due at the end of Thu: not yet on Thursday morning.
    assert.equal((await runDmPromiseNudges(NUDGE, nudgeDeps(w, THU))).summary, "nothing due");
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, FRI));
    assert.equal(w.posts.length, 1);
    assert.match(w.posts[0]!.text, new RegExp(`^\\*On Tue you said you'd review the PRD\\*\\n<@${MAYA}> `));
    // Re-armed to the end of Tue Oct 6: the follow-up goes on Wed.
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, at(36, 13)));
    assert.equal(w.posts.length, 1);
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, at(37, 13)));
    assert.equal(w.posts.length, 2);
    assert.match(w.posts[1]!.text, /Checking in once more/);
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, at(42, 13))); // Mon Oct 12
    assert.equal(w.posts.length, 2);
    assert.equal(w.records.rows()[0]!.state, "lapsed");
    assert.ok(w.posts.every((p) => p.channel === `D-UNO-${MAYA}`));
  });

  it("re-reads the permalink with the same token: a deleted message lapses silently", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    await runDmPromiseRead(READ, readDeps(w, EOD));
    w.slack.messages.set(DM_BEA, dmMessages().filter((m) => m.ts !== BEA_PROMISE));
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, THU));
    assert.deepEqual(w.posts, []);
    assert.equal(w.records.rows()[0]!.state, "lapsed");
  });

  it("a promise the later messages show kept is marked done, and nothing is sent", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    await runDmPromiseRead(READ, readDeps(w, EOD));
    w.slack.messages.get(DM_BEA)!.push({ ts: ts(30, 15), user: BEA, text: "here it is" });
    const done: EvidenceJudge = { judge: async () => ({ ok: true, done: true, evidenceTs: [ts(30, 15)] }) };
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, THU, done));
    assert.deepEqual(w.posts, []);
    assert.equal(w.records.rows()[0]!.state, "auto_done");
  });

  it("a missing scope at the morning skips the job with one log line and leaves the rows alone", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    await runDmPromiseRead(READ, readDeps(w, EOD));
    const narrowed = world({ scopes: ["im:read"] });
    const deps = { ...nudgeDeps(narrowed, THU), records: w.records };
    const report = await runDmPromiseNudges(NUDGE, deps);
    assert.equal(report.outcome, "skipped");
    assert.deepEqual(narrowed.logs, [`[dm-watch] ${MAYA}: the token lacks im:history, job skipped`]);
    assert.equal(w.records.rows()[0]!.state, "open");
    assert.deepEqual(narrowed.posts, []);
  });
});

describe("answering a DM reminder", () => {
  async function remindedWorld() {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    await runDmPromiseRead(READ, readDeps(w, EOD));
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, THU));
    const row = w.records.rows()[0]!;
    const edits: { ts: string; footer: string }[] = [];
    const door = (glyph: string, userId = MAYA) =>
      answerDmReminder(
        { channel: `D-UNO-${MAYA}`, messageTs: row.nudgeTs!, glyph, userId, messageAuthorId: BOT },
        {
          records: w.records,
          reminderBody: async () => w.posts[0]!.text,
          update: async (_c, ts, m) => {
            edits.push({ ts, footer: footerLabels(m.blocks) });
            return true;
          },
          botUserId: async () => BOT,
          now: () => at(31, 15),
        },
      );
    return { w, row, edits, door };
  }

  it("🙌 from the person marks it got, and the legend becomes the answer in place", async () => {
    const { w, edits, door } = await remindedWorld();
    assert.equal(await door("raised_hands"), true);
    assert.equal(w.records.rows()[0]!.state, "done");
    assert.deepEqual(edits.map((e) => e.footer), ["Got it. I'll leave it there."]);
  });

  it("⏳ waits two more working days, at most twice; 🙅 drops it", async () => {
    const { w, door } = await remindedWorld();
    await door("hourglass_flowing_sand");
    await door("hourglass_flowing_sand");
    await door("hourglass_flowing_sand");
    assert.equal(w.records.rows()[0]!.snoozes, 2);
    await door("no_good");
    assert.equal(w.records.rows()[0]!.state, "dropped");
  });

  it("anyone else's reaction, and a reaction outside a DM, changes nothing", async () => {
    const { w, door } = await remindedWorld();
    assert.equal(await door("raised_hands", BEA), true);
    assert.equal(w.records.rows()[0]!.state, "nudged");
    const outside = await answerDmReminder(
      { channel: "C0DESIGN", messageTs: w.records.rows()[0]!.nudgeTs!, glyph: "raised_hands", userId: MAYA },
      { records: w.records, reminderBody: async () => null, update: async () => true, botUserId: async () => BOT, now: () => THU },
    );
    assert.equal(outside, false);
  });
});

describe("the Home tab", () => {
  it("each person sees their own switches, and only once connected", async () => {
    const w = world();
    await turnOn(w, ["promises_made"]);
    await setDmWatch(BEA, ["promises_to_me"], { records: w.records, access: async () => ({ ok: true, api: w.slack.api, url: URL }), now: () => ON_AT });
    const viewFor = async (user: string, connected = true) =>
      homeView({ connectUrl: "https://uno.example/oauth/slack/start", viewer: { connected, on: (await w.records.switches(user)).map((s) => s.feature) } });
    const ticked = (view: { blocks: unknown[] }) => {
      const boxes = JSON.stringify(view.blocks);
      const el = (view.blocks as { elements?: { action_id?: string; initial_options?: { value: string }[] }[] }[])
        .flatMap((b) => b.elements ?? [])
        .find((e) => e.action_id === DM_WATCH_ACTION_ID);
      return { present: boxes.includes(DM_WATCH_ACTION_ID), on: (el?.initial_options ?? []).map((o) => o.value) };
    };
    assert.deepEqual(ticked(await viewFor(MAYA)), { present: true, on: ["promises_made"] });
    assert.deepEqual(ticked(await viewFor(BEA)), { present: true, on: ["promises_to_me"] });
    assert.deepEqual(ticked(await viewFor("U0NEW")), { present: true, on: [] });
    // Not connected: the link prompt, and no switches.
    const unlinked = await viewFor(MAYA, false);
    assert.deepEqual(ticked(unlinked), { present: false, on: [] });
    assert.ok(JSON.stringify(unlinked.blocks).includes("Link your Slack"));
  });

  it("the checkboxes' selection becomes the switches, ignoring anything unknown", () => {
    assert.deepEqual(selectedFeatures({ selected_options: [{ value: "promises_to_me" }, { value: "decisions" }] }), ["promises_to_me"]);
    assert.deepEqual(selectedFeatures(undefined), []);
  });
});

describe("reaching every DM, and every message in it", () => {
  const promiseIn = (channel: string, user: string, at_: string, what: string): [string, SweepSlackMessage[]] => [
    channel,
    [{ ts: at_, user, text: `PROMISE: ${what}` }],
  ];

  it("a budget stop mid-list keeps the DMs finished, and the retry reads only the rest", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    w.slack.ims = [
      { id: "D0A", user: "U0A" },
      { id: "D0B", user: "U0B" },
      { id: "D0C", user: "U0C" },
    ];
    for (const [c, m] of [promiseIn("D0A", "U0A", ts(29, 17), "a"), promiseIn("D0B", "U0B", ts(29, 17), "b"), promiseIn("D0C", "U0C", ts(29, 17), "c")]) {
      w.slack.messages.set(c, m);
    }
    let checks = 0;
    const stopping = { ...readDeps(w, EOD), meter: { headroom: () => (++checks > 4 ? { subrequests: 0, d1Queries: 40 } : { subrequests: 50, d1Queries: 40 }) } };
    await assert.rejects(runDmPromiseRead(READ, stopping), /budget/);
    const latest = (EOD / 1000).toFixed(6);
    assert.deepEqual(await w.records.positions(MAYA), { D0A: { through: latest, upTo: null }, D0B: { through: latest, upTo: null } });
    w.slack.calls.length = 0;
    await runDmPromiseRead(READ, readDeps(w, at(29, 22, 2)));
    assert.deepEqual(w.slack.calls.filter((c) => c.startsWith("history:")), ["history:D0C"]);
    assert.deepEqual(await w.records.positions(MAYA), { D0A: { through: latest, upTo: null }, D0B: { through: latest, upTo: null }, D0C: { through: latest, upTo: null } });
    assert.equal(w.records.rows().length, 3);
  });

  it("a DM with more than a page since it was last read is paged through, so its oldest promise is not skipped", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    const chatter = Array.from({ length: 249 }, (_, i) => ({ ts: ts(29, 18, 0, i + 1), user: BEA, text: `note ${i}` }));
    w.slack.messages.set(DM_BEA, [{ ts: ts(29, 17), user: BEA, text: "PROMISE: send the tokens doc|Wed" }, ...chatter]);
    await runDmPromiseRead(READ, readDeps(w, EOD));
    assert.deepEqual(w.records.rows().map((r) => r.kind), ["made_to"]);
    assert.equal(w.slack.calls.filter((c) => c === `history:${DM_BEA}`).length, 2);
    assert.deepEqual(await w.records.positions(MAYA), { [DM_BEA]: { through: (EOD / 1000).toFixed(6), upTo: null } });
  });

  it("350 new messages with the promise at the oldest end: found, and the position ends at the head", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    const chatter = Array.from({ length: 349 }, (_, i) => ({ ts: ts(29, 18, 0, i + 1), user: BEA, text: `note ${i}` }));
    w.slack.messages.set(DM_BEA, [{ ts: ts(29, 17), user: BEA, text: "PROMISE: send the tokens doc|Wed" }, ...chatter]);
    await runDmPromiseRead(READ, readDeps(w, EOD));
    if (!w.records.rows().length) await runDmPromiseRead(READ, readDeps(w, at(30, 22)));
    assert.deepEqual(w.records.rows().map((r) => r.permalink), [permalinkOf(URL, DM_BEA, ts(29, 17))]);
    const through = (await w.records.positions(MAYA))[DM_BEA];
    assert.ok(through && through.upTo === null && Number(through.through) >= EOD / 1000);
  });

  it("a backlog longer than a night's reads drains from its oldest end over nights, never skipping", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    const base = Date.UTC(2026, 8, 29, 12, 0) / 1000;
    const backlog = Array.from({ length: 1400 }, (_, i) => ({ ts: `${base + i * 10}.000000`, user: BEA, text: i === 0 ? "PROMISE: send the tokens doc" : `note ${i}` }));
    w.slack.messages.set(DM_BEA, backlog);
    const first = await runDmPromiseRead(READ, readDeps(w, EOD));
    assert.match(first.summary, /1 with a backlog left/);
    // Nothing the detector did not see is passed: the position has not moved
    // past where the switch was turned on, and the next read is bounded.
    const kept = (await w.records.positions(MAYA))[DM_BEA];
    assert.equal(kept?.through, (ON_AT / 1000).toFixed(6));
    assert.ok(kept?.upTo);
    assert.equal(w.records.rows().length, 0);
    let nights = 1;
    while ((await w.records.positions(MAYA))[DM_BEA]?.upTo !== null || !(await w.records.positions(MAYA))[DM_BEA]) {
      nights += 1;
      assert.ok(nights <= 6, "the backlog drains within a few nights");
      await runDmPromiseRead(READ, readDeps(w, at(29 + nights - 1, 22)));
    }
    assert.deepEqual(w.records.rows().map((r) => r.permalink), [permalinkOf(URL, DM_BEA, `${base}.000000`)]);
  });

  it("more DMs than a night reads: the ones not reached come first the next night, their messages intact", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    const quiet = Array.from({ length: MAX_DMS_PER_NIGHT + 5 }, (_, i) => ({ id: `D1${String(i).padStart(3, "0")}`, user: `U1${i}` }));
    // An active DM whose id sorts after every quiet one.
    w.slack.ims = [...quiet, { id: "D9ACTIVE", user: "U9KAI" }];
    w.slack.messages.set("D9ACTIVE", [{ ts: ts(29, 17), user: "U9KAI", text: "PROMISE: share the flows" }]);
    const first = await runDmPromiseRead(READ, readDeps(w, EOD));
    assert.match(first.summary, /6 DM\(s\) wait for another night/);
    assert.equal(w.records.rows().length, 0);
    w.slack.calls.length = 0;
    await runDmPromiseRead(READ, readDeps(w, at(30, 22)));
    assert.ok(w.slack.calls.includes("history:D9ACTIVE"));
    assert.deepEqual(w.records.rows().map((r) => r.permalink), [permalinkOf(URL, "D9ACTIVE", ts(29, 17))]);
  });

  it("a DM list longer than a page is read to its end", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    const quiet = Array.from({ length: 250 }, (_, i) => ({ id: `D1${String(i).padStart(3, "0")}`, user: `U1${i}` }));
    w.slack.ims = [{ id: "D0000", user: "U0000" }, ...quiet.slice(0, 210), { id: "D0LATE", user: "U0LATE" }];
    w.slack.messages.set("D0LATE", [{ ts: ts(29, 17), user: "U0LATE", text: "PROMISE: send it" }]);
    await runDmPromiseRead(READ, readDeps(w, EOD));
    assert.equal(w.slack.calls.filter((c) => c === "users.conversations").length, 2);
    assert.equal(w.records.rows().length, 1);
  });

  it("a retry later in the night resumes the run it belongs to, by the run's date", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    const stopped = { ...readDeps(w, EOD, "2026-09-29"), meter: { headroom: () => ({ subrequests: 0, d1Queries: 40 }) } };
    await assert.rejects(runDmPromiseRead(READ, stopped), /budget/);
    // Retried at 00:30 UTC on the 30th, still the 29th's run.
    await runDmPromiseRead(READ, readDeps(w, at(30, 0, 30), "2026-09-29"));
    assert.deepEqual(await w.records.positions(MAYA), { [DM_BEA]: { through: (EOD / 1000).toFixed(6), upTo: null } });
    assert.equal(w.progress.size, 0);
  });

  it("a switch turned off while the night's read runs: what it kept lapses", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    const racing: DmReadDeps = {
      ...readDeps(w, EOD),
      detector: {
        async detect(input) {
          await w.records.setSwitch(MAYA, "promises_to_me", false, { now: EOD, readThrough: "0" });
          return detector.detect(input);
        },
      },
    };
    await runDmPromiseRead(READ, racing);
    assert.deepEqual(w.records.rows().map((r) => r.state), ["lapsed"]);
  });
});

describe("⏳, token refusals and the scopes a switch needs", () => {
  async function toBeaReminded() {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    await runDmPromiseRead(READ, readDeps(w, EOD));
    return w;
  }
  const react = (w: World, glyph: string, when: number) => {
    const row = w.records.rows()[0]!;
    return answerDmReminder(
      { channel: `D-UNO-${MAYA}`, messageTs: (row.followupTs ?? row.nudgeTs)!, glyph, userId: MAYA, messageAuthorId: BOT },
      { records: w.records, reminderBody: async () => "body", update: async () => true, botUserId: async () => BOT, now: () => when },
    );
  };
  const legendOf = (post: { blocks: unknown[] }) => footerLabels(post.blocks);

  it("⏳ on the follow-up brings the check-back it promises, twice at most, and the last post offers no ⏳", async () => {
    const w = await toBeaReminded();
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, THU)); // the reminder
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, at(36, 13))); // Tue Oct 6: the follow-up
    assert.equal(w.posts.length, 2);
    assert.match(w.posts[1]!.text, /Checking in once more/);
    assert.equal(await react(w, "hourglass_flowing_sand", at(36, 15)), true);
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, at(39, 13))); // Fri Oct 9: the check-back
    assert.equal(w.posts.length, 3);
    assert.match(w.posts[2]!.text, /^Bea said they'd send the tokens doc/);
    assert.equal(legendOf(w.posts[2]!), MADE_TO_CHOICES.map((c) => c.label).join(" · "));
    await react(w, "hourglass_flowing_sand", at(39, 15));
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, at(44, 13))); // Wed Oct 14: the second check-back
    assert.equal(w.posts.length, 4);
    assert.equal(legendOf(w.posts[3]!), MADE_TO_LAST_CHOICES.map((c) => c.label).join(" · "));
    // A third ⏳ changes nothing.
    await react(w, "hourglass_flowing_sand", at(44, 15));
    assert.equal(w.records.rows()[0]!.snoozes, 2);
  });

  it("a token Slack refuses holds the morning's rows like no token, and they lapse", async () => {
    const w = await toBeaReminded();
    w.slack.refused = true;
    for (const day of [31, 32, 35]) await runDmPromiseNudges(NUDGE, nudgeDeps(w, at(day, 13)));
    assert.deepEqual(w.posts, []);
    assert.equal(w.records.rows()[0]!.state, "lapsed");
  });

  it("turning a switch on with a token missing a scope leaves it off and says why, with the link", async () => {
    const w = world({ scopes: ["im:read"] });
    const result = await setDmWatch(MAYA, ["promises_made"], { records: w.records, access: (u) => accessOf(u, ownerSlackOf(w)), now: () => ON_AT });
    assert.deepEqual(result, { on: [], refused: { ok: false, reason: "missing-scopes", missing: ["im:history"] } });
    const view = homeView({ connectUrl: "https://uno.example/oauth/slack/start", viewer: { connected: true, on: result.on, refused: result.refused } });
    const text = JSON.stringify(view.blocks);
    assert.match(text, /missing `im:history`/);
    assert.match(text, /uno\.example\/oauth\/slack\/start/);
    assert.ok(!text.includes("initial_options"), "the box is not left ticked");
  });

  it("the Home checkboxes save for the person who clicked, and republish with why a switch stayed off", async () => {
    const saved: [string, DmWatchFeature[]][] = [];
    const published: [string, string | undefined][] = [];
    await saveDmWatchAction(
      { user: { id: MAYA }, actions: [{ selected_options: [{ value: "promises_made" }, { value: "decisions" }] }] },
      {
        async save(userId, selected) {
          saved.push([userId, selected]);
          return { on: [], refused: { ok: false, reason: "no-token" } };
        },
        async publish(userId, refused) {
          published.push([userId, refused?.reason]);
        },
      },
    );
    assert.deepEqual(saved, [[MAYA, ["promises_made"]]]);
    assert.deepEqual(published, [[MAYA, "no-token"]]);
    // No user on the payload: nothing is saved for anyone.
    await saveDmWatchAction({ actions: [{ selected_options: [{ value: "promises_made" }] }] }, {
      save: async () => assert.fail("saved with no user"),
      publish: async () => assert.fail("published with no user"),
    });
  });
});

describe("the detector's window", () => {
  /** A detector that sees what the real one sees: the root and the newest
   *  messages that fit `MAX_COMMITMENT_THREAD_CHARS`, the middle dropped. */
  const capped: CommitmentDetector = {
    async detect({ thread, since }) {
      const root = thread.messages[0]!;
      let left = MAX_COMMITMENT_THREAD_CHARS - detectorChars(root);
      const kept: typeof thread.messages = [];
      for (const m of [...thread.messages.slice(1)].reverse()) {
        if (detectorChars(m) > left) break;
        left -= detectorChars(m);
        kept.unshift(m);
      }
      return detector.detect({ thread: { ...thread, messages: [root, ...kept] }, since });
    },
  };

  it("a promise in the middle of a long day is shown to the detector, and found", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    const pad = "x".repeat(480);
    const day = Array.from({ length: 150 }, (_, i) => ({
      ts: ts(29, 16, 0, i + 1),
      user: BEA,
      text: i === 20 ? `PROMISE: send the tokens doc ${pad}` : `note ${i} ${pad}`,
    }));
    w.slack.messages.set(DM_BEA, day);
    await runDmPromiseRead(READ, { ...readDeps(w, EOD), detector: capped });
    assert.deepEqual(w.records.rows().map((r) => r.permalink), [permalinkOf(URL, DM_BEA, ts(29, 16, 0, 21))]);
  });

  it("windows fit the detector's cap and cover every new message once, with context ahead", () => {
    const pad = "y".repeat(900);
    const messages = Array.from({ length: 40 }, (_, i) => ({ ts: ts(29, 16, 0, i + 1), user: BEA, text: `${i} ${pad}` }));
    const windows = detectorWindows(messages, "0");
    const newOnes = windows.flatMap((win) => win.messages.filter((m) => Number(m.ts) > Number(win.since)).map((m) => m.ts));
    assert.deepEqual(newOnes, messages.map((m) => m.ts));
    for (const win of windows) assert.ok(win.messages.reduce((n, m) => n + detectorChars(m), 0) <= MAX_COMMITMENT_THREAD_CHARS);
    assert.ok(windows.length > 1 && windows[1]!.messages.length > windows[1]!.messages.filter((m) => Number(m.ts) > Number(windows[1]!.since)).length);
  });

  it("the last switch going off while a read runs: the read does not bring the positions back", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    const racing: DmReadDeps = {
      ...readDeps(w, EOD),
      detector: {
        async detect(input) {
          await setDmWatch(MAYA, [], { records: w.records, access: async () => ({ ok: false, reason: "no-token" }), now: () => EOD });
          return detector.detect(input);
        },
      },
    };
    await runDmPromiseRead(READ, racing);
    assert.deepEqual(await w.records.positions(MAYA), {});
  });

  it("🙌 on an earlier follow-up still finds its row after a later post", async () => {
    const w = world();
    await turnOn(w, ["promises_to_me"]);
    await runDmPromiseRead(READ, readDeps(w, EOD));
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, THU));
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, at(36, 13)));
    const followUp = w.posts[1]!.ts;
    await answerDmReminder(
      { channel: `D-UNO-${MAYA}`, messageTs: followUp, glyph: "hourglass_flowing_sand", userId: MAYA, messageAuthorId: BOT },
      { records: w.records, reminderBody: async () => "body", update: async () => true, botUserId: async () => BOT, now: () => at(36, 15) },
    );
    await runDmPromiseNudges(NUDGE, nudgeDeps(w, at(39, 13)));
    assert.equal(w.posts.length, 3);
    const answered = await answerDmReminder(
      { channel: `D-UNO-${MAYA}`, messageTs: followUp, glyph: "raised_hands", userId: MAYA, messageAuthorId: BOT },
      { records: w.records, reminderBody: async () => "body", update: async () => true, botUserId: async () => BOT, now: () => at(39, 15) },
    );
    assert.equal(answered, true);
    assert.equal(w.records.rows()[0]!.state, "done");
  });
});
