// The checklist's words are plain text, seen from Slack.
//
// Slack shows a plan's heading, a card's title, `details`, `output` and a
// source's name as plain text: it parses no markup there and decodes no
// entities. So the mrkdwn escaper was the wrong pass for them — live, a heading
// read `*Sent using* <@U0ASFR2RJ9W>` and a source read `Employment &amp;
// Access`. Markup becomes the words a reader would have seen, and an entity
// becomes its character.
//
// Driven on the recording Slack client, so what is asserted is what Slack was
// handed.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { deliveryAdapter, type PlanTask, type SlackDeliveryTarget } from "../src/slack/delivery-adapter";
import { finishedProgress, type ToolProgressEvent } from "../src/agent/tool-progress";
import { recordingSlack, type RecordingSlack } from "./helpers/recording-slack";

const TARGET: SlackDeliveryTarget = { channel: "C123", replyTs: "100.1", userMsgTs: "100.1", userId: "U1", team: "T1" };

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** The heading Slack was handed for an ask. */
async function headingFor(ask: string): Promise<string> {
  const slack = recordingSlack();
  const delivery = deliveryAdapter(slack.deps(true), TARGET);
  await delivery.beginProgress("Working on it", ask);
  await delivery.endProgress("complete");
  const headings = slack.of("heading");
  assert.equal(headings.length, 1);
  return headings[0]!.title;
}

/** The card as Slack last saw it. */
function lastCard(slack: RecordingSlack, id: string): PlanTask {
  const cards = slack.of("tasks").flatMap((call) => call.tasks).filter((t) => t.id === id);
  assert.ok(cards.length, `card ${id} was sent`);
  return cards.at(-1)!;
}

describe("the checklist's plain text", () => {
  it("turns a mention into the name it shows, and a bare one into @someone", async () => {
    assert.equal(await headingFor("ask <@U0BILL|bill> about it"), "ask @bill about it");
    assert.equal(await headingFor("*Sent using* <@U0ASFR2RJ9W>"), "Sent using @someone");
  });

  it("turns a channel into its #name and a link into its label", async () => {
    assert.equal(await headingFor("post in <#C0DESIGN|plus-design>"), "post in #plus-design");
    assert.equal(await headingFor("read <https://example.com/prd|the PRD> first"), "read the PRD first");
  });

  it("drops emphasis markers", async () => {
    assert.equal(await headingFor("*bold* _italic_ ~struck~ `code`"), "bold italic struck code");
  });

  it("decodes entities", async () => {
    assert.equal(await headingFor("Employment &amp; Access &lt;draft&gt;"), "Employment & Access <draft>");
  });

  it("cuts within Slack's 256 characters after the pass, not before", async () => {
    const heading = await headingFor(`<https://example.com/${"x".repeat(300)}|short label> ${"word ".repeat(40)}`);
    assert.ok(heading.startsWith("short label word"), heading);
    assert.ok(heading.length <= 256);
  });

  it("gives a card's details and its sources' names the same pass", async () => {
    const slack = recordingSlack();
    const delivery = deliveryAdapter(slack.deps(true), TARGET);
    await delivery.beginProgress("Working on it");
    delivery.postInterim("Checking *Employment &amp; Access* for <@U0BILL|bill>");
    const base = { seq: 1, name: "notion_search", args: { query: "access" } };
    delivery.toolProgress({ ...base, phase: "announced" } as ToolProgressEvent);
    delivery.toolProgress({ ...base, phase: "started" } as ToolProgressEvent);
    await tick();
    delivery.toolProgress(
      finishedProgress(
        base,
        JSON.stringify({
          ok: true,
          count: 1,
          results: [{ title: "Employment &amp; Access", url: "https://www.notion.so/Employment-1" }],
        }),
      ),
    );
    await tick();
    await delivery.postAnswer("Done.");

    const card = lastCard(slack, "tool-1");
    assert.match(card.details ?? "", /^Checking Employment & Access for @bill/);
    assert.deepEqual(card.sources?.map((s) => s.text), ["Employment & Access"]);
  });
});
