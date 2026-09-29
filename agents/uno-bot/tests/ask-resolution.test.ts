// How each ask was resolved (src/usage/resolution*.ts): the rules, the
// end-of-day pass on fakes, and the reaction door recording the asker's ✅.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { runReactionDoor } from "../src/gate/index";
import { createInMemoryThreadState, stagingCardOf, type PendingProposal } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import { restageExecution } from "../src/turn/turn";
import { createInMemoryUsageLog } from "../src/usage/in-memory";
import {
  answeredAskOf,
  batchCompleted,
  isResolvingReaction,
  recordAnswerReaction,
  sameTopic,
  wholeThread,
  type ResolutionLog,
} from "../src/usage/resolution";
import { createInMemoryResolutionLog } from "../src/usage/resolution-in-memory";
import {
  ASK_RESOLUTION_JOBS,
  MAX_THREAD_ATTEMPTS,
  PASS_LIMIT,
  TRY_LATER,
  createLeadDmReader,
  passThreadOf,
  runResolutionPass,
  type PassThread,
  type DmMessage,
  type SlackRead,
  type ThreadMessage,
} from "../src/usage/resolution-pass";
import { turnRecord } from "./helpers/usage-log-conformance";

const HOUR = 60 * 60 * 1000;
const ASK_TS = "1700000000.000100";
const ASK_MS = 1_700_000_000_000;
const ASKER = "U1";
const LEAD = "ULEAD";
const BOT = "UBOT";
const tsAt = (offsetMs: number) => ((ASK_MS + offsetMs) / 1000).toFixed(6);

const ASK_TEXT = "Where is the tutor onboarding checklist for the spring cohort?";

async function world(over: Parameters<typeof turnRecord>[0] = {}) {
  const usage = createInMemoryUsageLog();
  const resolutions = createInMemoryResolutionLog(usage);
  const turn = turnRecord({
    turnId: `C1:${ASK_TS}`,
    askTs: ASK_TS,
    askedAt: ASK_MS,
    requesterId: ASKER,
    proposalId: null,
    ...over,
  });
  await usage.record(turn);
  return { usage, resolutions, turn };
}

/** The ask, the bot's answer, and whatever else the thread holds. */
function thread(...rest: ThreadMessage[]): ThreadMessage[] {
  return [
    { ts: ASK_TS, user: ASKER, text: ASK_TEXT },
    { ts: tsAt(5_000), user: BOT, bot_id: "B1", text: "It is in Notion." },
    ...rest,
  ];
}

async function pass(
  resolutions: ResolutionLog,
  opts: {
    thread?: PassThread;
    dms?: DmMessage[] | null;
    lead?: string | null;
    dryRun?: boolean;
    now?: number;
  } = {},
) {
  const dmCalls: string[] = [];
  const summary = await runResolutionPass({
    log: resolutions,
    now: () => opts.now ?? ASK_MS + 25 * HOUR,
    leadUserId: opts.lead === undefined ? LEAD : opts.lead,
    botUserId: async () => BOT,
    threadOf: async () => (opts.thread === undefined ? thread() : opts.thread),
    leadDmsWith:
      opts.dms === null
        ? null
        : async (asker, oldest, latest) => {
            dmCalls.push(`${asker} ${oldest} ${latest}`);
            return opts.dms ?? [];
          },
    dryRun: opts.dryRun ?? false,
  });
  return { summary, dmCalls };
}

