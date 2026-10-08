// A substantive answer ends with Slack's feedback buttons: a `context_actions`
// row holding one `feedback_buttons` element, beneath the footer.
//
// Driven on the recording posting client, which holds every post to the block
// rules Slack holds it to — `context_actions` among them — and through the
// Delivery adapter, which is where the turn's id is put on the buttons. The
// shape was posted live in Bill's DM on 2026-10-08.
//
// The buttons are the newest block in the message, so they are the first thing
// a refusal drops: the answer posts without them, and never goes without.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { postTextVerified } from "../src/slack/delivery";
import { deliveryAdapter, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import { FEEDBACK_ACTION_ID, feedbackOf } from "../src/slack/feedback";
import { MAX_POST_CHARS } from "../src/slack/answer-posts";
import type { Chart } from "../src/turn/chart";
import { expectRefusals, recordingPosting, recordingSlack } from "./helpers/recording-slack";

const RECIPIENT = { userId: "U1", team: "T1" };
const ANSWER =
  "**Three cards are in review.** Tutor import, Session prep and Day-of view, all on the " +
  "[Roadmap](https://www.notion.so/roadmap), with Bill owning two of them and Bryan one.";
const FEEDBACK = { turnId: "C1:1700000000.000100" };

type Block = { type: string; elements?: Array<Record<string, unknown>> };

/** Run `fn` collecting `console.warn` lines instead of printing them. */
async function warnings<T>(fn: () => Promise<T>): Promise<{ result: T; lines: string[] }> {
  const orig = console.warn;
  const lines: string[] = [];
  console.warn = (...args: unknown[]) => void lines.push(args.map(String).join(" "));
  try {
    return { result: await fn(), lines };
  } finally {
    console.warn = orig;
  }
}

function blocksOf(message: { blockList?: unknown[] } | undefined): Block[] {
  return (message?.blockList ?? []) as Block[];
}

describe("an answer's feedback buttons", () => {
  it("ride beneath the footer, as one feedback_buttons element", async () => {
    const slack = recordingPosting();
    await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", ANSWER, RECIPIENT, undefined, {
      feedback: FEEDBACK,
    });

    const blocks = blocksOf(slack.of("message")[0]);
    assert.deepEqual(blocks.map((b) => b.type), ["markdown", "context", "context_actions"]);
    const [element] = blocks[2]!.elements!;
    assert.equal(element!.type, "feedback_buttons");
    assert.equal(element!.action_id, FEEDBACK_ACTION_ID);
  });

  it("carry the turn on each button, so a tap is tied to the ask it answered", async () => {
    const slack = recordingPosting();
    await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", ANSWER, RECIPIENT, undefined, {
      feedback: FEEDBACK,
    });

    const element = blocksOf(slack.of("message")[0])[2]!.elements![0]!;
    const value = (button: string) => String((element[button] as { value: string }).value);
    assert.deepEqual(feedbackOf(value("positive_button")), { rating: "up", turnId: FEEDBACK.turnId });
    assert.deepEqual(feedbackOf(value("negative_button")), { rating: "down", turnId: FEEDBACK.turnId });
  });

  it("are not offered under an acknowledgement", async () => {
    const slack = recordingPosting();
    await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", "Got it, cancelled.", RECIPIENT, undefined, {
      feedback: FEEDBACK,
    });

    assert.equal(slack.of("message")[0]!.blocks, true);
    assert.deepEqual(blocksOf(slack.of("message")[0]).map((b) => b.type), ["markdown"]);
  });

  it("are not offered under a draft that goes out under the person's name", async () => {
    const slack = recordingPosting();
    await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", ANSWER, RECIPIENT, "draft", {
      feedback: FEEDBACK,
    });

    assert.ok(!blocksOf(slack.of("message")[0]).some((b) => b.type === "context_actions"));
  });

  it("ride the last part of a split answer only", async () => {
    const para = (i: number) => `Paragraph ${i}: ${"word ".repeat(60).trimEnd()}`;
    const long = Array.from({ length: 48 }, (_, i) => para(i)).join("\n\n");
    assert.ok(long.length > MAX_POST_CHARS);
    const slack = recordingPosting();
    await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", long, RECIPIENT, undefined, {
      feedback: FEEDBACK,
    });

    const posts = slack.of("message");
    assert.ok(posts.length > 1);
    const carrying = posts.filter((p) => blocksOf(p).some((b) => b.type === "context_actions"));
    assert.deepEqual(carrying, [posts.at(-1)]);
  });

  it("are dropped, and nothing else, when Slack refuses them", async () => {
    const slack = recordingPosting({ refusesBlockTypes: ["context_actions"] });
    const { result, lines } = await warnings(() =>
      postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", ANSWER, RECIPIENT, undefined, {
        feedback: FEEDBACK,
      }),
    );
    expectRefusals(slack.refused);

    assert.equal(result.ok, true);
    const posts = slack.of("message");
    assert.equal(posts.length, 2);
    assert.deepEqual(blocksOf(posts[1]).map((b) => b.type), ["markdown", "context"]);
    assert.ok(lines.some((l) => /feedback buttons refused/.test(l)));
  });

  const chart: Chart = {
    kind: "bar",
    title: "Cards by Design Status",
    lookup: "notion_query",
    groupBy: "Design Status",
    measure: null,
    points: [
      { label: "WIP", value: 3 },
      { label: "Done", value: 2 },
    ],
    valueLabel: "Cards",
    groupLabel: "Design Status",
    total: 5,
  };

  it("stay aboard when Slack points at a chart instead: the chart steps down, the buttons keep", async () => {
    const slack = recordingPosting({ refusesBlockTypes: ["data_visualization"] });
    const { result, lines } = await warnings(() =>
      postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", ANSWER, RECIPIENT, undefined, {
        presentation: { charts: [chart] },
        feedback: FEEDBACK,
      }),
    );
    expectRefusals(slack.refused);

    assert.equal(result.ok, true);
    const posts = slack.of("message");
    assert.equal(posts.length, 2);
    assert.deepEqual(blocksOf(posts[1]).map((b) => b.type), ["markdown", "context", "context_actions"]);
    assert.match(posts[1]!.text, /Cards by Design Status/);
    assert.ok(!lines.some((l) => /feedback buttons refused/.test(l)));
  });

  it("are dropped alone when Slack points at them, and the chart stays", async () => {
    const slack = recordingPosting({ refusesBlockTypes: ["context_actions"] });
    const { result } = await warnings(() =>
      postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", ANSWER, RECIPIENT, undefined, {
        presentation: { charts: [chart] },
        feedback: FEEDBACK,
      }),
    );
    expectRefusals(slack.refused);

    assert.equal(result.ok, true);
    const posts = slack.of("message");
    assert.equal(posts.length, 2);
    assert.deepEqual(blocksOf(posts[1]).map((b) => b.type), ["markdown", "data_visualization", "context"]);
  });

  it("are left off a post with no turn to tie them to", async () => {
    const slack = recordingPosting();
    await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", ANSWER, RECIPIENT);

    assert.deepEqual(blocksOf(slack.of("message")[0]).map((b) => b.type), ["markdown", "context"]);
  });
});

