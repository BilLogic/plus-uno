// The delivery ladder's cost has a ceiling, whatever rides beneath an answer.
//
// Each refused extra used to step down on its own, one post apiece, so an
// answer carrying charts, a table and cards could spend a post per extra out
// of the reserve the answer is posted from. Now one extra steps down where
// Slack points, and a second refusal drops every extra still aboard at once.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { postTextVerified } from "../src/slack/delivery";
import { roadmapTable } from "../src/turn/index";
import type { Chart } from "../src/turn/chart";
import { expectRefusals, recordingPosting } from "./helpers/recording-slack";

const RECIPIENT = { userId: "U1", team: "T1" };
const PROSE = "Three cards are in WIP; two have no Dev Status yet.";

const chart = (title: string): Chart => ({
  kind: "bar",
  title,
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
});

const table = roadmapTable({
  rows: [1, 2, 3].map((i) => ({
    title: `Card ${i}`,
    url: `https://www.notion.so/card-${i}`,
    cardNumber: 400 + i,
    designStatus: "WIP",
    devStatus: null,
  })),
  filter: { designStatus: "WIP" },
  total: 3,
  partial: false,
});

const cards = {
  lookup: "notion_query",
  total: 2,
  cards: [1, 2].map((i) => ({ title: `Card ${i}`, links: [{ label: "Open", url: `https://www.notion.so/card-${i}` }] })),
};

describe("a run of refusals beneath an answer", () => {
  it("still posts the answer, within three posts, every extra as text", async () => {
    const slack = recordingPosting({ refusesBlockTypes: ["data_visualization", "data_table", "carousel", "context_actions"] });
    const orig = console.warn;
    console.warn = () => {};
    let result;
    try {
      result = await postTextVerified(slack.deps({ streamingOn: false }), "C1", "100.1", PROSE, RECIPIENT, undefined, {
        presentation: { charts: [chart("Cards by Design Status"), chart("Cards by owner")], table, cards },
        feedback: { turnId: "C1:100.1" },
      });
    } finally {
      console.warn = orig;
    }
    expectRefusals(slack.refused);

    assert.equal(result.ok, true);
    const messages = slack.of("message");
    // One pointed step-down, buttons kept, then everything left at once.
    assert.ok(messages.length <= 3, `${messages.length} posts`);
    const last = messages.at(-1)!;
    assert.deepEqual(
      (last.blockList as Array<{ type: string }>).map((b) => b.type),
      ["markdown", "context"],
    );
    for (const n of [401, 402, 403]) assert.match(last.text, new RegExp(`#${n}`));
    assert.match(last.text, /Cards by owner/);
    assert.match(last.text, /Card 2/);
  });
});