describe("the resolution rules", () => {
  it("✅ and 👍 resolve an answer; other glyphs do not", () => {
    for (const glyph of ["white_check_mark", "+1", "thumbsup"]) assert.equal(isResolvingReaction(glyph), true);
    for (const glyph of ["tada", "eyes", "no_entry", "-1"]) assert.equal(isResolvingReaction(glyph), false);
  });

  it("a reacted answer maps to the last person's message before it in its thread", () => {
    const answer = tsAt(5_000);
    assert.equal(answeredAskOf("C1", thread(), answer), `C1:${ASK_TS}`);
    // The bot's interim line between them is not the ask.
    const withInterim = [thread()[0]!, { ts: tsAt(1_000), user: BOT, bot_id: "B1" }, thread()[1]!];
    assert.equal(answeredAskOf("C1", withInterim, answer), `C1:${ASK_TS}`);
    // A top-level post has no thread to map through; a person's message is no answer.
    assert.equal(answeredAskOf("C1", [thread()[1]!], answer), null);
    assert.equal(answeredAskOf("C1", thread(), ASK_TS), null);
  });

  it("a thread is read whole or not at all: a second page makes it unknown", () => {
    const messages = thread();
    assert.deepEqual(wholeThread({ ok: true, messages }), messages);
    assert.equal(wholeThread({ ok: true, messages, has_more: true }), null);
    assert.equal(wholeThread({ ok: false }), null);
    assert.equal(wholeThread({ ok: true, messages: [] }), null);
  });

  it("a thread too long to read whole leaves the reaction unrecorded", async () => {
    const { resolutions, turn } = await world();
    const recorded = await recordAnswerReaction(
      { channel: "C1", threadRoot: ASK_TS, reactedTs: tsAt(5_000), userId: ASKER },
      { log: resolutions, threadOf: async () => wholeThread({ ok: true, messages: thread(), has_more: true }), now: () => ASK_MS },
    );
    assert.equal(recorded, null);
    assert.equal((await resolutions.getResolution(turn.turnId))?.resolution, null);
  });

  it("a batch completed only when every approved operation came back ok", () => {
    assert.equal(batchCompleted(2, [{ ok: true }, { ok: true }]), true);
    assert.equal(batchCompleted(2, [{ ok: true }, { ok: false }]), false);
    assert.equal(batchCompleted(2, [{ ok: true }]), false); // the fence stopped it
    assert.equal(batchCompleted(0, []), false);
  });

  it("same topic: a link to the thread, or two shared content words", () => {
    assert.equal(sameTopic(ASK_TEXT, "hey, quick q about the onboarding checklist"), true);
    assert.equal(sameTopic(ASK_TEXT, "lunch tomorrow?"), false);
    assert.equal(sameTopic(ASK_TEXT, "the onboarding one"), false);
    assert.equal(
      sameTopic(ASK_TEXT, "see https://x.slack.com/archives/C1/p1700000000000100", [ASK_TS]),
      true,
    );
  });
});

