// How each ask was resolved (src/usage/resolution*.ts): the rules, the
// end-of-day pass on fakes, and the reaction door recording the asker's ✅.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { runReactionDoor } from "../src/gate/index";
import { createInMemoryThreadState } from "../src/thread-state/index";
import { recordingDelivery } from "../src/turn/index";
import { createInMemoryUsageLog } from "../src/usage/in-memory";
import {
  batchCompleted,
  isResolvingReaction,
  reactionWindow,
  sameTopic,
  type ResolutionLog,
} from "../src/usage/resolution";
import { createInMemoryResolutionLog } from "../src/usage/resolution-in-memory";
import { runResolutionPass, type DmMessage, type ThreadMessage } from "../src/usage/resolution-pass";
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
    thread?: ThreadMessage[] | null;
    dms?: DmMessage[] | null;
    lead?: string | null;
    dryRun?: boolean;
  } = {},
) {
  const dmCalls: string[] = [];
  const summary = await runResolutionPass({
    log: resolutions,
    now: () => ASK_MS + 25 * HOUR,
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

  it("a reaction looks back to its thread root, or a day when it is in no thread", () => {
    assert.deepEqual(reactionWindow("1700000000.000000", "1700000100.000000"), {
      fromMs: 1_700_000_000_000,
      toMs: 1_700_000_100_000,
    });
    assert.deepEqual(reactionWindow("1700000100.000000", "1700000100.000000"), {
      fromMs: 1_700_000_100_000 - 24 * HOUR,
      toMs: 1_700_000_100_000,
    });
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
    await resolutions.recordReaction({
      channel: "C1",
      requesterId: ASKER,
      fromMs: ASK_MS,
      toMs: ASK_MS + 10_000,
      at: ASK_MS + 10_000,
    });
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

  it("an unreadable thread is left for the next pass", async () => {
    const { resolutions, turn } = await world();
    const { summary } = await pass(resolutions, { thread: null });
    assert.equal(summary.skipped, 1);
    assert.equal((await resolutions.getResolution(turn.turnId))?.resolutionCheckedAt, null);
  });

  it("a dry run reads and writes nothing", async () => {
    const { resolutions, turn } = await world();
    const { summary } = await pass(resolutions, { dryRun: true });
    assert.equal(summary.noEscalation, 1);
    assert.equal((await resolutions.getResolution(turn.turnId))?.resolutionCheckedAt, null);
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

describe("the reaction door records the asker's ✅ on an answer", () => {
  const CHANNEL = "C1";
  const ANSWER_TS = tsAt(5_000);

  async function react(opts: { userId: string; glyph?: string; author?: string }) {
    const { resolutions, turn } = await world();
    const delivery = recordingDelivery();
    const verdicts: unknown[] = [];
    await runReactionDoor(
      {
        channel: CHANNEL,
        messageTs: ANSWER_TS,
        glyph: opts.glyph ?? "white_check_mark",
        userId: opts.userId,
        messageAuthorId: opts.author ?? BOT,
      },
      {
        threadState: createInMemoryThreadState(),
        delivery: () => delivery,
        threadRootOf: async () => ASK_TS,
        botUserId: async () => BOT,
        applyVerdict: async (v) => {
          verdicts.push(v);
        },
        restage: async () => {},
        async recordReaction(r) {
          await resolutions.recordReaction({
            channel: r.channel,
            requesterId: r.userId,
            ...reactionWindow(r.threadRoot, r.reactedTs),
            at: ASK_MS + 10_000,
          });
        },
      },
    );
    return { got: await resolutions.getResolution(turn.turnId), delivery, verdicts };
  }

  it("✅ by the asker records reaction, and resolves no card", async () => {
    const { got, delivery, verdicts } = await react({ userId: ASKER });
    assert.equal(got?.resolution, "reaction");
    assert.deepEqual(verdicts, []);
    assert.deepEqual(delivery.calls, []);
  });

  it("👍 by the asker records reaction too", async () => {
    const { got } = await react({ userId: ASKER, glyph: "+1" });
    assert.equal(got?.resolution, "reaction");
  });

  it("the same glyph from someone else records nothing, and resolves no card", async () => {
    const { got, verdicts } = await react({ userId: "U9" });
    assert.equal(got?.resolution, null);
    assert.deepEqual(verdicts, []);
  });

  it("a ✅ on a message the bot did not write records nothing", async () => {
    const { got } = await react({ userId: ASKER, author: "U9" });
    assert.equal(got?.resolution, null);
  });

  it("a party popper records nothing", async () => {
    const { got } = await react({ userId: ASKER, glyph: "tada" });
    assert.equal(got?.resolution, null);
  });
});