describe("a streamed answer's feedback buttons", () => {
  it("ride the stream's stop, beneath the footer, and nothing is posted beside it", async () => {
    const slack = recordingPosting();
    const posted = await postTextVerified(slack.deps(), "C1", "100.1", ANSWER, RECIPIENT, undefined, { feedback: FEEDBACK });

    assert.equal(posted.ok, true);
    assert.equal(slack.of("message").length, 0);
    const stops = slack.of("stopStream");
    assert.equal(stops.length, 1);
    assert.deepEqual(blocksOf(stops[0]).map((b) => b.type), ["context", "context_actions"]);
    assert.equal(blocksOf(stops[0])[1]!.elements![0]!.type, "feedback_buttons");
  });

  it("are dropped from a refused stop, which stops again without them and never re-posts the answer", async () => {
    const slack = recordingPosting({ refusesBlockTypes: ["context_actions"] });
    const { result, lines } = await warnings(() =>
      postTextVerified(slack.deps(), "C1", "100.1", ANSWER, RECIPIENT, undefined, { feedback: FEEDBACK }),
    );
    expectRefusals(slack.refused);

    assert.equal(result.ok, true);
    assert.equal(slack.of("message").length, 0, "the streamed answer is not posted a second time");
    const stops = slack.of("stopStream");
    assert.deepEqual(stops.map((s) => blocksOf(s).map((b) => b.type)), [["context", "context_actions"], ["context"]]);
    assert.ok(lines.some((l) => /feedback buttons refused/.test(l)));
  });

  it("stay off a streamed first part of a split answer, and ride its last", async () => {
    const para = (i: number) => `Paragraph ${i}: ${"word ".repeat(60).trimEnd()}`;
    const long = Array.from({ length: 48 }, (_, i) => para(i)).join("\n\n");
    const slack = recordingPosting();
    await postTextVerified(slack.deps(), "C1", "100.1", long, RECIPIENT, undefined, { feedback: FEEDBACK });

    assert.ok(!blocksOf(slack.of("stopStream")[0]).some((b) => b.type === "context_actions"));
    const posts = slack.of("message");
    assert.ok(blocksOf(posts.at(-1)).some((b) => b.type === "context_actions"));
  });
});

describe("the Delivery adapter", () => {
  it("hands the posting path the turn the answer belongs to", async () => {
    const target: SlackDeliveryTarget = {
      channel: "C1",
      replyTs: "1700000000.000100",
      userMsgTs: "1700000000.000100",
      userId: "U1",
      team: "T1",
    };
    const slack = recordingSlack();
    await deliveryAdapter(slack.deps(), target).postAnswer(ANSWER);

    const answer = slack.calls.find((c) => c.kind === "answer") as { feedback?: unknown } | undefined;
    assert.deepEqual(answer?.feedback, { turnId: "C1:1700000000.000100" });
  });
});