describe("the end-of-day pass", () => {
  it("with no person replying and no DM to the lead, records no_escalation", async () => {
    const { resolutions, turn } = await world();
    const { summary, dmCalls } = await pass(resolutions);
    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.resolution, "no_escalation");
    assert.equal(got?.escalatedToLead, false);
    assert.equal(got?.resolutionCheckedAt, ASK_MS + 25 * HOUR);
    assert.equal(summary.noEscalation, 1);
    // The DM window is the ask to 24 h after it.
    assert.deepEqual(dmCalls, [`${ASKER} ${ASK_TS} ${tsAt(24 * HOUR)}`]);
  });

  it("a human reply in the thread leaves the ask unresolved", async () => {
    const { resolutions, turn } = await world();
    await pass(resolutions, { thread: thread({ ts: tsAt(HOUR), user: "U7", text: "try the wiki" }) });
    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.resolution, null);
    assert.equal(got?.escalatedToLead, false);
    assert.notEqual(got?.resolutionCheckedAt, null);
  });

  it("the asker's own follow-up and a reply after 24 h are not a person replying", async () => {
    const { resolutions, turn } = await world();
    await pass(resolutions, {
      thread: thread(
        { ts: tsAt(HOUR), user: ASKER, text: "thanks!" },
        { ts: tsAt(30 * HOUR), user: "U7", text: "late" },
      ),
    });
    assert.equal((await resolutions.getResolution(turn.turnId))?.resolution, "no_escalation");
  });

  it("an asker-to-lead DM on the same topic leaves it unresolved and escalated", async () => {
    const { resolutions, turn } = await world();
    await pass(resolutions, {
      dms: [{ ts: tsAt(HOUR), user: ASKER, text: "Bill, where's the spring onboarding checklist?" }],
    });
    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.resolution, null);
    assert.equal(got?.escalatedToLead, true);
  });

  it("a DM on another topic, or from the lead, is not an escalation", async () => {
    const { resolutions, turn } = await world();
    await pass(resolutions, {
      dms: [
        { ts: tsAt(HOUR), user: ASKER, text: "lunch tomorrow?" },
        { ts: tsAt(2 * HOUR), user: LEAD, text: "the onboarding checklist is in notion" },
      ],
    });
    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.resolution, "no_escalation");
    assert.equal(got?.escalatedToLead, false);
  });

  it("a lead reply in the thread is an escalation", async () => {
    const { resolutions, turn } = await world();
    await pass(resolutions, { thread: thread({ ts: tsAt(HOUR), user: LEAD, text: "it's here" }) });
    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.escalatedToLead, true);
    assert.equal(got?.resolution, null);
  });

  it("writes escalated_to_lead on an ask a reaction already resolved, and keeps the reaction", async () => {
    const { resolutions, turn } = await world();
    await resolutions.recordReaction({ turnId: turn.turnId, requesterId: ASKER, reactedTs: tsAt(5_000), at: ASK_MS + 10_000 });
    await pass(resolutions, { thread: thread({ ts: tsAt(HOUR), user: LEAD, text: "also here" }) });
    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.resolution, "reaction");
    assert.equal(got?.escalatedToLead, true);
  });

  it("without the lead's token, records none rather than guessing, and logs one line", async () => {
    const first = await world();
    const second = await world({ turnId: `C1:${tsAt(HOUR)}`, askTs: tsAt(HOUR), askedAt: ASK_MS + HOUR });
    // Two asks on one log: record the second turn into the first world's log.
    await first.usage.record(second.turn);

    const lines: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => lines.push(args.join(" "));
    try {
      await pass(first.resolutions, { dms: null });
    } finally {
      console.log = original;
    }
    for (const id of [first.turn.turnId, second.turn.turnId]) {
      const got = await first.resolutions.getResolution(id);
      assert.equal(got?.resolution, "none");
      assert.equal(got?.escalatedToLead, null);
    }
    assert.equal(lines.filter((l) => l.startsWith("[resolution]")).length, 1);
  });

  it("without the lead's token, a lead reply in the thread is still known", async () => {
    const { resolutions, turn } = await world();
    await pass(resolutions, { dms: null, thread: thread({ ts: tsAt(HOUR), user: LEAD, text: "here" }) });
    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.escalatedToLead, true);
    assert.equal(got?.resolution, null);
  });

  it("the lead's own ask reads no DMs and is not escalated to themselves", async () => {
    const { resolutions, turn } = await world({ requesterId: LEAD });
    const { dmCalls } = await pass(resolutions);
    assert.deepEqual(dmCalls, []);
    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.escalatedToLead, false);
    assert.equal(got?.resolution, "no_escalation");
  });

  it("an unreadable thread is tried once a day, then recorded none and settled", async () => {
    const { resolutions, turn } = await world();
    for (let day = 0; day < MAX_THREAD_ATTEMPTS; day++) {
      const { summary } = await pass(resolutions, { thread: null, now: ASK_MS + (25 + 24 * day) * HOUR });
      assert.equal(summary.skipped, 1, `day ${day}`);
      // Not twice in one run.
      const again = await pass(resolutions, { thread: null, now: ASK_MS + (26 + 24 * day) * HOUR });
      assert.equal(again.summary.skipped, 0, `day ${day}, again`);
    }
    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.resolution, "none");
    assert.equal(got?.resolutionAttempts, MAX_THREAD_ATTEMPTS);
    assert.notEqual(got?.resolutionCheckedAt, null);
    const after = await pass(resolutions, { thread: null, now: ASK_MS + (25 + 24 * MAX_THREAD_ATTEMPTS) * HOUR });
    assert.equal(after.summary.skipped, 0);
  });

  it("a thread Slack says is gone counts towards the limit; a rate limit, a network error or a 5xx does not", () => {
    for (const error of ["channel_not_found", "not_in_channel", "thread_not_found"]) {
      assert.equal(passThreadOf({ ok: false, error }), null, error);
    }
    assert.equal(passThreadOf({ ok: true, messages: thread(), has_more: true }), null);
    for (const error of ["ratelimited", "network_error", "http_503", "http_500", undefined]) {
      assert.equal(passThreadOf({ ok: false, error }), TRY_LATER, String(error));
    }
    assert.deepEqual(passThreadOf({ ok: true, messages: thread() }), thread());
  });

  it("a rate-limited read leaves resolution_attempts unchanged; a thread_not_found bumps it", async () => {
    const { resolutions, turn } = await world();
    const busy = await pass(resolutions, { thread: passThreadOf({ ok: false, error: "ratelimited" }) });
    assert.equal(busy.summary.skipped, 0);
    assert.equal(busy.summary.deferred, 1);
    assert.match(busy.summary.summary, /1 left for a later read/);
    assert.deepEqual(await resolutions.getResolution(turn.turnId), {
      resolution: null,
      resolvedAt: null,
      escalatedToLead: null,
      resolutionCheckedAt: null,
      resolutionAttempts: 0,
      resolutionAttemptedAt: null,
    });
    // Left unread, so the run's next job reads it again.
    const gone = await pass(resolutions, {
      thread: passThreadOf({ ok: false, error: "thread_not_found" }),
      now: ASK_MS + 25 * HOUR + 60_000,
    });
    assert.equal(gone.summary.skipped, 1);
    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.resolutionAttempts, 1);
    assert.equal(got?.resolution, "none");
  });

  it("an unreadable thread does not block the asks behind it", async () => {
    const { usage, resolutions, turn } = await world();
    const others = Array.from({ length: PASS_LIMIT }, (_, i) =>
      turnRecord({ turnId: `C1:${tsAt((i + 1) * 60_000)}`, askTs: tsAt((i + 1) * 60_000), askedAt: ASK_MS + (i + 1) * 60_000, proposalId: null }),
    );
    for (const t of others) await usage.record(t);
    const run = async (now: number) =>
      runResolutionPass({
        log: resolutions,
        now: () => now,
        leadUserId: LEAD,
        botUserId: async () => BOT,
        threadOf: async (_c, askTs) => (askTs === ASK_TS ? null : [{ ts: askTs, user: ASKER, text: "q" }]),
        leadDmsWith: async () => [],
        dryRun: false,
      });
    // The oldest ask is unreadable; the run's second job still reaches the one
    // the first job's limit left over.
    await run(ASK_MS + 25 * HOUR);
    await run(ASK_MS + 25 * HOUR + 60_000);
    for (const t of others) assert.equal((await resolutions.getResolution(t.turnId))?.resolution, "no_escalation");
    assert.equal((await resolutions.getResolution(turn.turnId))?.resolutionAttempts, 1);
  });

  it("re-reading a backlog of unknowns never starves a new ask of its first read", async () => {
    const usage = createInMemoryUsageLog();
    const resolutions = createInMemoryResolutionLog(usage);
    const record = async (offsetMs: number) => {
      const t = turnRecord({ turnId: `C1:${tsAt(offsetMs)}`, askTs: tsAt(offsetMs), askedAt: ASK_MS + offsetMs, proposalId: null });
      await usage.record(t);
      return t;
    };
    // A full day of old unknowns, already read once…
    const backlog = await Promise.all(Array.from({ length: 60 }, (_, i) => record(i * 60_000)));
    const run = async (now: number) => {
      for (let job = 0; job < ASK_RESOLUTION_JOBS; job++) {
        await runResolutionPass({
          log: resolutions,
          now: () => now + job * 60_000,
          leadUserId: LEAD,
          botUserId: async () => BOT,
          threadOf: async (_c, askTs) => [{ ts: askTs, user: ASKER, text: "q" }],
          leadDmsWith: null,
          announce: job === 0,
          dryRun: false,
        });
      }
    };
    await run(ASK_MS + 26 * HOUR);
    // …then a new ask, the next day, behind all of them by age.
    const fresh = await record(24 * HOUR);
    await run(ASK_MS + 50 * HOUR);
    assert.equal((await resolutions.getResolution(fresh.turnId))?.resolutionAttempts, 1);
    const reread = await Promise.all(backlog.map((t) => resolutions.getResolution(t.turnId)));
    assert.equal(reread.filter((r) => r?.resolutionAttempts === 2).length, 59);
  });

  it("the missing-token line is logged by the announcing job only", async () => {
    const lines: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => lines.push(args.join(" "));
    try {
      // Each job with an ask of its own to read, so each reaches the announcement.
      for (const announce of [true, false, false]) {
        const { resolutions } = await world();
        await runResolutionPass({
          log: resolutions,
          now: () => ASK_MS + 25 * HOUR,
          leadUserId: LEAD,
          botUserId: async () => BOT,
          threadOf: async () => thread(),
          leadDmsWith: null,
          announce,
          dryRun: false,
        });
      }
    } finally {
      console.log = original;
    }
    assert.equal(lines.filter((l) => l.includes("no connected Slack token")).length, 1);
  });

  it("60 unknown asks are all read within one end-of-day run's jobs, and again the next day", async () => {
    const usage = createInMemoryUsageLog();
    const resolutions = createInMemoryResolutionLog(usage);
    const asks = Array.from({ length: 60 }, (_, i) =>
      turnRecord({ turnId: `C1:${tsAt(i * 60_000)}`, askTs: tsAt(i * 60_000), askedAt: ASK_MS + i * 60_000, proposalId: null }),
    );
    for (const t of asks) await usage.record(t);
    const run = async (now: number) =>
      runResolutionPass({
        log: resolutions,
        now: () => now,
        leadUserId: LEAD,
        botUserId: async () => BOT,
        threadOf: async (_c, askTs) => [{ ts: askTs, user: ASKER, text: "q" }],
        leadDmsWith: null, // no token: every ask stays unknown
        dryRun: false,
      });
    const endOfDay = ASK_MS + 26 * HOUR;
    for (let job = 0; job < ASK_RESOLUTION_JOBS; job++) {
      const { checked } = await run(endOfDay + job * 60_000);
      assert.ok(checked <= PASS_LIMIT);
    }
    for (const t of asks) assert.equal((await resolutions.getResolution(t.turnId))?.resolutionAttempts, 1, t.turnId);
    for (let job = 0; job < ASK_RESOLUTION_JOBS; job++) await run(endOfDay + 24 * HOUR + job * 60_000);
    for (const t of asks) {
      const got = await resolutions.getResolution(t.turnId);
      assert.equal(got?.resolutionAttempts, 2);
      assert.equal(got?.resolution, "none");
      assert.equal(got?.resolvedAt, endOfDay + Math.floor(asks.indexOf(t) / PASS_LIMIT) * 60_000);
    }
  });

  it("a dry run counts the asks due, and reads nothing from Slack and writes nothing", async () => {
    const { resolutions, turn } = await world();
    const reads: string[] = [];
    const lines: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => lines.push(args.join(" "));
    let summary;
    try {
      summary = await runResolutionPass({
        log: resolutions,
        now: () => ASK_MS + 25 * HOUR,
        leadUserId: LEAD,
        botUserId: async () => {
          reads.push("auth.test");
          return BOT;
        },
        threadOf: async () => {
          reads.push("conversations.replies");
          return thread();
        },
        // What the sweep probe hands over: no token looked up, so no refresh.
        leadDmsWith: null,
        dryRun: true,
      });
    } finally {
      console.log = original;
    }
    assert.deepEqual(reads, []);
    assert.equal(summary.checked, 0);
    assert.match(summary.summary, /1 ask\(s\) due \(dry run: nothing read, nothing written\)/);
    // The probe looks up no token, so it must not say the lead has none.
    assert.deepEqual(lines, []);
    assert.equal((await resolutions.getResolution(turn.turnId))?.resolutionAttempts, 0);
  });

  it("test traffic and asks under a day old are not read", async () => {
    const { usage, resolutions } = await world({ testTraffic: true });
    await usage.record(
      turnRecord({ turnId: `C1:${tsAt(2 * HOUR)}`, askTs: tsAt(2 * HOUR), askedAt: ASK_MS + 2 * HOUR }),
    );
    const { summary } = await pass(resolutions);
    assert.equal(summary.checked, 0);
    assert.equal(summary.summary, "no asks to check");
  });
});

