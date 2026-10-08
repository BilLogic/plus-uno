// A card table reaches Slack as a `data_table` in the answer's own message:
// the model's prose in a `markdown` block, then the table, then the footer.
//
// Driven on the recording posting client, which holds every post to the block
// rules Slack holds it to — `data_table`'s among them (`slack-block-rules.ts`)
// — so a green case here means Slack takes the shape, not merely that the fake
// was lenient. The shape itself was posted live in Bill's DM on 2026-10-07.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { postTextVerified } from "../src/slack/delivery";
import { deliveryAdapter, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import { roadmapTable, type CardTable } from "../src/turn/index";
import { recordingPosting, recordingSlack } from "./helpers/recording-slack";

const RECIPIENT = { userId: "U1", team: "T1" };
const THREAD: SlackDeliveryTarget = { channel: "C1", replyTs: "100.1", userMsgTs: "100.1", userId: "U1", team: "T1" };
const PROSE = "Thirteen cards are in WIP; two have no Dev Status yet.";

type Cell = { type: string; text?: string; value?: number; elements?: unknown[] };
type Block = { type: string; text?: string; caption?: string; page_size?: number; rows?: Cell[][] };

/** A table of `n` WIP cards. */
function wip(n: number, over: Partial<CardTable> = {}): CardTable {
  return {
    rows: Array.from({ length: n }, (_, i) => ({
      title: `Card ${i + 1}`,
      url: `https://www.notion.so/card-${i + 1}`,
      cardNumber: 400 + i + 1,
      designStatus: "WIP",
      devStatus: i < 2 ? null : "In progress",
    })),
    filter: { designStatus: "WIP" },
    total: n,
    partial: false,
    ...over,
  };
}

/** Post `table` beneath the prose, as the Roadmap preset, and hand back the
 *  one message it made. */
async function post(table: CardTable, prose = PROSE) {
  const slack = recordingPosting();
  const posted = await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", prose, RECIPIENT, undefined, {
    presentation: { table: roadmapTable(table) },
  });
  const messages = slack.of("message");
  assert.equal(messages.length, 1, "one message");
  const message = messages[0]!;
  const blocks = (message.blockList ?? []) as Block[];
  const dataTable = blocks.find((b) => b.type === "data_table");
  assert.ok(dataTable, "a data_table was posted");
  return { posted, message, blocks, dataTable };
}

describe("an answer with a card table", () => {
  it("posts the prose, then the table, then the footer, in one message", async () => {
    const { blocks, posted } = await post(wip(13));

    assert.equal(posted.ok, true);
    assert.deepEqual(blocks.map((b) => b.type), ["markdown", "data_table", "context"]);
    assert.equal(blocks[0]!.text, PROSE);
  });

  it("keeps the footer beneath a table whose prose is a single short line", async () => {
    // Short prose alone reads as an acknowledgement and goes out bare; the
    // table beneath it is thirteen checkable claims.
    const { blocks } = await post(wip(13), "Here they are.");

    assert.equal(blocks.at(-1)!.type, "context");
  });

  it("shows every row on one page", async () => {
    const { dataTable } = await post(wip(13));

    assert.equal(dataTable.page_size, 13);
    assert.equal(dataTable.rows!.length, 14, "the header and thirteen cards");
  });

  it("heads the columns title, number, Design Status and Dev Status", async () => {
    const { dataTable } = await post(wip(3));

    assert.deepEqual(
      dataTable.rows![0]!.map((c) => [c.type, c.text]),
      [
        ["raw_text", "Card"],
        ["raw_text", "#"],
        ["raw_text", "Design Status"],
        ["raw_text", "Dev Status"],
      ],
    );
  });

  it("links each title to its card", async () => {
    const { dataTable } = await post(wip(3));

    assert.deepEqual(dataTable.rows![1]![0], {
      type: "rich_text",
      elements: [
        { type: "rich_text_section", elements: [{ type: "link", url: "https://www.notion.so/card-1", text: "Card 1" }] },
      ],
    });
  });

  it("gives every number cell its text as well as its value", async () => {
    const { dataTable } = await post(wip(3));

    for (const row of dataTable.rows!.slice(1)) {
      assert.equal(row[1]!.type, "raw_number");
      assert.equal(row[1]!.text, String(row[1]!.value));
    }
    assert.deepEqual(dataTable.rows![1]![1], { type: "raw_number", value: 401, text: "401" });
  });

  it("fills an empty status with a dash rather than leaving the cell blank", async () => {
    const { dataTable } = await post(wip(3));

    assert.deepEqual(dataTable.rows![1]![3], { type: "raw_text", text: "—" });
  });

  it("captions the table with the count and the filter", async () => {
    const { dataTable } = await post(wip(13));

    assert.equal(dataTable.caption, "13 cards · Design Status WIP");
  });

  it("says when the list is only the first of more", async () => {
    const { dataTable } = await post(wip(30, { total: 41, partial: true }));

    assert.equal(dataTable.caption, "first 30 of 41 · Design Status WIP");
  });

  it("names the phrase a title search's list is for", async () => {
    const { dataTable } = await post(wip(3, { filter: { title: "onboarding" } }));

    assert.equal(dataTable.caption, '3 cards · title contains "onboarding"');
  });

  it("names the person a person's list is for", async () => {
    const { dataTable } = await post(wip(2, { filter: { person: "Bryan" } }));

    assert.equal(dataTable.caption, "2 cards · with Bryan");
  });

  it("keeps the prose and the plain list as the text copy, and reports it as what was posted", async () => {
    const { message, posted } = await post(wip(3));
    const copy = [PROSE, "", "Card 1 — #401 — WIP", "Card 2 — #402 — WIP", "Card 3 — #403 — WIP"].join("\n");

    assert.equal(message.text, copy);
    assert.equal(posted.text, copy, "what the thread remembers");
  });

  it("lists both statuses when the lookup filtered on neither", async () => {
    const { message } = await post(wip(3, { filter: { person: "Bryan" } }));

    assert.match(message.text, /^Card 1 — #401 — WIP$/m);
    assert.match(message.text, /^Card 3 — #403 — WIP · Dev In progress$/m);
  });
});

describe("the Slack adapter", () => {
  it("hands the turn's presentation to the posting path, and reports the text copy as posted", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(), THREAD);
    const presentation = { table: roadmapTable(wip(3)) };
    const posted = await delivery.postAnswer(PROSE, presentation);

    const [answer] = slack.of("answer");
    assert.deepEqual(answer?.presentation, presentation);
    assert.equal(answer?.text, PROSE, "the prose goes down as written");
    assert.match(posted.text, /^Card 3 — #403 — WIP$/m);
  });

  it("hands down no presentation when the turn left none", async () => {
    const slack = recordingSlack();
    await deliveryAdapter(slack.deps(), THREAD).postAnswer(PROSE);

    assert.equal("presentation" in (slack.of("answer")[0] ?? {}), false);
  });
});

describe("an answer without a card table", () => {
  it("posts exactly as it always has", async () => {
    const slack = recordingPosting();
    const prose = `${PROSE} See the [board](https://www.notion.so/roadmap).`;
    const posted = await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", prose, RECIPIENT);

    const message = slack.of("message")[0]!;
    assert.deepEqual(((message.blockList ?? []) as Block[]).map((b) => b.type), ["markdown", "context"]);
    assert.equal(message.text, prose);
    assert.equal(posted.text, prose);
  });
});
