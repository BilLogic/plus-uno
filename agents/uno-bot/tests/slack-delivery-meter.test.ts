// The Slack envelope's calls carry the meter's delivery label: the plan
// stream's cards and the answer go out while a lookup's limit is active and are
// neither refused by it nor counted as the lookup coming back short. Driven
// through the real envelope (`slack-delivery.ts`) and the real Slack client
// over a stubbed fetch.
//
// `net.ts` binds the real fetch at its first evaluation, so the stub goes onto
// `globalThis` here and the modules are imported lazily inside each test.
import { test } from "node:test";
import assert from "node:assert/strict";

let sent: string[] = [];
globalThis.fetch = (async (input: unknown) => {
  sent.push(String(input).replace("https://slack.com/api/", ""));
  return new Response(JSON.stringify({ ok: true, ts: "1.0", channel: "D0123" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}) as typeof fetch;

type Env = import("../src/types").Env;
const ENV = {
  SLACK_BOT_TOKEN: "xoxb-test",
  SLACK_STREAM_PLAN: "on",
  SLACK_STREAMING: "on",
  SLACK_STREAM_MARKUP_PROBE: "pass:2026-10-01",
} as Env;
const TARGET = { channel: "D0123", replyTs: "1.0", userMsgTs: "1.0", userId: "U0123", team: "T0123" };

test("plan-stream cards and the answer, sent at a spent lookup limit, are neither refused nor trips", async () => {
  const { runMetered, withSubrequestLimit, subrequestBudgetTrips, subrequestsUsed } = await import("../src/net.js");
  const { slackDelivery } = await import("../src/slack/slack-delivery.js");
  sent = [];
  await runMetered(async () => {
    const delivery = slackDelivery(ENV, TARGET);
    // A limit of zero: any call charged to the lookup would be refused.
    await withSubrequestLimit(0, async () => {
      await delivery.beginProgress("Working on it");
      delivery.postInterim("Searching the blueprint");
      const posted = await delivery.postAnswer("Here is the answer.");
      assert.equal(posted.ok, true);
    });
    assert.equal(subrequestBudgetTrips(), 0, "no delivery call stamped a lookup partial");
    assert.equal(subrequestsUsed(), sent.length, "every delivery call still counted");
  });
  assert.ok(sent.includes("chat.startStream"), sent.join(" "));
  assert.ok(sent.filter((m) => m === "chat.appendStream").length >= 3, sent.join(" "));
  assert.ok(sent.includes("chat.stopStream"), sent.join(" "));
});

test("a reaction and a note are delivery too", async () => {
  const { runMetered, withSubrequestLimit, subrequestBudgetTrips } = await import("../src/net.js");
  const { slackDelivery } = await import("../src/slack/slack-delivery.js");
  sent = [];
  await runMetered(async () => {
    const delivery = slackDelivery(ENV, TARGET);
    await withSubrequestLimit(0, async () => {
      await delivery.react("eyes");
      assert.equal((await delivery.postNote("One moment.")).ok, true);
    });
    assert.equal(subrequestBudgetTrips(), 0);
  });
  assert.deepEqual(sent, ["reactions.add", "chat.postMessage"]);
});