describe("the lead's DM reader is read-only", () => {
  type Call = { method: string; params: Record<string, string> };

  function fakeSlack(responses: Partial<Record<string, (params: Record<string, string>) => Record<string, unknown>>>) {
    const calls: Call[] = [];
    const read: SlackRead = async (method, params) => {
      calls.push({ method, params });
      const answer = responses[method];
      return (answer ? answer(params) : { ok: false, error: "unexpected" }) as { ok: boolean };
    };
    return { calls, read };
  }

  const IMS = { ok: true, channels: [{ id: "DASKER", user: ASKER }], response_metadata: { next_cursor: "" } };

  it("finds the existing DM from the lead's DM list, and reads its window", async () => {
    const slack = fakeSlack({
      "users.conversations": () => IMS,
      "conversations.history": () => ({ ok: true, messages: [{ ts: tsAt(HOUR), user: ASKER, text: "hi" }] }),
    });
    const reader = createLeadDmReader(slack.read);
    assert.deepEqual(await reader(ASKER, ASK_TS, tsAt(24 * HOUR)), [{ ts: tsAt(HOUR), user: ASKER, text: "hi" }]);
    assert.deepEqual(slack.calls[0]?.params.types, "im");
    assert.deepEqual(slack.calls[1], {
      method: "conversations.history",
      params: { channel: "DASKER", oldest: ASK_TS, latest: tsAt(24 * HOUR), inclusive: "false", limit: "200" },
    });
  });

  it("with no existing DM, answers no DM, and makes no write and no further call", async () => {
    const slack = fakeSlack({ "users.conversations": () => IMS });
    const reader = createLeadDmReader(slack.read);
    assert.deepEqual(await reader("U-NEVER-DMED", ASK_TS, tsAt(24 * HOUR)), []);
    assert.deepEqual(
      slack.calls.map((c) => c.method),
      ["users.conversations"],
    );
    assert.ok(slack.calls.every((c) => c.method !== "conversations.open"));
  });

  it("lists the DMs once per pass, across asks and pages", async () => {
    const slack = fakeSlack({
      "users.conversations": (params) =>
        params.cursor
          ? { ok: true, channels: [{ id: "DOTHER", user: "U8" }], response_metadata: { next_cursor: "" } }
          : { ...IMS, response_metadata: { next_cursor: "page2" } },
      "conversations.history": () => ({ ok: true, messages: [] }),
    });
    const reader = createLeadDmReader(slack.read);
    await reader(ASKER, ASK_TS, tsAt(24 * HOUR));
    await reader("U8", ASK_TS, tsAt(24 * HOUR));
    await reader("U9", ASK_TS, tsAt(24 * HOUR));
    assert.deepEqual(
      slack.calls.map((c) => [c.method, c.params.channel ?? c.params.cursor ?? ""]),
      [
        ["users.conversations", ""],
        ["users.conversations", "page2"],
        ["conversations.history", "DASKER"],
        ["conversations.history", "DOTHER"],
      ],
    );
  });

  it("a DM list it cannot read is unknown, never no DM", async () => {
    const slack = fakeSlack({ "users.conversations": () => ({ ok: false, error: "missing_scope" }) });
    const reader = createLeadDmReader(slack.read);
    const lines: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => lines.push(args.join(" "));
    try {
      assert.equal(await reader(ASKER, ASK_TS, tsAt(24 * HOUR)), null);
      assert.equal(await reader("U8", ASK_TS, tsAt(24 * HOUR)), null);
    } finally {
      console.log = original;
    }
    assert.equal(lines.filter((l) => l.startsWith("[resolution]")).length, 1);
    assert.equal(slack.calls.length, 1);
  });

  it("a DM list cut off at the page cap is unknown for an asker it did not name", async () => {
    const slack = fakeSlack({
      "users.conversations": (params) => ({
        ok: true,
        channels: params.cursor === "p2" ? [{ id: "DASKER", user: ASKER }] : [{ id: `D${params.cursor ?? "0"}`, user: `U${params.cursor ?? "0"}` }],
        response_metadata: { next_cursor: `p${Number((params.cursor ?? "p0").slice(1)) + 1}` },
      }),
      "conversations.history": () => ({ ok: true, messages: [] }),
    });
    const reader = createLeadDmReader(slack.read);
    assert.equal(await reader("U-NOT-LISTED", ASK_TS, tsAt(24 * HOUR)), null);
    // Named inside the pages it did read: that DM is known.
    assert.deepEqual(await reader(ASKER, ASK_TS, tsAt(24 * HOUR)), []);
  });

  it("a DM history with more in the window than one page is unknown", async () => {
    const slack = fakeSlack({
      "users.conversations": () => IMS,
      "conversations.history": () => ({ ok: true, messages: [{ ts: tsAt(HOUR), user: ASKER, text: "hi" }], has_more: true }),
    });
    assert.equal(await createLeadDmReader(slack.read)(ASKER, ASK_TS, tsAt(24 * HOUR)), null);
  });

  it("a DM history it cannot read is unknown, and the pass records none", async () => {
    const slack = fakeSlack({
      "users.conversations": () => IMS,
      "conversations.history": () => ({ ok: false, error: "token_revoked" }),
    });
    const { resolutions, turn } = await world();
    await runResolutionPass({
      log: resolutions,
      now: () => ASK_MS + 25 * HOUR,
      leadUserId: LEAD,
      botUserId: async () => BOT,
      threadOf: async () => thread(),
      leadDmsWith: createLeadDmReader(slack.read),
      dryRun: false,
    });
    const got = await resolutions.getResolution(turn.turnId);
    assert.equal(got?.resolution, "none");
    assert.equal(got?.escalatedToLead, null);
    assert.equal(got?.resolutionCheckedAt, null); // read again next day
  });
});

