// github_read's `lookup`, routed: a name goes to the hosted `ds_get`, a task in
// words to `ds_find`, and any miss of the hosted MCP answers from the facts
// baked into the Worker. The client is a fake, so nothing reaches the network.
import { test } from "node:test";
import assert from "node:assert/strict";

import { lookupDesignSystem } from "../src/tools/github-read";
import type { DsMcpClient, DsMcpResult, DsSection } from "../src/integrations/ds-mcp";

function fakeClient(answer: DsMcpResult) {
  const calls: Array<{ tool: "find" | "get"; arg: string; section?: DsSection }> = [];
  const client: DsMcpClient = {
    find: async (query) => (calls.push({ tool: "find", arg: query }), answer),
    get: async (name, section) => (calls.push({ tool: "get", arg: name, ...(section ? { section } : {}) }), answer),
  };
  return { calls, client };
}

const parse = async (p: Promise<string>) => JSON.parse(await p);

test("a named component asks the hosted ds_get and returns its text", async () => {
  const { calls, client } = fakeClient({ ok: true, text: "# Modal\n\nimport { Modal } from '@/components';" });
  const out = await parse(lookupDesignSystem("Modal", { ds: client }));
  assert.deepEqual(calls, [{ tool: "get", arg: "Modal" }]);
  assert.equal(out.ok, true);
  assert.equal(out.lookup, "Modal");
  assert.equal(out.source, "hosted");
  assert.equal(out.tool, "ds_get");
  assert.match(out.text, /# Modal/);
});

test("a name in any case, a prop or a token goes to ds_get under its baked name, with the section", async () => {
  const { calls, client } = fakeClient({ ok: true, text: "x" });
  await lookupDesignSystem("card", { ds: client });
  await lookupDesignSystem("Button.appearance", { ds: client });
  await lookupDesignSystem("--stack-md", { ds: client });
  await lookupDesignSystem("Modal", { ds: client, section: "usage" });
  assert.deepEqual(calls, [
    { tool: "get", arg: "Card" },
    { tool: "get", arg: "Button.appearance" },
    { tool: "get", arg: "--stack-md" },
    { tool: "get", arg: "Modal", section: "usage" },
  ]);
});

test("a task in words asks the hosted ds_find", async () => {
  const { calls, client } = fakeClient({ ok: true, text: "component import { Checkbox } from '@/components';" });
  const out = await parse(lookupDesignSystem("choose many options from a list", { ds: client }));
  assert.deepEqual(calls, [{ tool: "find", arg: "choose many options from a list" }]);
  assert.equal(out.tool, "ds_find");
  assert.match(out.text, /Checkbox/);
});

test("a token role answers from the built-in facts, with no call", async () => {
  const { calls, client } = fakeClient({ ok: true, text: "never" });
  const out = await parse(lookupDesignSystem("stack", { ds: client }));
  assert.deepEqual(calls, []);
  assert.equal(out.source, "built-in");
  assert.ok(out.tokens.length > 0);
});

test("a hosted miss on a name falls back to the built-in answer and says why", async () => {
  const { client } = fakeClient({ ok: false, reason: "timeout", detail: "no answer in 8000 ms" });
  const out = await parse(lookupDesignSystem("card", { ds: client }));
  assert.equal(out.source, "built-in");
  assert.equal(out.fallback, "timeout");
  assert.equal(out.answer.name, "Card");
  assert.equal(out.answer.status, "not-here");
  assert.equal(out.use[0].name, "PatternCard");
});

test("a hosted miss on a task in words falls back, and says the built-in facts match names only", async () => {
  const { client } = fakeClient({ ok: false, reason: "no-key", detail: "DS_MCP_KEY is not set" });
  const out = await parse(lookupDesignSystem("choose many options from a list", { ds: client }));
  assert.equal(out.source, "built-in");
  assert.equal(out.fallback, "no-key");
  assert.equal(out.answer.status, "unknown");
  assert.match(out.note, /names only/);
  assert.match(out.note, /agent-views\/components\/index\.md/);
});

test("with no client the built-in facts answer, as before", async () => {
  const out = await parse(lookupDesignSystem("card"));
  assert.equal(out.source, "built-in");
  assert.equal(out.fallback, undefined);
  assert.equal(out.answer.status, "not-here");
});
