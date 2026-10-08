// A posted answer carries the model's Markdown in a `markdown` block, so a
// table reaches the reader as a table — header row and all — on every post
// path: channel answers, continuation parts, and every answer while streaming
// is off. The `section` blocks it used to post turned each table into
// `• a — b — c` lines and dropped the header.
//
// If Slack refuses the block, the answer steps down: `section` blocks with the
// footer, then bare text. The person always gets the answer.
//
// Driven on the recording posting client, which holds every post to the block
// shape rules Slack holds it to.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { postTextVerified } from "../src/slack/delivery";
import { MAX_POST_CHARS } from "../src/slack/answer-posts";
import { sanitizeSlackBlocks } from "../src/slack/mrkdwn";
import { expectRefusals, recordingPosting } from "./helpers/recording-slack";

const RECIPIENT = { userId: "U1", team: "T1" };

const TABLE_ANSWER = [
  "Three cards are in review:",
  "",
  "| Card | Status | Owner |",
  "|---|---|---|",
  "| Tutor import | In review | Bill |",
  "| Session prep | In review | Bryan |",
  "| Day-of view | In review | Bill |",
  "",
  "From the [Roadmap](https://www.notion.so/roadmap).",
].join("\n");

/** Run `fn` collecting `console.warn` lines instead of printing them. */
async function warnings<T>(fn: () => Promise<T>): Promise<{ result: T; lines: string[] }> {
  const orig = console.warn;
  const lines: string[] = [];
  console.warn = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  try {
    return { result: await fn(), lines };
  } finally {
    console.warn = orig;
  }
}

/** Paragraphs long enough that the answer splits into continuation parts. */
function longAnswer(): string {
  const para = (i: number) => `Paragraph ${i}: ${"word ".repeat(60).trimEnd()}`;
  const head = Array.from({ length: 24 }, (_, i) => para(i));
  const tail = Array.from({ length: 24 }, (_, i) => para(i + 24));
  return [...head, TABLE_ANSWER, ...tail].join("\n\n");
}

type Block = { type: string; text?: unknown; elements?: unknown };

/** The `i`th item, which the test requires to be there. */
function at<T>(list: readonly T[], i: number): T {
  const item = list[i];
  assert.ok(item !== undefined, `expected an item at ${i} of ${list.length}`);
  return item;
}

/** A recorded post's blocks. */
const blocksOf = (call: { blockList?: unknown[] }) => (call.blockList ?? []) as Block[];

describe("a posted answer", () => {
  it("reaches Slack inside a markdown block, its table's header row intact", async () => {
    const slack = recordingPosting();
    const posted = await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", TABLE_ANSWER, RECIPIENT);

    assert.equal(posted.ok, true);
    const answer = at(blocksOf(at(slack.of("message"), 0)), 0);
    assert.equal(answer.type, "markdown");
    assert.equal(answer.text, TABLE_ANSWER, "the model's Markdown, as written");
    assert.match(String(answer.text), /\| Card \| Status \| Owner \|/);
  });

  it("keeps the text copy the full part", async () => {
    const slack = recordingPosting();
    await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", TABLE_ANSWER, RECIPIENT);

    assert.equal(at(slack.of("message"), 0).text, TABLE_ANSWER);
  });

  it("carries the footer beneath the markdown block", async () => {
    const slack = recordingPosting();
    await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", TABLE_ANSWER, RECIPIENT);

    const types = blocksOf(at(slack.of("message"), 0)).map((b) => b.type);
    assert.deepEqual(types, ["markdown", "context"]);
  });

  it("is the same at channel level, where no stream can open", async () => {
    const slack = recordingPosting();
    await postTextVerified(slack.deps(), "C1", undefined, TABLE_ANSWER, RECIPIENT);

    assert.equal(slack.of("startStream").length, 0);
    assert.equal(at(blocksOf(at(slack.of("message"), 0)), 0).type, "markdown");
  });
});

describe("a split answer", () => {
  it("posts every part in a markdown block, and the footer on the last part only", async () => {
    const slack = recordingPosting();
    await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", longAnswer(), RECIPIENT);

    const messages = slack.of("message");
    assert.ok(messages.length > 1, "the answer split");
    messages.forEach((message, i) => {
      const types = blocksOf(message).map((b) => b.type);
      const last = i === messages.length - 1;
      assert.deepEqual(types, last ? ["markdown", "context"] : ["markdown"], `part ${i + 1}`);
      assert.equal(at(blocksOf(message), 0).text, message.text, `part ${i + 1}'s text copy is the whole part`);
    });
    const holder = messages.find((m) => m.text.includes("| Card | Status | Owner |"));
    assert.ok(holder, "the table's header row reached a part");
  });
});

describe("the streamed first part", () => {
  it("still streams the Markdown and posts nothing", async () => {
    const slack = recordingPosting();
    await postTextVerified(slack.deps(), "C1", "100.1", TABLE_ANSWER, RECIPIENT);

    assert.deepEqual(
      slack.of("appendStream").map((c) => c.text),
      [TABLE_ANSWER],
    );
    assert.equal(slack.of("message").length, 0);
  });
});

