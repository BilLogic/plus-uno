// A task card's query, result and sources, seen from Slack.
//
// Driven on the recording Slack client, so what is asserted is the card Slack
// was handed. The visibility filter is the point: a card is posted into a
// thread, and a link on it is a link everyone in that thread can follow, so it
// carries only what those readers could already open.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { deliveryAdapter, type PlanTask, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import type { ToolProgressEvent } from "../src/agent/tool-progress";
import { recordingSlack, type RecordingSlack } from "./helpers/recording-slack";

const TARGET: SlackDeliveryTarget = { channel: "C123", replyTs: "100.1", userMsgTs: "100.1", userId: "U1", team: "T1" };

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Run one lookup end to end, the way the loop reports it. */
async function lookup(
  delivery: ReturnType<typeof deliveryAdapter>,
  name: string,
  args: Record<string, unknown>,
  result: string,
): Promise<void> {
  const base = { seq: 1, name, args };
  delivery.toolProgress({ ...base, phase: "announced" } as ToolProgressEvent);
  delivery.toolProgress({ ...base, phase: "started" } as ToolProgressEvent);
  await tick();
  delivery.toolProgress({ ...base, phase: "finished", result });
  await tick();
}

/** The card as Slack last saw it. */
function lastCard(slack: RecordingSlack, id: string): PlanTask {
  const cards = slack.of("tasks").flatMap((call) => call.tasks).filter((t) => t.id === id);
  assert.ok(cards.length, `card ${id} was sent`);
  return cards.at(-1)!;
}

async function finishedCard(name: string, args: Record<string, unknown>, result: unknown): Promise<PlanTask> {
  const slack = recordingSlack();
  const delivery = deliveryAdapter(slack.deps(true), TARGET);
  await delivery.beginProgress("Working on it");
  await lookup(delivery, name, args, JSON.stringify(result));
  await delivery.postAnswer("Done.");
  return lastCard(slack, "tool-1");
}

describe("a task card's details, output and sources", () => {
  it("a finished card carries the query, what came back, and the links it read", async () => {
    const card = await finishedCard("notion_search", { query: "session recap" }, {
      ok: true,
      count: 2,
      results: [
        { title: "Session recap PRD", url: "https://www.notion.so/Session-recap-1" },
        { title: "Recap board", url: "https://plus.notion.site/Recap-board-2" },
      ],
    });
    assert.equal(card.status, "complete");
    assert.equal(card.details, "session recap");
    assert.equal(card.output, "2 pages");
    assert.deepEqual(card.sources, [
      { text: "Session recap PRD", url: "https://www.notion.so/Session-recap-1" },
      { text: "Recap board", url: "https://plus.notion.site/Recap-board-2" },
    ]);
  });

  it("passes GitHub, Figma, blueprint and Storybook links, and nothing from an estate it cannot vouch for", async () => {
    const card = await finishedCard("github_read", { search: "x" }, {
      ok: true,
      hits: [
        { path: "a.jsx", url: "https://github.com/BilLogic/plus-uno/blob/main/a.jsx" },
        { path: "fig", url: "https://www.figma.com/design/KEY/F?node-id=1-2" },
        { path: "cell", url: "https://plus-uno.netlify.app/blueprint/cell/1" },
        { path: "story", url: "https://plus-uno.netlify.app/storybook/?path=/docs/button" },
        { path: "proto", url: "https://plus-uno.netlify.app/prototypes/x" },
        { path: "web", url: "https://example.com/elsewhere" },
        { path: "lookalike", url: "https://github.com.evil.example/x" },
      ],
    });
    assert.deepEqual(card.sources?.map((s) => s.text), ["a.jsx", "fig", "cell", "story"]);
  });

  it("drops a Slack permalink the search could not vouch for as public", async () => {
    const card = await finishedCard("slack_search", { query: "deadline" }, {
      ok: true,
      visibility: "workspace-filtered (public + team-allowlisted private)",
      results: [{ channel: "#design-private", link: "https://plus.slack.com/archives/C0PRIV/p1700000000000100", text: "…" }],
    });
    assert.equal(card.output, "1 message");
    assert.equal(card.sources, undefined, "a private-channel permalink never reaches the card");
  });

  it("passes a public-only search's permalinks", async () => {
    const card = await finishedCard("slack_search", { query: "deadline" }, {
      ok: true,
      visibility: "public-only (no user credential — public channels are the whole search)",
      results: [{ channel: "#design", link: "https://plus.slack.com/archives/C0PUB/p1700000000000100", text: "…" }],
    });
    assert.deepEqual(card.sources, [{ text: "#design", url: "https://plus.slack.com/archives/C0PUB/p1700000000000100" }]);
  });

  it("never passes a direct-message permalink, whatever the search could see", async () => {
    const card = await finishedCard("slack_search", { query: "relay" }, {
      ok: true,
      visibility: "requester-own (their DMs/private included)",
      results: [
        { channel: "D0RELAY", link: "https://plus.slack.com/archives/D0RELAY/p1700000000000100", text: "…" },
        { channel: "group", link: "https://plus.slack.com/archives/G0GROUP/p1700000000000200", text: "…" },
      ],
    });
    assert.equal(card.sources, undefined, "a relayed DM's permalink never reaches the card");
  });

  it("narration and the query share the details line", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);
    await delivery.beginProgress("Working on it");
    delivery.postInterim("Checking whether this shipped");
    await lookup(delivery, "roadmap_query", { title: "tutor import" }, JSON.stringify({ ok: true, count: 0, cards: [] }));
    await delivery.postAnswer("Done.");
    const card = lastCard(slack, "tool-1");
    assert.equal(card.details, "Checking whether this shipped · tutor import");
    assert.equal(card.output, "no matching cards");
  });

  it("an error card keeps the error as its output and carries no sources", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);
    await delivery.beginProgress("Working on it");
    const base = { seq: 1, name: "notion_search", args: { query: "x" } };
    delivery.toolProgress({ ...base, phase: "announced" });
    delivery.toolProgress({ ...base, phase: "started" });
    delivery.toolProgress({ ...base, phase: "finished", result: JSON.stringify({ ok: false, error: "502 from Notion" }), error: "502 from Notion" });
    await delivery.postAnswer("Done.");
    const card = lastCard(slack, "tool-1");
    assert.equal(card.status, "error");
    assert.equal(card.output, "502 from Notion");
    assert.equal(card.sources, undefined);
  });
});
