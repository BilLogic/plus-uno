// A task card's glyph, seen from Slack: which `icon` each card the adapter
// hands Slack carries, on the live checklist and on the static DM plan.
//
// The tool table names the estate a lookup reads and nothing more; the glyph
// for it is the Slack side's to pick. Driven on the recording Slack client, so
// what is asserted is the card Slack was handed — and that client refuses an
// icon Slack would refuse, so a wrong shape fails here too.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { deliveryAdapter, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import type { ToolProgressEvent } from "../src/agent/tool-progress";
import { recordingSlack } from "./helpers/recording-slack";

const THREAD: SlackDeliveryTarget = { channel: "C123", replyTs: "100.1", userMsgTs: "100.1", userId: "U1", team: "T1" };

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Announce and start each call, one per seq, and return each card's icon as
 *  the stream was handed it (the last one sent wins). */
async function streamIcons(calls: Array<{ name: string; args?: Record<string, unknown> }>): Promise<Map<string, unknown>> {
  const slack = recordingSlack();
  const delivery = deliveryAdapter(slack.deps(true), THREAD);
  await delivery.beginProgress("Working on it");
  calls.forEach(({ name, args = {} }, i) => {
    const event: ToolProgressEvent = { seq: i + 1, name, args, phase: "announced" };
    delivery.toolProgress(event);
  });
  calls.forEach(({ name, args = {} }, i) => delivery.toolProgress({ seq: i + 1, name, args, phase: "started" }));
  await tick();
  await delivery.postAnswer("Done.");
  const icons = new Map<string, unknown>();
  for (const call of slack.of("tasks")) for (const t of call.tasks) icons.set(t.id, (t as { icon?: unknown }).icon);
  return icons;
}

describe("estate glyphs on task cards", () => {
  it("gives each estate's card its named Slack icon", async () => {
    const icons = await streamIcons([
      { name: "notion_search" },
      { name: "search_blueprint" },
      { name: "github_read" },
      { name: "slack_search" },
    ]);
    assert.deepEqual(icons.get("tool-1"), { type: "icon", name: "book" });
    assert.deepEqual(icons.get("tool-2"), { type: "icon", name: "map" });
    assert.deepEqual(icons.get("tool-3"), { type: "icon", name: "code" });
    assert.deepEqual(icons.get("tool-4"), { type: "icon", name: "comment" });
  });

  it("gives a card that reads no estate no icon", async () => {
    const icons = await streamIcons([{ name: "reminder_set" }, { name: "read_reference" }]);
    assert.equal(icons.get("tool-1"), undefined);
    assert.equal(icons.get("tool-2"), undefined);
    assert.ok(icons.has("understand"));
    assert.equal(icons.get("understand"), undefined, "the opening card reads nothing");
  });

  it("takes a read link's glyph from the link's host, and the globe for a host on no estate", async () => {
    const icons = await streamIcons([
      { name: "source_read", args: { url: "https://www.figma.com/design/abc/File?node-id=1-2" } },
      { name: "source_read", args: { url: "https://raw.githubusercontent.com/BilLogic/plus-uno/main/README.md" } },
      { name: "source_read", args: { text: "can you read https://www.notion.so/Recap-1 please" } },
      { name: "source_read", args: { url: "https://example.com/page" } },
    ]);
    assert.deepEqual(icons.get("tool-1"), { type: "icon", name: "image" });
    assert.deepEqual(icons.get("tool-2"), { type: "icon", name: "code" });
    assert.deepEqual(icons.get("tool-3"), { type: "icon", name: "book" });
    assert.deepEqual(icons.get("tool-4"), { type: "icon", name: "globe" });
  });

  it("tells our own site's estates apart by path, and gives its other paths the globe", async () => {
    const icons = await streamIcons([
      { name: "source_read", args: { url: "https://plus-uno.netlify.app/storybook/?path=/docs/badge--docs" } },
      { name: "source_read", args: { url: "https://plus-uno.netlify.app/blueprint/phase/in-session" } },
      { name: "source_read", args: { url: "https://plus-uno.netlify.app/storybook-old/x" } },
      { name: "source_read", args: { url: "https://plus-uno.netlify.app/home" } },
    ]);
    assert.deepEqual(icons.get("tool-1"), { type: "icon", name: "cube" });
    assert.deepEqual(icons.get("tool-2"), { type: "icon", name: "map" });
    assert.deepEqual(icons.get("tool-3"), { type: "icon", name: "globe" });
    assert.deepEqual(icons.get("tool-4"), { type: "icon", name: "globe" });
  });

  it("carries the same icons on the static plan in a top-level DM", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), { channel: "D123", userMsgTs: "100.1", userId: "U1", team: "T1" });
    await delivery.beginProgress("Working on it");
    const calls = [
      { name: "github_read", args: {} },
      { name: "source_read", args: { url: "https://example.com/page" } },
      { name: "reminder_set", args: {} },
    ];
    calls.forEach(({ name, args }, i) => delivery.toolProgress({ seq: i + 1, name, args, phase: "announced" }));
    calls.forEach(({ name, args }, i) => {
      delivery.toolProgress({ seq: i + 1, name, args, phase: "started" });
      delivery.toolProgress({ seq: i + 1, name, args, phase: "finished" });
    });
    await delivery.postAnswer("Done.");

    const [settled] = slack.of("update");
    const plan = settled!.blocks.find((b) => (b as { type: string }).type === "plan") as {
      tasks: Array<{ task_id: string; icon?: unknown }>;
    };
    const icons = new Map(plan.tasks.map((t) => [t.task_id, t.icon]));
    assert.deepEqual(icons.get("tool-1"), { type: "icon", name: "code" });
    assert.deepEqual(icons.get("tool-2"), { type: "icon", name: "globe" });
    assert.equal(icons.get("tool-3"), undefined);
    assert.equal("icon" in plan.tasks.find((t) => t.task_id === "understand")!, false);
  });
});