describe("the fallback ladder", () => {
  it("steps down to section blocks with the footer when Slack refuses the markdown block", async () => {
    const slack = recordingPosting({ refusesBlockTypes: ["markdown"] });
    const { result, lines } = await warnings(() =>
      postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", TABLE_ANSWER, RECIPIENT),
    );
    expectRefusals(slack.refused);

    assert.equal(result.ok, true);
    const first = at(slack.of("message"), 0);
    const second = at(slack.of("message"), 1);
    assert.equal(at(blocksOf(first), 0).type, "markdown");
    const types = blocksOf(second).map((b) => b.type);
    assert.equal(types.at(-1), "context", "the footer rides the fallback");
    assert.ok(types.slice(0, -1).every((t) => t === "section"));
    assert.equal(second.text, TABLE_ANSWER);
    assert.equal(slack.of("message").length, 2);
    assert.ok(
      lines.some((l) => /markdown block refused/.test(l) && /invalid_blocks/.test(l)),
      `logged the step down with Slack's detail: ${lines.join(" / ")}`,
    );
  });

  it("cuts a full-size part into sections that each fit, when the markdown block is refused", async () => {
    const slack = recordingPosting({ refusesBlockTypes: ["markdown"] });
    const body = Array.from({ length: 50 }, (_, i) => `Paragraph ${i}: ${"word ".repeat(40).trimEnd()}`).join("\n\n");
    assert.ok(body.length > 10_000 && body.length < MAX_POST_CHARS, `body was ${body.length} chars`);
    const { result } = await warnings(() =>
      postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", body, RECIPIENT),
    );
    expectRefusals(slack.refused);

    assert.equal(result.ok, true);
    const fallback = at(slack.of("message"), 1);
    const sections = blocksOf(fallback).filter((b) => b.type === "section");
    assert.ok(sections.length > 1, "a full-size part needs several sections");
    // The strict fake has already held each to 3,000 chars and the message to
    // 50 blocks; this pins that the part reached Slack whole.
    assert.equal(fallback.text, body);
  });

  it("steps down to bare text when the section blocks are refused too", async () => {
    const slack = recordingPosting({ refusesBlockTypes: ["markdown", "section"] });
    const { result, lines } = await warnings(() =>
      postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", TABLE_ANSWER, RECIPIENT),
    );
    expectRefusals(slack.refused);

    assert.equal(result.ok, true);
    const messages = slack.of("message");
    assert.equal(messages.length, 3);
    assert.equal(at(messages, 2).blocks, false, "the last rung carries no blocks");
    assert.equal(at(messages, 2).text, TABLE_ANSWER);
    assert.ok(lines.some((l) => /markdown block refused/.test(l)));
    assert.ok(
      lines.some((l) => /section blocks refused/.test(l) && /invalid_blocks/.test(l)),
      `logged the second step down: ${lines.join(" / ")}`,
    );
  });

  it("goes straight to bare text when the refusal is not about the blocks", async () => {
    for (const error of ["ratelimited", "channel_not_found"]) {
      const slack = recordingPosting({ postFailsWith: { error } });
      const { result } = await warnings(() =>
        postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", TABLE_ANSWER, RECIPIENT),
      );

      assert.equal(result.ok, false);
      const messages = slack.of("message");
      assert.equal(messages.length, 2, `${error}: a doomed post costs two calls, not three`);
      assert.equal(at(blocksOf(at(messages, 0)), 0).type, "markdown");
      assert.equal(at(messages, 1).blocks, false, `${error}: the second call is bare text`);
    }
  });

  it("treats invalid_arguments as a block refusal only when Slack points into /blocks", async () => {
    const intoBlocks = recordingPosting({
      postFailsWith: { error: "invalid_arguments", messages: ["[ERROR] must be a valid block [json-pointer:/blocks/0]"] },
    });
    await warnings(() =>
      postTextVerified(intoBlocks.deps({ streamingOn: false }), "C1", "100.1", TABLE_ANSWER, RECIPIENT),
    );
    assert.equal(intoBlocks.of("message").length, 3, "every rung is tried");

    const elsewhere = recordingPosting({
      postFailsWith: { error: "invalid_arguments", messages: ["[ERROR] missing required field [json-pointer:/channel]"] },
    });
    await warnings(() =>
      postTextVerified(elsewhere.deps({ streamingOn: false }), "C1", "100.1", TABLE_ANSWER, RECIPIENT),
    );
    assert.equal(elsewhere.of("message").length, 2, "straight to bare text");
  });
});

describe("the markup pass over a markdown block", () => {
  it("leaves the Markdown exactly as written, tags in fences included", () => {
    const text = [
      "| a | b |",
      "|---|---|",
      "| x & y | 1 < 2 |",
      "",
      "Ask <@teammate> or <@U0ASFR2RJ9W>, see <https://example.com|the doc> -> **done**",
      "> quoted",
      "```jsx",
      '<Button variant="primary">Save</Button>',
      "```",
    ].join("\n");
    const block = at(sanitizeSlackBlocks([{ type: "markdown", text }]) as Array<{ text: string }>, 0);

    assert.equal(block.text, text, "Slack shows an escaped entity as written, so nothing is escaped");
  });
});