describe("the reaction door records the asker's ✅ on an answer", () => {
  const CHANNEL = "C1";
  const ANSWER_TS = tsAt(5_000);
  const OTHER = "U9";

  /** A thread: the reactor's ask, someone else's ask, and the bot's answer to each. */
  const twoAsks = (): ThreadMessage[] => [
    { ts: ASK_TS, user: ASKER, text: ASK_TEXT },
    { ts: tsAt(5_000), user: BOT, bot_id: "B1", text: "It is in Notion." },
    { ts: tsAt(10_000), user: OTHER, text: "and the fall one?" },
    { ts: tsAt(15_000), user: BOT, bot_id: "B1", text: "Also in Notion." },
  ];

  async function react(opts: {
    userId: string;
    glyph?: string;
    author?: string;
    messageTs?: string;
    threadRoot?: string;
    thread?: ThreadMessage[] | null;
    threadState?: ReturnType<typeof createInMemoryThreadState>;
    /** The card the reactor's ask staged, on its usage row. */
    proposalId?: string;
  }) {
    const { usage, resolutions, turn } = await world({ proposalId: opts.proposalId ?? null });
    const otherTurn = turnRecord({
      turnId: `C1:${tsAt(10_000)}`,
      askTs: tsAt(10_000),
      askedAt: ASK_MS + 10_000,
      requesterId: OTHER,
      proposalId: null,
    });
    await usage.record(otherTurn);
    const delivery = recordingDelivery();
    const verdicts: unknown[] = [];
    const recorded: string[] = [];
    await runReactionDoor(
      {
        channel: CHANNEL,
        messageTs: opts.messageTs ?? ANSWER_TS,
        glyph: opts.glyph ?? "white_check_mark",
        userId: opts.userId,
        messageAuthorId: opts.author ?? BOT,
      },
      {
        threadState: opts.threadState ?? createInMemoryThreadState(),
        delivery: () => delivery,
        threadRootOf: async () => opts.threadRoot ?? ASK_TS,
        botUserId: async () => BOT,
        applyVerdict: async (v) => {
          verdicts.push(v);
        },
        restage: async () => {},
        async recordReaction(r) {
          recorded.push(r.reactedTs);
          await recordAnswerReaction(r, {
            log: resolutions,
            threadOf: async () => (opts.thread === undefined ? twoAsks() : opts.thread),
            now: () => ASK_MS + 20_000,
          });
        },
      },
    );
    return {
      mine: await resolutions.getResolution(turn.turnId),
      theirs: await resolutions.getResolution(otherTurn.turnId),
      delivery,
      verdicts,
      recorded,
    };
  }

  it("✅ by the asker on the answer to their ask records reaction, and resolves no card", async () => {
    const { mine, delivery, verdicts } = await react({ userId: ASKER });
    assert.equal(mine?.resolution, "reaction");
    assert.deepEqual(verdicts, []);
    assert.deepEqual(delivery.calls, []);
  });

  it("👍 by the asker records reaction too", async () => {
    const { mine } = await react({ userId: ASKER, glyph: "+1" });
    assert.equal(mine?.resolution, "reaction");
  });

  it("the same glyph from someone else records nothing, and resolves no card", async () => {
    const { mine, theirs, verdicts } = await react({ userId: "U5" });
    assert.equal(mine?.resolution, null);
    assert.equal(theirs?.resolution, null);
    assert.deepEqual(verdicts, []);
  });

  it("a 👍 on the answer to someone else's question never resolves the reactor's own ask", async () => {
    const { mine, theirs } = await react({ userId: ASKER, glyph: "+1", messageTs: tsAt(15_000) });
    assert.equal(mine?.resolution, null);
    assert.equal(theirs?.resolution, null);
  });

  it("the other asker's ✅ on the answer to their question resolves theirs, not the thread's first", async () => {
    const { mine, theirs } = await react({ userId: OTHER, messageTs: tsAt(15_000) });
    assert.equal(theirs?.resolution, "reaction");
    assert.equal(mine?.resolution, null);
  });

  it("a top-level bot post, or a thread it cannot read, records nothing", async () => {
    const topLevel = await react({ userId: ASKER, threadRoot: ANSWER_TS });
    assert.equal(topLevel.mine?.resolution, null);
    const unreadable = await react({ userId: ASKER, thread: null });
    assert.equal(unreadable.mine?.resolution, null);
  });

  it("an ask in another thread of the same channel is never resolved from this one", async () => {
    // This thread holds only someone else's ask and its answer; the reactor's
    // own ask (the world's turn) sits in a different thread.
    const elsewhere: ThreadMessage[] = [
      { ts: tsAt(10_000), user: OTHER, text: "and the fall one?" },
      { ts: tsAt(15_000), user: BOT, bot_id: "B1", text: "Also in Notion." },
    ];
    const { mine } = await react({ userId: ASKER, threadRoot: tsAt(10_000), messageTs: tsAt(15_000), thread: elsewhere });
    assert.equal(mine?.resolution, null);
  });

  it("a ✅ on a message the bot did not write records nothing", async () => {
    const { mine } = await react({ userId: ASKER, author: "U9" });
    assert.equal(mine?.resolution, null);
  });

  it("a ✅ on a card already used up records nothing: the reacted ts is a known card", async () => {
    // The card was claimed, rejected or cleared, so the gate finds no proposal
    // and does nothing; the reacted message still maps to the ask by thread.
    const { mine, verdicts, recorded } = await react({ userId: ASKER, proposalId: ANSWER_TS });
    assert.deepEqual(verdicts, []);
    assert.deepEqual(recorded, [ANSWER_TS]);
    assert.equal(mine?.resolution, null);
  });

  it("a party popper records nothing", async () => {
    const { mine } = await react({ userId: ASKER, glyph: "tada" });
    assert.equal(mine?.resolution, null);
  });

  describe("when the gate did anything at all, nothing is recorded", () => {
    const card = (over: Partial<PendingProposal> = {}): PendingProposal => ({
      toolName: "github_issue_create",
      input: { title: "t" },
      channel: CHANNEL,
      threadTs: ASK_TS,
      replyTs: ASK_TS,
      userMsgTs: ASK_TS,
      proposalTs: tsAt(8_000),
      proposalText: "card",
      requesterUserId: ASKER,
      ...over,
    });

    it("a ✅ on an answer while a card is live in the thread gets a pointer, and no reaction", async () => {
      const threadState = createInMemoryThreadState();
      await threadState.putProposal(card());
      const { mine, recorded, delivery } = await react({ userId: ASKER, threadState });
      assert.equal(mine?.resolution, null);
      assert.deepEqual(recorded, []);
      assert.ok(delivery.calls.length > 0, "the pointer was posted");
    });

    it("a refused confirmer's ✅ on the card records no reaction", async () => {
      const threadState = createInMemoryThreadState();
      await threadState.putProposal(card({ proposalTs: ANSWER_TS, confirmers: ["U-SOMEONE"] }));
      const { mine, recorded } = await react({ userId: ASKER, threadState });
      assert.equal(mine?.resolution, null);
      assert.deepEqual(recorded, []);
    });

    it("a ✅ on a card another card replaced records no reaction", async () => {
      // The reacted message was a card, now superseded: the gate says so.
      // (A which-card question is asked only of a typed emoji, never a reaction.)
      const threadState = createInMemoryThreadState();
      await threadState.putProposal(card({ proposalTs: ANSWER_TS }));
      await threadState.putProposal(card({ proposalTs: tsAt(9_000) }));
      const { mine, recorded } = await react({ userId: ASKER, threadState });
      assert.equal(mine?.resolution, null);
      assert.deepEqual(recorded, []);
    });
  });
});

