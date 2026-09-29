// A weekly-thread dispute on the queued path: it runs at the head of the
// thread's message job, behind the per-message dedup claim, so the `message`
// event and its `app_mention` twin handle it once whichever lands first; a
// broadcast reply counts; a revision that throws falls through to the turn;
// and two quick disputes — the runner takes them one at a time — both apply.
//
// The claim is the in-memory ThreadState's real `claimRun`; the dispute is the
// real `disputePrecedenceItems` over an in-memory thread record. Nothing
// reaches Slack.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { runMessageJob, type MessageJobDeps } from "../src/slack/message-job";
import { disputePrecedenceItems, PRECEDENCE_CARD_TTL_MS, type PostedThread } from "../src/ds-precedence/jobs";
import { disputedItems } from "../src/ds-precedence/report";
import { createInMemoryThreadState, type PendingProposal } from "../src/thread-state/index";
import type { SlackMessageEvent } from "../src/slack/types";

const CHANNEL = "C072E8SFLKV";
const THREAD = "1759500000.000001";
const NOW = Date.UTC(2026, 9, 5, 16, 0);

function weeklyThread(): PostedThread {
  const item = (n: number, component: string) => ({
    n,
    key: `${component}::missing-in-figma`,
    component,
    kind: "missing-in-figma" as const,
    summary: `\`${component}\` is missing.`,
    codeUrl: "https://github.com/x",
    figmaUrl: "https://www.figma.com/design/x",
    winner: "code" as const,
    loser: "library" as const,
  });
  return {
    channel: CHANNEL,
    ts: THREAD,
    cardTs: "1759500000.000002",
    weekOf: "2026-10-02",
    items: [item(1, "Button"), item(2, "TreeSelect"), item(3, "Cascader")],
    disputed: [],
    target: { kind: "create" },
    confirmers: ["U0MEMBER1"],
    expiresAt: NOW + PRECEDENCE_CARD_TTL_MS,
  };
}

function harness(opts: { disputeThrows?: boolean; engages?: boolean } = {}) {
  const threadState = createInMemoryThreadState({ now: () => NOW });
  const record = { value: weeklyThread() as PostedThread | null };
  const turns: string[] = [];
  const staged: PendingProposal[] = [];
  let posted = 0;
  const deps: MessageJobDeps = {
    claim: (key) => threadState.claimRun(key),
    markDone: (key) => threadState.markRunDone(key),
    disputeCandidate: (e) => e.channel === CHANNEL && !!e.thread_ts && disputedItems(e.text ?? "").length > 0,
    dispute: async (e) => {
      if (opts.disputeThrows) throw new Error("Slack down");
      return disputePrecedenceItems(
        {
          thread: {
            read: async () => record.value,
            write: async (v) => {
              record.value = v;
            },
          },
          post: async () => {
            posted += 1;
            return { ok: true, ts: `1759600000.00000${posted}` };
          },
          stage: async (p) => {
            staged.push(p);
            await threadState.putProposal(p);
          },
          retire: (ts) => threadState.retireProposal(ts),
          pending: async () => true,
          now: () => NOW,
        },
        { channel: e.channel, threadTs: e.thread_ts!, user: e.user!, text: e.text ?? "" },
      );
    },
    // Engages as the gate would in the weekly thread: on an @mention.
    engages: async (e) => opts.engages ?? /<@/.test(e.text ?? ""),
    turn: async (e) => {
      turns.push(e.ts);
    },
  };
  return { deps, record, turns, staged };
}

const reply = (ts: string, text: string, over: Partial<SlackMessageEvent> = {}): SlackMessageEvent =>
  ({ type: "message", channel: CHANNEL, thread_ts: THREAD, ts, user: "U0MEMBER1", text, ...over }) as SlackMessageEvent;

