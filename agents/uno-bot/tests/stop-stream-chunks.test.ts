// The checklist's last changes ride `chat.stopStream` as task chunks, so the
// settle spends no call of its own; a stop that refuses them falls back to an
// append and a bare stop, so the cards still settle and the stream still
// closes. Driven through the real envelope (`slack-delivery.ts`) and the real
// Slack client over a stubbed fetch.
//
// `net.ts` binds the real fetch at its first evaluation, so the stub goes onto
// `globalThis` here and the modules are imported lazily inside each test.
import { test } from "node:test";
import assert from "node:assert/strict";

let sent: Array<{ method: string; body: Record<string, unknown> }> = [];
/** Whether a stop that carries chunks is refused. */
let refuseChunkedStop = false;
globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const method = String(input).replace("https://slack.com/api/", "");
  const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
  sent.push({ method, body });
  const ok = !(refuseChunkedStop && method === "chat.stopStream" && "chunks" in body);
  return new Response(JSON.stringify(ok ? { ok: true, ts: "1.0", channel: "D0123" } : { ok: false, error: "invalid_arguments" }), {
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

async function oneLookup(): Promise<void> {
  const { slackDelivery } = await import("../src/slack/slack-delivery.js");
  const delivery = slackDelivery(ENV, TARGET);
  await delivery.beginProgress("Working on it");
  const call = { seq: 1, name: "search_blueprint", args: { query: "call-off" } };
  delivery.toolProgress({ ...call, phase: "announced" });
  delivery.toolProgress({ ...call, phase: "started" });
  // The group's append lands while the lookup runs.
  await new Promise((resolve) => setTimeout(resolve, 10));
  delivery.toolProgress({ ...call, phase: "finished" });
  await delivery.endProgress("complete");
}

const planStops = () => sent.filter((s) => s.method === "chat.stopStream");
const taskChunks = (body: Record<string, unknown>) =>
  ((body.chunks ?? []) as Array<{ type: string; status?: string }>).filter((c) => c.type === "task_update");

test("the stop carries the checklist's settle as task chunks, with no append of its own", async () => {
  sent = [];
  refuseChunkedStop = false;
  await oneLookup();
  const methods = sent.map((s) => s.method);
  assert.deepEqual(methods, ["chat.startStream", "chat.appendStream", "chat.stopStream"]);
  const [stop] = planStops();
  const chunks = taskChunks(stop!.body);
  assert.ok(chunks.length > 0, JSON.stringify(stop!.body));
  assert.ok(chunks.every((c) => c.status === "complete"), JSON.stringify(chunks));
  assert.equal("markdown_text" in stop!.body, false, "Slack takes markdown_text or chunks, never both");
});

test("a stop that refuses the chunks falls back to an append and a bare stop", async () => {
  sent = [];
  refuseChunkedStop = true;
  await oneLookup();
  const methods = sent.map((s) => s.method);
  assert.deepEqual(methods, ["chat.startStream", "chat.appendStream", "chat.stopStream", "chat.appendStream", "chat.stopStream"]);
  assert.ok(taskChunks(sent[3]!.body).every((c) => c.status === "complete"));
  assert.equal("chunks" in sent[4]!.body, false, "the second stop is bare");
});
