// A turn's origin decides how much of Slack its tools may read (#903).
//
// An @uno ask in a Figma comment is answered in the file, which people outside
// the team can open, so a turn wired with the `figma` origin must read Slack
// at public visibility only, and a `slack` turn must keep its reach. This is
// the privacy guarantee, so it is driven through the wiring rather than at the
// tool alone: the Slack context `turn/env-deps.ts` builds for the agent run
// (`toolSlackContextFor`, what `buildTurnDeps` hands `runAgent`), into the
// agent run's own dispatch (`executeUngatedTool`) and the real tool bodies,
// with Slack's API stubbed.
//
// `net.ts` binds `fetch` when it is first evaluated, so the stub goes onto
// `globalThis` here, at load, and the code under test is imported lazily.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";
import type { TurnOrigin } from "../src/usage/index";

const PUBLIC = "CPUBLIC1";
const PRIVATE = "CPRIVATE1";
const SECRET = "salary bands for the tutor pilot";

/** Every Slack call sent, as `method body`. */
const sent: string[] = [];
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const body = typeof init?.body === "string" ? init.body : "";
  sent.push(`${url} ${body}`);
  if (url.includes("assistant.search.context")) {
    const types = new URLSearchParams(body).get("channel_types") ?? "";
    const hit = (channel: string, text: string) => ({
      channel_id: channel,
      channel_name: channel.toLowerCase(),
      permalink: `https://plus.slack.com/archives/${channel}/p1700000000000100`,
      content: text,
      message_ts: "1700000000.000100",
    });
    return Response.json({ ok: true, results: { messages: types.includes("private_channel") ? [hit(PRIVATE, SECRET)] : [hit(PUBLIC, "the progress bar ships hidden")] } });
  }
  if (url.includes("conversations.info")) {
    const channel = new URL(url).searchParams.get("channel");
    return Response.json({ ok: true, channel: { id: channel, is_private: channel === PRIVATE } });
  }
  if (url.includes("conversations.replies")) {
    return Response.json({ ok: true, messages: [{ user: "U1", ts: "1700000000.000100", text: SECRET }] });
  }
  return Response.json({ ok: false, error: "unexpected" });
}) as typeof fetch;

/** A Worker with the stored workspace token and one allowlisted private channel. */
function env(): Env {
  const kv = new Map<string, string>([["slack_oauth_token", JSON.stringify({ access_token: "xoxp-legacy-test" })]]);
  return {
    SLACK_BOT_TOKEN: "xoxb-test",
    SLACK_MCP_CLIENT_ID: "id",
    SLACK_MCP_CLIENT_SECRET: "secret",
    SLACK_OAUTH_REDIRECT_URI: "https://worker.example/oauth/slack/callback",
    SLACK_OAUTH_KV: { get: async (k: string) => kv.get(k) ?? null, put: async () => {} } as unknown as KVNamespace,
    SLACK_SEARCH_PRIVATE_ALLOWLIST: PRIVATE,
  } as unknown as Env;
}

/** Run one tool the way a turn with `origin` runs it, from the context the wiring builds. */
async function runTool(origin: TurnOrigin, name: string, input: Record<string, unknown>): Promise<string> {
  const { toolSlackContextFor } = await import("../src/turn/env-deps.js");
  const { executeUngatedTool } = await import("../src/agent/run-agent.js");
  const { buildTurnRequest } = await import("../src/turn/index.js");
  const request = buildTurnRequest({
    userId: "U1",
    channel: "CDESIGN1",
    channelType: "channel",
    conversationTs: origin === "figma" ? "figma:FILEKEY1:100" : "1700000000.000200",
    userMsgTs: origin === "figma" ? "figma:100" : "1700000000.000200",
    threaded: true,
    text: "what did we decide about the tutor pilot?",
  });
  const slack = toolSlackContextFor(request, origin === "figma" ? { origin } : { origin, toolThreadTs: "1700000000.000200" });
  sent.length = 0;
  return executeUngatedTool(env(), name, input, slack);
}

describe("a turn wired with the figma origin reads Slack at public visibility only", () => {
  it("its slack_search runs no private pass, so an allowlisted private channel's hit never reaches it", async () => {
    const out = await runTool("figma", "slack_search", { query: "tutor pilot" });
    assert.doesNotMatch(out, new RegExp(`${SECRET}|${PRIVATE}`));
    assert.match(out, /the progress bar ships hidden/);
    assert.ok(sent.every((s) => !s.includes("private_channel")), sent.join("\n"));
  });

  it("its slack_thread_read refuses a thread in a private channel", async () => {
    const out = await runTool("figma", "slack_thread_read", { link: `https://plus.slack.com/archives/${PRIVATE}/p1700000000000100` });
    assert.doesNotMatch(out, new RegExp(SECRET));
    assert.match(out, /only a public channel's thread/);
  });
});

describe("a turn wired with the slack origin keeps its reach", () => {
  it("its slack_search still runs the allowlisted private pass", async () => {
    const out = await runTool("slack", "slack_search", { query: "tutor pilot" });
    assert.match(out, new RegExp(SECRET));
  });

  it("its slack_thread_read reads a private channel's thread the bot is in", async () => {
    const out = await runTool("slack", "slack_thread_read", { link: `https://plus.slack.com/archives/${PRIVATE}/p1700000000000100` });
    assert.match(out, new RegExp(SECRET));
  });
});
