// A failure, as the person reads it, and the Try again button under it.
//
// The shape is one bold line saying how far the turn got, one next step, a ⚠️
// line saying nothing changed, and Try again whenever the question can be
// asked again. Driven from the Turn (what the turn hands Delivery), through
// the Slack adapter (what it hands the posting path), to the post itself on a
// recording Slack that refuses what Slack refuses — and then the press, which
// asks the question again as the presser's own message.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type TurnDeps } from "../src/turn/index";
import { deliveryAdapter } from "../src/slack/delivery-adapter";
import { postVisibleFailure } from "../src/slack/delivery";
import { TRY_AGAIN_ACTION_ID } from "../src/slack/failure-message";
import { retryValue, runTryAgainDoor } from "../src/slack/try-again";
import type { SlackMessageEvent } from "../src/slack/types";
import { harness, request } from "./helpers/turn-harness";
import { recordingPosting, recordingSlack } from "./helpers/recording-slack";

const QUESTION = "how many Roadmap cards are in WIP?";

type Block = Record<string, any>;

/** The Try again door on recordings: what it posted, queued and said aside. */
function door() {
  const posted: Array<{ channel: string; thread_ts?: string; text: string }> = [];
  const queued: SlackMessageEvent[] = [];
  const ephemeral: string[] = [];
  return {
    posted,
    queued,
    ephemeral,
    deps: {
      post: async (m: { channel: string; thread_ts?: string; text: string }) => {
        posted.push(m);
        return `9.00000${posted.length}`;
      },
      enqueue: async (event: SlackMessageEvent) => void queued.push(event),
      replyEphemeral: async (text: string) => void ephemeral.push(text),
    },
  };
}

/** The one failure post, and its blocks. */
function failurePost(posting: ReturnType<typeof recordingPosting>): { text: string; blocks: Block[] } {
  const posts = posting.of("message").filter((m) => m.channel === "C1"); // a capacity alert goes elsewhere
  assert.equal(posts.length, 1, "one message, and only one");
  return { text: posts[0]!.text, blocks: (posts[0]!.blockList ?? []) as Block[] };
}

describe("at the Turn seam", () => {
  it("a failed turn hands Delivery the question, so the failure can offer it again", async () => {
    const h = harness();
    const broken: TurnDeps = {
      ...h.deps,
      async runAgent() {
        throw new Error("the run stopped");
      },
    };
    await runTurn(request({ text: QUESTION }), broken);
    const failure = h.delivery.calls.find((c) => c.kind === "failure");
    assert.equal(failure?.kind === "failure" && failure.ask, QUESTION);
  });

  it("the Slack adapter passes the question on to the post, with who asked it", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(false), { channel: "C1", replyTs: "1.000100", userMsgTs: "1.000100", userId: "U0000001" });
    await delivery.postFailure("agent", new Error("x"), QUESTION);
    const [ask] = slack.of("failure").map((f) => f.ask);
    // Pressed by the asker, the button asks exactly the question again.
    const d = door();
    await runTryAgainDoor({ userId: "U0000001", channel: "C1", messageTs: "1.000200", value: ask }, d.deps);
    assert.equal(d.queued[0]?.text, QUESTION);
    // Pressed by anyone else, it asks nothing.
    const other = door();
    await runTryAgainDoor({ userId: "U0000002", channel: "C1", messageTs: "1.000200", value: ask }, other.deps);
    assert.deepEqual(other.queued, []);
  });
});

