// The card table never costs a reader the answer. An answer carrying one posts
// as an ordinary message rather than streaming; on a split answer it rides the
// last part beside the footer; and if Slack refuses the message, the answer
// goes out again without the table, its cards as a plain list in the Markdown,
// before the existing rungs (section blocks, then bare text) — each carrying
// that list, and each step down logged with what Slack said.
//
// Driven on the recording posting client, which holds every post to Slack's
// block rules and refuses a block type on demand, so each rung is reachable.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { postTextVerified } from "../src/slack/delivery";
import { roadmapTable, type ResultTable } from "../src/turn/index";
import { expectRefusals, recordingPosting } from "./helpers/recording-slack";

const RECIPIENT = { userId: "U1", team: "T1" };
const PROSE = "Three cards are in WIP; two have no Dev Status yet.";
const LIST = ["Card 1 — #401 — WIP", "Card 2 — #402 — WIP", "Card 3 — #403 — WIP"].join("\n");

type Block = { type: string; text?: unknown };

/** A table of three WIP cards, as the Roadmap preset builds it. */
function wip(): ResultTable {
  return roadmapTable({
    rows: [1, 2, 3].map((i) => ({
      title: `Card ${i}`,
      url: `https://www.notion.so/card-${i}`,
      cardNumber: 400 + i,
      designStatus: "WIP",
      devStatus: i < 3 ? null : "In progress",
    })),
    filter: { designStatus: "WIP" },
    total: 3,
    partial: false,
  });
}

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

const blocksOf = (call: { blockList?: unknown[] }) => (call.blockList ?? []) as Block[];
const typesOf = (call: { blockList?: unknown[] }) => blocksOf(call).map((b) => b.type);

describe("an answer carrying a card table", () => {
  it("posts as an ordinary message and never streams, even with streaming on", async () => {
    const slack = recordingPosting();
    const posted = await postTextVerified(slack.deps({ streamingOn: true }), "C1", "100.1", PROSE, RECIPIENT, undefined, {
      presentation: { table: wip() },
    });

    assert.equal(posted.ok, true);
    assert.equal(slack.of("startStream").length, 0, "no stream opened");
    assert.deepEqual(typesOf(slack.of("message")[0]!), ["markdown", "data_table", "context"]);
  });
});

describe("a split answer carrying a card table", () => {
  it("puts the table on the last part only, beside the footer, and its list in that part's text copy", async () => {
    const para = (i: number) => `Paragraph ${i}: ${"word ".repeat(60).trimEnd()}`;
    const prose = Array.from({ length: 48 }, (_, i) => para(i)).join("\n\n");
    const slack = recordingPosting();
    await postTextVerified(slack.deps({ streamingOn: true }), "C1", "100.1", prose, RECIPIENT, undefined, {
      presentation: { table: wip() },
    });

    const messages = slack.of("message");
    assert.ok(messages.length > 1, "the answer split");
    assert.equal(slack.of("startStream").length, 0, "not even the first part streams");
    messages.forEach((message, i) => {
      const last = i === messages.length - 1;
      assert.deepEqual(typesOf(message), last ? ["markdown", "data_table", "context"] : ["markdown"], `part ${i + 1}`);
      assert.equal(message.text.endsWith(LIST), last, `part ${i + 1}'s text copy carries the list only if last`);
    });
  });
});

describe("a card table Slack refuses", () => {
  it("re-sends the answer without it, the cards as a plain list in the Markdown, logged with Slack's detail", async () => {
    const slack = recordingPosting({ refusesBlockTypes: ["data_table"] });
    const { result, lines } = await warnings(() =>
      postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", PROSE, RECIPIENT, undefined, {
        presentation: { table: wip() },
      }),
    );
    expectRefusals(slack.refused);

    assert.equal(result.ok, true);
    const messages = slack.of("message");
    assert.equal(messages.length, 2);
    assert.deepEqual(typesOf(messages[1]!), ["markdown", "context"]);
    assert.equal(blocksOf(messages[1]!)[0]!.text, `${PROSE}\n\n${LIST}`);
    assert.equal(messages[1]!.text, `${PROSE}\n\n${LIST}`);
    assert.ok(
      lines.some((l) => /result table refused/.test(l) && /json-pointer:\/blocks\/1/.test(l)),
      `logged the step down with Slack's detail: ${lines.join(" / ")}`,
    );
  });

  it("then steps down to section blocks carrying the list, when the Markdown is refused too", async () => {
    const slack = recordingPosting({ refusesBlockTypes: ["data_table", "markdown"] });
    const { result, lines } = await warnings(() =>
      postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", PROSE, RECIPIENT, undefined, {
        presentation: { table: wip() },
      }),
    );
    expectRefusals(slack.refused);

    assert.equal(result.ok, true);
    const messages = slack.of("message");
    assert.equal(messages.length, 3);
    const types = typesOf(messages[2]!);
    assert.equal(types.at(-1), "context", "the footer rides the fallback");
    assert.ok(types.slice(0, -1).every((t) => t === "section"));
    const sectionText = blocksOf(messages[2]!)
      .filter((b) => b.type === "section")
      .map((b) => JSON.stringify(b.text))
      .join("");
    for (const n of [401, 402, 403]) assert.match(sectionText, new RegExp(`#${n}`), `card #${n} is in the sections`);
    assert.equal(messages[2]!.text, `${PROSE}\n\n${LIST}`);
    assert.ok(lines.some((l) => /result table refused/.test(l)));
    assert.ok(
      lines.some((l) => /markdown block refused/.test(l) && /invalid_blocks/.test(l)),
      `logged the second step down: ${lines.join(" / ")}`,
    );
  });

  it("and to bare text carrying the list, when the sections are refused as well", async () => {
    const slack = recordingPosting({ refusesBlockTypes: ["data_table", "markdown", "section"] });
    const { result, lines } = await warnings(() =>
      postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", PROSE, RECIPIENT, undefined, {
        presentation: { table: wip() },
      }),
    );
    expectRefusals(slack.refused);

    assert.equal(result.ok, true);
    const messages = slack.of("message");
    assert.equal(messages.length, 4);
    assert.equal(messages[3]!.blocks, false, "the last rung carries no blocks");
    assert.equal(messages[3]!.text, `${PROSE}\n\n${LIST}`);
    assert.ok(
      lines.some((l) => /section blocks refused/.test(l) && /invalid_blocks/.test(l)),
      `logged the third step down: ${lines.join(" / ")}`,
    );
  });

  it("is not blamed for a failure that is not about the blocks", async () => {
    const slack = recordingPosting({ postFailsWith: { error: "ratelimited" } });
    const { result } = await warnings(() =>
      postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", PROSE, RECIPIENT, undefined, {
        presentation: { table: wip() },
      }),
    );

    assert.equal(result.ok, false);
    const messages = slack.of("message");
    assert.equal(messages.length, 2, "a doomed post costs two calls, not three");
    assert.equal(messages[1]!.blocks, false, "the second call is bare text");
    assert.equal(messages[1]!.text, `${PROSE}\n\n${LIST}`);
  });
});
