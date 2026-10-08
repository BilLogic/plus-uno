// The recording Slack clients refuse a block real Slack would refuse.
//
// Every live failure so far was a payload the fake accepted. These drive the
// two recording clients directly with shapes Slack's own validator refused, and
// with the shapes the Worker sends today, so the rules in
// `helpers/slack-block-rules.ts` are held from both sides.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { expectRefusals, recordingPosting, recordingSlack } from "./helpers/recording-slack";
import { planBlock } from "../src/slack/plan-block";
import { textSections } from "../src/slack/render";

const section = (text: string) => ({ type: "section", text: { type: "mrkdwn", text } });
const markdown = (text: string) => ({ type: "markdown", text });
const footer = { type: "context", elements: [{ type: "mrkdwn", text: "LLM-written · check before acting" }] };
const card = (extra: Record<string, unknown> = {}) => ({
  type: "task_card",
  task_id: "t1",
  title: "Reading Notion",
  status: "complete",
  ...extra,
});
const plan = (tasks: unknown[]) => ({ type: "plan", title: "Working on it", tasks });

/** Post one set of blocks through each client that takes a message's blocks,
 *  and say what each refused. */
async function verdicts(blocks: unknown[]): Promise<string[]> {
  const slack = recordingSlack();
  const posting = recordingPosting();
  const posted = await slack.client.postMessage({ channel: "C1", text: "t", blocks });
  await slack.client.updateMessage({ channel: "C1", ts: "1.1", text: "t", blocks });
  const viaPosting = await posting.client.postMessage({ channel: "C1", text: "t", blocks: blocks as Array<Record<string, unknown>> });
  const refused = [...expectRefusals(slack.refused), ...expectRefusals(posting.refused)].map((r) => r.error);
  if (refused.length) {
    assert.equal(posted.ok, false, "a refused post does not land");
    assert.equal(viaPosting.ok, false, "a refused post does not land");
  }
  return refused;
}

describe("the strict fake refuses what Slack refuses", () => {
  it("accepts the shapes the Worker sends today", async () => {
    const answer = [...textSections("**Status** — two cards are *in review*."), footer];
    const checklist = [planBlock("Working on it", [{ id: "t1", title: "Reading Notion", status: "complete", output: "4 pages" }])];
    for (const blocks of [answer, checklist, [markdown("| a | b |\n|---|---|\n| 1 | 2 |"), footer]]) {
      assert.deepEqual(await verdicts(blocks), []);
    }
  });

  it("refuses a section over 3,000 chars", async () => {
    assert.deepEqual(await verdicts([section("a".repeat(3000))]), []);
    assert.deepEqual(await verdicts([section("a".repeat(3001))]), ["invalid_blocks", "invalid_blocks", "invalid_blocks"]);
  });

  it("refuses markdown over 12,000 chars across one message", async () => {
    assert.deepEqual(await verdicts([markdown("a".repeat(12_000))]), []);
    assert.equal((await verdicts([markdown("a".repeat(6_001)), markdown("a".repeat(6_000))])).length, 3);
  });

  it("refuses a message over 50 blocks", async () => {
    assert.deepEqual(await verdicts(Array.from({ length: 50 }, () => section("x"))), []);
    assert.equal((await verdicts(Array.from({ length: 51 }, () => section("x")))).length, 3);
  });

  it("refuses a block type the Worker never sends", async () => {
    assert.equal((await verdicts([{ type: "bogus_block" }])).length, 3);
    assert.equal((await verdicts([{ type: "carousel" }])).length, 3);
  });

  it("refuses a context with no elements or more than ten", async () => {
    assert.equal((await verdicts([{ type: "context", elements: [] }])).length, 3);
    const eleven = Array.from({ length: 11 }, () => ({ type: "mrkdwn", text: "x" }));
    assert.equal((await verdicts([{ type: "context", elements: eleven }])).length, 3);
  });

  it("refuses a plan or card without a title, and a card status Slack does not take", async () => {
    assert.equal((await verdicts([{ type: "plan", tasks: [card()] }])).length, 3);
    assert.equal((await verdicts([plan([{ type: "task_card", task_id: "t1", status: "complete" }])])).length, 3);
    assert.equal((await verdicts([plan([card({ status: "pending" })])])).length, 3);
    assert.equal((await verdicts([plan([card({ status: "done" })])])).length, 3);
  });

  it("takes a card icon only as a named Slack icon", async () => {
    for (const name of ["globe", "book", "map", "code", "comment", "folder", "cube", "image"]) {
      assert.deepEqual(await verdicts([plan([card({ icon: { type: "icon", name } })])]), [], name);
    }
    for (const icon of [
      { type: "icon", name: "https://example.test/notion.png" },
      { type: "icon", url: "https://example.test/notion.png" },
      { type: "icon", name: "globe", url: "https://example.test/notion.png" },
      { type: "image", image_url: "https://example.test/notion.png", alt_text: "Notion" },
      { type: "emoji", name: "globe_with_meridians" },
      { type: "icon", name: "zzz_nope" },
      ...["call", "email", "file", "link", "user"].map((name) => ({ type: "icon", name })),
      "globe",
    ]) {
      assert.equal((await verdicts([plan([card({ icon })])])).length, 3, JSON.stringify(icon));
    }
  });

  it("holds the stop's footer blocks to the same rules", async () => {
    const posting = recordingPosting();
    assert.equal(await posting.client.stopStream("C1", "stream-1", [footer]), true);
    const other = recordingPosting();
    assert.equal(await other.client.stopStream("C1", "stream-2", [{ type: "bogus_block" }]), false);
    assert.equal(expectRefusals(other.refused).length, 1);
  });
});

describe("the stream fake takes a named icon on a task", () => {
  // Any shape at all, past the type: judging it is the fake's job here.
  const task = (icon: unknown) => ({ id: "t1", title: "Reading Notion", status: "in_progress" as const, icon: icon as never });

  it("lands a card with a named Slack icon", async () => {
    const slack = recordingSlack();
    await slack.client.appendTasks("C1", "stream-1", [task({ type: "icon", name: "book" })]);
    assert.equal(slack.landed.length, 1);
  });

  it("refuses an icon given as a URL, an image, an emoji or an unknown name", async () => {
    for (const icon of [
      "https://example.test/notion.png",
      { type: "icon", url: "https://example.test/notion.png" },
      { type: "image", image_url: "https://example.test/notion.png", alt_text: "Notion" },
      { type: "emoji", name: "books" },
      { type: "icon", name: "link" },
    ]) {
      const slack = recordingSlack();
      await slack.client.appendTasks("C1", "stream-1", [task(icon)]);
      assert.deepEqual(expectRefusals(slack.refused).map((r) => r.error), ["invalid_arguments"], JSON.stringify(icon));
      assert.equal(slack.landed.length, 0);
    }
  });
});
