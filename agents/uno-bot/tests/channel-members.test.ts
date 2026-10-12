// Who may decide a Worker-posted card: a channel's members, or, for a card
// posted into a 1:1 DM, the person on the other side — Slack will not list a
// DM's members, so the DM's own record names them.
//
// `net.ts` binds `fetch` when it is first evaluated, so the stub goes onto
// `globalThis` here, at load, and the code under test is imported lazily.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(input);
  const channel = new URL(url).searchParams.get("channel");
  if (url.includes("conversations.members")) {
    if (channel?.startsWith("D")) return Response.json({ ok: false, error: "method_not_supported_for_channel_type" });
    return Response.json({ ok: true, members: ["U1", "U2"] });
  }
  if (url.includes("conversations.info")) {
    return Response.json({ ok: true, channel: { id: channel, is_im: true, user: "UBILL" } });
  }
  return Response.json({ ok: false, error: "unexpected" });
}) as typeof fetch;

const members = async (env: Env, channel: string) => (await import("../src/slack/channel-members.js")).channelMembers(env, channel);

const env = { SLACK_BOT_TOKEN: "xoxb-test" } as unknown as Env;

describe("channelMembers", () => {
  it("lists a channel's members", async () => {
    assert.deepEqual(await members(env, "C0DESIGN"), ["U1", "U2"]);
  });

  it("names the person a 1:1 DM is with, since Slack will not list a DM's members", async () => {
    assert.deepEqual(await members(env, "D0APTB20SK0"), ["UBILL"]);
  });
});