describe("the failure post", () => {
  it("is a bold progress line with one next step, a ⚠️ line, and Try again", async () => {
    const posting = recordingPosting();
    await postVisibleFailure(posting.deps(), "C1", "1.000100", "1.000100", new Error("boom"), "agent", QUESTION);

    assert.deepEqual(posting.of("react").map((r) => r.name), ["x"]);
    const { text, blocks } = failurePost(posting);
    assert.deepEqual(blocks.map((b) => b.type), ["section", "context", "actions"]);

    const [lead, next, ...rest] = String(blocks[0]!.text.text).split("\n");
    assert.match(lead!, /^:x: \*[^*]+\*$/, "the progress line is bold, sign first");
    assert.match(lead!, /started working|stopped partway/i);
    assert.ok(next, "one next step");
    assert.deepEqual(rest, [], "and nothing else");

    assert.deepEqual(blocks[1]!.elements.map((e: Block) => e.text), ["⚠️ Nothing was created or changed."]);

    const [button, ...others] = blocks[2]!.elements as Block[];
    assert.deepEqual(others, []);
    assert.equal(button!.action_id, TRY_AGAIN_ACTION_ID);
    assert.equal(button!.text.text, "Try again");
    assert.equal(button!.value, QUESTION);

    // The notification carries all three lines.
    assert.equal(text.split("\n").length, 3);
    assert.match(text, /Nothing was created or changed/);
  });

  it("over capacity says wait, and still offers Try again", async () => {
    const posting = recordingPosting();
    await postVisibleFailure(posting.deps(), "C1", "1.000100", "1.000100", new Error("429 quota"), "agent", QUESTION);
    const { blocks } = failurePost(posting);
    assert.match(String(blocks[0]!.text.text), /^:x: \*.*over capacity.*\*\n.*couple of minutes/is);
    assert.equal(blocks.at(-1)!.type, "actions");
  });

  it("offers no Try again when there is no question to ask again, or it will not fit a button", async () => {
    for (const ask of [undefined, "   ", "x".repeat(2001)]) {
      const posting = recordingPosting();
      await postVisibleFailure(posting.deps(), "C1", "1.000100", "1.000100", new Error("boom"), "delivery", ask);
      const { blocks } = failurePost(posting);
      assert.deepEqual(blocks.map((b) => b.type), ["section", "context"], String(ask?.length));
    }
  });
});

describe("Try again", () => {
  it("honours only the person who asked: anyone else is told to ask it themselves", async () => {
    const d = door();
    const value = retryValue("U0000001", QUESTION);
    await runTryAgainDoor({ userId: "U0000002", channel: "C1", messageTs: "1.000200", threadTs: "1.000100", value }, d.deps);
    assert.deepEqual([d.posted, d.queued], [[], []]);
    assert.deepEqual(d.ephemeral, ["Only <@U0000001> can retry this — ask it yourself."]);

    const asker = door();
    await runTryAgainDoor({ userId: "U0000001", channel: "C1", messageTs: "1.000200", threadTs: "1.000100", value }, asker.deps);
    assert.equal(asker.queued[0]?.user, "U0000001");
    assert.equal(asker.queued[0]?.text, QUESTION);
    assert.deepEqual(asker.ephemeral, []);
  });

  it("the failure's button carries the asker, and still fits Slack's value", async () => {
    const posting = recordingPosting();
    await postVisibleFailure(posting.deps(), "C1", "1.000100", "1.000100", new Error("boom"), "agent", retryValue("U0000001", QUESTION));
    const { blocks } = failurePost(posting);
    const value = String(blocks.at(-1)!.elements[0].value);
    const d = door();
    await runTryAgainDoor({ userId: "U0000003", channel: "C1", messageTs: "1.000200", value }, d.deps);
    assert.match(d.ephemeral[0] ?? "", /Only <@U0000001>/);
  });

  it("asks the question again in the failure's thread, as the presser's own message", async () => {
    const d = door();
    await runTryAgainDoor({ userId: "U0000002", channel: "C1", messageTs: "1.000200", threadTs: "1.000100", value: QUESTION }, d.deps);

    assert.equal(d.posted.length, 1);
    assert.equal(d.posted[0]!.thread_ts, "1.000100", "under the failure, in its thread");
    assert.match(d.posted[0]!.text, /<@U0000002>/);
    assert.equal(d.queued.length, 1);
    assert.deepEqual(d.queued[0], { type: "message", channel: "C1", user: "U0000002", text: QUESTION, ts: "9.000001", thread_ts: "1.000100" });
  });

  it("starts a thread under the line when the failure sat at channel level", async () => {
    const d = door();
    await runTryAgainDoor({ userId: "U0000002", channel: "D1", messageTs: "1.000200", value: QUESTION }, d.deps);
    assert.equal(d.posted[0]!.thread_ts, undefined);
    assert.equal(d.queued[0]!.thread_ts, "9.000001");
  });

  it("runs nothing without a question, and nothing when the line did not land", async () => {
    const empty = door();
    await runTryAgainDoor({ userId: "U0000002", channel: "C1", messageTs: "1.000200", value: "" }, empty.deps);
    assert.deepEqual([empty.posted, empty.queued], [[], []]);

    const silent = door();
    await runTryAgainDoor(
      { userId: "U0000002", channel: "C1", messageTs: "1.000200", value: QUESTION },
      { ...silent.deps, post: async () => null },
    );
    assert.deepEqual(silent.queued, []);
  });
});