describe("a re-staged card still resolves the ask that staged the first one", () => {
  it("carries the original card through each re-staging, and task_completed lands on the ask", async () => {
    const usage = createInMemoryUsageLog();
    const resolutions = createInMemoryResolutionLog(usage);
    const turn = turnRecord({ turnId: `C1:${ASK_TS}`, askTs: ASK_TS, askedAt: ASK_MS, proposalId: "P0" });
    await usage.record(turn);

    const original: PendingProposal = {
      toolName: "github_issue_create",
      input: { title: "t", body: "b" },
      operations: [{ toolName: "github_issue_create", input: { title: "t", body: "b" } }],
      channel: "C1",
      threadTs: ASK_TS,
      replyTs: ASK_TS,
      userMsgTs: ASK_TS,
      proposalTs: "P0",
      proposalText: "card",
      requesterUserId: ASKER,
    };
    const deps = {
      threadState: createInMemoryThreadState(),
      delivery: recordingDelivery(),
      cards: {
        async notionRevision() {
          return null;
        },
        async notionTarget() {
          return null;
        },
        async designPreviewImage() {
          return null;
        },
        async issueTarget() {
          return { repo: "BilLogic/plus-uno", visibility: "public" as const };
        },
        async workflowTarget() {
          return { repo: "BilLogic/plus-uno", branch: "main" };
        },
      },
    } as unknown as Parameters<typeof restageExecution>[1];
    const once = await restageExecution({ proposal: original, operations: original.operations! }, deps);
    assert.ok(once);
    assert.notEqual(once.proposal.proposalTs, "P0");
    assert.equal(once.proposal.originProposalTs, "P0");
    const twice = await restageExecution({ proposal: once.proposal, operations: original.operations! }, deps);
    assert.equal(twice?.proposal.originProposalTs, "P0");

    // What `runVerdict` records on, for the re-staged card.
    assert.equal(stagingCardOf(twice!.proposal), "P0");
    assert.equal(await resolutions.recordTaskCompleted(stagingCardOf(twice!.proposal), ASK_MS + HOUR), turn.turnId);
    assert.equal(stagingCardOf(original), "P0");
  });
});
