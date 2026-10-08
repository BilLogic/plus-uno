// The post probe, through its route body over a stubbed fetch: what it refuses
// before Slack is called, and that what it sends and what it returns are raw.
//
// `net.ts` binds the real fetch at its first evaluation, so the stub goes onto
// `globalThis` here and the modules are imported lazily inside each test.
import { test } from "node:test";
import assert from "node:assert/strict";

let sent: Array<{ method: string; body: Record<string, unknown> }> = [];
let reply: Record<string, unknown> = { ok: true, ts: "1.0" };
globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const method = String(input).replace("https://slack.com/api/", "");
  sent.push({ method, body: JSON.parse(String(init?.body)) as Record<string, unknown> });
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
