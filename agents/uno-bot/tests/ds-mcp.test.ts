// The hosted DS MCP client, over a fake MCP: the one request it sends per
// question, and each way it gives up so the caller falls back to the built-in
// facts. Nothing here reaches the network.
import { test } from "node:test";
import assert from "node:assert/strict";

import { dsMcpClient, DS_MCP_URL, type DsMcpPost } from "../src/integrations/ds-mcp";

interface Sent {
  url: string;
  init: RequestInit;
  timeoutMs: number | undefined;
}

/** A fake MCP answering every tools/call with `text`, recording what it was sent. */
function fakeMcp(respond: (body: { method: string; params: { name: string; arguments: Record<string, unknown> } }) => Response | Promise<Response>) {
  const sent: Sent[] = [];
  const post: DsMcpPost = async (url, init, timeoutMs) => {
    sent.push({ url, init, timeoutMs });
    return respond(JSON.parse(String(init.body)));
  };
  return { sent, post };
}

const rpcText = (text: string, isError = false) =>
  new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { content: [{ type: "text", text }], ...(isError ? { isError } : {}) } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

test("a find question is one tools/call ds_find POST, no initialize, with the key and both accept types", async () => {
  const mcp = fakeMcp(() => rpcText("component import { Checkbox } from '@/components';  Checkbox — choose many."));
  const client = dsMcpClient({ key: "k1", post: mcp.post });
  const out = await client.find("choose many options from a list");
  assert.deepEqual(out, { ok: true, text: "component import { Checkbox } from '@/components';  Checkbox — choose many." });
  assert.equal(mcp.sent.length, 1);
  const { url, init, timeoutMs } = mcp.sent[0]!;
  assert.equal(url, DS_MCP_URL);
  assert.equal(init.method, "POST");
  const headers = new Headers(init.headers);
  assert.equal(headers.get("authorization"), "Bearer k1");
  assert.equal(headers.get("content-type"), "application/json");
  assert.match(headers.get("accept") ?? "", /application\/json/);
  assert.match(headers.get("accept") ?? "", /text\/event-stream/);
  assert.equal(timeoutMs, 8000);
  const body = JSON.parse(String(init.body));
  assert.equal(body.jsonrpc, "2.0");
  assert.equal(body.method, "tools/call");
  assert.deepEqual(body.params, { name: "ds_find", arguments: { query: "choose many options from a list" } });
});

test("a named question is one tools/call ds_get, with the section when one is asked", async () => {
  const mcp = fakeMcp(() => rpcText("# Modal"));
  const client = dsMcpClient({ key: "k1", post: mcp.post });
  assert.deepEqual(await client.get("Modal"), { ok: true, text: "# Modal" });
  assert.deepEqual(await client.get("Modal", "usage"), { ok: true, text: "# Modal" });
  assert.deepEqual(
    mcp.sent.map((s) => JSON.parse(String(s.init.body)).params),
    [
      { name: "ds_get", arguments: { names: ["Modal"] } },
      { name: "ds_get", arguments: { names: ["Modal"], section: "usage" } },
    ],
  );
});

test("no key: nothing is sent, and the answer says to fall back", async () => {
  for (const key of [undefined, "", "  "]) {
    const mcp = fakeMcp(() => rpcText("never"));
    const out = await dsMcpClient({ key, post: mcp.post }).find("card");
    assert.equal(out.ok, false);
    assert.equal(!out.ok && out.reason, "no-key");
    assert.equal(mcp.sent.length, 0);
  }
});

test("a non-2xx answer (401 on a wrong key, 502 from the function) falls back", async () => {
  for (const status of [401, 406, 500, 502]) {
    const mcp = fakeMcp(() => new Response('{"error":"unauthorized"}', { status }));
    const out = await dsMcpClient({ key: "k1", post: mcp.post }).get("Modal");
    assert.equal(out.ok, false);
    assert.equal(!out.ok && out.reason, "http");
    assert.match(!out.ok ? out.detail : "", new RegExp(String(status)));
  }
});

test("a JSON-RPC error, a tool error or a body that is not the expected shape falls back", async () => {
  const bodies = [
    new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code: -32601, message: "no method" } }), { status: 200 }),
    rpcText("ds_get failed: boom", true),
    new Response("not json", { status: 200 }),
    new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { content: [] } }), { status: 200 }),
  ];
  for (const res of bodies) {
    const out = await dsMcpClient({ key: "k1", post: async () => res }).get("Modal");
    assert.equal(out.ok, false, JSON.stringify(out));
    assert.equal(!out.ok && out.reason, "error");
  }
});

test("a timeout or a network failure falls back", async () => {
  const timeout = Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" });
  const outT = await dsMcpClient({ key: "k1", post: async () => { throw timeout; } }).find("card");
  assert.equal(!outT.ok && outT.reason, "timeout");
  const outN = await dsMcpClient({ key: "k1", post: async () => { throw new TypeError("fetch failed"); } }).find("card");
  assert.equal(!outN.ok && outN.reason, "error");
});

test("with no subrequest left, nothing is sent and the answer says why", async () => {
  const mcp = fakeMcp(() => rpcText("never"));
  const out = await dsMcpClient({ key: "k1", post: mcp.post, canSpend: () => false }).find("card");
  assert.equal(!out.ok && out.reason, "budget");
  assert.equal(mcp.sent.length, 0);
});
