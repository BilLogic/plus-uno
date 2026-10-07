// A task card's logo, seen from Slack: which `icon` each card the adapter hands
// Slack carries, and the chunk shape the client turns it into.
//
// The tool table names an estate and nothing more; the logo for it is the Slack
// adapter's to pick. Driven on the recording Slack client, so what is asserted
// is the card Slack was handed.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { deliveryAdapter, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import type { ToolProgressEvent } from "../src/agent/tool-progress";
import { recordingSlack } from "./helpers/recording-slack";

const TARGET: SlackDeliveryTarget = {
  channel: "C123",
  replyTs: "100.1",
  userMsgTs: "100.1",
  userId: "U1",
  team: "T1",
};

const LOGOS = "https://plus-uno.netlify.app/uno-bot/estate-logos";

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Announce and start each call, one per seq, and return each card's icon as sent. */
async function iconsFor(calls: Array<{ name: string; args?: Record<string, unknown> }>): Promise<Map<string, unknown>> {
  const slack = recordingSlack();
  const delivery = deliveryAdapter(slack.deps(true), TARGET);
  await delivery.beginProgress("Working on it");
  calls.forEach(({ name, args = {} }, i) => {
    const event: ToolProgressEvent = { seq: i + 1, name, args, phase: "announced" };
    delivery.toolProgress(event);
  });
  calls.forEach(({ name, args = {} }, i) => {
    delivery.toolProgress({ seq: i + 1, name, args, phase: "started" });
  });
  await tick();
  await delivery.postAnswer("Done.");
  const icons = new Map<string, unknown>();
  for (const call of slack.of("tasks")) for (const t of call.tasks) icons.set(t.id, t.icon);
  return icons;
}

describe("estate logos on task cards", () => {
  it("gives a GitHub card the GitHub logo, a Slack card Slack's, and a card with no estate none", async () => {
    const icons = await iconsFor([{ name: "github_read" }, { name: "reminder_set" }, { name: "slack_search" }]);
    assert.equal(icons.get("tool-1"), `${LOGOS}/github.png`);
    assert.equal(icons.get("tool-2"), undefined);
    assert.equal(icons.get("tool-3"), `${LOGOS}/slack.png`);
    // The opening card reads no estate.
    assert.equal(icons.get("understand"), undefined);
  });

  it("sends no logo for an estate that has none", async () => {
    // Font Awesome Free carries no glyph for the blueprint, and the copy of it
    // the logos were drawn from carries none for Notion, so neither has a logo.
    const icons = await iconsFor([{ name: "search_blueprint" }, { name: "notion_search" }]);
    assert.equal(icons.get("tool-1"), undefined);
    assert.equal(icons.get("tool-2"), undefined);
  });

  it("takes a read link's logo from the link's host", async () => {
    const icons = await iconsFor([
      { name: "source_read", args: { url: "https://www.figma.com/design/abc/File?node-id=1-2" } },
      { name: "source_read", args: { url: "https://github.com/BilLogic/plus-uno/blob/main/README.md" } },
      { name: "source_read", args: { url: "https://example.com/page" } },
      { name: "source_read", args: { url: "not a url" } },
    ]);
    assert.equal(icons.get("tool-1"), `${LOGOS}/figma.png`);
    assert.equal(icons.get("tool-2"), `${LOGOS}/github.png`);
    assert.equal(icons.get("tool-3"), undefined);
    assert.equal(icons.get("tool-4"), undefined);
  });

  it("reads the link the same way the card's details do: the url, else the first link in the text", async () => {
    const icons = await iconsFor([
      { name: "source_read", args: { text: "can you read https://github.com/BilLogic/plus-uno/pull/1 please" } },
      { name: "source_read", args: { url: "https://raw.githubusercontent.com/BilLogic/plus-uno/main/README.md" } },
      { name: "source_read", args: { url: "https://gist.githubusercontent.com/x/y/raw/z.md" } },
    ]);
    assert.equal(icons.get("tool-1"), `${LOGOS}/github.png`);
    assert.equal(icons.get("tool-2"), `${LOGOS}/github.png`);
    assert.equal(icons.get("tool-3"), `${LOGOS}/github.png`, "one host rule with the visibility filter");
  });
});
