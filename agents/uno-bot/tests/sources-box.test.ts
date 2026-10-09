// The links an answer used fold into a closed "Sources (n)" box beneath it,
// built by code from the turn's card sources, and every answer posts with link
// previews off.
//
// "Used" is the board or page a lookup queried, once, and the rows the prose
// names. Live on r515 a Roadmap status answer's box listed ten cards its
// lookups happened to read and the prose never mentioned: a lookup's every row
// is what it read, not what the answer stands on.
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

const PROSE = "**Three pages cover onboarding.** Page 1, Page 2 and Page 3 cover it; Page 3 is the newest.";

/** A Notion search that found these pages. */
function notionResult(urls: readonly string[]): string {
  return JSON.stringify({
    ok: true,
    count: urls.length,
    results: urls.map((url, i) => ({ title: `Page ${i + 1}`, url })),
  });
}

const notion = (n: number) => Array.from({ length: n }, (_, i) => `https://www.notion.so/page-${i + 1}`);

/** Run one turn whose lookups return these results, in order, and whose model
 *  answers with this prose; hand back what Delivery was handed beneath it. */
async function turn(results: Array<{ name: string; result: string }>, prose = PROSE): Promise<Presentation | undefined> {
  let at = 0;
  const h = harness({
    replies: [
      ...results.map((r) => ({ toolCalls: [{ name: r.name, args: { query: "onboarding" } }] })),
      { text: prose },
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
async function post(presentation: Presentation | undefined, opts: RecordingPostingOptions = {}, prose = PROSE) {
  const slack = recordingPosting(opts);
  const result = await postTextVerified(
    slack.deps({ streamingOn: false }),
    "C1",
    "100.1",
    prose,
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

/** Run the turn and post its answer, the same prose both times. */
async function answer(results: Array<{ name: string; result: string }>, prose = PROSE) {
  return post(await turn(results, prose), {}, prose);
}

/** The links a box lists, in order. */
const linksIn = (box: Block | undefined): string[] =>
  [...JSON.stringify(box?.child_blocks ?? []).matchAll(/"url":"([^"]+)"/g)].map((m) => m[1]!);

test("three links the prose names make a closed Sources (3) box beneath the answer, each one linked", async () => {
  const { types, box } = await answer([{ name: "notion_search", result: notionResult(notion(3)) }]);

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
  const { box } = await answer(
    [
      { name: "notion_search", result: notionResult(notion(2)) },
      { name: "notion_search", result: notionResult([...notion(2), "https://www.notion.so/page-9"]) },
    ],
    "Page 1, Page 2 and [the archive](https://www.notion.so/page-9) cover it.",
  );

  assert.deepEqual(box!.title, { type: "plain_text", text: "Sources (3)" });
  assert.deepEqual(linksIn(box), [...notion(2), "https://www.notion.so/page-9"]);
});

test("the title is the count alone, with no freshness suffix", async () => {
  const { box } = await answer(
    [{ name: "notion_search", result: notionResult(notion(4)) }],
    "Page 1, Page 2, Page 3 and Page 4 cover it.",
  );

  assert.equal(box!.title!.text, "Sources (4)");
});

test("rows the prose never names are not sources: a search's every hit is what it read, not what the answer used", async () => {
  const { box } = await answer(
    [{ name: "notion_search", result: notionResult(notion(8)) }],
    "**Onboarding is written up in three places.** Page 2, Page 5 and Page 8 are the ones to read.",
  );

  assert.deepEqual(linksIn(box), ["https://www.notion.so/page-2", "https://www.notion.so/page-5", "https://www.notion.so/page-8"]);
});

test("a name is matched whole: Page 1 is not named by Page 10", async () => {
  const urls = Array.from({ length: 12 }, (_, i) => `https://www.notion.so/page-${i + 1}`);
  const { box } = await answer(
    [{ name: "notion_search", result: notionResult(urls) }],
    "Page 10, Page 11 and Page 12 are the newest.",
  );

  assert.deepEqual(linksIn(box), urls.slice(9));
});

test("one or two links the prose already carries make no box", async () => {
  for (const n of [1, 2]) {
    const prose = notion(n).map((url, i) => `[Page ${i + 1}](${url})`).join(" and ") + " cover it.";
    const { types } = await answer([{ name: "notion_search", result: notionResult(notion(n)) }], prose);

    assert.deepEqual(types, ["markdown"], `${n} links`);
  }
});

test("a lookup that found nothing makes no box", async () => {
  const { types } = await answer([{ name: "notion_search", result: notionResult([]) }], "Nothing covers it yet.");

  assert.deepEqual(types, ["markdown"]);
});

const BOARD = "https://www.notion.so/roadmapdb";

/** A Roadmap lookup that read these cards off the board. */
function roadmapResult(numbers: readonly number[]): string {
  return JSON.stringify({
    ok: true,
    filters: { design_status: "WIP" },
    count: numbers.length,
    truncated: false,
    board: { title: "Roadmap", url: BOARD },
    cards: numbers.map((n) => ({ card_number: n, title: `Card ${n} redesign`, url: `https://www.notion.so/card-${n}` })),
  });
}

test("a Roadmap count answer cites the board once, plus the cards its prose names", async () => {
  const { box } = await answer(
    [
      { name: "roadmap_query", result: roadmapResult([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) },
      { name: "roadmap_query", result: roadmapResult([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) },
    ],
    "**There are 20 cards in WIP.** The oldest is [Card 7 redesign](https://www.notion.so/card-7), and Card 12 redesign has no owner.",
  );

  assert.deepEqual(box!.title, { type: "plain_text", text: "Sources (3)" });
  assert.deepEqual(linksIn(box), [BOARD, "https://www.notion.so/card-7", "https://www.notion.so/card-12"]);
});

test("a Roadmap count answer that names no card still cites the board", async () => {
  const { box } = await answer(
    [{ name: "roadmap_query", result: roadmapResult([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) }],
    "**There are 10 cards in WIP.** Most of them sit with the design team.",
  );

  assert.deepEqual(box!.title, { type: "plain_text", text: "Sources (1)" });
  assert.deepEqual(linksIn(box), [BOARD]);
});

test("a Roadmap answer that links its one card cites the board alone, and the card stays on its name", async () => {
  const { box } = await answer(
    [{ name: "roadmap_query", result: roadmapResult([1, 2, 3, 4, 5]) }],
    "**There are 5 cards in WIP.** The oldest is [Card 3 redesign](https://www.notion.so/card-3).",
  );

  assert.deepEqual(linksIn(box), [BOARD]);
});

test("a Roadmap card is named by its number as the prose writes it, #12 or card 13, and #1 is not #12", async () => {
  const { box } = await answer(
    [{ name: "roadmap_query", result: roadmapResult([1, 12, 13, 14]) }],
    "**Two of the 4 cards in WIP are blocked:** #12 waits on copy, and card 13 on engineering.",
  );

  assert.deepEqual(linksIn(box), [BOARD, "https://www.notion.so/card-12", "https://www.notion.so/card-13"]);
});

const APP = "https://plus-uno.netlify.app/blueprint/";
const cell = (n: number) => `${APP}?cell=c${n}`;

/** A blueprint search, its rows shaped as `BlueprintRow`: a cell's title is
 *  its content cut to 80 characters, and its url opens it in the app. */
function blueprintResult(contents: readonly string[]): string {
  return JSON.stringify({
    ok: true,
    query: "reminders",
    count: contents.length,
    blueprint: { title: "uno-blueprint", url: APP },
    rows: contents.map((content, i) => ({
      kind: "cell",
      id: `c${i + 1}`,
      title: content.slice(0, 80),
      snippet: content,
      lane: "Regular Tutor",
      url: cell(i + 1),
    })),
  });
}

test("a blueprint answer cites the blueprint once and the cells it names, by link or by their whole title", async () => {
  const contents = [
    "Tutor signs in to the portal with their school account before the first session begins",
    "Tutor gets a reminder text a day before the session and often misses it in the noise",
    "Reconfirm the tutor call",
    "Coordinator exports the payout sheet at the end of every month for the finance team",
    "Tutor fills the reflection form after the session, usually days late or not at all",
  ];
  const { box } = await answer(
    [{ name: "search_blueprint", result: blueprintResult(contents) }],
    `**Reminders are where tutors slip.** The <${cell(2)}|day-before reminder> is easy to miss, the [reflection form](${cell(5)}) comes in late, and coordinators lean on Reconfirm the tutor call to catch it.`,
  );

  assert.deepEqual(box!.title, { type: "plain_text", text: "Sources (4)" });
  assert.deepEqual(linksIn(box), [APP, cell(2), cell(3), cell(5)]);
});

test("a link in Slack's own <url|text> form names its row", async () => {
  const { box } = await answer(
    [{ name: "notion_search", result: notionResult(notion(5)) }],
    `See <${notion(5)[0]}|the first>, <${notion(5)[2]}|the third> and <${notion(5)[4]}>.`,
  );

  assert.deepEqual(linksIn(box), [notion(5)[0], notion(5)[2], notion(5)[4]]);
});

test("a link is matched whole: /page-1 is not named by /page-10", async () => {
  const urls = Array.from({ length: 12 }, (_, i) => `https://www.notion.so/page-${i + 1}`);
  const { box } = await answer(
    [{ name: "notion_search", result: notionResult(urls) }],
    `See [ten](${urls[9]}), [eleven](${urls[10]}). And ${urls[11]}.`,
  );

  assert.deepEqual(linksIn(box), urls.slice(9));
});

/** A Notion search whose rows carry these titles. */
function titled(titles: readonly string[]): string {
  return JSON.stringify({
    ok: true,
    count: titles.length,
    results: titles.map((title, i) => ({ title, url: `https://www.notion.so/t-${i + 1}` })),
  });
}

test("a one-word title is named only by its link: 'Session' is not cited by 'tutors miss the session'", async () => {
  const { box } = await answer(
    [{ name: "notion_search", result: titled(["Session", "Onboarding", "Tutor import v2", "Reflection form v3", "Payout export"]) }],
    "**Tutors miss the session during onboarding.** Tutor import v2, Reflection form v3 and Payout export cover it.",
  );

  assert.deepEqual(linksIn(box), ["https://www.notion.so/t-3", "https://www.notion.so/t-4", "https://www.notion.so/t-5"]);
});

test("a title two rows share names neither of them", async () => {
  const { box } = await answer(
    [{ name: "notion_search", result: titled(["Weekly sync", "Weekly sync", "Tutor import v2", "Reflection form v3", "Payout export"]) }],
    "**The Weekly sync covers it.** Tutor import v2, Reflection form v3 and Payout export carry the detail.",
  );

  assert.deepEqual(linksIn(box), ["https://www.notion.so/t-3", "https://www.notion.so/t-4", "https://www.notion.so/t-5"]);
});

test("a hyphen continues a name: 'Tutor import' is not named by 'Tutor import-v2'", async () => {
  const { box } = await answer(
    [{ name: "notion_search", result: titled(["Tutor import", "Reflection form v3", "Payout export", "Match review"]) }],
    "**Tutor import-v2 replaced it.** Reflection form v3, Payout export and Match review carry the detail.",
  );

  assert.deepEqual(linksIn(box), ["https://www.notion.so/t-2", "https://www.notion.so/t-3", "https://www.notion.so/t-4"]);
});

test("a title is matched as written, brackets and all: '[DS] Token update'", async () => {
  const { box } = await answer(
    [{ name: "notion_search", result: titled(["[DS] Token update", "Reflection form v3", "Payout export"]) }],
    "**[DS]  Token update shipped it.** Reflection form v3 and Payout export follow.",
  );

  assert.deepEqual(linksIn(box), ["https://www.notion.so/t-1", "https://www.notion.so/t-2", "https://www.notion.so/t-3"]);
});

test("two rows named without a queried collection make no box, linked or not", async () => {
  const { types } = await answer(
    [{ name: "notion_search", result: titled(["Tutor import v2", "Reflection form v3", "Payout export"]) }],
    "**Tutor import v2 and Reflection form v3 cover it.**",
  );

  assert.deepEqual(types, ["markdown"]);
});

test("a page a search found and then read whole is cited, though the prose only paraphrases it", async () => {
  const { box } = await answer(
    [
      { name: "notion_search", result: notionResult(notion(4)) },
      { name: "source_read", result: JSON.stringify({ ok: true, url: notion(4)[2], title: "Page 3", content: "…" }) },
    ],
    "**Onboarding is written up once, and it is current.**",
  );

  assert.deepEqual(linksIn(box), [notion(4)[2]]);
});

test("a search scoped to a Notion database cites that database once", async () => {
  const db = "https://www.notion.so/successdb";
  const scoped = (urls: string[]) =>
    JSON.stringify({
      ok: true,
      scope: "success_stories",
      label: "Success Stories",
      database: { title: "Success Stories", url: db },
      count: urls.length,
      results: urls.map((url, i) => ({ title: `Story ${i + 1} recap`, url })),
    });
  const { box } = await answer(
    [
      { name: "notion_search", result: scoped(notion(3)) },
      { name: "notion_search", result: scoped(notion(3)) },
    ],
    "**Three stories mention reflection.**",
  );

  assert.deepEqual(linksIn(box), [db]);
});

test("only links the thread may see are counted: a page from the open web does not make a third", async () => {
  const { blocks } = await answer(
    [
      { name: "notion_search", result: notionResult(notion(2)) },
      { name: "notion_search", result: notionResult(["https://example.com/blog"]) },
    ],
    "[Page 1](https://www.notion.so/page-1), [Page 2](https://www.notion.so/page-2) and [the blog](https://example.com/blog) cover it.",
  );

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
  const { result, last } = await answer([{ name: "notion_search", result: notionResult(notion(3)) }]);

  assert.match(result.text, /Sources: \[Page 1\]\(https:\/\/www\.notion\.so\/page-1\)/);
  assert.equal(last.text, result.text);
});
