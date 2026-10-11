// A turn whose answer leaves Slack reads Slack at public visibility only (#903).
//
// An @uno ask in a Figma comment is answered in the file, which people outside
// the team can open, so its turn carries `publicOnly` (`turn/env-deps.ts`, from
// the `figma` origin). These cases drive the two Slack readers at their tool
// seam with Slack's API stubbed: what a search on the stored workspace token
// finds in an allowlisted private channel, and what a thread link into a
// private channel holds, never reach what the model reads.
//
// `net.ts` binds `fetch` when it is first evaluated, so the stub goes onto
// `globalThis` here, at load, and the code under test is imported lazily.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

const PUBLIC = "CPUBLIC1";
const PRIVATE = "CPRIVATE1";
let route: typeof fetch = async () => Response.json({ ok: false, error: "no stub" });
globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => route(input, init)) as typeof fetch;

const tools = async () => ({
  ...(await import("../src/tools/slack-search.js")),
  ...(await import("../src/tools/slack-thread-read.js")),
});

/** Slack, stubbed: each search pass answers for the channel types it asked for. */
function stubSlack(): string[] {
  const sent: string[] = [];
  route = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = typeof init?.body === "string" ? init.body : "";
    sent.push(`${url.replace(/\?.*/, "")} ${body}`);
    if (url.includes("assistant.search.context")) {
      const types = new URLSearchParams(body).get("channel_types") ?? "";
      const hit = (channel: string, text: string) => ({ channel_id: channel, channel_name: channel.toLowerCase(), permalink: `https://plus.slack.com/archives/${channel}/p1700000000000100`, content: text, message_ts: "1700000000.000100" });
      const messages = types.includes("private_channel") ? [hit(PRIVATE, "salary bands for the tutor pilot")] : [hit(PUBLIC, "the progress bar ships hidden")];
      return Response.json({ ok: true, results: { messages } });
    }
    if (url.includes("conversations.info")) {
      const channel = new URL(url).searchParams.get("channel");
      return Response.json({ ok: true, channel: { id: channel, is_private: channel === PRIVATE } });
    }
    if (url.includes("conversations.replies")) {
      return Response.json({ ok: true, messages: [{ user: "U1", ts: "1700000000.000100", text: "salary bands for the tutor pilot" }] });
    }
    return Response.json({ ok: false, error: "unexpected" });
  }) as typeof fetch;
  return sent;
}

/** A Worker with the stored workspace token and one allowlisted private channel. */
function env(): Env {
  const kv = new Map<string, string>([["slack_oauth_token", JSON.stringify({ access_token: "xoxp-legacy-test" })]]);
  return {
    SLACK_MCP_CLIENT_ID: "id",
    SLACK_MCP_CLIENT_SECRET: "secret",
    SLACK_OAUTH_REDIRECT_URI: "https://worker.example/oauth/slack/callback",
    SLACK_OAUTH_KV: { get: async (k: string) => kv.get(k) ?? null, put: async () => {} } as unknown as KVNamespace,
    SLACK_SEARCH_PRIVATE_ALLOWLIST: PRIVATE,
  } as unknown as Env;
}

describe("slack_search on a public-only turn", () => {
  it("runs no private pass, so an allowlisted private channel's hit never reaches the model", async () => {
    const sent = stubSlack();
    const { executeSlackSearch } = await tools();
    const out = await executeSlackSearch(env(), { query: "tutor pilot" }, { channel: "CDESIGN1", userMsgTs: "figma:1", requestedBy: "U1", publicOnly: true });
    assert.doesNotMatch(out, /salary bands|CPRIVATE1/);
    assert.match(out, /the progress bar ships hidden/);
    assert.match(out, /public-only/);
    assert.ok(sent.every((s) => !s.includes("private_channel")), sent.join("\n"));
  });

  it("is the flag that does it: the same search in a Slack channel turn still runs the allowlisted pass", async () => {
    stubSlack();
    const { executeSlackSearch } = await tools();
    const out = await executeSlackSearch(env(), { query: "tutor pilot" }, { channel: "CDESIGN1", userMsgTs: "1700000000.000200", requestedBy: "U1" });
    assert.match(out, /salary bands/);
  });
});

describe("slack_thread_read on a public-only turn", () => {
  it("refuses a thread in a private channel", async () => {
    stubSlack();
    const { executeSlackThreadRead } = await tools();
    const out = await executeSlackThreadRead(env(), { link: `https://plus.slack.com/archives/${PRIVATE}/p1700000000000100` }, { publicOnly: true });
    assert.doesNotMatch(out, /salary bands/);
    assert.match(out, /only a public channel's thread/);
  });

  it("reads a thread in a public channel", async () => {
    stubSlack();
    const { executeSlackThreadRead } = await tools();
    const out = await executeSlackThreadRead(env(), { link: `https://plus.slack.com/archives/${PUBLIC}/p1700000000000100` }, { publicOnly: true });
    assert.match(out, /"ok":true/);
  });
});
