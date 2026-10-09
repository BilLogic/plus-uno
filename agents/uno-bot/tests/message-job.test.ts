// A reply handled ahead of the turn, on the queued path: it runs at the head
// of the thread's message job, behind the per-message dedup claim, so the
// `message` event and its `app_mention` twin handle it once whichever lands
// first; a broadcast reply counts; a handler that throws falls through to the
// turn; and a reply the handler declines takes the ordinary path.
//
// The claim is the in-memory ThreadState's real `claimRun`, reached through
// the real reply chain (`chainReplyHandlers`). The handler is a stand-in that
// takes `answer N` in one thread. Nothing reaches Slack.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { chainReplyHandlers, runMessageJob, type MessageJobDeps } from "../src/slack/message-job";
import { createInMemoryThreadState } from "../src/thread-state/index";
import type { SlackMessageEvent } from "../src/slack/types";

const CHANNEL = "C072E8SFLKV";
const THREAD = "1759500000.000001";

function harness(opts: { throws?: boolean } = {}) {
  const threadState = createInMemoryThreadState();
  const handled: string[] = [];
  const turns: string[] = [];
  const answer = (e: SlackMessageEvent) => /^\s*(?:<@[A-Z0-9]+>\s*)?answer \d+/.test(e.text ?? "");
  const deps: MessageJobDeps = {
    claim: (key) => threadState.claimRun(key),
    markDone: (key) => threadState.markRunDone(key),
    ...chainReplyHandlers([
      {
        name: "answers",
        candidate: (e) => e.channel === CHANNEL && !!e.thread_ts && answer(e),
        async handle(e) {
          if (opts.throws) throw new Error("Slack down");
          if (e.thread_ts !== THREAD) return false;
          handled.push(e.ts);
          return true;
        },
      },
      { name: "follow-through", candidate: () => false, handle: async () => false },
    ]),
    // Engages as the gate would in a quiet thread: on an @mention.
    engages: async (e) => /<@/.test(e.text ?? ""),
    turn: async (e) => void turns.push(e.ts),
  };
  return { deps, handled, turns };
}

const reply = (ts: string, text: string, over: Partial<SlackMessageEvent> = {}): SlackMessageEvent =>
  ({ type: "message", channel: CHANNEL, thread_ts: THREAD, ts, user: "U0MEMBER1", text, ...over }) as SlackMessageEvent;

describe("a reply handled on the queued path", () => {
  it("the message and its mention twin, in either order, are handled exactly once", async () => {
    for (const order of [["message", "mention"], ["mention", "message"]]) {
      const { deps, handled, turns } = harness();
      const events: Record<string, SlackMessageEvent> = {
        message: reply("1759500100.000001", "<@UBOT> answer 2"),
        // The mention twin, as `appMentionToMessage` shapes it: same ts.
        mention: reply("1759500100.000001", "<@UBOT> answer 2"),
      };
      for (const which of order) assert.equal(await runMessageJob(events[which]!, deps), "handled");
      assert.deepEqual(handled, ["1759500100.000001"], order.join(" then "));
      assert.deepEqual(turns, [], "no turn for a handled reply");
    }
  });

  it("a reply sent to the channel too (thread_broadcast) is handled", async () => {
    const { deps, handled, turns } = harness();
    await runMessageJob(reply("1759500200.000001", "answer 3", { subtype: "thread_broadcast" }), deps);
    assert.deepEqual(handled, ["1759500200.000001"]);
    assert.deepEqual(turns, []);
  });

  it("a broadcast no handler wants is still skipped", async () => {
    const { deps, turns } = harness();
    await runMessageJob(reply("1759500250.000001", "fyi all", { subtype: "thread_broadcast" }), deps);
    assert.deepEqual(turns, []);
  });

  it("a handler that throws falls through to the turn in the same job", async () => {
    const { deps, turns } = harness({ throws: true });
    await runMessageJob(reply("1759500300.000001", "answer 1"), deps);
    assert.deepEqual(turns, ["1759500300.000001"]);
  });

  it("a declined reply runs no turn where it would not engage, and its turn where it would", async () => {
    const { deps, handled, turns } = harness();
    const elsewhere = "1759400000.000001";
    await runMessageJob(reply("1759500600.000001", "answer 1", { thread_ts: elsewhere }), deps);
    assert.deepEqual(turns, []);
    await runMessageJob(reply("1759500600.000002", "<@UBOT> answer 1", { thread_ts: elsewhere }), deps);
    assert.deepEqual(turns, ["1759500600.000002"]);
    assert.deepEqual(handled, []);
  });

  it("a declined broadcast leaves the message's key alone, so its mention twin arriving second gets its turn", async () => {
    const { deps, turns } = harness();
    const elsewhere = "1759400000.000001";
    const ts = "1759500650.000001";
    await runMessageJob(reply(ts, "<@UBOT> answer 1", { thread_ts: elsewhere, subtype: "thread_broadcast" }), deps);
    assert.deepEqual(turns, []);
    await runMessageJob(reply(ts, "<@UBOT> answer 1", { thread_ts: elsewhere }), deps);
    assert.deepEqual(turns, [ts]);
  });

  it("an ordinary reply runs its turn", async () => {
    const { deps, turns } = harness();
    await runMessageJob(reply("1759500500.000001", "<@UBOT> why is Button listed?"), deps);
    assert.deepEqual(turns, ["1759500500.000001"]);
  });
});
