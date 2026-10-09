// The post probe, through its route body over a stubbed fetch: what it refuses
// before Slack is called, and that what it sends and what it returns are raw.
//
// `net.ts` binds the real fetch at its first evaluation, so the stub goes onto
// `globalThis` here and the modules are imported lazily inside each test.
import { test } from "node:test";
import assert from "node:assert/strict";

let sent: Array<{ method: string; httpMethod: string; body: Record<string, unknown> }> = [];
let reply: Record<string, unknown> = { ok: true, ts: "1.0" };
globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = new URL(String(input));
  const method = url.pathname.replace("/api/", "");
  const httpMethod = init?.method ?? "GET";
  const body = httpMethod === "GET" ? Object.fromEntries(url.searchParams) : JSON.parse(String(init?.body));
  sent.push({ method, httpMethod, body });
  return new Response(JSON.stringify(reply), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

type Env = import("../src/types").Env;
const ENV = { SLACK_BOT_TOKEN: "xoxb-test" } as Env;

async function probe(q: string): Promise<{ body: Record<string, unknown>; status?: number }> {
  const { slackPostProbe } = await import("../src/diagnostics/probes/slack.js");
  const url = `https://w/debug/slack-post?${q}`;
  return (await slackPostProbe(ENV, new URL(url), new Request(url))) as {
    body: Record<string, unknown>;
    status?: number;
  };
}

const BLOCKS = [{ type: "markdown", text: "| a | b |\n|---|---|\n| <@x> | 2 |" }];
const blocksParam = `blocks=${encodeURIComponent(JSON.stringify(BLOCKS))}`;

test("report previews preserve their metadata through two edits of the message they just posted", async () => {
  sent = [];
  reply = { ok: true, ts: "2.0", messages: [{ metadata: { event_type: "uno_preview_report", event_payload: { fixture: "sweep" } } }] };
  const metadata = { event_type: "uno_preview_report", event_payload: { fixture: "sweep" } };
  const edits = [{ text: "Approved preview", blocks: BLOCKS }, { text: "Closed preview", blocks: BLOCKS }];
  const q = new URLSearchParams({ channel: "D0123", text: "PREVIEW — not live", blocks: JSON.stringify(BLOCKS), metadata: JSON.stringify(metadata), edits: JSON.stringify(edits) });
  const res = await probe(q.toString());
  assert.deepEqual(sent.map((s) => s.method), ["chat.postMessage", "chat.update", "chat.update", "conversations.replies"]);
  assert.equal(sent.at(-1)!.httpMethod, "GET", "Slack reads take query parameters");
  assert.deepEqual(sent.at(-1)!.body, { channel: "D0123", ts: "2.0", limit: "1", inclusive: "true", include_all_metadata: "true" });
  for (const call of sent.slice(0, 3)) assert.deepEqual(call.body.metadata, metadata);
  for (const call of sent.slice(1, 3)) assert.equal(call.body.ts, "2.0", "only the newly posted fixture is edited");
  assert.deepEqual(res.body.metadata, metadata);
});

test("report-preview edits refuse public channels and malformed or oversized fixtures before posting", async () => {
  sent = [];
  const metadata = JSON.stringify({ event_type: "uno_preview_report", event_payload: {} });
  for (const extra of [
    { channel: "C0ARJ2A3A69", metadata, edits: "[]" },
    { metadata: JSON.stringify({ event_type: "uno_sweep_card", event_payload: {} }) },
    { metadata, edits: JSON.stringify([{}, {}, {}]) },
    { metadata, edits: JSON.stringify([{ text: "x".repeat(2001), blocks: BLOCKS }]) },
  ]) {
    const q = new URLSearchParams({ channel: "D0123", blocks: JSON.stringify(BLOCKS) });
    for (const [key, value] of Object.entries(extra)) if (value !== undefined) q.set(key, value);
    assert.equal((await probe(q.toString())).status, 400);
  }
  assert.equal(sent.length, 0);
});

test("the post probe refuses a public channel, bad JSON or a non-array before calling Slack", async () => {
  sent = [];
  let res = await probe(`channel=C0PUBLIC1&text=t&${blocksParam}`);
  assert.equal(res.status, 400);
  assert.match(String(res.body.error), /^blocks= .*DM \(D…\) or the alert channel/);

  res = await probe(`channel=D0123&text=t&blocks=${encodeURIComponent("[{not json")}`);
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "blocks is not JSON");

  res = await probe(`channel=D0123&text=t&blocks=${encodeURIComponent('{"type":"markdown"}')}`);
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "blocks must be a JSON array");

  res = await probe("text=t");
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "channel required");

  res = await probe("channel=D0123&text=t");
  assert.equal(res.status, 400);
  assert.match(String(res.body.error), /^blocks is empty/);

  assert.equal(sent.length, 0, "a refused probe calls nothing");
});

test("the post probe posts the blocks raw, in a thread if asked, and returns Slack's verdict verbatim", async () => {
  sent = [];
  reply = {
    ok: false,
    error: "invalid_blocks",
    response_metadata: { messages: ["[ERROR] unsupported type: markdown [json-pointer:/blocks/0/type]"] },
  };
  const res = await probe(`channel=D0123&thread_ts=1.5&text=${encodeURIComponent("a <@x>")}&${blocksParam}`);
  assert.deepEqual(sent.map((s) => s.method), ["chat.postMessage"]);
  assert.deepEqual(sent[0]!.body, { channel: "D0123", thread_ts: "1.5", text: "a <@x>", blocks: BLOCKS }, "raw, on purpose");
  assert.deepEqual(res.body.slack, reply, "Slack's response, response_metadata included");
  assert.equal(res.status, undefined);

  // The alert channel is the one non-DM target, and no thread means none sent.
  sent = [];
  reply = { ok: true, ts: "2.0" };
  await probe(`channel=C0ARJ2A3A69&text=t&${blocksParam}`);
  assert.deepEqual(Object.keys(sent[0]!.body).sort(), ["blocks", "channel", "text"]);
});