describe("a dispute on the queued path", () => {
  it("the message and its mention twin, in either order, are handled exactly once", async () => {
    for (const order of [["message", "mention"], ["mention", "message"]]) {
      const { deps, record, turns, staged } = harness();
      const events: Record<string, SlackMessageEvent> = {
        message: reply("1759500100.000001", "<@UBOT> dispute 2"),
        // The mention twin, as `appMentionToMessage` shapes it: same ts.
        mention: reply("1759500100.000001", "<@UBOT> dispute 2"),
      };
      for (const which of order) assert.equal(await runMessageJob(events[which]!, deps), "handled");
      assert.equal(staged.length, 1, `one revised card (${order.join(" then ")})`);
      assert.deepEqual(record.value?.disputed, [2]);
      assert.deepEqual(turns, [], "no turn for a handled dispute");
    }
  });

  it("a dispute sent to the channel too (thread_broadcast) is handled", async () => {
    const { deps, record, turns } = harness();
    await runMessageJob(reply("1759500200.000001", "dispute 3", { subtype: "thread_broadcast" }), deps);
    assert.deepEqual(record.value?.disputed, [3]);
    assert.deepEqual(turns, []);
  });

  it("a broadcast that is not a dispute is still skipped, as before", async () => {
    const { deps, turns } = harness();
    await runMessageJob(reply("1759500250.000001", "fyi all", { subtype: "thread_broadcast" }), deps);
    assert.deepEqual(turns, []);
  });

  it("a revision that throws falls through to the turn in the same job", async () => {
    const { deps, turns } = harness({ disputeThrows: true });
    await runMessageJob(reply("1759500300.000001", "dispute 1"), deps);
    assert.deepEqual(turns, ["1759500300.000001"]);
  });

  it("two quick disputes both apply, and the last card carries neither item", async () => {
    const { deps, record, staged } = harness();
    // The thread's runner takes one job at a time.
    await runMessageJob(reply("1759500400.000001", "dispute 1"), deps);
    await runMessageJob(reply("1759500400.000002", "dispute 3"), deps);
    assert.deepEqual(record.value?.disputed, [1, 3]);
    assert.equal(staged.length, 2);
    const last = String(staged[1]!.operations![0]!.input.body);
    assert.match(last, /TreeSelect/);
    assert.doesNotMatch(last, /Button|Cascader/);
    assert.equal(record.value?.cardTs, staged[1]!.proposalTs, "the thread record follows the live card");
    assert.equal(staged[0]!.supersedeKey, staged[1]!.supersedeKey, "the revision supersedes the first");
  });

  it("a dispute the thread declines runs no turn where the reply would not engage", async () => {
    const { deps, record, turns, staged } = harness();
    // An item not on the list, and a thread that is not the weekly one.
    await runMessageJob(reply("1759500600.000001", "dispute 9"), deps);
    await runMessageJob(reply("1759500600.000002", "dispute 1", { thread_ts: "1759400000.000001" }), deps);
    assert.deepEqual(turns, []);
    assert.deepEqual(staged, []);
    assert.deepEqual(record.value?.disputed, []);
    // With an @mention it would have engaged anyway, so its turn runs.
    await runMessageJob(reply("1759500600.000003", "<@UBOT> dispute 9"), deps);
    assert.deepEqual(turns, ["1759500600.000003"]);
  });

  it("a reply that only mentions disputing changes nothing", async () => {
    const { deps, record, turns, staged } = harness();
    for (const [ts, text] of [["1759500700.000001", "I wouldn't dispute 2"], ["1759500700.000002", "should we dispute 3?"]]) {
      await runMessageJob(reply(ts!, text!), deps);
    }
    assert.deepEqual(staged, [], "no revised card");
    assert.deepEqual(record.value?.disputed, []);
    // Not a candidate, so it is an ordinary message: the harness runs its turn
    // (the dispatch's gate would have dropped it first, as for any reply).
    assert.equal(turns.length, 2);
  });

  it("an ordinary reply runs its turn", async () => {
    const { deps, turns } = harness();
    await runMessageJob(reply("1759500500.000001", "<@UBOT> why is Button listed?"), deps);
    assert.deepEqual(turns, ["1759500500.000001"]);
  });
});
