// The links an answer read fold into a closed "Sources (n)" box beneath it,
// built by code from the turn's card sources, and every answer posts with link
// previews off.
//
// Driven across `runTurn` on the Turn harness — the real loop, whose finished
// lookups carry the links their readouts found — then the presentation
// Delivery was handed is posted on the recording posting client, which holds
// every post to the block rules Slack holds it to.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runTurn, type DeliveryCall, type Presentation } from "../src/turn/index";
import { postTextVerified } from "../src/slack/delivery";
import { harness, request } from "./helpers/turn-harness";
import { expectRefusals, recordingPosting, type RecordingPostingOptions } from "./helpers/recording-slack";

const PROSE = "**Three pages cover onboarding.** The clearance page is the newest.";

/** A Notion search that found these pages. */
function notionResult(urls: readonly string[]): string {
  return JSON.stringify({
    ok: true,
    count: urls.length,
    results: urls.map((url, i) => ({ title: `Page ${i + 1}`, url })),
  });
}

const notion = (n: number) => Array.from({ length: n }, (_, i) => `https://www.notion.so/page-${i + 1}`);

/** Run one turn whose lookups return these results, in order, and hand back
 *  what Delivery was handed beneath the answer. */
async function turn(results: Array<{ name: string; result: string }>): Promise<Presentation | undefined> {
  let at = 0;
  const h = harness({
    replies: [
      ...results.map((r) => ({ toolCalls: [{ name: r.name, args: { query: "onboarding" } }] })),
      { text: PROSE },
    ],
    toolResultFor: () => results[at++]!.result,
  });
  await runTurn(request({ text: "where is onboarding written up?" }), h.deps);
  const answer = h.delivery.calls.find((c): c is Extract<DeliveryCall, { kind: "answer" }> => c.kind === "answer");
  assert.ok(answer, "an answer was posted");
  return answer.presentation;
}

type Block = { type: string; text?: string; title?: { type: string; text: string }; child_blocks?: Block[]; [k: string]: unknown };

/** Post the prose and its presentation as the Slack path does. */
async function post(presentation: Presentation | undefined, opts: RecordingPostingOptions = {}) {
  const slack = recordingPosting(opts);
  const result = await postTextVerified(
    slack.deps({ streamingOn: false }),
    "C1",
    "100.1",
    PROSE,
    { userId: "U1", team: "T1" },
    undefined,
    presentation ? { presentation } : {},
  );
  const messages = slack.of("message");
  const last = messages.at(-1)!;
  const blocks = (last.blockList ?? []) as Block[];
  // The footer is the prose's to earn, box or no box.
  const types = blocks.map((b) => b.type).filter((t) => t !== "context");
  return { slack, result, messages, last, blocks, types, box: blocks.find((b) => b.type === "container") };
}

test("three links read make a closed Sources (3) box beneath the answer, each one linked", async () => {
  const presentation = await turn([{ name: "notion_search", result: notionResult(notion(3)) }]);
  const { types, box } = await post(presentation);

  assert.deepEqual(types, ["markdown", "container"]);
  assert.ok(box);
  assert.deepEqual(box.title, { type: "plain_text", text: "Sources (3)" });
  assert.equal(box.is_collapsible, true);
  assert.equal(box.default_collapsed, true);
  const links = JSON.stringify(box.child_blocks);
  for (const [i, url] of notion(3).entries()) {
    assert.ok(links.includes(`{"type":"link","url":"${url}","text":"Page ${i + 1}"}`), `page ${i + 1} is linked`);
  }
});

test("links from several lookups gather into one box, each once, in the order they were read", async () => {
  const presentation = await turn([
    { name: "notion_search", result: notionResult(notion(2)) },
    { name: "notion_search", result: notionResult([...notion(2), "https://www.notion.so/page-9"]) },
  ]);
  const { box } = await post(presentation);

  assert.deepEqual(box!.title, { type: "plain_text", text: "Sources (3)" });
  const links = JSON.stringify(box!.child_blocks);
  assert.ok(links.indexOf("page-1") < links.indexOf("page-2") && links.indexOf("page-2") < links.indexOf("page-9"));
});

test("the title is the count alone, with no freshness suffix", async () => {
  const { box } = await post(await turn([{ name: "notion_search", result: notionResult(notion(4)) }]));

  assert.equal(box!.title!.text, "Sources (4)");
});

test("fewer than three links make no box", async () => {
  for (const n of [0, 1, 2]) {
    const { types } = await post(await turn([{ name: "notion_search", result: notionResult(notion(n)) }]));

    assert.deepEqual(types, ["markdown"], `${n} links`);
  }
});

test("only links the thread may see are counted: a page from the open web does not make a third", async () => {
  const presentation = await turn([
    { name: "notion_search", result: notionResult(notion(2)) },
    { name: "notion_search", result: notionResult(["https://example.com/blog"]) },
  ]);
  const { blocks } = await post(presentation);

  assert.equal(blocks.some((b) => b.type === "container"), false);
});

test("an answer posts with link previews off", async () => {
  for (const presentation of [undefined, await turn([{ name: "notion_search", result: notionResult(notion(3)) }])]) {
    const { messages } = await post(presentation);

    for (const m of messages) {
      assert.equal(m.unfurlLinks, false);
      assert.equal(m.unfurlMedia, false);
    }
  }
});

test("a refused box steps down to the plain rung: the answer posts, its links listed in the text", async () => {
  const presentation = await turn([{ name: "notion_search", result: notionResult(notion(3)) }]);
  const { slack, result, messages, last, blocks, types } = await post(presentation, { refusesBlockTypes: ["container"] });
  assert.deepEqual(expectRefusals(slack.refused).map((r) => r.call), ["post with a container block"]);

  assert.equal(result.ok, true);
  assert.equal(messages.length, 2, "the boxed post, then the plain rung");
  assert.deepEqual(types, ["markdown"]);
  assert.match(blocks[0]!.text!, /^\*\*Three pages cover onboarding\.\*\*/);
  assert.match(blocks[0]!.text!, /Sources: \[Page 1\]\(https:\/\/www\.notion\.so\/page-1\) · \[Page 2\]/);
  assert.equal(last.unfurlLinks, false);
});

test("the thread remembers the links: the text copy lists them", async () => {
  const { result, last } = await post(await turn([{ name: "notion_search", result: notionResult(notion(3)) }]));

  assert.match(result.text, /Sources: \[Page 1\]\(https:\/\/www\.notion\.so\/page-1\)/);
  assert.equal(last.text, result.text);
});
